export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import { prisma } from "@/lib/db/prisma"
import { UserPhotoProvider } from "@/contexts/UserPhotoContext"

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D": 1.0, "F": 0.0,
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      fullName: true, photoUrl: true, role: true, faculty: true,
      semesters: {
        select: {
          subjects: { select: { grade: true, credits: true } },
        },
      },
    },
  })

  if (!user) redirect("/login")

  // Calculate CGPA from subjects for dean's list check
  let isDeanList = false
  if (user.role === "STUDENT") {
    const subjects = user.semesters.flatMap(s => s.subjects)
    if (subjects.length > 0) {
      const pts = subjects.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0)
      const cr  = subjects.reduce((sum, s) => sum + s.credits, 0)
      const cgpa = cr > 0 ? pts / cr : 0
      isDeanList = cgpa > 3.5
    }
  }

  return (
    <UserPhotoProvider initial={user.photoUrl}>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar role={user.role} name={user.fullName} photoUrl={user.photoUrl} isDeanList={isDeanList} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar name={user.fullName} photoUrl={user.photoUrl} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </UserPhotoProvider>
  )
}
