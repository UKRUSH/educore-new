import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  // Fetch all dashboard data in parallel
  const [user, semesters, clubCount, sportCount, sessionCount, recentMaterials, pendingApps] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { fullName: true, faculty: true, degree: true, intakeYear: true, photoUrl: true },
      }),
      prisma.semester.findMany({
        where: { userId: session.userId },
        orderBy: { semesterNum: "desc" },
        take: 1,
        select: { gpa: true, semesterNum: true },
      }),
      prisma.studentClub.count({ where: { userId: session.userId, isActive: true } }),
      prisma.sportAchievement.count({ where: { userId: session.userId } }),
      prisma.sessionApplication.count({
        where: { userId: session.userId, status: "APPROVED" },
      }),
      prisma.studyMaterial.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true, courseCode: true, type: true, isSummarized: true, createdAt: true },
      }),
      prisma.clubApplication.findMany({
        where: { userId: session.userId, status: "PENDING" },
        take: 3,
        include: { club: { select: { name: true } } },
      }),
    ])

  if (!user) redirect("/login")

  const latestGpa = semesters[0]?.gpa ?? null
  const initials = user.fullName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome card */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
          {user.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoUrl} alt={user.fullName} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">{user.fullName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user.faculty}</p>
          <p className="text-sm text-muted-foreground">{user.degree} · Intake {user.intakeYear}</p>
        </div>
        <Link
          href="/profile"
          className="shrink-0 text-sm text-primary font-medium hover:underline"
        >
          View Profile →
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current GPA"
          value={latestGpa !== null ? latestGpa.toFixed(2) : "—"}
          sub={semesters[0] ? `Semester ${semesters[0].semesterNum}` : "No records yet"}
          color="text-primary"
        />
        <StatCard
          label="Clubs Joined"
          value={String(clubCount)}
          sub="Active memberships"
          color="text-accent-foreground"
        />
        <StatCard
          label="Sport Awards"
          value={String(sportCount)}
          sub="Total achievements"
          color="text-chart-2"
        />
        <StatCard
          label="Sessions"
          value={String(sessionCount)}
          sub="Sessions attended"
          color="text-chart-3"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent materials */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Materials</h2>
            <Link href="/materials" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentMaterials.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No materials uploaded yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentMaterials.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/materials/${m.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {m.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.courseCode}</p>
                    </div>
                    {m.isSummarized && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Summarized
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pending applications */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Club Applications</h2>
              <Link href="/clubs/applications" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            {pendingApps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No pending applications.
              </p>
            ) : (
              <ul className="space-y-2">
                {pendingApps.map((app) => (
                  <li
                    key={app.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-foreground truncate pr-2">
                      {app.club.name}
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full shrink-0">
                      Pending
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <QuickAction href="/materials/upload" label="Upload Material" />
              <QuickAction href="/support/sessions" label="Browse Sessions" />
              <QuickAction href="/clubs" label="Browse Clubs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-border hover:bg-accent/50 transition-colors text-sm font-medium text-foreground"
    >
      {label}
      <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  )
}
