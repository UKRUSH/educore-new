export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") ?? ""
  const active = searchParams.get("active")

  const mentors = await prisma.mentorProfile.findMany({
    where: {
      ...(active === "true" ? { isActive: true } : active === "false" ? { isActive: false } : {}),
      ...(search ? {
        user: {
          OR: [
            { fullName: { contains: search } },
            { faculty: { contains: search } },
          ],
        },
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { fullName: true, email: true, faculty: true, photoUrl: true } },
      _count: { select: { sessions: true } },
    },
  })

  return Response.json(mentors)
}
