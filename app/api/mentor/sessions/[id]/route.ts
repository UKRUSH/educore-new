export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 })

  const mentor = await prisma.mentorProfile.findUnique({ where: { userId: session.userId } })
  if (!mentor) return Response.json({ error: "Not found" }, { status: 404 })

  const sess = await prisma.supportSession.findFirst({ where: { id, mentorId: mentor.id } })
  if (!sess) return Response.json({ error: "Session not found" }, { status: 404 })

  const body = await request.json()
  const { status, subject, description, date, durationMins, locationOrLink, capacity } = body

  const valid = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]
  if (status && !valid.includes(status))
    return Response.json({ error: "Invalid status" }, { status: 400 })

  // Full edit mode (when subject is provided)
  if (subject !== undefined) {
    if (!subject?.trim()) return Response.json({ error: "Subject is required" }, { status: 400 })
    if (!date) return Response.json({ error: "Date & time is required" }, { status: 400 })
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return Response.json({ error: "Invalid date" }, { status: 400 })
    const dur = parseInt(durationMins) || 60
    if (dur < 15 || dur > 240) return Response.json({ error: "Duration must be 15–240 minutes" }, { status: 400 })
    const cap = parseInt(capacity) || 10
    if (cap < 1 || cap > 10) return Response.json({ error: "Max students cannot exceed 10 per session" }, { status: 400 })

    const updated = await prisma.supportSession.update({
      where: { id },
      data: {
        subject: subject.trim(),
        description: description?.trim() || null,
        date: parsedDate,
        durationMins: dur,
        locationOrLink: locationOrLink?.trim() || null,
        capacity: cap,
        ...(status ? { status } : {}),
      },
    })
    return Response.json(updated)
  }

  const updated = await prisma.supportSession.update({
    where: { id },
    data: { ...(status ? { status } : {}) },
  })

  return Response.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 })

  const mentor = await prisma.mentorProfile.findUnique({ where: { userId: session.userId } })
  if (!mentor) return Response.json({ error: "Not found" }, { status: 404 })

  const sess = await prisma.supportSession.findFirst({ where: { id, mentorId: mentor.id } })
  if (!sess) return Response.json({ error: "Session not found" }, { status: 404 })

  await prisma.supportSession.delete({ where: { id } })
  return Response.json({ ok: true })
}
