export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; }

.ad-root { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

/* ── Hero ── */
.ad-hero {
  border-radius: 1.25rem; overflow: hidden; position: relative;
  background: linear-gradient(135deg,
    oklch(0.22 0.1 265) 0%,
    oklch(0.30 0.14 258) 55%,
    oklch(0.40 0.16 252) 100%);
  padding: 1.75rem 2rem;
}
.ad-hero::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 28px 28px;
}
.ad-hero-glow {
  position: absolute; top: -80px; right: -60px; pointer-events: none;
  width: 280px; height: 280px; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.65 0.2 260 / 0.3) 0%, transparent 70%);
}
.ad-hero-inner { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
.ad-hero-tag {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .26rem .8rem; border-radius: 999px; margin-bottom: .7rem;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
  font-size: .7rem; font-weight: 700; letter-spacing: .07em; color: rgba(255,255,255,.85); text-transform: uppercase;
}
.ad-hero-dot { width: 6px; height: 6px; border-radius: 50%; background: oklch(0.75 0.2 145); box-shadow: 0 0 6px oklch(0.75 0.2 145 / .8); animation: adBlink 2s ease-in-out infinite; }
@keyframes adBlink { 0%,100% { opacity:1; } 50% { opacity:.35; } }
.ad-hero-title { font-size: 1.6rem; font-weight: 900; color: #fff; letter-spacing: -.04em; margin: 0 0 .3rem; line-height: 1.15; }
.ad-hero-sub { font-size: .85rem; color: rgba(255,255,255,.6); }
.ad-hero-date {
  display: flex; flex-direction: column; align-items: flex-end; gap: .2rem;
  padding: .85rem 1.15rem; border-radius: .9rem;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
  backdrop-filter: blur(8px); white-space: nowrap;
}
.ad-hero-date-label { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.55); }
.ad-hero-date-val { font-size: .9rem; font-weight: 800; color: #fff; }

/* ── Stat cards ── */
.ad-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
@media (max-width: 900px) { .ad-stats { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 500px) { .ad-stats { grid-template-columns: 1fr 1fr; } }

.ad-stat {
  background: var(--card); border: 1px solid var(--border); border-radius: 1.1rem;
  padding: 1.2rem 1.25rem; position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: .65rem;
}
.ad-stat-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 1.1rem 1.1rem 0 0; }
.ad-stat-top { display: flex; align-items: flex-start; justify-content: space-between; }
.ad-stat-icon {
  width: 2.4rem; height: 2.4rem; border-radius: .75rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.ad-stat-icon svg { width: 1.1rem; height: 1.1rem; }
.ad-stat-label { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--muted-foreground); margin-bottom: .3rem; }
.ad-stat-val { font-size: 2rem; font-weight: 900; letter-spacing: -.04em; line-height: 1; color: var(--foreground); }
.ad-stat-sub { font-size: .72rem; color: var(--muted-foreground); font-weight: 500; }

/* ── Main 2-col row ── */
.ad-main { display: grid; grid-template-columns: 1fr 320px; gap: 1.15rem; }
@media (max-width: 820px) { .ad-main { grid-template-columns: 1fr; } }

/* ── Bottom 3-col row ── */
.ad-bottom { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.15rem; }
@media (max-width: 900px) { .ad-bottom { grid-template-columns: 1fr 1fr; } }
@media (max-width: 560px) { .ad-bottom { grid-template-columns: 1fr; } }

/* ── Card ── */
.ad-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 1.1rem;
  padding: 1.35rem 1.5rem; display: flex; flex-direction: column; gap: 1rem;
}
.ad-card-header { display: flex; align-items: center; justify-content: space-between; gap: .65rem; }
.ad-card-title { font-size: .925rem; font-weight: 800; color: var(--foreground); letter-spacing: -.02em; }
.ad-view-all {
  font-size: .75rem; font-weight: 600; color: oklch(0.52 0.2 260);
  text-decoration: none; padding: .28rem .75rem; border-radius: .5rem;
  background: oklch(0.52 0.2 260 / .08); transition: background .15s;
}
.ad-view-all:hover { background: oklch(0.52 0.2 260 / .15); }

/* ── App list ── */
.ad-app-list { display: flex; flex-direction: column; gap: 0; }
.ad-app-row {
  display: flex; align-items: center; gap: .85rem;
  padding: .85rem 0; border-bottom: 1px solid var(--border);
}
.ad-app-row:last-child { border-bottom: none; padding-bottom: 0; }
.ad-app-row:first-child { padding-top: 0; }
.ad-avatar {
  width: 2.35rem; height: 2.35rem; border-radius: .7rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: .72rem; font-weight: 900; color: #fff;
}
.ad-app-info { flex: 1; min-width: 0; }
.ad-app-name { font-size: .85rem; font-weight: 700; color: var(--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-app-meta { display: flex; align-items: center; gap: .4rem; margin-top: .18rem; flex-wrap: wrap; }
.ad-app-club { font-size: .73rem; color: var(--muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.ad-cat-badge {
  font-size: .62rem; font-weight: 700; padding: .12rem .45rem; border-radius: 999px;
}
.ad-app-date { font-size: .68rem; color: var(--muted-foreground); white-space: nowrap; flex-shrink: 0; }
.ad-review-btn {
  font-size: .73rem; font-weight: 700; padding: .3rem .7rem; border-radius: .5rem;
  background: oklch(0.52 0.2 260 / .1); color: oklch(0.45 0.2 260);
  text-decoration: none; flex-shrink: 0; transition: background .15s;
  border: 1px solid oklch(0.52 0.2 260 / .2);
}
.ad-review-btn:hover { background: oklch(0.52 0.2 260 / .18); }
.ad-empty { text-align: center; padding: 2rem 0; font-size: .875rem; color: var(--muted-foreground); }

/* ── Quick actions ── */
.ad-actions { display: flex; flex-direction: column; gap: .55rem; }
.ad-action {
  display: flex; align-items: center; gap: .85rem;
  padding: .8rem 1rem; border-radius: .85rem;
  border: 1px solid var(--border); background: var(--background);
  text-decoration: none; transition: all .18s; cursor: pointer;
}
.ad-action:hover {
  border-color: oklch(0.62 0.2 260 / .45);
  background: oklch(0.62 0.2 260 / .04);
  box-shadow: 0 2px 12px oklch(0.5 0.2 260 / .08);
  transform: translateX(2px);
}
.ad-action-icon {
  width: 2.1rem; height: 2.1rem; border-radius: .6rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.ad-action-icon svg { width: 1rem; height: 1rem; }
.ad-action-label { flex: 1; font-size: .875rem; font-weight: 700; color: var(--foreground); }
.ad-action-arrow { color: var(--muted-foreground); }
.ad-action-arrow svg { width: 14px; height: 14px; }

/* ── Overview mini stats ── */
.ad-overview { display: flex; flex-direction: column; gap: .65rem; }
.ad-ov-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: .75rem .9rem; border-radius: .8rem;
  background: var(--background); border: 1px solid var(--border);
}
.ad-ov-left { display: flex; align-items: center; gap: .65rem; }
.ad-ov-icon {
  width: 2rem; height: 2rem; border-radius: .55rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.ad-ov-icon svg { width: .9rem; height: .9rem; }
.ad-ov-label { font-size: .82rem; font-weight: 600; color: var(--foreground); }
.ad-ov-val { font-size: .95rem; font-weight: 900; color: var(--foreground); letter-spacing: -.02em; }

/* ── Recent users ── */
.ad-user-list { display: flex; flex-direction: column; gap: 0; }
.ad-user-row {
  display: flex; align-items: center; gap: .75rem;
  padding: .75rem 0; border-bottom: 1px solid var(--border);
}
.ad-user-row:last-child { border-bottom: none; padding-bottom: 0; }
.ad-user-row:first-child { padding-top: 0; }
.ad-user-avatar {
  width: 2.1rem; height: 2.1rem; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.52 0.2 260), oklch(0.42 0.22 265));
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 900; color: #fff;
}
.ad-user-name { font-size: .82rem; font-weight: 700; color: var(--foreground); }
.ad-user-faculty { font-size: .7rem; color: var(--muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.ad-user-date { font-size: .68rem; color: var(--muted-foreground); white-space: nowrap; flex-shrink: 0; margin-left: auto; }

/* ── Category breakdown ── */
.ad-cats { display: flex; flex-direction: column; gap: .55rem; }
.ad-cat-row { display: flex; align-items: center; gap: .75rem; }
.ad-cat-label { font-size: .78rem; font-weight: 600; color: var(--foreground); min-width: 80px; }
.ad-cat-track { flex: 1; height: 7px; border-radius: 999px; background: var(--muted); overflow: hidden; }
.ad-cat-fill { height: 100%; border-radius: 999px; }
.ad-cat-count { font-size: .75rem; font-weight: 700; color: var(--muted-foreground); min-width: 20px; text-align: right; }

/* ── Dean List ── */
.ad-dl-list { display: flex; flex-direction: column; gap: 0; }
.ad-dl-row { display: flex; align-items: center; gap: .7rem; padding: .7rem 0; border-bottom: 1px solid var(--border); }
.ad-dl-row:last-child { border-bottom: none; padding-bottom: 0; }
.ad-dl-row:first-child { padding-top: 0; }
.ad-dl-rank { font-size: 1rem; width: 1.5rem; flex-shrink: 0; text-align: center; }
.ad-dl-avatar { width: 2.1rem; height: 2.1rem; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.58 0.22 55), oklch(0.68 0.2 65));
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 900; color: #fff; overflow: hidden; }
.ad-dl-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ad-dl-name { font-size: .82rem; font-weight: 700; color: var(--foreground); }
.ad-dl-faculty { font-size: .68rem; color: var(--muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
.ad-dl-gpa { margin-left: auto; flex-shrink: 0; font-size: .82rem; font-weight: 900; padding: .2rem .55rem; border-radius: .5rem; }
`

// ── Helpers ───────────────────────────────────────────────────────────────────

const CAT_META: Record<string, { icon: string; color: string; bg: string; fg: string }> = {
  ACADEMIC:  { icon: "🎓", color: "oklch(0.5 0.2 250)",  bg: "oklch(0.93 0.05 250)", fg: "oklch(0.42 0.2 250)"  },
  SPORTS:    { icon: "⚽", color: "oklch(0.48 0.2 145)", bg: "oklch(0.93 0.06 145)", fg: "oklch(0.4 0.2 145)"   },
  CULTURAL:  { icon: "🎭", color: "oklch(0.48 0.2 295)", bg: "oklch(0.93 0.06 295)", fg: "oklch(0.42 0.2 295)"  },
  RELIGIOUS: { icon: "☪️", color: "oklch(0.5 0.18 55)",  bg: "oklch(0.94 0.06 55)",  fg: "oklch(0.45 0.2 55)"   },
  OTHER:     { icon: "✦",  color: "oklch(0.48 0.1 260)", bg: "oklch(0.94 0.02 260)", fg: "oklch(0.45 0.06 260)" },
}

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

function relativeDate(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60)  return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")

  const [
    userCount, clubCount, pendingApps, activeSessions,
    openClubs, activeMemberships, activeMentors,
    recentApps, recentUsers, clubsByCategory, topStudentsRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.club.count(),
    prisma.clubApplication.count({ where: { status: "PENDING" } }),
    prisma.supportSession.count({ where: { status: { in: ["UPCOMING", "ONGOING"] } } }),
    prisma.club.count({ where: { status: "OPEN" } }),
    prisma.studentClub.count({ where: { isActive: true } }),
    prisma.mentorProfile.count({ where: { isActive: true } }),
    prisma.clubApplication.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true } },
        club: { select: { name: true, category: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { fullName: true, faculty: true, createdAt: true },
    }),
    prisma.club.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", semesters: { some: { gpa: { gte: 3.5 } } } },
      select: {
        fullName: true, faculty: true, photoUrl: true,
        semesters: { where: { gpa: { not: null } }, select: { gpa: true }, orderBy: { gpa: "desc" }, take: 1 },
      },
      take: 20,
    }),
  ])

  // Sort dean list by best GPA
  const deanList = topStudentsRaw
    .map(s => ({ ...s, bestGpa: s.semesters[0]?.gpa ?? 0 }))
    .filter(s => s.bestGpa >= 3.5)
    .sort((a, b) => b.bestGpa - a.bestGpa)
    .slice(0, 5)

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const maxCatCount = Math.max(...clubsByCategory.map((c) => c._count.id), 1)

  const STATS = [
    {
      label: "Total Users",
      value: userCount,
      sub: "Registered accounts",
      accent: "linear-gradient(90deg, oklch(0.5 0.22 265), oklch(0.62 0.2 258))",
      iconBg: "oklch(0.93 0.05 260)",
      iconFg: "oklch(0.45 0.2 262)",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: "Total Clubs",
      value: clubCount,
      sub: `${openClubs} open for applications`,
      accent: "linear-gradient(90deg, oklch(0.5 0.22 295), oklch(0.6 0.18 285))",
      iconBg: "oklch(0.93 0.06 295)",
      iconFg: "oklch(0.42 0.2 295)",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: "Pending Applications",
      value: pendingApps,
      sub: "Awaiting review",
      accent: "linear-gradient(90deg, oklch(0.6 0.2 55), oklch(0.65 0.18 70))",
      iconBg: "oklch(0.95 0.07 65)",
      iconFg: "oklch(0.5 0.2 60)",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
    },
    {
      label: "Active Sessions",
      value: activeSessions,
      sub: "Upcoming & ongoing",
      accent: "linear-gradient(90deg, oklch(0.5 0.2 145), oklch(0.6 0.18 155))",
      iconBg: "oklch(0.93 0.06 145)",
      iconFg: "oklch(0.4 0.2 145)",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
  ]

  const ACTIONS = [
    {
      href: "/admin/users",
      label: "Manage Users",
      sub: `${userCount} accounts`,
      iconBg: "oklch(0.93 0.05 260)",
      iconFg: "oklch(0.45 0.2 262)",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      href: "/admin/clubs",
      label: "Manage Clubs",
      sub: `${clubCount} clubs total`,
      iconBg: "oklch(0.93 0.06 295)",
      iconFg: "oklch(0.42 0.2 295)",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      href: "/admin/club-applications",
      label: "Review Applications",
      sub: `${pendingApps} pending`,
      iconBg: "oklch(0.95 0.07 65)",
      iconFg: "oklch(0.5 0.2 60)",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
    {
      href: "/admin/mentors",
      label: "Manage Mentors",
      sub: `${activeMentors} active`,
      iconBg: "oklch(0.93 0.06 145)",
      iconFg: "oklch(0.4 0.2 145)",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
        </svg>
      ),
    },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="ad-root">

        {/* ── Hero ── */}
        <div className="ad-hero">
          <div className="ad-hero-glow" />
          <div className="ad-hero-inner">
            <div>
              <div className="ad-hero-tag">
                <span className="ad-hero-dot" />
                Admin Portal
              </div>
              <h1 className="ad-hero-title">Admin Dashboard</h1>
              <p className="ad-hero-sub">Platform overview, controls and management</p>
            </div>
            <div className="ad-hero-date">
              <span className="ad-hero-date-label">Today</span>
              <span className="ad-hero-date-val">{dateStr}</span>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="ad-stats">
          {STATS.map((s) => (
            <div key={s.label} className="ad-stat">
              <div className="ad-stat-accent" style={{ background: s.accent }} />
              <div className="ad-stat-top">
                <div>
                  <div className="ad-stat-label">{s.label}</div>
                  <div className="ad-stat-val">{s.value.toLocaleString()}</div>
                </div>
                <div className="ad-stat-icon" style={{ background: s.iconBg, color: s.iconFg }}>
                  {s.icon}
                </div>
              </div>
              <div className="ad-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main row: applications + quick actions ── */}
        <div className="ad-main">

          {/* Pending applications */}
          <div className="ad-card">
            <div className="ad-card-header">
              <span className="ad-card-title">Pending Club Applications</span>
              <Link href="/admin/club-applications" className="ad-view-all">View all →</Link>
            </div>
            {recentApps.length === 0 ? (
              <div className="ad-empty">No pending applications. All clear!</div>
            ) : (
              <div className="ad-app-list">
                {recentApps.map((app) => {
                  const cat = CAT_META[app.club.category] ?? CAT_META.OTHER
                  const ini = initials(app.user.fullName)
                  return (
                    <div key={app.id} className="ad-app-row">
                      <div className="ad-avatar" style={{ background: cat.color }}>{ini}</div>
                      <div className="ad-app-info">
                        <div className="ad-app-name">{app.user.fullName}</div>
                        <div className="ad-app-meta">
                          <span className="ad-app-club">{app.club.name}</span>
                          <span className="ad-cat-badge" style={{ background: cat.bg, color: cat.fg }}>
                            {cat.icon} {cap(app.club.category)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".35rem", flexShrink: 0 }}>
                        <span className="ad-app-date">{relativeDate(new Date(app.createdAt))}</span>
                        <Link href="/admin/club-applications" className="ad-review-btn">Review</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="ad-card">
            <div className="ad-card-header">
              <span className="ad-card-title">Quick Actions</span>
            </div>
            <div className="ad-actions">
              {ACTIONS.map((a) => (
                <Link key={a.href} href={a.href} className="ad-action">
                  <div className="ad-action-icon" style={{ background: a.iconBg, color: a.iconFg }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ad-action-label">{a.label}</div>
                    <div style={{ fontSize: ".72rem", color: "var(--muted-foreground)", marginTop: ".1rem" }}>{a.sub}</div>
                  </div>
                  <div className="ad-action-arrow">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* ── Bottom row: overview + recent users ── */}
        <div className="ad-bottom">

          {/* Platform overview */}
          <div className="ad-card">
            <div className="ad-card-header">
              <span className="ad-card-title">Platform Overview</span>
            </div>
            <div className="ad-overview">
              {[
                {
                  label: "Open Clubs", value: openClubs,
                  iconBg: "oklch(0.93 0.06 145)", iconFg: "oklch(0.4 0.2 145)",
                  icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                },
                {
                  label: "Active Members", value: activeMemberships,
                  iconBg: "oklch(0.93 0.05 260)", iconFg: "oklch(0.45 0.2 262)",
                  icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                },
                {
                  label: "Active Mentors", value: activeMentors,
                  iconBg: "oklch(0.93 0.06 295)", iconFg: "oklch(0.42 0.2 295)",
                  icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
                },
              ].map((item) => (
                <div key={item.label} className="ad-ov-row">
                  <div className="ad-ov-left">
                    <div className="ad-ov-icon" style={{ background: item.iconBg, color: item.iconFg }}>{item.icon}</div>
                    <span className="ad-ov-label">{item.label}</span>
                  </div>
                  <span className="ad-ov-val">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Club category breakdown */}
            {clubsByCategory.length > 0 && (
              <>
                <div style={{ fontSize: ".7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--muted-foreground)", marginTop: ".25rem" }}>
                  Clubs by Category
                </div>
                <div className="ad-cats">
                  {clubsByCategory.map((c) => {
                    const meta = CAT_META[c.category] ?? CAT_META.OTHER
                    return (
                      <div key={c.category} className="ad-cat-row">
                        <span className="ad-cat-label">{meta.icon} {cap(c.category)}</span>
                        <div className="ad-cat-track">
                          <div className="ad-cat-fill"
                            style={{ width: `${(c._count.id / maxCatCount) * 100}%`, background: meta.color }} />
                        </div>
                        <span className="ad-cat-count">{c._count.id}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Recent users */}
          <div className="ad-card">
            <div className="ad-card-header">
              <span className="ad-card-title">Recent Registrations</span>
              <Link href="/admin/users" className="ad-view-all">View all →</Link>
            </div>
            {recentUsers.length === 0 ? (
              <div className="ad-empty">No users yet.</div>
            ) : (
              <div className="ad-user-list">
                {recentUsers.map((u, i) => (
                  <div key={i} className="ad-user-row">
                    <div className="ad-user-avatar">{initials(u.fullName)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ad-user-name">{u.fullName}</div>
                      <div className="ad-user-faculty">{u.faculty}</div>
                    </div>
                    <span className="ad-user-date">{relativeDate(new Date(u.createdAt))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dean List snapshot */}
          <div className="ad-card">
            <div className="ad-card-header">
              <span className="ad-card-title">⭐ Dean&apos;s List</span>
              <Link href="/admin/dean-list" className="ad-view-all">View all →</Link>
            </div>
            {deanList.length === 0 ? (
              <div className="ad-empty">No dean list students yet.</div>
            ) : (
              <div className="ad-dl-list">
                {deanList.map((s, i) => {
                  const rank = i + 1
                  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`
                  const gpaFg = s.bestGpa >= 3.9
                    ? "oklch(0.4 0.2 145)"
                    : s.bestGpa >= 3.7 ? "oklch(0.42 0.2 260)" : "oklch(0.48 0.2 55)"
                  const gpaBg = s.bestGpa >= 3.9
                    ? "oklch(0.93 0.07 145)"
                    : s.bestGpa >= 3.7 ? "oklch(0.93 0.05 258)" : "oklch(0.95 0.07 60)"
                  return (
                    <div key={i} className="ad-dl-row">
                      <span className="ad-dl-rank">{medal}</span>
                      <div className="ad-dl-avatar">
                        {s.photoUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={s.photoUrl} alt={s.fullName} />
                          : initials(s.fullName)
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ad-dl-name">{s.fullName}</div>
                        <div className="ad-dl-faculty">{s.faculty.replace("Faculty of ", "")}</div>
                      </div>
                      <span className="ad-dl-gpa" style={{ color: gpaFg, background: gpaBg }}>
                        {s.bestGpa.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  )
}
