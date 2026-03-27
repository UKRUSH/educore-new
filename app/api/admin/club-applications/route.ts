export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const search = searchParams.get("search") ?? ""

  const apps = await prisma.clubApplication.findMany({
    where: {
      ...(status && status !== "ALL" ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED" } : {}),
      ...(search ? {
        OR: [
          { user: { fullName: { contains: search } } },
          { club: { name: { contains: search } } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { fullName: true, email: true, studentId: true, faculty: true } },
      club: { select: { name: true, category: true } },
    },
  })

  return Response.json(apps)
}
