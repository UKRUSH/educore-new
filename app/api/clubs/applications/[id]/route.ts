export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

// GET /api/clubs/applications/[id] — fetch full application details
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  const application = await prisma.clubApplication.findUnique({
    where: { id: Number(id) },
    include: { club: { select: { name: true, category: true } } },
  })

  if (!application || application.userId !== session.userId)
    return Response.json({ error: "Not found." }, { status: 404 })

  return Response.json(application)
}

// PUT /api/clubs/applications/[id] — update a PENDING application
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  const application = await prisma.clubApplication.findUnique({ where: { id: Number(id) } })

  if (!application || application.userId !== session.userId)
    return Response.json({ error: "Not found." }, { status: 404 })

  if (application.status !== "PENDING")
    return Response.json({ error: "Only pending applications can be edited." }, { status: 400 })

  const body = await request.json()
  const { motivation, currentYear, currentSemester, gpa, contribution, experience, availableDays } = body

  if (!motivation?.trim())
    return Response.json({ error: "Motivation is required." }, { status: 400 })

  const updated = await prisma.clubApplication.update({
    where: { id: Number(id) },
    data: {
      motivation: String(motivation).trim(),
      currentYear: currentYear ? Number(currentYear) : null,
      currentSemester: currentSemester ? Number(currentSemester) : null,
      gpa: gpa ? Number(gpa) : null,
      contribution: contribution ? String(contribution).trim() : null,
      experience: experience ? String(experience).trim() : null,
      availableDays: availableDays ? String(availableDays).trim() : null,
    },
    include: { club: { select: { name: true, category: true } } },
  })

  return Response.json(updated)
}

// DELETE /api/clubs/applications/[id] — withdraw a PENDING application
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  const application = await prisma.clubApplication.findUnique({ where: { id: Number(id) } })

  if (!application || application.userId !== session.userId)
    return Response.json({ error: "Not found." }, { status: 404 })

  if (application.status !== "PENDING")
    return Response.json({ error: "Only pending applications can be withdrawn." }, { status: 400 })

  await prisma.clubApplication.delete({ where: { id: Number(id) } })

  return Response.json({ success: true })
}
