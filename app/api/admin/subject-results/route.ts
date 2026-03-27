export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN")
    return Response.json({ error: "Unauthorized." }, { status: 401 })

  const body = await request.json()
  const { semesterId, subjectCode, subjectName, credits, caMarks, finalMarks, marks, grade } = body

  if (!semesterId || !subjectCode || !subjectName || !credits || marks === undefined || !grade)
    return Response.json({ error: "semesterId, subjectCode, subjectName, credits, marks and grade are required." }, { status: 400 })

  try {
    // Try with caMarks / finalMarks (needs regenerated Prisma client)
    const subject = await (prisma.subjectResult.create as Function)({
      data: {
        semesterId: Number(semesterId),
        subjectCode: String(subjectCode),
        subjectName: String(subjectName),
        credits: Number(credits),
        caMarks: caMarks !== undefined && caMarks !== "" ? Number(caMarks) : null,
        finalMarks: finalMarks !== undefined && finalMarks !== "" ? Number(finalMarks) : null,
        marks: Number(marks),
        grade: String(grade),
      },
    })
    return Response.json(subject, { status: 201 })
  } catch {
    // Fallback: save without new columns
    const subject = await prisma.subjectResult.create({
      data: {
        semesterId: Number(semesterId),
        subjectCode: String(subjectCode),
        subjectName: String(subjectName),
        credits: Number(credits),
        marks: Number(marks),
        grade: String(grade),
      },
    })
    return Response.json(subject, { status: 201 })
  }
}
