export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await context.params
  const body = await request.json()
  const { isActive } = body

  const mentor = await prisma.mentorProfile.update({
    where: { id: Number(id) },
    data: { isActive: Boolean(isActive) },
    include: {
      user: { select: { fullName: true, email: true, faculty: true, photoUrl: true } },
      _count: { select: { sessions: true } },
    },
  })

  return Response.json(mentor)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await context.params
  await prisma.mentorProfile.delete({ where: { id: Number(id) } })
  return Response.json({ success: true })
}
