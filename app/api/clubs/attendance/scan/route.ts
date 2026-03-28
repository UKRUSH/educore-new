export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { token } = await request.json()
  if (!token?.trim()) return Response.json({ error: "No QR token provided." }, { status: 400 })

  const attendanceSession = await prisma.clubAttendanceSession.findUnique({
    where: { token: String(token).trim() },
    include: { club: { select: { name: true } } },
  })
  if (!attendanceSession) return Response.json({ error: "Invalid QR code." }, { status: 404 })
  if (attendanceSession.expiresAt < new Date())
    return Response.json({ error: "This QR code has expired." }, { status: 400 })

  const membership = await prisma.studentClub.findUnique({
    where: { userId_clubId: { userId: session.userId, clubId: attendanceSession.clubId } },
  })
  if (!membership)
    return Response.json({ error: "You are not a member of this club." }, { status: 403 })

  const existing = await prisma.clubAttendance.findUnique({
    where: { userId_sessionId: { userId: session.userId, sessionId: attendanceSession.id } },
  })
  if (existing)
    return Response.json({ error: "Attendance already marked for this session." }, { status: 409 })

  const attendance = await prisma.clubAttendance.create({
    data: { userId: session.userId, sessionId: attendanceSession.id },
  })

  return Response.json({
    success: true,
    clubName: attendanceSession.club.name,
    label: attendanceSession.label,
    scannedAt: attendance.scannedAt,
  })
}
