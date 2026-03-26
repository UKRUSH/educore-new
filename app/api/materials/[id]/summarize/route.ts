import type { NextRequest } from "next/server"
import fs from "fs"
import path from "path"
import Anthropic from "@anthropic-ai/sdk"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SUPPORTED_TEXT_EXTS = [".txt", ".md"]
const SUPPORTED_PDF_EXT = ".pdf"

function readFileAsBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString("base64")
}

function readFileAsText(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8")
}

interface SummaryResult {
  quickSummary: string
  detailedNotes: string
  keyTerms: string
  suggestedResources: Array<{ title: string; sourceName: string; url: string; type: "ARTICLE" | "YOUTUBE" | "LINK" }>
}

async function summarizeWithClaude(
  fileExt: string,
  filePath: string,
  title: string,
  courseCode: string,
): Promise<SummaryResult> {
  const systemPrompt = `You are an educational AI assistant. Analyze academic materials and return a JSON object with this exact structure:
{
  "quickSummary": "2-3 sentence overview of the material",
  "detailedNotes": "Detailed bullet-point notes covering key concepts, theories, and important points",
  "keyTerms": "Comma-separated list of 8-15 key terms and definitions",
  "suggestedResources": [
    { "title": "Resource title", "sourceName": "Source name", "url": "https://...", "type": "ARTICLE" | "YOUTUBE" | "LINK" }
  ]
}

For suggestedResources, suggest 4-6 real, well-known educational resources. Use:
- Wikipedia articles (type: ARTICLE)
- YouTube educational channels like Khan Academy, MIT OpenCourseWare, CrashCourse (type: YOUTUBE)
- Official documentation, Coursera, edX courses (type: LINK)
Base suggestions on the topic/subject of the material.
Return ONLY valid JSON, no markdown fences.`

  let messages: Anthropic.MessageParam[]

  if (fileExt === SUPPORTED_PDF_EXT) {
    const base64Data = readFileAsBase64(filePath)
    messages = [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64Data },
          } as Anthropic.DocumentBlockParam,
          {
            type: "text",
            text: `Analyze this academic material titled "${title}" for course ${courseCode}. Return the JSON summary.`,
          },
        ],
      },
    ]
  } else if (SUPPORTED_TEXT_EXTS.includes(fileExt)) {
    const text = readFileAsText(filePath)
    messages = [
      {
        role: "user",
        content: `Analyze this academic material titled "${title}" for course ${courseCode}:\n\n${text.slice(0, 50000)}\n\nReturn the JSON summary.`,
      },
    ]
  } else {
    // For non-readable files (images, zip, etc.), summarize based on title/course only
    messages = [
      {
        role: "user",
        content: `Generate a study resource summary for a file titled "${title}" for course ${courseCode}. The file type is ${fileExt}. Return the JSON summary based on the title and course context.`,
      },
    ]
  }

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim()
  return JSON.parse(cleaned) as SummaryResult
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

  const filePath = path.join(process.cwd(), "public", material.fileAsset.fileUrl)
  if (!fs.existsSync(filePath))
    return Response.json({ error: "File not found on server." }, { status: 404 })

  const fileExt = path.extname(material.fileAsset.fileName).toLowerCase()

  let result: SummaryResult
  try {
    result = await summarizeWithClaude(fileExt, filePath, material.title, material.courseCode)
  } catch (err) {
    console.error("Claude summarization failed:", err)
    return Response.json({ error: "AI summarization failed. Please try again." }, { status: 500 })
  }

  // Upsert summary and replace suggested resources in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Delete old resources
    await tx.suggestedResource.deleteMany({ where: { materialId: matId } })

    // Upsert summary
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

    // Create suggested resources
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

    // Mark as summarized
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
}
