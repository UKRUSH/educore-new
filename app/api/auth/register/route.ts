export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { hashPassword, setSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { fullName, email, studentId, password, faculty, degree, intakeYear } = body

  // ── Validation ──────────────────────────────────────────────────────────────

  if (!fullName || !email || !studentId || !password || !faculty || !degree || !intakeYear) {
    return Response.json({ error: "All fields are required." }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(String(email))) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  if (typeof password !== "string" || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 })
  }

  const year = Number(intakeYear)
  const currentYear = new Date().getFullYear()
  if (!Number.isInteger(year) || year < 1990 || year > currentYear) {
    return Response.json(
      { error: `Intake year must be between 1990 and ${currentYear}.` },
      { status: 400 }
    )
  }

  // ── Uniqueness check ────────────────────────────────────────────────────────

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: String(email) }, { studentId: String(studentId) }] },
    select: { email: true, studentId: true },
  })

  if (existing?.email === String(email)) {
    return Response.json({ error: "This email is already registered." }, { status: 409 })
  }
  if (existing?.studentId === String(studentId)) {
    return Response.json({ error: "This Student ID is already registered." }, { status: 409 })
  }

  // ── Create user ─────────────────────────────────────────────────────────────

  const user = await prisma.user.create({
    data: {
      fullName: String(fullName),
      email: String(email),
      studentId: String(studentId),
      password: hashPassword(String(password)),
      faculty: String(faculty),
      degree: String(degree),
      intakeYear: year,
    },
    select: { id: true, role: true },
  })

  // ── Set session cookie ──────────────────────────────────────────────────────

  await setSession(user.id, user.role)

  return Response.json({ message: "Account created successfully." }, { status: 201 })
}
