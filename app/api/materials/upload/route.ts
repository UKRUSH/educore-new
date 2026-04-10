export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { MaterialType } from "@prisma/client"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { uploadBuffer } from "@/lib/cloudinary"

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
const VALID_TYPES = Object.values(MaterialType) as string[]

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let formData: FormData
  try { formData = await request.formData() }
  catch { return Response.json({ error: "Invalid form data." }, { status: 400 }) }

  const file = formData.get("file") as File | null
  if (!file || typeof file === "string")
    return Response.json({ error: "No file received." }, { status: 400 })
  if (file.size > MAX_SIZE)
    return Response.json({ error: "File too large. Max 20 MB." }, { status: 413 })

  const title       = (formData.get("title")       as string | null)?.trim()
  const courseCode  = (formData.get("courseCode")  as string | null)?.trim()
  const type        = (formData.get("type")         as string | null) ?? ""
  const description = (formData.get("description") as string | null)?.trim() || null

  if (!title || !courseCode)
    return Response.json({ error: "Title and course code are required." }, { status: 400 })

  const materialType: MaterialType = VALID_TYPES.includes(type) ? (type as MaterialType) : MaterialType.NOTES

  const buffer = Buffer.from(await file.arrayBuffer())

  let cloudResult: { secure_url: string; public_id: string; bytes: number }
  try {
    cloudResult = await uploadBuffer(buffer, {
      folder: "educore/materials",
      resource_type: "auto",
      public_id: `material-${session.userId}-${Date.now()}`,
      use_filename: true,
      unique_filename: true,
    })
  } catch {
    return Response.json({ error: "Upload to Cloudinary failed." }, { status: 500 })
  }

  const fileUrl = cloudResult.secure_url

  try {
    const material = await prisma.$transaction(async (tx) => {
      const mat = await tx.studyMaterial.create({
        data: {
          title,
          courseCode: courseCode.toUpperCase(),
          type: materialType,
          description,
          userId: session.userId,
        },
      })
      await tx.fileAsset.create({
        data: {
          fileName: file.name,
          fileSize: cloudResult.bytes,
          fileUrl,
          fileType: file.type,
          userId: session.userId,
          materialId: mat.id,
        },
      })
      return tx.studyMaterial.findUnique({
        where: { id: mat.id },
        include: {
          fileAsset: { select: { fileName: true, fileSize: true, fileUrl: true, fileType: true } },
          summary: { select: { quickSummary: true } },
        },
      })
    })
    return Response.json(material, { status: 201 })
  } catch {
    return Response.json({ error: "Database error." }, { status: 500 })
  }
}
