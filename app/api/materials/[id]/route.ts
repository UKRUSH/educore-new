export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  const matId = Number(id)

  const material = await prisma.studyMaterial.findUnique({
    where: { id: matId },
    include: { fileAsset: true },
  })
  if (!material || material.userId !== session.userId)
    return Response.json({ error: "Not found." }, { status: 404 })

  await prisma.studyMaterial.delete({ where: { id: matId } })
  return new Response(null, { status: 204 })
}
