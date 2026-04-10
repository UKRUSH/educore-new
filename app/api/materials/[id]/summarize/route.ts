export const dynamic = "force-dynamic"
export const maxDuration = 60

import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

interface SummaryResult {
  quickSummary: string
  detailedNotes: string
  keyTerms: string
  suggestedResources: Array<{ title: string; sourceName: string; url: string; type: "ARTICLE" | "YOUTUBE" | "LINK" }>
}

async function summarizeWithNvidia(
  title: string,
  courseCode: string,
  extractedText: string | null,
): Promise<SummaryResult> {
  const { default: OpenAI } = await import("openai")
  const { jsonrepair }      = await import("jsonrepair")

  const nvidia = new OpenAI({
    apiKey:  process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
  })

  const systemPrompt = `You are an educational AI assistant. Return ONLY a valid JSON object, no markdown or code fences.
{
  "quickSummary": "2-3 sentence overview",
  "detailedNotes": "Key concepts and important points",
  "keyTerms": "Comma-separated list of 6-10 key terms",
  "suggestedResources": [
    { "title": "Resource title", "sourceName": "Source name", "url": "https://example.com", "type": "ARTICLE" }
  ]
}
suggestedResources: 3-4 items. type must be ARTICLE, YOUTUBE, or LINK. Output ONLY the JSON.`

  const userContent = extractedText
    ? `Summarize this academic material titled "${title}" (course: ${courseCode}):\n\n${extractedText.slice(0, 18000)}\n\nJSON only.`
    : `Generate a study summary for "${title}" (course: ${courseCode}). JSON only.`

  const response = await nvidia.chat.completions.create({
    model:       "meta/llama-3.1-8b-instruct",
    messages:    [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
    max_tokens:  1024,
    temperature: 0.1,
  })

  const raw   = response.choices[0]?.message?.content ?? ""
  const start = raw.indexOf("{")
  const end   = raw.lastIndexOf("}")
  if (start === -1 || end === -1)
    throw new Error(`No JSON in model response: ${raw.slice(0, 200)}`)

  return JSON.parse(jsonrepair(raw.slice(start, end + 1))) as SummaryResult
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!process.env.NVIDIA_API_KEY)
      return Response.json({ error: "AI service is not configured (NVIDIA_API_KEY missing)." }, { status: 503 })

    const session = await getSession()
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await context.params
    const matId  = Number(id)

    const material = await prisma.studyMaterial.findUnique({
      where:   { id: matId },
      include: { fileAsset: true, summary: true },
    })

    if (!material || material.userId !== session.userId)
      return Response.json({ error: "Not found." }, { status: 404 })

    // Use pre-extracted text stored at upload time — no Cloudinary re-fetch needed
    const extractedText = material.fileAsset?.extractedText ?? null

    let result: SummaryResult
    try {
      result = await summarizeWithNvidia(material.title, material.courseCode, extractedText)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("NVIDIA summarization failed:", msg)
      return Response.json({ error: `AI summarization failed: ${msg}` }, { status: 500 })
    }

    // Run writes sequentially — no transaction wrapper to avoid Neon cold-start timeouts
    await prisma.suggestedResource.deleteMany({ where: { materialId: matId } })

    await prisma.materialSummary.upsert({
      where:  { materialId: matId },
      create: { materialId: matId, quickSummary: result.quickSummary, detailedNotes: result.detailedNotes, keyTerms: result.keyTerms },
      update: { quickSummary: result.quickSummary, detailedNotes: result.detailedNotes, keyTerms: result.keyTerms, updatedAt: new Date() },
    })

    if (Array.isArray(result.suggestedResources) && result.suggestedResources.length > 0) {
      await prisma.suggestedResource.createMany({
        data: result.suggestedResources.map((r) => ({
          materialId: matId, title: r.title, sourceName: r.sourceName, url: r.url, type: r.type,
        })),
      })
    }

    await prisma.studyMaterial.update({ where: { id: matId }, data: { isSummarized: true } })

    const updated = await prisma.studyMaterial.findUnique({
      where:   { id: matId },
      include: {
        fileAsset:          { select: { fileName: true, fileSize: true, fileUrl: true, fileType: true } },
        summary:            true,
        suggestedResources: true,
      },
    })

    return Response.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Summarize route crashed:", msg)
    return Response.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
