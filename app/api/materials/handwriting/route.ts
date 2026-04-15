export const dynamic = "force-dynamic"
export const maxDuration = 60

import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED  = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const PROMPT = `Analyse these handwritten notes and return ONLY the following JSON — no markdown, no code fences, nothing else:
{"detectedLanguage":"language the notes appear to be in","quickSummary":"2-3 English sentences summarising what the student was studying","detailedNotes":"key points as short English bullet lines each starting with •","keyTerms":"5-8 important subject terms in English, comma-separated","englishTranslation":"English explanation of the main content and ideas visible in the notes"}

If the script is non-Latin (Sinhala, Tamil, Arabic, etc.) describe the subject matter from context clues — structure, diagrams, numbers, any readable words. Return only the JSON.`

/* ── Anthropic path (fast — 2-5 s) ─────────────────────────────────────── */
async function analyseWithAnthropic(
  apiKey: string,
  base64: string,
  mediaType: string,
): Promise<object> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default
  const client    = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type:   "image",
            source: {
              type:       "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
              data:       base64,
            },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  })

  const block = response.content.find(b => b.type === "text")
  const raw   = block && "text" in block ? (block.text as string).trim() : ""
  return parseResult(raw)
}

/* ── NVIDIA path — streaming to avoid the 60 s wall ────────────────────── */
async function analyseWithNvidia(
  apiKey: string,
  dataUrl: string,
): Promise<object> {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method:  "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model:       "meta/llama-3.2-11b-vision-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            { type: "text",      text: PROMPT },
          ],
        },
      ],
      max_tokens:  450,
      temperature: 0.2,
      stream:      true,   // stream tokens to avoid server-side timeout
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("NVIDIA error:", err.slice(0, 300))
    throw new Error(`NVIDIA API error ${res.status}`)
  }

  // Accumulate SSE delta chunks into a single string
  let accumulated = ""
  const reader  = res.body!.getReader()
  const decoder = new TextDecoder()

  outer: while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const payload = trimmed.slice(5).trim()
      if (payload === "[DONE]") break outer
      try {
        const parsed = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[]
        }
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) accumulated += delta
      } catch { /* skip malformed chunk */ }
    }
  }

  return parseResult(accumulated)
}

/* ── Shared JSON parser with jsonrepair fallback ────────────────────────── */
function parseResult(raw: string): object {
  const start = raw.indexOf("{")
  const end   = raw.lastIndexOf("}")

  if (start !== -1 && end !== -1) {
    // jsonrepair is loaded synchronously here (called after top-level await in handler)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { jsonrepair } = require("jsonrepair") as { jsonrepair: (s: string) => string }
      const result = JSON.parse(jsonrepair(raw.slice(start, end + 1))) as Record<string, string>
      return {
        detectedLanguage:   result.detectedLanguage   ?? "Unknown",
        extractedText:      result.englishTranslation ?? raw,
        englishTranslation: result.englishTranslation ?? raw,
        quickSummary:       result.quickSummary       ?? raw.slice(0, 300),
        detailedNotes:      result.detailedNotes      ?? "",
        keyTerms:           result.keyTerms           ?? "",
      }
    } catch { /* fall through */ }
  }

  // Plain-text fallback
  return {
    detectedLanguage:   "Unknown",
    extractedText:      raw,
    englishTranslation: raw,
    quickSummary:       raw.slice(0, 400),
    detailedNotes:      raw,
    keyTerms:           "",
  }
}

/* ── Route handler ──────────────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const nvidiaKey    = process.env.NVIDIA_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  const hasAnthropic = !!anthropicKey && !anthropicKey.startsWith("your-")
  const hasNvidia    = !!nvidiaKey

  if (!hasAnthropic && !hasNvidia)
    return Response.json({ error: "AI service not configured." }, { status: 503 })

  let formData: FormData
  try { formData = await request.formData() }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }) }

  const image = formData.get("image") as File | null
  if (!image || typeof image === "string")
    return Response.json({ error: "No image file received." }, { status: 400 })
  if (!ALLOWED.includes(image.type))
    return Response.json({ error: "Only JPG, PNG, or WEBP images are supported." }, { status: 400 })
  if (image.size > MAX_SIZE)
    return Response.json({ error: "Image too large. Max 10 MB." }, { status: 413 })

  const buffer    = Buffer.from(await image.arrayBuffer())
  const base64    = buffer.toString("base64")
  const mediaType = image.type === "image/jpg" ? "image/jpeg" : image.type
  const dataUrl   = `data:${mediaType};base64,${base64}`

  try {
    // Prefer Anthropic (fast). Fall back to NVIDIA with streaming.
    const result = hasAnthropic
      ? await analyseWithAnthropic(anthropicKey!, base64, mediaType)
      : await analyseWithNvidia(nvidiaKey!, dataUrl)

    return Response.json(result)
  } catch (err) {
    console.error("Handwriting analysis error:", err)
    return Response.json(
      { error: "AI analysis failed. Please try again with a clearer photo." },
      { status: 502 },
    )
  }
}
