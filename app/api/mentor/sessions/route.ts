export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const mentor = await prisma.mentorProfile.findUnique({
    where: { userId: session.userId },
  })
  if (!mentor || !mentor.isActive)
    return Response.json({ error: "No active mentor profile" }, { status: 403 })

  const sessions = await prisma.supportSession.findMany({
    where: { mentorId: mentor.id },
    orderBy: { date: "desc" },
    include: {
      _count: { select: { applications: true } },
      applications: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              faculty: true,
              degree: true,
              photoUrl: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  return Response.json(sessions.map(s => ({
    id: s.id,
    subject: s.subject,
    description: s.description,
    date: s.date,
    durationMins: s.durationMins,
    locationOrLink: s.locationOrLink,
    capacity: s.capacity,
    status: s.status,
    enrolled: s._count.applications,
    createdAt: s.createdAt,
    students: s.applications.map(a => ({
      id: a.user.id,
      fullName: a.user.fullName,
      studentId: a.user.studentId,
      faculty: a.user.faculty,
      degree: a.user.degree,
      photoUrl: a.user.photoUrl,
      joinedAt: a.createdAt,
    })),
  })))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const mentor = await prisma.mentorProfile.findUnique({
    where: { userId: session.userId },
  })
  if (!mentor || !mentor.isActive)
    return Response.json({ error: "Only active mentors can create sessions" }, { status: 403 })

  const body = await request.json()
  const { subject, description, date, durationMins, locationOrLink, capacity } = body

  if (!subject?.trim()) return Response.json({ error: "Subject is required" }, { status: 400 })
  if (!date) return Response.json({ error: "Date & time is required" }, { status: 400 })

  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) return Response.json({ error: "Invalid date" }, { status: 400 })
  if (parsedDate <= new Date()) return Response.json({ error: "Session date must be in the future" }, { status: 400 })

  const dur = parseInt(durationMins) || 60
  if (dur < 15 || dur > 240) return Response.json({ error: "Duration must be 15–240 minutes" }, { status: 400 })

  const cap = parseInt(capacity) || 10
  if (cap < 1 || cap > 10) return Response.json({ error: "Max students cannot exceed 10 per session" }, { status: 400 })

  const created = await prisma.supportSession.create({
    data: {
      mentorId: mentor.id,
      subject: subject.trim(),
      description: description?.trim() || null,
      date: parsedDate,
      durationMins: dur,
      locationOrLink: locationOrLink?.trim() || null,
      capacity: cap,
      status: "UPCOMING",
    },
  })

  return Response.json(created, { status: 201 })
}
