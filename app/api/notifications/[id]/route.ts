export const dynamic = "force-dynamic"

import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const id = parseInt(params.id)
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 })

  const notif = await prisma.notification.findUnique({ where: { id } })
  if (!notif || notif.userId !== session.userId)
    return Response.json({ error: "Not found" }, { status: 404 })

  await prisma.notification.update({ where: { id }, data: { isRead: true } })
  return Response.json({ ok: true })
}
