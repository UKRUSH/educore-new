export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

const BASE_SUBJECT_SELECT = {
  id: true,
  subjectCode: true,
  subjectName: true,
  credits: true,
  marks: true,
  grade: true,
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await ctx.params
  const userId = Number(id)

  const SEM_ORDER = [{ academicYear: "desc" as const }, { semesterNum: "desc" as const }]
  const SUBJ_ORDER = { subjectCode: "asc" as const }

  // Attempt with CA/Final marks columns (available after dev server restart)
  let user = null
  let hasExtendedMarks = true

  try {
    user = await (prisma.user.findUnique as Function)({
      where: { id: userId },
      select: {
        id: true, fullName: true, studentId: true, faculty: true,
        degree: true, intakeYear: true, photoUrl: true,
        semesters: {
          orderBy: SEM_ORDER,
          select: {
            id: true, semesterNum: true, academicYear: true, gpa: true,
            subjects: {
              orderBy: SUBJ_ORDER,
              select: { ...BASE_SUBJECT_SELECT, caMarks: true, finalMarks: true },
            },
          },
        },
      },
    })
  } catch {
    hasExtendedMarks = false
  }

  // Fallback without new columns (when Prisma client not yet regenerated)
  if (!hasExtendedMarks) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, fullName: true, studentId: true, faculty: true,
        degree: true, intakeYear: true, photoUrl: true,
        semesters: {
          orderBy: SEM_ORDER,
          select: {
            id: true, semesterNum: true, academicYear: true, gpa: true,
            subjects: {
              orderBy: SUBJ_ORDER,
              select: BASE_SUBJECT_SELECT,
            },
          },
        },
      },
    })
    // Patch nulls so the client TypeScript shape stays consistent
    if (user) {
      user = {
        ...user,
        semesters: user.semesters.map(sem => ({
          ...sem,
          subjects: sem.subjects.map(subj => ({ ...subj, caMarks: null, finalMarks: null })),
        })),
      }
    }
  }

  if (!user) return Response.json({ error: "User not found." }, { status: 404 })
  return Response.json(user)
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await ctx.params
  const userId = Number(id)

  if (userId === session.userId)
    return Response.json({ error: "Cannot delete your own account." }, { status: 400 })

  await prisma.user.delete({ where: { id: userId } })
  return Response.json({ message: "User deleted." })
}
