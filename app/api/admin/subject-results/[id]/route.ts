export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await ctx.params
  const { subjectCode, subjectName, credits, caMarks, finalMarks, marks, grade } = await request.json()

  const baseData = {
    ...(subjectCode !== undefined ? { subjectCode: String(subjectCode) } : {}),
    ...(subjectName !== undefined ? { subjectName: String(subjectName) } : {}),
    ...(credits !== undefined ? { credits: Number(credits) } : {}),
    ...(marks !== undefined ? { marks: Number(marks) } : {}),
    ...(grade !== undefined ? { grade: String(grade) } : {}),
  }

  try {
    const subject = await (prisma.subjectResult.update as Function)({
      where: { id: Number(id) },
      data: {
        ...baseData,
        caMarks: caMarks !== undefined && caMarks !== "" ? Number(caMarks) : null,
        finalMarks: finalMarks !== undefined && finalMarks !== "" ? Number(finalMarks) : null,
      },
    })
    return Response.json(subject)
  } catch {
    const subject = await prisma.subjectResult.update({
      where: { id: Number(id) },
      data: baseData,
    })
    return Response.json(subject)
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const { id } = await ctx.params
  await prisma.subjectResult.delete({ where: { id: Number(id) } })
  return Response.json({ message: "Subject deleted." })
}
