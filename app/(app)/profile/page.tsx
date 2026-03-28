export const dynamic = "force-dynamic"

import React from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

const TABS = [
  { label: "Overview",  href: "/profile",           icon: "⊞" },
  { label: "Academics", href: "/profile/academics",  icon: "📊" },
  { label: "Clubs",     href: "/profile/clubs",      icon: "🎯" },
  { label: "Sports",    href: "/profile/sports",     icon: "🏆" },
  { label: "Progress",  href: "/profile/progress",   icon: "📈" },
]

const ACHIEVEMENT_ICON: Record<string, string> = {
  TROPHY: "🏆", CERTIFICATE: "📜", MEDAL: "🥇",
}

const GRADE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  A:  { bg: "oklch(0.97 0.04 145)", color: "oklch(0.35 0.18 145)", border: "oklch(0.88 0.08 145)" },
  "A-":{ bg: "oklch(0.97 0.04 145)", color: "oklch(0.35 0.18 145)", border: "oklch(0.88 0.08 145)" },
  B:  { bg: "oklch(0.95 0.04 264)", color: "oklch(0.40 0.18 264)", border: "oklch(0.85 0.08 264)" },
  "B+":{ bg: "oklch(0.95 0.04 264)", color: "oklch(0.40 0.18 264)", border: "oklch(0.85 0.08 264)" },
  "B-":{ bg: "oklch(0.95 0.04 264)", color: "oklch(0.40 0.18 264)", border: "oklch(0.85 0.08 264)" },
  C:  { bg: "oklch(0.97 0.05 80)",  color: "oklch(0.45 0.18 75)",  border: "oklch(0.88 0.10 80)"  },
  "C+":{ bg: "oklch(0.97 0.05 80)", color: "oklch(0.45 0.18 75)",  border: "oklch(0.88 0.10 80)"  },
  D:  { bg: "oklch(0.97 0.04 25)",  color: "oklch(0.45 0.18 25)",  border: "oklch(0.88 0.08 25)"  },
  F:  { bg: "oklch(0.97 0.04 25)",  color: "oklch(0.45 0.20 15)",  border: "oklch(0.88 0.10 15)"  },
}

function gradeStyle(grade: string) {
  return GRADE_STYLE[grade] ?? GRADE_STYLE[grade[0]] ?? GRADE_STYLE.C
}

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [user, semesters, clubs, sports] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        fullName: true, studentId: true, faculty: true, degree: true,
        intakeYear: true, photoUrl: true, email: true, phone: true,
        gender: true, dateOfBirth: true,
      },
    }),
    prisma.semester.findMany({
      where: { userId: session.userId },
      orderBy: { semesterNum: "desc" },
      include: { subjects: { orderBy: { marks: "asc" } } },
    }),
    prisma.studentClub.findMany({
      where: { userId: session.userId, isActive: true },
      orderBy: { joinedDate: "desc" }, take: 3,
      include: { club: { select: { name: true, category: true } } },
    }),
    prisma.sportAchievement.findMany({
      where: { userId: session.userId },
      orderBy: { date: "desc" }, take: 3,
    }),
  ])

  if (!user) redirect("/login")

  const GP: Record<string, number> = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D": 1.0, "F": 0.0,
  }
  const allSubjects = semesters.flatMap(s => s.subjects)
  const cgpa = allSubjects.length > 0
    ? allSubjects.reduce((sum, s) => sum + (GP[s.grade] ?? 0) * s.credits, 0) /
      allSubjects.reduce((sum, s) => sum + s.credits, 0)
    : semesters.length > 0
      ? semesters.filter(s => s.gpa !== null).reduce((sum, s) => sum + (s.gpa ?? 0), 0) /
        Math.max(1, semesters.filter(s => s.gpa !== null).length)
      : 0
  const avgGpa = cgpa
  const academicScore = Math.min(Math.round((avgGpa / 4.0) * 100), 100)
  const sportsScore   = Math.min(sports.reduce((sum, s) => sum + s.points, 0), 100)
  const societyScore  = Math.min(clubs.reduce((sum, c) => sum + c.participationPoints, 0), 100)
  const overallScore  = Math.round(academicScore * 0.5 + sportsScore * 0.25 + societyScore * 0.25)

  const latestSemester = semesters[0] ?? null
  // Calculate latest semester GPA from subjects; fall back to stored gpa field
  const latestSemGpa = latestSemester
    ? (latestSemester.subjects.length > 0
        ? latestSemester.subjects.reduce((s, x) => s + (GP[x.grade] ?? 0) * x.credits, 0) /
          Math.max(1, latestSemester.subjects.reduce((s, x) => s + x.credits, 0))
        : latestSemester.gpa)
    : null
  const graduationYear = user.intakeYear + 4
  const initials = user.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

  const suggestions: { text: string; href: string; linkLabel: string; icon: string }[] = []
  if (latestSemester) {
    const weakSubject = latestSemester.subjects.find((s) => s.marks < 70)
    if (weakSubject) suggestions.push({ text: `Your ${weakSubject.subjectName} grade is ${weakSubject.grade} (${weakSubject.marks}%). Consider getting extra support.`, href: "/support/mentors", linkLabel: "Find a mentor →", icon: "📚" })
  }
  if (clubs.length === 0) suggestions.push({ text: "You haven't joined any clubs yet. Joining clubs boosts your society score.", href: "/clubs", linkLabel: "Explore clubs →", icon: "🎯" })
  if (sports.length === 0) suggestions.push({ text: "No sports achievements recorded. Participate in sports events to earn points.", href: "/profile/sports", linkLabel: "Add achievement →", icon: "🏆" })
  suggestions.push({ text: "Upload your lecture notes to use the AI-powered study summarizer.", href: "/materials/upload", linkLabel: "Upload materials →", icon: "✨" })
  suggestions.push({ text: "Browse peer mentor sessions to get academic support from top students.", href: "/support/sessions", linkLabel: "Browse sessions →", icon: "🤝" })
  const topSuggestions = suggestions.slice(0, 3)

  // circle progress helper (SVG)
  const ring = (value: number, color: string, size = 72, stroke = 6) => {
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const dash = (value / 100) * circ
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border,#e5e7eb)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <>
      <style>{`
        .pf-page { max-width: 1050px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.4rem; }

        /* ── Hero ── */
        .pf-hero {
          position: relative; overflow: hidden; border-radius: 1.4rem;
          background: linear-gradient(135deg,
            oklch(0.2046 0.10 268) 0%,
            oklch(0.3244 0.1809 265.6377) 45%,
            oklch(0.4882 0.2172 264.3763) 100%
          );
          padding: 0;
          box-shadow: 0 20px 60px oklch(0.3244 0.1809 265.6377 / .35);
        }
        .pf-hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
          background-size: 32px 32px;
        }
        .pf-hero-orb1 {
          position: absolute; top: -60px; right: -60px; width: 260px; height: 260px;
          border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, oklch(0.6231 0.1880 259.8145 / .3) 0%, transparent 70%);
        }
        .pf-hero-orb2 {
          position: absolute; bottom: -80px; left: 40%; width: 200px; height: 200px;
          border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, oklch(0.45 0.22 280 / .2) 0%, transparent 70%);
        }
        .pf-hero-body {
          position: relative; z-index: 1;
          display: flex; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap;
          padding: 2rem 2.25rem 1.5rem;
        }
        .pf-avatar {
          width: 84px; height: 84px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
          background: linear-gradient(135deg, oklch(0.6231 0.1880 259.8145), oklch(0.4882 0.2172 264.3763));
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem; font-weight: 900; color: #fff;
          border: 3px solid rgba(255,255,255,.3);
          box-shadow: 0 8px 28px rgba(0,0,0,.3), 0 0 0 6px rgba(255,255,255,.07);
        }
        .pf-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .pf-hero-info { flex: 1; min-width: 0; }
        .pf-hero-name {
          font-size: clamp(1.3rem,2.8vw,1.85rem); font-weight: 900;
          color: #fff; letter-spacing: -.04em; line-height: 1.1; margin-bottom: .35rem;
        }
        .pf-hero-id {
          font-size: .72rem; color: rgba(255,255,255,.55);
          font-weight: 600; letter-spacing: .06em; margin-bottom: .55rem;
        }
        .pf-hero-tags { display: flex; flex-wrap: wrap; gap: .4rem; }
        .pf-tag {
          font-size: .7rem; font-weight: 600; color: rgba(255,255,255,.88);
          background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
          border-radius: 999px; padding: .22rem .7rem; backdrop-filter: blur(8px);
        }
        .pf-edit-btn {
          display: inline-flex; align-items: center; gap: .4rem; flex-shrink: 0;
          font-size: .78rem; font-weight: 700; color: #fff;
          background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.28);
          border-radius: 999px; padding: .42rem 1.1rem; text-decoration: none;
          backdrop-filter: blur(8px); transition: background .15s;
        }
        .pf-edit-btn:hover { background: rgba(255,255,255,.25); }

        /* score strip */
        .pf-score-strip {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 0;
          border-top: 1px solid rgba(255,255,255,.1);
          padding: 1.1rem 2.25rem;
          background: rgba(0,0,0,.12); backdrop-filter: blur(8px);
          flex-wrap: wrap; gap: 1rem;
        }
        .pf-score-item {
          display: flex; align-items: center; gap: .75rem;
          flex: 1; min-width: 130px;
        }
        .pf-score-ring { position: relative; flex-shrink: 0; }
        .pf-score-ring-val {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: .75rem; font-weight: 900; color: #fff;
        }
        .pf-score-info h3 { font-size: .82rem; font-weight: 700; color: #fff; margin: 0 0 .1rem; }
        .pf-score-info p  { font-size: .68rem; color: rgba(255,255,255,.55); margin: 0; }
        .pf-score-divider { width: 1px; height: 40px; background: rgba(255,255,255,.12); flex-shrink: 0; }

        /* ── Tabs ── */
        .pf-tabs {
          display: flex; gap: .3rem;
          background: var(--card,#fff);
          border: 1px solid var(--border,#e5e7eb);
          border-radius: 1rem; padding: .35rem;
        }
        .pf-tab {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: .4rem;
          padding: .55rem .5rem; border-radius: .7rem;
          font-size: .78rem; font-weight: 600; text-decoration: none;
          color: var(--muted-foreground,#888); transition: all .15s;
          white-space: nowrap;
        }
        .pf-tab:hover { color: var(--foreground,#090909); background: var(--background,#f9f9f9); }
        .pf-tab.active {
          background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763 / .1), oklch(0.6231 0.1880 259.8145 / .06));
          color: oklch(0.4882 0.2172 264.3763);
          border: 1px solid oklch(0.6231 0.1880 259.8145 / .22);
          font-weight: 700;
        }

        /* ── Cards ── */
        .pf-card {
          background: var(--card,#fff);
          border: 1px solid var(--border,#e5e7eb);
          border-radius: 1.1rem; overflow: hidden;
        }
        .pf-card-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: .95rem 1.35rem;
          border-bottom: 1px solid var(--border,#e5e7eb);
          background: var(--background,#fafafa);
        }
        .pf-card-head-left { display: flex; align-items: center; gap: .6rem; }
        .pf-card-icon {
          width: 32px; height: 32px; border-radius: .6rem; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: .85rem;
        }
        .pf-card-head h2 { font-size: .88rem; font-weight: 800; color: var(--foreground,#090909); margin: 0; }
        .pf-card-head p  { font-size: .7rem; color: var(--muted-foreground,#999); margin: 0; }
        .pf-view-link {
          font-size: .72rem; font-weight: 700; text-decoration: none;
          color: oklch(0.4882 0.2172 264.3763);
          padding: .28rem .75rem; border-radius: 999px;
          background: oklch(0.4882 0.2172 264.3763 / .08);
          border: 1px solid oklch(0.4882 0.2172 264.3763 / .18);
        }
        .pf-card-body { padding: 1.1rem 1.35rem; }

        /* semester header */
        .pf-sem-header {
          display: flex; align-items: center; gap: 1.25rem;
          padding: .875rem 1.35rem; margin-bottom: 0;
          background: linear-gradient(90deg,
            oklch(0.4882 0.2172 264.3763 / .06) 0%,
            transparent 100%
          );
          border-bottom: 1px solid var(--border,#e5e7eb);
        }
        .pf-gpa-big {
          font-size: 2.4rem; font-weight: 900; letter-spacing: -.06em;
          color: oklch(0.4882 0.2172 264.3763); line-height: 1;
        }
        .pf-gpa-label { font-size: .62rem; color: var(--muted-foreground,#999); font-weight: 600; text-transform: uppercase; letter-spacing: .08em; margin-top: .2rem; }

        /* subject table */
        .pf-table { width: 100%; border-collapse: collapse; }
        .pf-table th {
          font-size: .65rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
          color: var(--muted-foreground,#aaa); padding: .6rem 1rem; text-align: left;
          background: var(--background,#fafafa); border-bottom: 1px solid var(--border,#f0f0f0);
        }
        .pf-table th:not(:first-child) { text-align: center; }
        .pf-table td { padding: .75rem 1rem; border-bottom: 1px solid var(--border,#f5f5f5); }
        .pf-table tr:last-child td { border-bottom: none; }
        .pf-table tr:hover td { background: var(--background,#fafafa); }
        .pf-marks-bar { width: 56px; height: 4px; background: var(--border,#e5e7eb); border-radius: 2px; overflow: hidden; margin-top: 3px; }
        .pf-grade-pill {
          display: inline-flex; align-items: center; justify-content: center;
          font-size: .7rem; font-weight: 800; min-width: 36px;
          padding: .2rem .55rem; border-radius: 999px; border: 1px solid;
        }

        /* club / sport items */
        .pf-list-item {
          display: flex; align-items: center; gap: .75rem;
          padding: .75rem .875rem; border-radius: .75rem;
          border: 1px solid var(--border,#e5e7eb);
          background: var(--background,#fafafa); margin-bottom: .5rem;
          transition: all .15s;
        }
        .pf-list-item:last-child { margin-bottom: 0; }
        .pf-list-item:hover { border-color: oklch(0.6231 0.1880 259.8145 / .35); }
        .pf-list-ico {
          width: 36px; height: 36px; border-radius: .65rem; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: .8rem; font-weight: 800;
        }

        /* suggestions */
        .pf-sugg {
          display: flex; flex-direction: column; gap: .75rem;
          padding: 1rem; border-radius: .9rem;
          border: 1px solid oklch(0.4882 0.2172 264.3763 / .15);
          background: oklch(0.4882 0.2172 264.3763 / .04);
          transition: all .15s;
        }
        .pf-sugg:hover { border-color: oklch(0.4882 0.2172 264.3763 / .3); background: oklch(0.4882 0.2172 264.3763 / .07); }

        /* empty state */
        .pf-empty {
          display: flex; flex-direction: column; align-items: center;
          padding: 2rem 1rem; text-align: center;
        }
        .pf-empty-ico {
          width: 56px; height: 56px; border-radius: 50%; margin-bottom: .75rem;
          background: oklch(0.4882 0.2172 264.3763 / .08);
          display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
        }
      `}</style>

      <div className="pf-page">

        {/* ════════════════ HERO ════════════════ */}
        <div className="pf-hero">
          <div className="pf-hero-grid" />
          <div className="pf-hero-orb1" />
          <div className="pf-hero-orb2" />

          <div className="pf-hero-body">
            <div className="pf-avatar">
              {user.photoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.photoUrl} alt={user.fullName} />
                : initials
              }
            </div>

            <div className="pf-hero-info">
              <div className="pf-hero-id">{user.studentId}</div>
              <div className="pf-hero-name">{user.fullName}</div>
              <div className="pf-hero-tags">
                <span className="pf-tag">{user.faculty}</span>
                <span className="pf-tag">{user.degree}</span>
                <span className="pf-tag">Intake {user.intakeYear}</span>
                <span className="pf-tag">Est. Grad {graduationYear}</span>
                {user.email && <span className="pf-tag">{user.email}</span>}
              </div>
            </div>

            <Link href="/profile/setup" className="pf-edit-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </Link>
          </div>

          {/* Score strip */}
          <div className="pf-score-strip">
            {[
              { label: "Overall Score", sub: "Combined", value: overallScore, color: "#fff" },
              { label: "Academic",      sub: `CGPA ${avgGpa.toFixed(2)}`,  value: academicScore, color: "oklch(0.6231 0.1880 259.8145)" },
              { label: "Sports",        sub: `${sports.length} achievements`, value: sportsScore,   color: "oklch(0.60 0.20 145)" },
              { label: "Society",       sub: `${clubs.length} clubs`,          value: societyScore,  color: "oklch(0.65 0.18 310)" },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="pf-score-divider" />}
                <div className="pf-score-item">
                  <div className="pf-score-ring">
                    {ring(s.value, s.color, 52, 5)}
                    <div className="pf-score-ring-val" style={{ fontSize: ".68rem" }}>{s.value}</div>
                  </div>
                  <div className="pf-score-info">
                    <h3>{s.label}</h3>
                    <p>{s.sub}</p>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ════════════════ TABS ════════════════ */}
        <div className="pf-tabs">
          {TABS.map(t => (
            <Link key={t.href} href={t.href} className={`pf-tab${t.href === "/profile" ? " active" : ""}`}>
              <span>{t.icon}</span>{t.label}
            </Link>
          ))}
        </div>

        {/* ════════════════ CONTENT GRID ════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>

          {/* ── Current Semester (span 2) ── */}
          <div className="pf-card" style={{ gridColumn: "span 2" }}>
            <div className="pf-card-head">
              <div className="pf-card-head-left">
                <div className="pf-card-icon" style={{ background: "oklch(0.4882 0.2172 264.3763 / .1)" }}>📖</div>
                <div>
                  <h2>Current Semester</h2>
                  <p>Latest academic performance</p>
                </div>
              </div>
              <Link href="/profile/academics" className="pf-view-link">View all →</Link>
            </div>

            {latestSemester ? (
              <>
                <div className="pf-sem-header">
                  <div>
                    <div className="pf-gpa-big">{latestSemGpa !== null ? latestSemGpa.toFixed(2) : "—"}</div>
                    <div className="pf-gpa-label">GPA / 4.00</div>
                  </div>
                  <div style={{ width: 1, height: 48, background: "var(--border,#e5e7eb)", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--foreground,#090909)", margin: "0 0 .15rem" }}>
                      Semester {latestSemester.semesterNum}
                    </p>
                    <p style={{ fontSize: ".72rem", color: "var(--muted-foreground,#999)", margin: 0 }}>
                      {latestSemester.academicYear}
                    </p>
                  </div>
                  <div style={{
                    marginLeft: "auto", padding: ".35rem .9rem", borderRadius: "999px",
                    background: latestSemGpa !== null && latestSemGpa >= 3.5
                      ? "oklch(0.55 0.20 145 / .1)" : "oklch(0.4882 0.2172 264.3763 / .1)",
                    border: latestSemGpa !== null && latestSemGpa >= 3.5
                      ? "1px solid oklch(0.55 0.20 145 / .25)" : "1px solid oklch(0.4882 0.2172 264.3763 / .25)",
                    fontSize: ".7rem", fontWeight: 700,
                    color: latestSemGpa !== null && latestSemGpa >= 3.5
                      ? "oklch(0.35 0.18 145)" : "oklch(0.4882 0.2172 264.3763)",
                  }}>
                    {latestSemGpa !== null && latestSemGpa >= 3.7 ? "🎖 Dean's List" :
                     latestSemGpa !== null && latestSemGpa >= 3.0 ? "✓ Good Standing" : "⚠ Needs Improvement"}
                  </div>
                </div>

                {latestSemester.subjects.length > 0 ? (
                  <table className="pf-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th style={{ textAlign: "center" }}>Marks</th>
                        <th style={{ textAlign: "center" }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestSemester.subjects.map(subj => {
                        const gs = gradeStyle(subj.grade)
                        const barColor = subj.marks >= 80 ? "oklch(0.55 0.20 145)"
                          : subj.marks >= 70 ? "oklch(0.4882 0.2172 264.3763)"
                          : subj.marks >= 60 ? "oklch(0.70 0.18 65)"
                          : "oklch(0.55 0.18 25)"
                        return (
                          <tr key={subj.id}>
                            <td>
                              <p style={{ fontSize: ".855rem", fontWeight: 600, color: "var(--foreground,#090909)", margin: "0 0 .1rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subj.subjectName}</p>
                              <p style={{ fontSize: ".7rem", color: "var(--muted-foreground,#aaa)", margin: 0 }}>{subj.subjectCode}</p>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <p style={{ fontSize: ".855rem", fontWeight: 700, color: "var(--foreground,#090909)", margin: "0 0 .25rem" }}>{subj.marks}%</p>
                              <div className="pf-marks-bar" style={{ margin: "0 auto" }}>
                                <div style={{ height: "100%", width: `${subj.marks}%`, background: barColor, borderRadius: 2 }} />
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="pf-grade-pill" style={{ background: gs.bg, color: gs.color, borderColor: gs.border }}>
                                {subj.grade}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="pf-card-body">
                    <p style={{ fontSize: ".85rem", color: "var(--muted-foreground,#999)", textAlign: "center", padding: "1.5rem 0" }}>No subjects recorded for this semester.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="pf-empty">
                <div className="pf-empty-ico">📖</div>
                <p style={{ fontWeight: 600, color: "var(--foreground,#090909)", margin: "0 0 .3rem" }}>No academic records yet</p>
                <p style={{ fontSize: ".8rem", color: "var(--muted-foreground,#999)", margin: "0 0 1rem" }}>Add your semester details to track your GPA</p>
                <Link href="/profile/academics" style={{
                  display: "inline-flex", alignItems: "center", gap: ".4rem",
                  fontSize: ".8rem", fontWeight: 700, color: "#fff",
                  background: "linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145))",
                  borderRadius: "999px", padding: ".45rem 1.1rem", textDecoration: "none",
                  boxShadow: "0 4px 12px oklch(0.4882 0.2172 264.3763 / .3)",
                }}>Add first semester →</Link>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Clubs */}
            <div className="pf-card">
              <div className="pf-card-head">
                <div className="pf-card-head-left">
                  <div className="pf-card-icon" style={{ background: "oklch(0.40 0.18 150 / .12)" }}>🎯</div>
                  <h2 style={{ fontSize: ".88rem", fontWeight: 800, color: "var(--foreground,#090909)", margin: 0 }}>Clubs</h2>
                </div>
                <Link href="/profile/clubs" className="pf-view-link">View all →</Link>
              </div>
              <div className="pf-card-body">
                {clubs.length === 0 ? (
                  <div className="pf-empty" style={{ padding: "1.25rem 0" }}>
                    <div className="pf-empty-ico" style={{ width: 44, height: 44, fontSize: "1.1rem", marginBottom: ".5rem" }}>🎯</div>
                    <p style={{ fontSize: ".8rem", color: "var(--muted-foreground,#999)", margin: "0 0 .6rem" }}>No clubs joined yet</p>
                    <Link href="/clubs" style={{ fontSize: ".75rem", fontWeight: 700, color: "oklch(0.4882 0.2172 264.3763)", textDecoration: "none" }}>Browse clubs →</Link>
                  </div>
                ) : clubs.map(c => (
                  <div key={c.id} className="pf-list-item">
                    <div className="pf-list-ico" style={{ background: "oklch(0.40 0.18 150 / .1)", color: "oklch(0.35 0.18 150)", fontSize: ".88rem" }}>
                      {c.club.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: ".83rem", fontWeight: 700, color: "var(--foreground,#090909)", margin: "0 0 .1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.club.name}</p>
                      <p style={{ fontSize: ".7rem", color: "var(--muted-foreground,#999)", margin: 0, textTransform: "capitalize" }}>{c.role.toLowerCase()}</p>
                    </div>
                    <span style={{
                      fontSize: ".62rem", fontWeight: 800, padding: ".18rem .55rem", borderRadius: "999px",
                      background: "oklch(0.55 0.20 145 / .1)", color: "oklch(0.35 0.18 145)",
                      border: "1px solid oklch(0.55 0.20 145 / .25)", whiteSpace: "nowrap",
                    }}>Active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sports */}
            <div className="pf-card">
              <div className="pf-card-head">
                <div className="pf-card-head-left">
                  <div className="pf-card-icon" style={{ background: "oklch(0.55 0.20 55 / .12)" }}>🏆</div>
                  <h2 style={{ fontSize: ".88rem", fontWeight: 800, color: "var(--foreground,#090909)", margin: 0 }}>Sports</h2>
                </div>
                <Link href="/profile/sports" className="pf-view-link">View all →</Link>
              </div>
              <div className="pf-card-body">
                {sports.length === 0 ? (
                  <div className="pf-empty" style={{ padding: "1.25rem 0" }}>
                    <div className="pf-empty-ico" style={{ width: 44, height: 44, fontSize: "1.1rem", marginBottom: ".5rem" }}>🏆</div>
                    <p style={{ fontSize: ".8rem", color: "var(--muted-foreground,#999)", margin: "0 0 .6rem" }}>No achievements yet</p>
                    <Link href="/profile/sports" style={{ fontSize: ".75rem", fontWeight: 700, color: "oklch(0.4882 0.2172 264.3763)", textDecoration: "none" }}>Add achievement →</Link>
                  </div>
                ) : sports.map(s => (
                  <div key={s.id} className="pf-list-item">
                    <div className="pf-list-ico" style={{ background: "oklch(0.55 0.20 55 / .1)", fontSize: "1.1rem" }}>
                      {ACHIEVEMENT_ICON[s.achievementType] ?? "🏅"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: ".83rem", fontWeight: 700, color: "var(--foreground,#090909)", margin: "0 0 .1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sportName}</p>
                      <p style={{ fontSize: ".7rem", color: "var(--muted-foreground,#999)", margin: 0 }}>
                        {s.position ?? s.achievementType.toLowerCase()}
                      </p>
                    </div>
                    <span style={{
                      fontSize: ".7rem", fontWeight: 800, color: "oklch(0.50 0.18 65)",
                      background: "oklch(0.70 0.18 65 / .1)", border: "1px solid oklch(0.70 0.18 65 / .25)",
                      padding: ".18rem .55rem", borderRadius: "999px", whiteSpace: "nowrap",
                    }}>{s.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ════════════════ SUGGESTIONS ════════════════ */}
        <div className="pf-card">
          <div className="pf-card-head">
            <div className="pf-card-head-left">
              <div className="pf-card-icon" style={{ background: "oklch(0.60 0.20 320 / .12)" }}>💡</div>
              <div>
                <h2>Improvement Suggestions</h2>
                <p>Personalised tips to boost your profile score</p>
              </div>
            </div>
          </div>
          <div className="pf-card-body" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".875rem" }}>
            {topSuggestions.map((s, i) => (
              <div key={i} className="pf-sugg">
                <div style={{ display: "flex", alignItems: "flex-start", gap: ".65rem" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: ".6rem", flexShrink: 0,
                    background: "oklch(0.4882 0.2172 264.3763 / .1)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".9rem",
                  }}>{s.icon}</div>
                  <p style={{ fontSize: ".8rem", color: "var(--foreground,#090909)", lineHeight: 1.5, margin: 0 }}>{s.text}</p>
                </div>
                <Link href={s.href} style={{
                  fontSize: ".75rem", fontWeight: 700,
                  color: "oklch(0.4882 0.2172 264.3763)", textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: ".25rem",
                }}>
                  {s.linkLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
