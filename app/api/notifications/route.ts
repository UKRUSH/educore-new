export const dynamic = "force-dynamic"

import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.userId
  const now = new Date()
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [rawNotifs, clubApps, sessionApps] = await Promise.all([
    // Direct notifications
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),

    // Club application status updates (APPROVED / REJECTED / WAITLISTED)
    prisma.clubApplication.findMany({
      where: {
        userId,
        status: { in: ["APPROVED", "REJECTED", "WAITLISTED"] },
        updatedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: { club: { select: { id: true, name: true, logoUrl: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),

    // Upcoming sessions the user applied to (APPROVED, within next 7 days)
    prisma.sessionApplication.findMany({
      where: {
        userId,
        status: "APPROVED",
        session: { date: { gte: now, lte: soon }, status: "UPCOMING" },
      },
      include: {
        session: {
          select: {
            id: true, subject: true, date: true,
            locationOrLink: true, durationMins: true,
            mentor: { select: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  // Map club apps → unified notification shape
  const clubNotifs = clubApps.map(app => ({
    id: `club-${app.id}`,
    type: "CLUB",
    isRead: false,
    createdAt: app.updatedAt,
    title: app.status === "APPROVED"
      ? `Joined ${app.club.name}`
      : app.status === "WAITLISTED"
        ? `Waitlisted for ${app.club.name}`
        : `Not accepted to ${app.club.name}`,
    message: app.status === "APPROVED"
      ? `Your application to ${app.club.name} was approved. Welcome aboard!`
      : app.status === "WAITLISTED"
        ? `You have been placed on the waitlist for ${app.club.name}.`
        : `Your application to ${app.club.name} was not accepted this time.`,
    icon: app.status === "APPROVED" ? "club_approved" : app.status === "WAITLISTED" ? "club_wait" : "club_rejected",
    meta: { clubId: app.club.id, clubName: app.club.name, status: app.status },
  }))

  // Map session apps → unified notification shape
  const sessionNotifs = sessionApps.map(app => {
    const s = app.session
    const dateStr = new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    const timeStr = new Date(s.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    return {
      id: `session-${app.id}`,
      type: "SESSION",
      isRead: false,
      createdAt: s.date,
      title: `Upcoming: ${s.subject}`,
      message: `Session on ${dateStr} at ${timeStr} (${s.durationMins} min) with ${s.mentor.user.fullName}`,
      icon: "session",
      meta: { sessionId: s.id, subject: s.subject, date: s.date, location: s.locationOrLink },
    }
  })

  // Raw DB notifications → unified shape
  const dbNotifs = rawNotifs.map(n => ({
    id: `notif-${n.id}`,
    dbId: n.id,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt,
    title: typeToTitle(n.type),
    message: n.message,
    icon: n.type.toLowerCase(),
    meta: {},
  }))

  // Merge + sort by date desc
  const all = [...dbNotifs, ...clubNotifs, ...sessionNotifs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const unreadCount = all.filter(n => !n.isRead).length

  return Response.json({ notifications: all, unreadCount })
}

export async function PATCH() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  })

  return Response.json({ ok: true })
}

function typeToTitle(type: string) {
  const map: Record<string, string> = {
    CLUB: "Club Update",
    SESSION: "Session Update",
    ACADEMIC: "Academic Update",
    SYSTEM: "System Notice",
    MENTOR: "Mentor Notice",
  }
  return map[type] ?? "Notification"
}
