export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          members: { where: { isActive: true } },
          applications: { where: { status: "PENDING" } },
        },
      },
    },
  })

  return Response.json(clubs)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const body = await request.json()
  const { name, category, description, requirements, capacity, status, email, social } = body

  if (!name?.trim() || !category || !description?.trim() || !capacity)
    return Response.json({ error: "Name, category, description and capacity are required." }, { status: 400 })

  const validCats = ["ACADEMIC", "SPORTS", "CULTURAL", "RELIGIOUS", "OTHER"]
  if (!validCats.includes(String(category)))
    return Response.json({ error: "Invalid category." }, { status: 400 })

  const validStatuses = ["OPEN", "FULL", "CLOSED"]
  const clubStatus = validStatuses.includes(String(status)) ? String(status) : "OPEN"

  const club = await prisma.club.create({
    data: {
      name: String(name).trim(),
      category: category as "ACADEMIC" | "SPORTS" | "CULTURAL" | "RELIGIOUS" | "OTHER",
      description: String(description).trim(),
      requirements: requirements ? String(requirements).trim() : null,
      capacity: Number(capacity),
      status: clubStatus as "OPEN" | "FULL" | "CLOSED",
      email: email ? String(email).trim() : null,
      social: social ? String(social).trim() : null,
    },
    include: {
      _count: { select: { members: { where: { isActive: true } }, applications: { where: { status: "PENDING" } } } },
    },
  })

  return Response.json(club, { status: 201 })
}
