export const dynamic = "force-dynamic"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const memberships = await prisma.studentClub.findMany({
    where: { userId: session.userId, isActive: true },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          category: true,
          logoUrl: true,
          _count: { select: { members: { where: { isActive: true } } } },
        },
      },
    },
    orderBy: { joinedDate: "desc" },
  })

  const result = await Promise.all(
    memberships.map(async (m) => {
      let attendanceCount = 0
      try {
        attendanceCount = await prisma.clubAttendance.count({
          where: { userId: session.userId, session: { clubId: m.clubId } },
        })
      } catch { /* table may not exist yet — default to 0 */ }
      return {
        membershipId: m.id,
        clubId: m.clubId,
        role: m.role,
        joinedDate: m.joinedDate,
        participationPoints: m.participationPoints,
        attendanceCount,
        club: m.club,
      }
    })
  )

  return Response.json(result)
}
