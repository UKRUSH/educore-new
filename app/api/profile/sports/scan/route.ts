export const dynamic = "force-dynamic"

import { getSession } from "@/lib/auth/session"
import { uploadBuffer } from "@/lib/cloudinary"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024

function positionToMarks(position: string | null): number {
  if (!position) return 0.5
  const p = position.toLowerCase()
  if (/1st|first|champion|gold|winner/.test(p)) return 3
  if (/2nd|second|runner.?up|silver/.test(p))   return 2
  if (/3rd|third|bronze/.test(p))               return 1
  return 0.5
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey)
    return Response.json({ error: "NVIDIA_API_KEY is not configured." }, { status: 503 })

  // ── Parse file ────────────────────────────────────────────────────────────
  let formData: FormData
  try { formData = await request.formData() }
  catch { return Response.json({ error: "Invalid form data." }, { status: 400 }) }

  const file = formData.get("image") as File | null
  if (!file || typeof file === "string")
    return Response.json({ error: "No image file provided." }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type))
    return Response.json({ error: "Only JPG, PNG, and WebP images are supported." }, { status: 400 })
  if (file.size > MAX_SIZE_BYTES)
    return Response.json({ error: "Image must be under 5 MB." }, { status: 400 })

  // ── Upload to Cloudinary ──────────────────────────────────────────────────
  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  let fileUrl: string
  try {
    const result = await uploadBuffer(buffer, {
      folder: "educore/certificates",
      resource_type: "image",
      public_id: `cert-${session.userId}-${Date.now()}`,
    })
    fileUrl = result.secure_url
  } catch {
    return Response.json({ error: "Failed to upload certificate." }, { status: 500 })
  }

  // ── Call NVIDIA vision model via raw fetch ────────────────────────────────
  // Image was resized client-side to ≤800px so base64 stays well under 180KB
  const base64    = buffer.toString("base64")
  const mediaType = file.type === "image/jpg" ? "image/jpeg" : file.type
  const imageUrl  = `data:${mediaType};base64,${base64}`

  const { jsonrepair } = await import("jsonrepair")

  const systemPrompt = `You are an AI that reads sports achievement certificates.
Return ONLY a raw JSON object with these exact keys — no markdown, no backticks, no explanation:
{"sportName":"...","achievementType":"TROPHY|CERTIFICATE|MEDAL","position":"...or null","eventName":"...or null","date":"YYYY-MM-DD or null"}`

  const userPrompt = `Read this certificate image and return the JSON with sportName, achievementType, position, eventName, date.`

  let extracted: {
    sportName: string
    achievementType: string
    position: string | null
    eventName: string | null
    date: string | null
  }

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:       "meta/llama-3.2-90b-vision-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              { type: "text",      text: userPrompt },
            ],
          },
        ],
        max_tokens:  400,
        temperature: 0.1,
        stream:      false,
      }),
    })

    const body = await res.text()

    if (!res.ok) {
      console.error(`NVIDIA API ${res.status}:`, body.slice(0, 500))
      return Response.json(
        { error: `AI service error (${res.status}). Please fill in manually.`, fileUrl },
        { status: 502 },
      )
    }

    const aiData = JSON.parse(body) as { choices: { message: { content: string } }[] }
    const raw    = aiData.choices?.[0]?.message?.content ?? ""

    const start = raw.indexOf("{")
    const end   = raw.lastIndexOf("}")
    if (start === -1 || end === -1)
      throw new Error(`No JSON in response: ${raw.slice(0, 300)}`)

    const repaired = jsonrepair(raw.slice(start, end + 1))
    extracted = JSON.parse(repaired)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Scan error:", msg)
    return Response.json(
      { error: `Scan failed: ${msg.slice(0, 120)}`, fileUrl },
      { status: 502 },
    )
  }

  // ── Normalise ─────────────────────────────────────────────────────────────
  if (!["TROPHY", "CERTIFICATE", "MEDAL"].includes(extracted.achievementType))
    extracted.achievementType = "CERTIFICATE"

  return Response.json({
    sportName:       extracted.sportName       ?? "",
    achievementType: extracted.achievementType,
    position:        extracted.position        ?? "",
    eventName:       extracted.eventName       ?? "",
    date:            extracted.date            ?? "",
    points:          positionToMarks(extracted.position),
    fileUrl,
  })
}
