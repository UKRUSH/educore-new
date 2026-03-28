export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await ctx.params
  const { semesterNum, academicYear, gpa } = await request.json()

  const semester = await prisma.semester.update({
    where: { id: Number(id) },
    data: {
      ...(semesterNum !== undefined ? { semesterNum: Number(semesterNum) } : {}),
      ...(academicYear !== undefined ? { academicYear: String(academicYear) } : {}),
      gpa: gpa !== undefined && gpa !== "" ? Number(gpa) : null,
    },
    select: { id: true, semesterNum: true, academicYear: true, gpa: true },
  })

  return Response.json(semester)
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await ctx.params
  await prisma.semester.delete({ where: { id: Number(id) } })
  return Response.json({ message: "Semester deleted." })
}
