import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const applications = await prisma.clubApplication.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      club: {
        select: { id: true, name: true, category: true, logoUrl: true, email: true },
      },
      feedback: { select: { message: true } },
    },
  })

  return Response.json(applications)
}
