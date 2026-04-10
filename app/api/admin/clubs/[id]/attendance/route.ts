export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import QRCode from "qrcode"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await context.params
  const clubId = Number(id)

  const club = await prisma.club.findUnique({ where: { id: clubId } })
  if (!club) return Response.json({ error: "Club not found." }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const label = body.label?.trim() || "Club Meeting"

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  const attendanceSession = await prisma.clubAttendanceSession.create({
    data: { clubId, token, label, expiresAt },
  })

  const qrDataUrl = await QRCode.toDataURL(token, { width: 300, margin: 2 })

  return Response.json({ ...attendanceSession, qrDataUrl }, { status: 201 })
}
