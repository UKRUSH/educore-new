export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import { prisma } from "@/lib/db/prisma"
import { UserPhotoProvider } from "@/contexts/UserPhotoContext"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, photoUrl: true, role: true, faculty: true },
  })

  if (!user) redirect("/login")

  return (
    <UserPhotoProvider initial={user.photoUrl}>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar role={user.role} name={user.fullName} photoUrl={user.photoUrl} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar name={user.fullName} photoUrl={user.photoUrl} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </UserPhotoProvider>
  )
}
