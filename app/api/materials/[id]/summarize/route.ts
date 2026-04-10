export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import path from "path"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

interface SummaryResult {
  quickSummary: string
  detailedNotes: string
  keyTerms: string
  suggestedResources: Array<{ title: string; sourceName: string; url: string; type: "ARTICLE" | "YOUTUBE" | "LINK" }>
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as string)).default
  const data = await pdfParse(buffer)
  return data.text as string
}

class LegacyFileError extends Error {}

async function fetchFileBuffer(fileUrl: string): Promise<Buffer> {
  // Cloudinary / any absolute URL
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error(`Failed to fetch file from storage: ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }
  // Legacy local path — file no longer exists on server
  throw new LegacyFileError(
    "This file was uploaded before cloud storage was enabled and is no longer available. Please delete and re-upload the material.",
  )
}

async function summarizeWithNvidia(
  fileExt: string,
  fileBuffer: Buffer,
  title: string,
  courseCode: string,
): Promise<SummaryResult> {
  const { default: OpenAI } = await import("openai")
  const { jsonrepair } = await import("jsonrepair")

  const nvidia = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
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

  let userContent: string

  if (fileExt === ".pdf") {
    const pdfText = await extractPdfText(fileBuffer)
    userContent = `Summarize this academic PDF titled "${title}" (course: ${courseCode}):\n\n${pdfText.slice(0, 18000)}\n\nJSON only.`
  } else if ([".txt", ".md"].includes(fileExt)) {
    const text = fileBuffer.toString("utf-8")
    userContent = `Summarize this academic material titled "${title}" (course: ${courseCode}):\n\n${text.slice(0, 18000)}\n\nJSON only.`
  } else {
    userContent = `Generate a study summary for "${title}" (course: ${courseCode}, type: ${fileExt}). JSON only.`
  }

  const response = await nvidia.chat.completions.create({
    model: "meta/llama-3.1-8b-instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    max_tokens: 1024,
    temperature: 0.1,
  })

  const raw = response.choices[0]?.message?.content ?? ""

  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end === -1) {
    throw new Error(`No JSON object found in model response. Got: ${raw.slice(0, 200)}`)
  }
  const extracted = raw.slice(start, end + 1)

  const repaired = jsonrepair(extracted)
  return JSON.parse(repaired) as SummaryResult
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await context.params
    const matId = Number(id)

    const material = await prisma.studyMaterial.findUnique({
      where: { id: matId },
      include: { fileAsset: true, summary: true },
    })

    if (!material || material.userId !== session.userId)
      return Response.json({ error: "Not found." }, { status: 404 })

    if (!material.fileAsset)
      return Response.json({ error: "No file attached to this material." }, { status: 400 })

    let fileBuffer: Buffer
    try {
      fileBuffer = await fetchFileBuffer(material.fileAsset.fileUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const status = err instanceof LegacyFileError ? 410 : 502
      return Response.json({ error: msg }, { status })
    }

    const fileExt = path.extname(material.fileAsset.fileName).toLowerCase()

    let result: SummaryResult
    try {
      result = await summarizeWithNvidia(fileExt, fileBuffer, material.title, material.courseCode)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("NVIDIA summarization failed:", msg)
      return Response.json({ error: `AI summarization failed: ${msg}` }, { status: 500 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.suggestedResource.deleteMany({ where: { materialId: matId } })

      await tx.materialSummary.upsert({
        where: { materialId: matId },
        create: {
          materialId: matId,
          quickSummary: result.quickSummary,
          detailedNotes: result.detailedNotes,
          keyTerms: result.keyTerms,
        },
        update: {
          quickSummary: result.quickSummary,
          detailedNotes: result.detailedNotes,
          keyTerms: result.keyTerms,
          updatedAt: new Date(),
        },
      })

      if (Array.isArray(result.suggestedResources)) {
        await tx.suggestedResource.createMany({
          data: result.suggestedResources.map((r) => ({
            materialId: matId,
            title: r.title,
            sourceName: r.sourceName,
            url: r.url,
            type: r.type,
          })),
        })
      }

      await tx.studyMaterial.update({
        where: { id: matId },
        data: { isSummarized: true },
      })

      return tx.studyMaterial.findUnique({
        where: { id: matId },
        include: {
          fileAsset: { select: { fileName: true, fileSize: true, fileUrl: true, fileType: true } },
          summary: true,
          suggestedResources: true,
        },
      })
    })

    return Response.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Summarize route crashed:", msg)
    return Response.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
