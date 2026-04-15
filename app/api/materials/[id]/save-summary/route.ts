export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  const matId   = Number(id)
  if (isNaN(matId)) return Response.json({ error: "Invalid ID." }, { status: 400 })

  const material = await prisma.studyMaterial.findUnique({ where: { id: matId } })
  if (!material || material.userId !== session.userId)
    return Response.json({ error: "Not found." }, { status: 404 })

  const { extractedText, quickSummary, detailedNotes, keyTerms } = await request.json()
  if (!quickSummary?.trim())
    return Response.json({ error: "quickSummary is required." }, { status: 400 })

  await prisma.materialSummary.upsert({
    where:  { materialId: matId },
    create: { materialId: matId, quickSummary, detailedNotes: detailedNotes ?? extractedText ?? "", keyTerms: keyTerms ?? "" },
    update: { quickSummary, detailedNotes: detailedNotes ?? extractedText ?? "", keyTerms: keyTerms ?? "", updatedAt: new Date() },
  })

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
}
