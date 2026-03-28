export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { userId: userIdStr } = await params
  const otherId = parseInt(userIdStr)
  if (isNaN(otherId)) return Response.json({ error: "Invalid user" }, { status: 400 })

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: { senderId: otherId, receiverId: session.userId, isRead: false },
    data: { isRead: true },
  })

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.userId, receiverId: otherId },
        { senderId: otherId, receiverId: session.userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, content: true, createdAt: true },
  })

  return Response.json(messages)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { userId: userIdStr } = await params
  const otherId = parseInt(userIdStr)
  if (isNaN(otherId)) return Response.json({ error: "Invalid user" }, { status: 400 })

  const { content } = await request.json()
  if (!content?.trim()) return Response.json({ error: "Empty message" }, { status: 400 })

  const msg = await prisma.message.create({
    data: { senderId: session.userId, receiverId: otherId, content: content.trim() },
    select: { id: true, senderId: true, content: true, createdAt: true },
  })

  return Response.json(msg, { status: 201 })
}
