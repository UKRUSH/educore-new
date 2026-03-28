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
  const { status, feedback } = body

  const validStatuses = ["APPROVED", "REJECTED", "WAITLISTED"]
  if (!validStatuses.includes(String(status)))
    return Response.json({ error: "Invalid status." }, { status: 400 })

  const application = await prisma.clubApplication.findUnique({
    where: { id: Number(id) },
    include: { club: true },
  })
  if (!application)
    return Response.json({ error: "Application not found." }, { status: 404 })

  // Update application status
  const updated = await prisma.clubApplication.update({
    where: { id: Number(id) },
    data: { status: status as "APPROVED" | "REJECTED" | "WAITLISTED" },
    include: {
      user: { select: { fullName: true, email: true, studentId: true, faculty: true } },
      club: { select: { name: true, category: true } },
    },
  })

  // Save feedback if provided
  if (feedback?.trim()) {
    await prisma.applicationFeedback.upsert({
      where: { applicationId: Number(id) },
      create: { applicationId: Number(id), message: String(feedback).trim() },
      update: { message: String(feedback).trim() },
    })
  }

  // If approved: create StudentClub membership
  if (status === "APPROVED") {
    await prisma.studentClub.upsert({
      where: { userId_clubId: { userId: application.userId, clubId: application.clubId } },
      create: { userId: application.userId, clubId: application.clubId, isActive: true },
      update: { isActive: true },
    })

    // Check if capacity reached → mark club FULL
    const activeCount = await prisma.studentClub.count({
      where: { clubId: application.clubId, isActive: true },
    })
    if (activeCount >= application.club.capacity) {
      await prisma.club.update({
        where: { id: application.clubId },
        data: { status: "FULL" },
      })
    }
  }

  return Response.json(updated)
}
