export const dynamic = "force-dynamic"

import { getSession } from "@/lib/auth/session"
import { removeAvailability } from "@/lib/student-availability-store"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 })

  const removed = removeAvailability(session.userId, id)
  if (!removed) return Response.json({ error: "Not found" }, { status: 404 })

  return Response.json({ ok: true })
}
