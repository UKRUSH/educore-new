export const dynamic = "force-dynamic"

import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const mentors = await prisma.mentorProfile.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: {
          fullName: true,
          studentId: true,
          faculty: true,
          degree: true,
          photoUrl: true,
        },
      },
      sessions: {
        where: { status: "UPCOMING", date: { gte: new Date() } },
        orderBy: { date: "asc" },
        include: {
          _count: { select: { applications: true } },
          applications: {
            where: { userId: session.userId },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { rating: "desc" },
  })

  const result = mentors.map(m => ({
    id:                m.id,
    userId:            m.userId,
    gpa:               m.gpa,
    subjects:          m.subjects,
    bio:               m.bio,
    preferredDays:     m.preferredDays,
    contactPreference: m.contactPreference,
    sessionsCount:     m.sessionsCount,
    rating:            m.rating,
    user:              m.user,
    sessions: m.sessions.map(s => ({
      id:            s.id,
      subject:       s.subject,
      description:   s.description,
      date:          s.date,
      durationMins:  s.durationMins,
      locationOrLink: s.locationOrLink,
      capacity:      s.capacity,
      status:        s.status,
      enrolled:      s._count.applications,
      hasApplied:    s.applications.length > 0,
    })),
  }))

  return Response.json(result)
}
