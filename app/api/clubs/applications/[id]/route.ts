import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

type Ctx = { params: Promise<{ id: string }> }

// GET — read full application details
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const app = await prisma.clubApplication.findUnique({
    where: { id: Number(id) },
    include: {
      club: { select: { id: true, name: true, category: true, logoUrl: true } },
      feedback: { select: { message: true } },
    },
  })

  if (!app || app.userId !== session.userId)
    return Response.json({ error: "Not found." }, { status: 404 })

  return Response.json(app)
}

// PUT — update a PENDING application
export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const app = await prisma.clubApplication.findUnique({ where: { id: Number(id) } })

  if (!app || app.userId !== session.userId)
    return Response.json({ error: "Not found." }, { status: 404 })

  if (app.status !== "PENDING")
    return Response.json({ error: "Only pending applications can be edited." }, { status: 400 })

  const body = await req.json()
  const { motivation, contribution, experience, availableDays, additionalInfo } = body

  if (!motivation?.trim())
    return Response.json({ error: "Motivation is required." }, { status: 400 })

  const updated = await prisma.clubApplication.update({
    where: { id: Number(id) },
    data: {
      motivation:     String(motivation).trim(),
      contribution:   contribution  ? String(contribution).trim()  : null,
      experience:     experience    ? String(experience).trim()    : null,
      availableDays:  availableDays ? String(availableDays).trim() : null,
      additionalInfo: additionalInfo ? String(additionalInfo).trim() : null,
    },
    include: {
      club: { select: { id: true, name: true, category: true, logoUrl: true } },
      feedback: { select: { message: true } },
    },
  })

  return Response.json(updated)
}

// DELETE — withdraw an application
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const app = await prisma.clubApplication.findUnique({ where: { id: Number(id) } })

  if (!app || app.userId !== session.userId)
    return Response.json({ error: "Not found." }, { status: 404 })

  await prisma.clubApplication.delete({ where: { id: Number(id) } })
  return new Response(null, { status: 204 })
}
