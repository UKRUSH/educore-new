export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { uploadBuffer } from "@/lib/cloudinary"

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let formData: FormData
  try { formData = await request.formData() }
  catch { return Response.json({ error: "Invalid form data." }, { status: 400 }) }

  const file = formData.get("photo") as File | null
  if (!file || typeof file === "string")
    return Response.json({ error: "No file received. Field name must be 'photo'." }, { status: 400 })
  if (!ALLOWED.includes(file.type))
    return Response.json({ error: "Use JPEG, PNG, WebP or GIF." }, { status: 415 })
  if (file.size > MAX_SIZE)
    return Response.json({ error: "File too large. Max 5 MB." }, { status: 413 })

  const buffer = Buffer.from(await file.arrayBuffer())

  let cloudResult: { secure_url: string; public_id: string; bytes: number }
  try {
    cloudResult = await uploadBuffer(buffer, {
      folder: "educore/profiles",
      resource_type: "image",
      public_id: `user-${session.userId}-${Date.now()}`,
      overwrite: true,
    })
  } catch {
    return Response.json({ error: "Upload to Cloudinary failed." }, { status: 500 })
  }

  const fileUrl = cloudResult.secure_url

  try {
    await prisma.$transaction([
      prisma.fileAsset.create({
        data: {
          fileName: file.name,
          fileSize: cloudResult.bytes,
          fileUrl,
          fileType: file.type,
          userId: session.userId,
        },
      }),
      prisma.user.update({ where: { id: session.userId }, data: { photoUrl: fileUrl } }),
    ])
  } catch {
    return Response.json({ error: "Database error." }, { status: 500 })
  }

  return Response.json({ photoUrl: fileUrl })
}
