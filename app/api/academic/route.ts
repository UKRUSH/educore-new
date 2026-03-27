export const dynamic = "force-dynamic"

import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

const BASE_SUBJ = {
  id: true, subjectCode: true, subjectName: true,
  credits: true, marks: true, grade: true,
}

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 })

  const SEM_ORDER = [{ academicYear: "asc" as const }, { semesterNum: "asc" as const }]
  const SUBJ_ORDER = { subjectCode: "asc" as const }

  let user = null
  let extended = true

  try {
    user = await (prisma.user.findUnique as Function)({
      where: { id: session.userId },
      select: {
        id: true, fullName: true, email: true, studentId: true,
        faculty: true, degree: true, intakeYear: true, photoUrl: true,
        phone: true, gender: true, dateOfBirth: true, createdAt: true,
        semesters: {
          orderBy: SEM_ORDER,
          select: {
            id: true, semesterNum: true, academicYear: true, gpa: true,
            subjects: {
              orderBy: SUBJ_ORDER,
              select: { ...BASE_SUBJ, caMarks: true, finalMarks: true },
            },
          },
        },
      },
    })
  } catch {
    extended = false
  }

  if (!extended) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true, fullName: true, email: true, studentId: true,
        faculty: true, degree: true, intakeYear: true, photoUrl: true,
        phone: true, gender: true, dateOfBirth: true, createdAt: true,
        semesters: {
          orderBy: SEM_ORDER,
          select: {
            id: true, semesterNum: true, academicYear: true, gpa: true,
            subjects: { orderBy: SUBJ_ORDER, select: BASE_SUBJ },
          },
        },
      },
    })
    if (user) {
      user = {
        ...user,
        semesters: (user as { semesters: { subjects: object[] }[] }).semesters.map(sem => ({
          ...sem,
          subjects: sem.subjects.map(subj => ({ ...subj, caMarks: null, finalMarks: null })),
        })),
      }
    }
  }

  if (!user) return Response.json({ error: "User not found." }, { status: 404 })
  return Response.json(user)
}
