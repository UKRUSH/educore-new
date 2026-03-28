export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D": 1.0,  "F": 0.0,
}

function calcCGPA(semesters: { subjects: { grade: string; credits: number }[] }[]) {
  const subjects = semesters.flatMap(s => s.subjects)
  if (!subjects.length) return null
  const pts = subjects.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0)
  const cr  = subjects.reduce((sum, s) => sum + s.credits, 0)
  return cr > 0 ? pts / cr : null
}

function calcSemGPA(subjects: { grade: string; credits: number }[]) {
  if (!subjects.length) return null
  const pts = subjects.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0)
  const cr  = subjects.reduce((sum, s) => sum + s.credits, 0)
  return cr > 0 ? pts / cr : null
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const threshold = parseFloat(searchParams.get("threshold") ?? "3.5")
  const search    = searchParams.get("search") ?? ""
  const faculty   = searchParams.get("faculty") ?? ""

  // Fetch all students with their semesters + subjects
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(search ? {
        OR: [
          { fullName:  { contains: search } },
          { studentId: { contains: search } },
          { faculty:   { contains: search } },
        ],
      } : {}),
      ...(faculty ? { faculty: { contains: faculty } } : {}),
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
        orderBy: [{ academicYear: "desc" }, { semesterNum: "desc" }],
        select: {
          id: true,
          semesterNum: true,
          academicYear: true,
          gpa: true,
          subjects: {
            select: { grade: true, credits: true },
          },
        },
      },
    },
    orderBy: { fullName: "asc" },
  })

  // Calculate real CGPA from subjects for each student
  const enriched = students.map(s => {
    const cgpa = calcCGPA(s.semesters) ??
      // fallback: average of non-null stored gpa values
      (s.semesters.filter(sem => sem.gpa !== null).length > 0
        ? s.semesters.filter(sem => sem.gpa !== null).reduce((sum, sem) => sum + (sem.gpa ?? 0), 0) /
          s.semesters.filter(sem => sem.gpa !== null).length
        : null)

    if (cgpa === null) return null

    // Latest semester info
    const latestSem = s.semesters[0] ?? null
    const latestGpa = latestSem
      ? (calcSemGPA(latestSem.subjects) ?? latestSem.gpa)
      : null

    return {
      id:        s.id,
      fullName:  s.fullName,
      studentId: s.studentId,
      faculty:   s.faculty,
      degree:    s.degree,
      intakeYear: s.intakeYear,
      photoUrl:  s.photoUrl,
      bestGpa:   cgpa,
      latestSem: latestSem ? {
        gpa:          latestGpa,
        semesterNum:  latestSem.semesterNum,
        academicYear: latestSem.academicYear,
      } : null,
    }
  })

  // Filter by threshold and sort by CGPA desc
  const result = enriched
    .filter((s): s is NonNullable<typeof s> => s !== null && s.bestGpa >= threshold)
    .sort((a, b) => b.bestGpa - a.bestGpa)

  return Response.json(result)
}
