export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { clubId, label, expiresInMinutes = 120 } = await request.json()
  if (!clubId) return Response.json({ error: "clubId is required." }, { status: 400 })

  const membership = await prisma.studentClub.findUnique({
    where: { userId_clubId: { userId: session.userId, clubId: Number(clubId) } },
  })
  if (!membership || !membership.isActive)
    return Response.json({ error: "You are not an active member of this club." }, { status: 403 })

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + Number(expiresInMinutes) * 60 * 1000)

  const attendanceSession = await prisma.clubAttendanceSession.create({
    data: {
      clubId: Number(clubId),
      token,
      label: label?.trim() || "Club Meeting",
      expiresAt,
    },
  })

  const qrDataUrl = await QRCode.toDataURL(token, { width: 280, margin: 2 })

  return Response.json({ ...attendanceSession, qrDataUrl }, { status: 201 })
}
