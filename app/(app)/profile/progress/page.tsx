export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { GpaLineChart } from "@/components/profile/GpaLineChart"

const TABS = [
  { label: "Overview",  href: "/profile" },
  { label: "Academics", href: "/profile/academics" },
  { label: "Clubs",     href: "/profile/clubs" },
  { label: "Sports",    href: "/profile/sports" },
  { label: "Progress",  href: "/profile/progress" },
]

const SUGG_META: Record<string, { icon: string; color: string; bg: string }> = {
  academic:  { icon: "📚", color: "oklch(0.55 0.2 250)", bg: "oklch(0.95 0.04 250 / 0.6)" },
  sports:    { icon: "🏃", color: "oklch(0.45 0.2 145)", bg: "oklch(0.95 0.06 145 / 0.6)" },
  society:   { icon: "👥", color: "oklch(0.5 0.2 295)",  bg: "oklch(0.95 0.05 295 / 0.6)" },
  materials: { icon: "📄", color: "oklch(0.48 0.18 215)", bg: "oklch(0.95 0.04 215 / 0.6)" },
  mentor:    { icon: "🎓", color: "oklch(0.52 0.2 60)",  bg: "oklch(0.97 0.06 60 / 0.6)"  },
}

const CSS = `
.pg-wrap { max-width: 900px; margin: 0 auto; padding-bottom: 2rem; }

/* ── Hero ── */
.pg-hero {
  background: linear-gradient(135deg, oklch(0.22 0.14 240) 0%, oklch(0.18 0.16 260) 50%, oklch(0.2 0.13 220) 100%);
  border-radius: 1.25rem; padding: 2rem 2rem 1.75rem;
  position: relative; overflow: hidden; margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px oklch(0.3 0.15 250 / 0.3);
}
.pg-hero-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(oklch(1 0 0 / 0.04) 1px, transparent 1px),
                    linear-gradient(90deg, oklch(1 0 0 / 0.04) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}
.pg-hero-orb1 {
  position: absolute; right: -2rem; top: -2rem;
  width: 14rem; height: 14rem; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.65 0.2 200 / 0.18), transparent 65%);
  pointer-events: none;
}
.pg-hero-orb2 {
  position: absolute; left: 30%; bottom: -3rem;
  width: 10rem; height: 10rem; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.6 0.22 280 / 0.14), transparent 65%);
  pointer-events: none;
}
.pg-hero-content { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.pg-hero-left {}
.pg-hero-eyebrow {
  display: inline-flex; align-items: center; gap: .4rem;
  background: oklch(1 0 0 / 0.1); border: 1px solid oklch(1 0 0 / 0.15);
  color: oklch(0.85 0.06 220); font-size: .72rem; font-weight: 600;
  padding: .25rem .75rem; border-radius: 9999px;
  letter-spacing: .04em; text-transform: uppercase; margin-bottom: .75rem;
}
.pg-hero-title { color: #fff; font-size: 1.6rem; font-weight: 800; margin: 0 0 .35rem; line-height: 1.15; }
.pg-hero-sub { color: oklch(0.75 0.06 230); font-size: .875rem; margin: 0; }
.pg-hero-right { flex-shrink: 0; display: none; }
@media (min-width: 600px) { .pg-hero-right { display: block; } }
.pg-score-bubble {
  width: 7rem; height: 7rem; border-radius: 50%;
  background: oklch(1 0 0 / 0.08); border: 2px solid oklch(1 0 0 / 0.18);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  backdrop-filter: blur(8px);
}
.pg-score-bubble-val { color: #fff; font-size: 2rem; font-weight: 900; line-height: 1; }
.pg-score-bubble-label { color: oklch(0.8 0.05 230); font-size: .68rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }

.pg-hero-stats {
  position: relative; display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; margin-top: 1.5rem;
  background: oklch(1 0 0 / 0.1); border-radius: .75rem; overflow: hidden;
}
.pg-hero-stat { padding: .75rem 1rem; background: oklch(1 0 0 / 0.05); }
.pg-hero-stat:hover { background: oklch(1 0 0 / 0.1); }
.pg-hero-stat-val { color: #fff; font-size: 1.25rem; font-weight: 800; }
.pg-hero-stat-label { color: oklch(0.75 0.05 230); font-size: .7rem; font-weight: 500; margin-top: .1rem; }

/* ── Tabs ── */
.pg-tabs {
  display: flex; gap: .35rem; margin-bottom: 1.5rem;
  background: var(--card); border: 1px solid var(--border);
  border-radius: .75rem; padding: .35rem; overflow-x: auto;
}
.pg-tab {
  flex-shrink: 0; padding: .45rem 1rem; border-radius: .5rem;
  font-size: .8rem; font-weight: 500; color: var(--muted-foreground);
  text-decoration: none; transition: all .2s; white-space: nowrap;
}
.pg-tab:hover { color: var(--foreground); background: var(--accent); }
.pg-tab.active {
  background: linear-gradient(135deg, oklch(0.5 0.2 240), oklch(0.43 0.22 260));
  color: #fff; font-weight: 600;
  box-shadow: 0 2px 8px oklch(0.5 0.2 240 / 0.4);
}

/* ── Score category cards ── */
.pg-score-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1.25rem; }
@media (min-width: 600px) { .pg-score-grid { grid-template-columns: repeat(3, 1fr); } }

.pg-score-card {
  border-radius: 1rem; padding: 1.25rem; position: relative; overflow: hidden;
  border: 1px solid transparent;
  transition: transform .2s, box-shadow .2s;
}
.pg-score-card:hover { transform: translateY(-2px); }
.pg-score-card.academic {
  background: linear-gradient(145deg, oklch(0.94 0.05 250), oklch(0.96 0.03 245));
  border-color: oklch(0.85 0.1 250); box-shadow: 0 4px 16px oklch(0.6 0.2 250 / 0.1);
}
.pg-score-card.sports {
  background: linear-gradient(145deg, oklch(0.94 0.06 145), oklch(0.96 0.04 140));
  border-color: oklch(0.85 0.1 145); box-shadow: 0 4px 16px oklch(0.6 0.2 145 / 0.1);
}
.pg-score-card.society {
  background: linear-gradient(145deg, oklch(0.94 0.05 295), oklch(0.96 0.03 290));
  border-color: oklch(0.85 0.1 295); box-shadow: 0 4px 16px oklch(0.6 0.2 295 / 0.1);
}
.pg-score-card-icon {
  width: 2.75rem; height: 2.75rem; border-radius: .65rem;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; margin-bottom: .85rem;
}
.academic .pg-score-card-icon { background: oklch(0.6 0.2 250 / 0.15); }
.sports   .pg-score-card-icon { background: oklch(0.6 0.2 145 / 0.15); }
.society  .pg-score-card-icon { background: oklch(0.6 0.2 295 / 0.15); }
.pg-score-card-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .35rem; }
.academic .pg-score-card-label { color: oklch(0.45 0.2 250); }
.sports   .pg-score-card-label { color: oklch(0.4 0.2 145); }
.society  .pg-score-card-label { color: oklch(0.45 0.2 295); }
.pg-score-card-val { font-size: 2.5rem; font-weight: 900; line-height: 1; margin-bottom: .5rem; }
.academic .pg-score-card-val { color: oklch(0.42 0.22 250); }
.sports   .pg-score-card-val { color: oklch(0.38 0.22 145); }
.society  .pg-score-card-val { color: oklch(0.42 0.22 295); }
.pg-score-card-unit { font-size: .9rem; font-weight: 500; opacity: .7; }
.pg-score-card-track { height: .35rem; background: oklch(1 0 0 / 0.3); border-radius: 9999px; overflow: hidden; margin-bottom: .4rem; }
.academic .pg-score-card-track { background: oklch(0.7 0.12 250 / 0.25); }
.sports   .pg-score-card-track { background: oklch(0.7 0.12 145 / 0.25); }
.society  .pg-score-card-track { background: oklch(0.7 0.12 295 / 0.25); }
.pg-score-card-fill { height: 100%; border-radius: 9999px; }
.academic .pg-score-card-fill { background: oklch(0.55 0.22 250); }
.sports   .pg-score-card-fill { background: oklch(0.5 0.22 145); }
.society  .pg-score-card-fill { background: oklch(0.55 0.22 295); }
.pg-score-card-meta { font-size: .72rem; }
.academic .pg-score-card-meta { color: oklch(0.5 0.15 250); }
.sports   .pg-score-card-meta { color: oklch(0.45 0.15 145); }
.society  .pg-score-card-meta { color: oklch(0.5 0.15 295); }
.pg-score-card-weight {
  position: absolute; top: 1rem; right: 1rem;
  font-size: .68rem; font-weight: 700; padding: .2rem .5rem; border-radius: .35rem;
}
.academic .pg-score-card-weight { background: oklch(0.6 0.2 250 / 0.15); color: oklch(0.45 0.2 250); }
.sports   .pg-score-card-weight { background: oklch(0.6 0.2 145 / 0.15); color: oklch(0.4 0.2 145); }
.society  .pg-score-card-weight { background: oklch(0.6 0.2 295 / 0.15); color: oklch(0.45 0.2 295); }

/* ── Milestones ── */
.pg-milestones { display: flex; flex-wrap: wrap; gap: .65rem; }
.pg-milestone {
  display: flex; align-items: center; gap: .55rem;
  padding: .55rem .95rem; border-radius: .65rem;
  border: 1px solid; font-size: .78rem; font-weight: 600;
  transition: transform .15s;
}
.pg-milestone:hover { transform: scale(1.02); }
.pg-milestone.earned { background: oklch(0.96 0.06 80); border-color: oklch(0.85 0.12 80); color: oklch(0.45 0.22 80); }
.pg-milestone.locked { background: var(--muted); border-color: var(--border); color: var(--muted-foreground); opacity: .6; }
.pg-milestone-icon { font-size: 1rem; }
.pg-milestone-lock { font-size: .7rem; opacity: .5; }

/* ── Generic card ── */
.pg-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; padding: 1.5rem;
  margin-bottom: 1.25rem; position: relative; overflow: hidden;
}
.pg-card::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, oklch(0.6 0.2 240), oklch(0.55 0.22 260));
  opacity: 0; transition: opacity .2s;
}
.pg-card:hover::after { opacity: 1; }
.pg-card-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.1rem; }
.pg-card-title { font-size: .9rem; font-weight: 700; color: var(--foreground); }
.pg-card-sub { font-size: .75rem; color: var(--muted-foreground); margin-top: .2rem; }
.pg-card-badge {
  font-size: .7rem; font-weight: 600; padding: .2rem .65rem; border-radius: .4rem;
  background: oklch(0.95 0.04 240); color: oklch(0.48 0.18 240);
  border: 1px solid oklch(0.88 0.08 240); flex-shrink: 0;
}

/* ── GPA trend extras ── */
.pg-gpa-stats { display: flex; gap: 1.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.pg-gpa-stat { }
.pg-gpa-stat-label { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--muted-foreground); }
.pg-gpa-stat-val { font-size: 1.5rem; font-weight: 800; color: var(--foreground); line-height: 1.1; }
.pg-gpa-stat-sub { font-size: .72rem; color: var(--muted-foreground); }
.pg-gpa-badge {
  display: inline-flex; align-items: center; gap: .3rem;
  font-size: .72rem; font-weight: 600; padding: .2rem .6rem; border-radius: .4rem;
}
.pg-gpa-badge.up { background: oklch(0.94 0.08 145); color: oklch(0.4 0.2 145); }
.pg-gpa-badge.down { background: oklch(0.94 0.07 25); color: oklch(0.5 0.22 25); }
.pg-gpa-badge.same { background: var(--muted); color: var(--muted-foreground); }

/* ── Bar chart ── */
.pg-bar-chart { }
.pg-bar-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: .75rem; }
.pg-bar-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted-foreground); }
.pg-bars-row { display: flex; align-items: flex-end; gap: .65rem; height: 7rem; }
.pg-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .25rem; }
.pg-bar-val { font-size: .75rem; font-weight: 800; }
.pg-bar-fill { width: 100%; border-radius: .35rem .35rem 0 0; transition: height .5s ease; min-height: 4px; }
.pg-bar-key { font-size: .7rem; color: var(--muted-foreground); }

/* ── Weak subjects ── */
.pg-weak-list { display: flex; flex-direction: column; gap: .8rem; }
.pg-weak-item {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem 1.25rem; border-radius: .85rem; border: 1px solid;
  position: relative; overflow: hidden;
}
.pg-weak-item::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 0 2px 2px 0;
}
.pg-weak-item.red { background: oklch(0.97 0.04 25 / 0.5); border-color: oklch(0.88 0.08 25); }
.pg-weak-item.red::before { background: oklch(0.55 0.22 25); }
.pg-weak-item.orange { background: oklch(0.97 0.05 60 / 0.5); border-color: oklch(0.88 0.1 60); }
.pg-weak-item.orange::before { background: oklch(0.6 0.2 60); }
.pg-weak-grade {
  width: 2.75rem; height: 2.75rem; border-radius: .6rem;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: .9rem; flex-shrink: 0;
}
.pg-weak-grade.red { background: oklch(0.92 0.08 25); color: oklch(0.5 0.22 25); }
.pg-weak-grade.orange { background: oklch(0.93 0.09 60); color: oklch(0.48 0.2 60); }
.pg-weak-info { flex: 1; min-width: 0; }
.pg-weak-name { font-weight: 700; font-size: .875rem; color: var(--foreground); }
.pg-weak-meta { font-size: .75rem; color: var(--muted-foreground); margin-top: .1rem; }
.pg-weak-bar-wrap { display: flex; align-items: center; gap: .5rem; margin-top: .4rem; }
.pg-weak-bar-track { flex: 1; height: .25rem; background: var(--muted); border-radius: 9999px; overflow: hidden; max-width: 8rem; }
.pg-weak-bar-fill { height: 100%; border-radius: 9999px; }
.pg-weak-pct { font-size: .7rem; font-weight: 700; }
.pg-weak-pct.red { color: oklch(0.5 0.22 25); }
.pg-weak-pct.orange { color: oklch(0.52 0.2 60); }
.pg-weak-link {
  display: inline-flex; align-items: center; gap: .3rem;
  font-size: .75rem; font-weight: 600;
  background: oklch(0.95 0.04 250); color: oklch(0.48 0.18 250);
  border: 1px solid oklch(0.88 0.08 250);
  padding: .35rem .75rem; border-radius: .45rem;
  text-decoration: none; white-space: nowrap; flex-shrink: 0;
  transition: background .15s;
}
.pg-weak-link:hover { background: oklch(0.9 0.07 250); }

/* ── Suggestions ── */
.pg-sugg-grid { display: grid; grid-template-columns: 1fr; gap: .75rem; }
@media (min-width: 640px) { .pg-sugg-grid { grid-template-columns: repeat(2, 1fr); } }
.pg-sugg-card {
  display: flex; gap: .85rem; align-items: flex-start;
  padding: 1rem 1.1rem; border-radius: .85rem;
  border: 1px solid var(--border);
  transition: border-color .2s, box-shadow .2s;
  text-decoration: none;
}
.pg-sugg-card:hover { border-color: oklch(0.7 0.12 250 / 0.5); box-shadow: 0 2px 12px oklch(0.6 0.15 250 / 0.08); }
.pg-sugg-icon {
  width: 2.5rem; height: 2.5rem; border-radius: .6rem;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; flex-shrink: 0;
}
.pg-sugg-text { font-size: .8rem; color: var(--foreground); line-height: 1.45; flex: 1; }
.pg-sugg-action { font-size: .75rem; font-weight: 700; margin-top: .4rem; display: block; }

/* ── Formula pill ── */
.pg-formula {
  font-size: .72rem; color: var(--muted-foreground);
  padding: .65rem 1rem; border-radius: .65rem;
  background: var(--muted); border: 1px solid var(--border);
  margin-top: 1.25rem; display: inline-flex; align-items: center; gap: .5rem;
}

/* ── Chart empty ── */
.pg-chart-empty {
  display: flex; align-items: center; justify-content: center;
  height: 7rem; font-size: .85rem; color: var(--muted-foreground);
  border: 1.5px dashed var(--border); border-radius: .75rem;
  flex-direction: column; gap: .5rem;
}
`

function rankInfo(score: number): { label: string; emoji: string; next: number | null } {
  if (score >= 90) return { label: "Platinum", emoji: "💎", next: null }
  if (score >= 75) return { label: "Gold",     emoji: "🥇", next: 90 }
  if (score >= 55) return { label: "Silver",   emoji: "🥈", next: 75 }
  if (score >= 35) return { label: "Bronze",   emoji: "🥉", next: 55 }
  return { label: "Starter", emoji: "🌱", next: 35 }
}

function BarChart({ data, label, color }: { data: { key: string; value: number }[]; label: string; color: string }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="pg-bar-chart">
      <div className="pg-bar-label-row">
        <span className="pg-bar-label">{label}</span>
      </div>
      <div className="pg-bars-row">
        {data.map((d) => (
          <div key={d.key} className="pg-bar-col">
            <span className="pg-bar-val" style={{ color }}>{d.value}</span>
            <div
              className="pg-bar-fill"
              style={{
                height: `${(d.value / max) * 80}px`,
                background: `linear-gradient(180deg, ${color}, ${color}99)`,
              }}
            />
            <span className="pg-bar-key">{d.key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function ProgressPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [semesters, sports, clubs] = await Promise.all([
    prisma.semester.findMany({
      where: { userId: session.userId },
      orderBy: { semesterNum: "asc" },
      include: { subjects: { orderBy: { marks: "asc" } } },
    }),
    prisma.sportAchievement.findMany({ where: { userId: session.userId }, orderBy: { date: "asc" } }),
    prisma.studentClub.findMany({ where: { userId: session.userId, isActive: true } }),
  ])

  // ── Score calculations ────────────────────────────────────────────────────
  const avgGpa = semesters.length > 0 ? semesters.reduce((sum, s) => sum + (s.gpa ?? 0), 0) / semesters.length : 0
  const bestGpa = semesters.reduce((best, s) => (s.gpa != null && s.gpa > best ? s.gpa : best), 0)
  const latestGpa = semesters.filter((s) => s.gpa != null).slice(-1)[0]?.gpa ?? null
  const prevGpa   = semesters.filter((s) => s.gpa != null).slice(-2)[0]?.gpa ?? null

  const academicScore = Math.min(Math.round((avgGpa / 4.0) * 100), 100)
  const sportsTotal   = sports.reduce((sum, s) => sum + s.points, 0)
  const sportsScore   = Math.min(sportsTotal, 100)
  const societyTotal  = clubs.reduce((sum, c) => sum + c.participationPoints, 0)
  const societyScore  = Math.min(societyTotal, 100)
  const overallScore  = Math.round(academicScore * 0.5 + sportsScore * 0.25 + societyScore * 0.25)

  const rank = rankInfo(overallScore)

  // ── GPA chart data ────────────────────────────────────────────────────────
  const gpaChartData = semesters.filter((s) => s.gpa != null).map((s) => ({
    semesterNum: s.semesterNum, academicYear: s.academicYear, gpa: s.gpa!,
  }))

  // ── Sports by year ────────────────────────────────────────────────────────
  const sportsByYear: Record<string, number> = {}
  for (const s of sports) {
    const yr = String(new Date(s.date).getFullYear())
    sportsByYear[yr] = (sportsByYear[yr] ?? 0) + s.points
  }
  const sportsBarData = Object.entries(sportsByYear).sort(([a], [b]) => Number(a) - Number(b)).map(([key, value]) => ({ key, value }))

  // ── Weak subjects ─────────────────────────────────────────────────────────
  const allSubjects = semesters.flatMap((s) => s.subjects.map((sub) => ({ ...sub, semesterNum: s.semesterNum })))
  const weakSubjects = [...allSubjects].sort((a, b) => a.marks - b.marks).slice(0, 3).filter((s) => s.marks < 70)

  // ── Milestones ────────────────────────────────────────────────────────────
  const milestones = [
    { label: "Dean's List",    emoji: "🏅", earned: avgGpa >= 3.5 },
    { label: "Active Athlete", emoji: "🏆", earned: sportsScore >= 50 },
    { label: "Club Leader",    emoji: "👑", earned: clubs.some((c) => c.participationPoints >= 30) },
    { label: "All-Rounder",    emoji: "⭐", earned: academicScore >= 60 && sportsScore >= 30 && societyScore >= 30 },
    { label: "High Achiever",  emoji: "🚀", earned: overallScore >= 75 },
  ]

  // ── Suggestions ───────────────────────────────────────────────────────────
  type Suggestion = { type: string; text: string; href: string; linkLabel: string }
  const suggestions: Suggestion[] = []

  for (let i = 1; i < semesters.length; i++) {
    const prev = semesters[i - 1]; const curr = semesters[i]
    if (prev.gpa && curr.gpa && curr.gpa < prev.gpa - 0.3) {
      suggestions.push({ type: "academic", text: `GPA dropped from ${prev.gpa.toFixed(2)} (Sem ${prev.semesterNum}) to ${curr.gpa.toFixed(2)} (Sem ${curr.semesterNum}). Consider reviewing your study strategy.`, href: "/profile/academics", linkLabel: "View academics →" })
      break
    }
  }
  if (weakSubjects.length > 0) {
    const w = weakSubjects[0]
    suggestions.push({ type: "academic", text: `${w.subjectName} is your weakest subject at ${w.marks}% (${w.grade}). A mentor session could make a real difference.`, href: "/support/mentors", linkLabel: "Find a mentor →" })
  }
  if (sportsScore < 30) suggestions.push({ type: "sports", text: "Your sports score is below average. Participating in events can earn you more points and improve your overall score.", href: "/profile/sports", linkLabel: "Add achievement →" })
  if (societyScore < 30) suggestions.push({ type: "society", text: clubs.length === 0 ? "You haven't joined any clubs yet. Club involvement boosts your society score significantly." : "Your society participation is low. Getting more involved in your clubs will help.", href: clubs.length === 0 ? "/clubs" : "/profile/clubs", linkLabel: clubs.length === 0 ? "Explore clubs →" : "View clubs →" })
  suggestions.push({ type: "materials", text: "Upload your lecture notes to use the AI-powered study summarizer and improve retention.", href: "/materials/upload", linkLabel: "Upload materials →" })
  suggestions.push({ type: "mentor", text: "Browse peer mentor sessions to get academic support from top-performing students.", href: "/support/sessions", linkLabel: "Browse sessions →" })

  const topSuggestions = suggestions.slice(0, 4)

  const overallColor = overallScore >= 70 ? "#22c55e" : overallScore >= 50 ? "#f59e0b" : "#ef4444"

  // GPA trend direction
  const gpaTrend = latestGpa == null || prevGpa == null ? "same"
    : latestGpa > prevGpa ? "up" : latestGpa < prevGpa ? "down" : "same"
  const gpaDiff = latestGpa != null && prevGpa != null ? Math.abs(latestGpa - prevGpa).toFixed(2) : null

  const totalSubjects = allSubjects.length
  const activeClubs   = clubs.length
  const achievements  = sports.length

  return (
    <div className="pg-wrap">
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <div className="pg-hero">
        <div className="pg-hero-grid" />
        <div className="pg-hero-orb1" />
        <div className="pg-hero-orb2" />
        <div className="pg-hero-content">
          <div className="pg-hero-left">
            <div className="pg-hero-eyebrow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Progress Dashboard
            </div>
            <h1 className="pg-hero-title">4-Year Progress</h1>
            <p className="pg-hero-sub">Your academic, sports &amp; society journey at a glance.</p>
          </div>
          <div className="pg-hero-right">
            <div className="pg-score-bubble">
              <span className="pg-score-bubble-val">{overallScore}</span>
              <span className="pg-score-bubble-label">Overall</span>
            </div>
          </div>
        </div>
        <div className="pg-hero-stats">
          <div className="pg-hero-stat">
            <div className="pg-hero-stat-val">{semesters.length}</div>
            <div className="pg-hero-stat-label">Semesters</div>
          </div>
          <div className="pg-hero-stat">
            <div className="pg-hero-stat-val">{activeClubs}</div>
            <div className="pg-hero-stat-label">Active Clubs</div>
          </div>
          <div className="pg-hero-stat">
            <div className="pg-hero-stat-val">{achievements}</div>
            <div className="pg-hero-stat-label">Achievements</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="pg-tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`pg-tab${t.href === "/profile/progress" ? " active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Score Breakdown Cards ── */}
      <div className="pg-score-grid">
        {/* Academic */}
        <div className="pg-score-card academic">
          <span className="pg-score-card-weight">× 50%</span>
          <div className="pg-score-card-icon">📚</div>
          <div className="pg-score-card-label">Academic</div>
          <div className="pg-score-card-val">{academicScore}<span className="pg-score-card-unit"> / 100</span></div>
          <div className="pg-score-card-track">
            <div className="pg-score-card-fill" style={{ width: `${academicScore}%` }} />
          </div>
          <div className="pg-score-card-meta">Avg GPA {avgGpa.toFixed(2)} across {semesters.length} sem{semesters.length !== 1 ? "s" : ""}</div>
        </div>
        {/* Sports */}
        <div className="pg-score-card sports">
          <span className="pg-score-card-weight">× 25%</span>
          <div className="pg-score-card-icon">🏃</div>
          <div className="pg-score-card-label">Sports</div>
          <div className="pg-score-card-val">{sportsScore}<span className="pg-score-card-unit"> / 100</span></div>
          <div className="pg-score-card-track">
            <div className="pg-score-card-fill" style={{ width: `${sportsScore}%` }} />
          </div>
          <div className="pg-score-card-meta">{achievements} achievement{achievements !== 1 ? "s" : ""} · {sportsTotal} pts</div>
        </div>
        {/* Society */}
        <div className="pg-score-card society">
          <span className="pg-score-card-weight">× 25%</span>
          <div className="pg-score-card-icon">👥</div>
          <div className="pg-score-card-label">Society</div>
          <div className="pg-score-card-val">{societyScore}<span className="pg-score-card-unit"> / 100</span></div>
          <div className="pg-score-card-track">
            <div className="pg-score-card-fill" style={{ width: `${societyScore}%` }} />
          </div>
          <div className="pg-score-card-meta">{activeClubs} active club{activeClubs !== 1 ? "s" : ""} · {societyTotal} pts</div>
        </div>
      </div>

      {/* ── Rank + Formula ── */}
      <div className="pg-card" style={{ marginBottom: "1.25rem" }}>
        <div className="pg-card-head">
          <div>
            <p className="pg-card-title">Overall Rank</p>
            <p className="pg-card-sub">Based on your combined score of {overallScore} / 100</p>
          </div>
          <span
            style={{
              fontSize: ".75rem", fontWeight: 700, padding: ".3rem .85rem",
              borderRadius: ".5rem", background: overallColor + "22", color: overallColor,
              border: `1px solid ${overallColor}44`, flexShrink: 0,
            }}
          >
            {overallScore} pts
          </span>
        </div>
        {/* Rank bar */}
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <div style={{
            height: ".75rem", borderRadius: 9999, overflow: "hidden",
            background: "linear-gradient(90deg, oklch(0.7 0.2 25), oklch(0.7 0.18 60), oklch(0.75 0.15 80), oklch(0.7 0.18 145), oklch(0.6 0.2 250))",
          }}>
            <div style={{
              height: "100%", width: "3px", background: "#fff",
              marginLeft: `calc(${overallScore}% - 1.5px)`,
              boxShadow: "0 0 6px rgba(255,255,255,0.8)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".4rem" }}>
            {["Starter","Bronze","Silver","Gold","Platinum"].map((r) => (
              <span key={r} style={{ fontSize: ".65rem", color: "var(--muted-foreground)", fontWeight: 600 }}>{r}</span>
            ))}
          </div>
          <div style={{
            position: "absolute", top: "-1.75rem",
            left: `clamp(0px, calc(${overallScore}% - 2rem), calc(100% - 4rem))`,
            background: overallColor, color: "#fff",
            fontSize: ".68rem", fontWeight: 700,
            padding: ".2rem .55rem", borderRadius: ".35rem",
            whiteSpace: "nowrap",
          }}>
            {rank.emoji} {rank.label}
          </div>
        </div>
        {rank.next !== null && (
          <p style={{ fontSize: ".78rem", color: "var(--muted-foreground)" }}>
            Need <strong style={{ color: "var(--foreground)" }}>{rank.next - overallScore} more points</strong> to reach the next rank.
          </p>
        )}
        <p className="pg-formula">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ opacity: .6 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Formula: Academic × 50% + Sports × 25% + Society × 25%
        </p>
      </div>

      {/* ── Milestones ── */}
      <div className="pg-card" style={{ marginBottom: "1.25rem" }}>
        <div className="pg-card-head">
          <div>
            <p className="pg-card-title">Milestones</p>
            <p className="pg-card-sub">{milestones.filter((m) => m.earned).length} of {milestones.length} unlocked</p>
          </div>
          <span className="pg-card-badge">{milestones.filter((m) => m.earned).length} / {milestones.length}</span>
        </div>
        <div className="pg-milestones">
          {milestones.map((m) => (
            <div key={m.label} className={`pg-milestone ${m.earned ? "earned" : "locked"}`}>
              <span className="pg-milestone-icon">{m.emoji}</span>
              <span>{m.label}</span>
              {!m.earned && <span className="pg-milestone-lock">🔒</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── GPA Trend ── */}
      <div className="pg-card">
        <div className="pg-card-head">
          <div>
            <p className="pg-card-title">GPA Trend</p>
            <p className="pg-card-sub">Semester-by-semester academic performance</p>
          </div>
          {latestGpa != null && gpaDiff && (
            <span className={`pg-gpa-badge ${gpaTrend}`}>
              {gpaTrend === "up" ? "▲" : gpaTrend === "down" ? "▼" : "—"} {gpaDiff}
            </span>
          )}
        </div>
        {gpaChartData.length > 0 ? (
          <>
            <div className="pg-gpa-stats">
              <div className="pg-gpa-stat">
                <p className="pg-gpa-stat-label">Current GPA</p>
                <p className="pg-gpa-stat-val">{latestGpa?.toFixed(2) ?? "—"}</p>
                <p className="pg-gpa-stat-sub">Latest semester</p>
              </div>
              <div className="pg-gpa-stat">
                <p className="pg-gpa-stat-label">Best GPA</p>
                <p className="pg-gpa-stat-val">{bestGpa.toFixed(2)}</p>
                <p className="pg-gpa-stat-sub">All-time high</p>
              </div>
              <div className="pg-gpa-stat">
                <p className="pg-gpa-stat-label">Average GPA</p>
                <p className="pg-gpa-stat-val">{avgGpa.toFixed(2)}</p>
                <p className="pg-gpa-stat-sub">Across all semesters</p>
              </div>
              <div className="pg-gpa-stat">
                <p className="pg-gpa-stat-label">Subjects</p>
                <p className="pg-gpa-stat-val">{totalSubjects}</p>
                <p className="pg-gpa-stat-sub">Total recorded</p>
              </div>
            </div>
            <GpaLineChart data={gpaChartData} />
          </>
        ) : (
          <div className="pg-chart-empty">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ opacity: .3 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm9.75-9.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V3.375z" />
            </svg>
            <span>Add semester records in the Academics tab to see your GPA trend.</span>
          </div>
        )}
      </div>

      {/* ── Sports Points by Year ── */}
      {sportsBarData.length > 0 && (
        <div className="pg-card">
          <div className="pg-card-head">
            <div>
              <p className="pg-card-title">Sports Points by Year</p>
              <p className="pg-card-sub">Total achievement points earned per year</p>
            </div>
            <span className="pg-card-badge">{sportsTotal} total pts</span>
          </div>
          <BarChart data={sportsBarData} label="Points earned" color="#22c55e" />
        </div>
      )}

      {/* ── Weak Areas ── */}
      {weakSubjects.length > 0 && (
        <div className="pg-card">
          <div className="pg-card-head">
            <div>
              <p className="pg-card-title">Weak Areas</p>
              <p className="pg-card-sub">Subjects scoring below 70% that need attention</p>
            </div>
            <span className="pg-card-badge" style={{ background: "oklch(0.95 0.05 25 / 0.6)", color: "oklch(0.5 0.2 25)", border: "1px solid oklch(0.88 0.08 25)" }}>
              {weakSubjects.length} subject{weakSubjects.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="pg-weak-list">
            {weakSubjects.map((sub) => {
              const cls = sub.marks < 50 ? "red" : "orange"
              const barColor = sub.marks < 50 ? "oklch(0.55 0.22 25)" : "oklch(0.6 0.2 60)"
              return (
                <div key={sub.id} className={`pg-weak-item ${cls}`}>
                  <div className={`pg-weak-grade ${cls}`}>{sub.grade}</div>
                  <div className="pg-weak-info">
                    <p className="pg-weak-name">{sub.subjectName}</p>
                    <p className="pg-weak-meta">Semester {sub.semesterNum} · {sub.subjectCode}</p>
                    <div className="pg-weak-bar-wrap">
                      <div className="pg-weak-bar-track">
                        <div className="pg-weak-bar-fill" style={{ width: `${sub.marks}%`, background: barColor }} />
                      </div>
                      <span className={`pg-weak-pct ${cls}`}>{sub.marks}%</span>
                    </div>
                  </div>
                  <Link href="/support/mentors" className="pg-weak-link">Get help →</Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Improvement Suggestions ── */}
      <div className="pg-card">
        <div className="pg-card-head">
          <div>
            <p className="pg-card-title">Improvement Suggestions</p>
            <p className="pg-card-sub">Personalised recommendations based on your profile</p>
          </div>
        </div>
        <div className="pg-sugg-grid">
          {topSuggestions.map((s, i) => {
            const meta = SUGG_META[s.type] ?? SUGG_META.academic
            return (
              <Link key={i} href={s.href} className="pg-sugg-card" style={{ background: meta.bg }}>
                <div className="pg-sugg-icon" style={{ background: meta.color + "22" }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p className="pg-sugg-text">{s.text}</p>
                  <span className="pg-sugg-action" style={{ color: meta.color }}>{s.linkLabel}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
