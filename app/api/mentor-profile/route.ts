export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D": 1.0, "F": 0.0,
}

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, fullName: true, studentId: true,
      faculty: true, degree: true, photoUrl: true,
      mentorProfile: true,
      semesters: {
        select: { subjects: { select: { grade: true, credits: true } } },
      },
    },
  })
  if (!user) return Response.json({ error: "Not found" }, { status: 404 })

  const subjects = user.semesters.flatMap(s => s.subjects)
  const pts = subjects.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0)
  const cr  = subjects.reduce((sum, s) => sum + s.credits, 0)
  const cgpa = cr > 0 ? pts / cr : 0

  return Response.json({ user, mentorProfile: user.mentorProfile, cgpa })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { gpa, subjects, bio, preferredDays, contactPreference } = body

  if (!bio?.trim()) return Response.json({ error: "Bio is required." }, { status: 400 })
  if (!subjects?.trim()) return Response.json({ error: "Subjects are required." }, { status: 400 })

  const existing = await prisma.mentorProfile.findUnique({ where: { userId: session.userId } })
  if (existing) return Response.json({ error: "Mentor profile already exists." }, { status: 400 })

  const profile = await prisma.mentorProfile.create({
    data: {
      userId: session.userId,
      gpa: Number(gpa) || 0,
      subjects: String(subjects),
      bio: String(bio),
      preferredDays: preferredDays ? String(preferredDays) : null,
      contactPreference: contactPreference === "CHAT" ? "CHAT" : "EMAIL",
      isActive: false,
    },
  })

  return Response.json(profile, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { subjects, bio, preferredDays, contactPreference } = body

  if (!bio?.trim()) return Response.json({ error: "Bio is required." }, { status: 400 })
  if (!subjects?.trim()) return Response.json({ error: "Subjects are required." }, { status: 400 })

  const profile = await prisma.mentorProfile.update({
    where: { userId: session.userId },
    data: {
      subjects: String(subjects),
      bio: String(bio),
      preferredDays: preferredDays ? String(preferredDays) : null,
      contactPreference: contactPreference === "CHAT" ? "CHAT" : "EMAIL",
    },
  })

  return Response.json(profile)
}
