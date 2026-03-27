export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { userId, semesterNum, academicYear, gpa } = await request.json()

  if (!userId || !semesterNum || !academicYear)
    return Response.json({ error: "userId, semesterNum and academicYear are required." }, { status: 400 })

  const semester = await prisma.semester.create({
    data: {
      userId: Number(userId),
      semesterNum: Number(semesterNum),
      academicYear: String(academicYear),
      gpa: gpa !== undefined && gpa !== "" ? Number(gpa) : null,
    },
    select: {
      id: true, semesterNum: true, academicYear: true, gpa: true,
      subjects: true,
    },
  })

  return Response.json(semester, { status: 201 })
}
