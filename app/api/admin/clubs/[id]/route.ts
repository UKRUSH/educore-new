export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await context.params
  const body = await request.json()
  const { name, category, description, requirements, capacity, status, email, social } = body

  const validCats = ["ACADEMIC", "SPORTS", "CULTURAL", "RELIGIOUS", "OTHER"]
  const validStatuses = ["OPEN", "FULL", "CLOSED"]

  if (category && !validCats.includes(String(category)))
    return Response.json({ error: "Invalid category." }, { status: 400 })
  if (status && !validStatuses.includes(String(status)))
    return Response.json({ error: "Invalid status." }, { status: 400 })

  const club = await prisma.club.update({
    where: { id: Number(id) },
    data: {
      ...(name ? { name: String(name).trim() } : {}),
      ...(category ? { category: category as "ACADEMIC" | "SPORTS" | "CULTURAL" | "RELIGIOUS" | "OTHER" } : {}),
      ...(description ? { description: String(description).trim() } : {}),
      ...(requirements !== undefined ? { requirements: requirements ? String(requirements).trim() : null } : {}),
      ...(capacity ? { capacity: Number(capacity) } : {}),
      ...(status ? { status: status as "OPEN" | "FULL" | "CLOSED" } : {}),
      ...(email !== undefined ? { email: email ? String(email).trim() : null } : {}),
      ...(social !== undefined ? { social: social ? String(social).trim() : null } : {}),
    },
    include: {
      _count: { select: { members: { where: { isActive: true } }, applications: { where: { status: "PENDING" } } } },
    },
  })

  return Response.json(club)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await context.params
  await prisma.club.delete({ where: { id: Number(id) } })
  return Response.json({ success: true })
}
