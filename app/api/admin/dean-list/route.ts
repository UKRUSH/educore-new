export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const threshold = parseFloat(searchParams.get("threshold") ?? "3.5")
  const search    = searchParams.get("search") ?? ""
  const faculty   = searchParams.get("faculty") ?? ""

  // Get students who have at least one semester with GPA >= threshold
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(search ? {
        OR: [
          { fullName: { contains: search } },
          { studentId: { contains: search } },
          { faculty: { contains: search } },
        ],
      } : {}),
      ...(faculty ? { faculty: { contains: faculty } } : {}),
      semesters: { some: { gpa: { gte: threshold } } },
    },
    select: {
      id: true,
      fullName: true,
      studentId: true,
      faculty: true,
      degree: true,
      intakeYear: true,
      photoUrl: true,
      semesters: {
        where: { gpa: { not: null } },
        orderBy: [{ academicYear: "desc" }, { semesterNum: "desc" }],
        select: { gpa: true, semesterNum: true, academicYear: true },
      },
    },
    orderBy: { fullName: "asc" },
  })

  // Attach best GPA and latest semester, filter to only those where latest semester qualifies
  const result = students
    .map((s) => {
      const bestGpa   = Math.max(...s.semesters.map(sem => sem.gpa ?? 0))
      const latestSem = s.semesters[0] ?? null
      return { ...s, bestGpa, latestSem }
    })
    .filter((s) => s.bestGpa >= threshold)
    .sort((a, b) => b.bestGpa - a.bestGpa)

  return Response.json(result)
}
