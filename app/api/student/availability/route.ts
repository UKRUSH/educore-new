export const dynamic = "force-dynamic"

import { getSession } from "@/lib/auth/session"
import { addAvailability, listAvailability } from "@/lib/student-availability-store"

function isValidTime(value: unknown): value is string {
  if (typeof value !== "string") return false
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  return Response.json(listAvailability(session.userId))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: "Invalid JSON body." }, { status: 400 })

  const dayOfWeek = Number(body.dayOfWeek)
  const startTime = body.startTime
  const endTime = body.endTime
  const labelInput = typeof body.label === "string" ? body.label.trim() : ""
  const label = labelInput.length ? labelInput.slice(0, 30) : null

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return Response.json({ error: "dayOfWeek must be between 0 and 6." }, { status: 400 })
  }

  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return Response.json({ error: "Time must be in HH:MM format." }, { status: 400 })
  }

  if (startTime >= endTime) {
    return Response.json({ error: "End time must be after start time." }, { status: 400 })
  }

  const created = addAvailability(session.userId, { dayOfWeek, startTime, endTime, label })
  if (!created.ok) {
    return Response.json({ error: created.error }, { status: created.status })
  }

  return Response.json(created.slot, { status: 201 })
}
