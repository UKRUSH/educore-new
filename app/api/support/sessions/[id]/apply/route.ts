export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id: idStr } = await params
  const sessionId = parseInt(idStr)
  if (isNaN(sessionId)) return Response.json({ error: "Invalid session id" }, { status: 400 })

  const supportSession = await prisma.supportSession.findUnique({
    where: { id: sessionId },
    include: { _count: { select: { applications: true } } },
  })
  if (!supportSession || supportSession.status !== "UPCOMING")
    return Response.json({ error: "Session not available" }, { status: 404 })

  if (supportSession._count.applications >= supportSession.capacity)
    return Response.json({ error: "Session is full" }, { status: 409 })

  const existing = await prisma.sessionApplication.findUnique({
    where: { sessionId_userId: { sessionId, userId: session.userId } },
  })
  if (existing) return Response.json({ error: "Already applied to this session" }, { status: 409 })

  const application = await prisma.sessionApplication.create({
    data: { sessionId, userId: session.userId, status: "APPROVED" },
  })

  return Response.json(application, { status: 201 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id: idStr } = await params
  const sessionId = parseInt(idStr)
  if (isNaN(sessionId)) return Response.json({ error: "Invalid session id" }, { status: 400 })

  await prisma.sessionApplication.deleteMany({
    where: { sessionId, userId: session.userId },
  })

  return Response.json({ ok: true })
}
