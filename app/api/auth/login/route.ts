export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { verifyPassword, setSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, rememberMe } = body

  // ── Validation ──────────────────────────────────────────────────────────────

  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(String(email))) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  if (typeof password !== "string" || password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 })
  }

  // ── Database lookup ─────────────────────────────────────────────────────────

  let user: { id: number; password: string; role: "STUDENT" | "ADMIN" | "LECTURER"; fullName: string } | null = null

  try {
    user = await prisma.user.findUnique({
      where: { email: String(email) },
      select: { id: true, password: true, role: true, fullName: true },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return Response.json(
        {
          error: "Database is unavailable. Please check your connection and try again.",
          code: "DB_UNAVAILABLE",
        },
        { status: 503 },
      )
    }

    console.error("Login query failed", error)
    return Response.json({ error: "Internal server error." }, { status: 500 })
  }

  if (!user || !verifyPassword(String(password), user.password)) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 })
  }

  // ── Set session cookie ──────────────────────────────────────────────────────

  await setSession(user.id, user.role, Boolean(rememberMe))

  return Response.json({ message: "Login successful.", name: user.fullName, role: user.role })
}
