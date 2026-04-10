"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { GpaLineChart } from "@/components/profile/GpaLineChart"

const TABS = [
  { label: "Overview", href: "/profile" },
  { label: "Academics", href: "/profile/academics" },
  { label: "Clubs", href: "/profile/clubs" },
  { label: "Sports", href: "/profile/sports" },
  { label: "Progress", href: "/profile/progress" },
]

type Subject = {
  id: number
  subjectCode: string
  subjectName: string
  credits: number
  marks: number
  grade: string
}

type Semester = {
  id: number
  semesterNum: number
  academicYear: string
  gpa: number | null
  subjects: Subject[]
}

const GRADE_BG: Record<string, string> = {
  "A+": "#dcfce7", A: "#dcfce7", "A-": "#d1fae5",
  "B+": "#dbeafe", B: "#dbeafe", "B-": "#e0f2fe",
  "C+": "#fef9c3", C: "#fef9c3", "C-": "#ffedd5",
  D: "#fee2e2", F: "#fecaca",
}
const GRADE_FG: Record<string, string> = {
  "A+": "#15803d", A: "#15803d", "A-": "#047857",
  "B+": "#1d4ed8", B: "#1d4ed8", "B-": "#0369a1",
  "C+": "#a16207", C: "#a16207", "C-": "#c2410c",
  D: "#dc2626", F: "#b91c1c",
}

const CSS = `
.ac-wrap { max-width: 900px; margin: 0 auto; }

.ac-hero {
  background: linear-gradient(135deg, oklch(0.28 0.08 260) 0%, oklch(0.22 0.12 250) 100%);
  border-radius: 1rem;
  padding: 1.5rem 1.75rem;
  position: relative;
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.ac-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}
.ac-hero-title { color: #fff; font-size: 1.35rem; font-weight: 700; margin: 0 0 .25rem; }
.ac-hero-sub { color: oklch(0.75 0.06 250); font-size: .875rem; margin: 0; }

.ac-tabs {
  display: flex; gap: .35rem; margin-bottom: 1.5rem;
  background: var(--card); border: 1px solid var(--border);
  border-radius: .75rem; padding: .35rem;
  overflow-x: auto;
}
.ac-tab {
  flex-shrink: 0; padding: .45rem 1rem; border-radius: .5rem;
  font-size: .8rem; font-weight: 500; color: var(--muted-foreground);
  text-decoration: none; transition: all .2s; white-space: nowrap;
}
.ac-tab:hover { color: var(--foreground); background: var(--accent); }
.ac-tab.active {
  background: linear-gradient(135deg, oklch(0.55 0.2 250), oklch(0.48 0.22 265));
  color: #fff; font-weight: 600;
  box-shadow: 0 2px 8px oklch(0.5 0.2 250 / 0.35);
}

.ac-chart-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;
}
.ac-chart-title { font-size: .8rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 1rem; }

.ac-sem-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; overflow: hidden;
  transition: box-shadow .2s, border-color .2s;
  margin-bottom: .85rem;
}
.ac-sem-card:hover { border-color: oklch(0.6 0.15 250 / 0.4); box-shadow: 0 4px 16px oklch(0.5 0.15 250 / 0.1); }

.ac-sem-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; cursor: pointer; user-select: none;
}
.ac-sem-left { display: flex; align-items: center; gap: .75rem; flex: 1; }
.ac-chevron {
  width: 1.5rem; height: 1.5rem; border-radius: .4rem;
  border: 1.5px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  color: var(--muted-foreground); transition: transform .25s, border-color .2s;
  flex-shrink: 0;
}
.ac-chevron.open { transform: rotate(90deg); border-color: oklch(0.6 0.2 250); color: oklch(0.6 0.2 250); }
.ac-sem-num { font-weight: 700; color: var(--foreground); font-size: .95rem; }
.ac-sem-year { font-size: .75rem; color: var(--muted-foreground); font-weight: 400; margin-left: .4rem; }
.ac-sem-meta { font-size: .75rem; color: var(--muted-foreground); }
.ac-sem-gpa {
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, oklch(0.55 0.2 250), oklch(0.48 0.22 265));
  color: #fff; font-size: .75rem; font-weight: 700;
  padding: .2rem .6rem; border-radius: .4rem; margin-left: .5rem;
}

.ac-subjects { border-top: 1px solid var(--border); }
.ac-table { width: 100%; font-size: .82rem; border-collapse: collapse; }
.ac-table thead tr { background: oklch(0.97 0.01 250 / 0.5); }
.ac-th { padding: .55rem .85rem; text-align: left; font-weight: 600; font-size: .72rem; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: .04em; }
.ac-th.center { text-align: center; }
.ac-tr { border-bottom: 1px solid var(--border); transition: background .15s; }
.ac-tr:last-child { border-bottom: none; }
.ac-tr:hover { background: var(--accent); }
.ac-td { padding: .65rem .85rem; color: var(--foreground); }
.ac-td.muted { color: var(--muted-foreground); font-family: ui-monospace, monospace; font-size: .75rem; }
.ac-td.center { text-align: center; }
.ac-marks-bar { display: flex; align-items: center; gap: .5rem; }
.ac-marks-track { flex: 1; height: .3rem; background: var(--muted); border-radius: 9999px; overflow: hidden; }
.ac-marks-fill { height: 100%; border-radius: 9999px; transition: width .4s; }
.ac-grade-pill {
  display: inline-block; padding: .15rem .5rem; border-radius: .4rem;
  font-weight: 700; font-size: .72rem; white-space: nowrap;
}

.ac-no-subs { padding: .75rem 1.25rem; font-size: .82rem; color: var(--muted-foreground); }

.ac-empty { text-align: center; padding: 3.5rem 1rem; color: var(--muted-foreground); }
.ac-empty-icon { font-size: 2.5rem; margin-bottom: .75rem; }
`

export default function AcademicsPage() {
  const pathname = usePathname()
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  async function load() {
    setLoading(true)
    const res = await fetch("/api/profile/semesters")
    if (res.ok) setSemesters(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function toggle(id: number) {
    setExpanded((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const chartData = semesters.filter((s) => s.gpa != null).map((s) => ({ semesterNum: s.semesterNum, academicYear: s.academicYear, gpa: s.gpa! }))

  return (
    <div className="ac-wrap">
      <style>{CSS}</style>

      {/* Hero */}
      <div className="ac-hero">
        <h1 className="ac-hero-title">Academic Records</h1>
        <p className="ac-hero-sub">View your semester results and subject grades.</p>
      </div>

      {/* Tabs */}
      <div className="ac-tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`ac-tab${pathname === t.href ? " active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* GPA Chart */}
      {chartData.length > 0 && (
        <div className="ac-chart-card">
          <p className="ac-chart-title">GPA Trend</p>
          <GpaLineChart data={chartData} />
        </div>
      )}

      {/* Semester list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)", fontSize: ".875rem" }}>Loading…</div>
      ) : semesters.length === 0 ? (
        <div className="ac-empty">
          <div className="ac-empty-icon">📚</div>
          <p style={{ fontWeight: 600, marginBottom: ".25rem" }}>No academic records yet.</p>
          <p style={{ fontSize: ".82rem" }}>Your academic records will appear here once added by an administrator.</p>
        </div>
      ) : (
        <div>
          {semesters.map((sem) => (
            <div key={sem.id} className="ac-sem-card">
              <div className="ac-sem-head" onClick={() => toggle(sem.id)}>
                <div className="ac-sem-left">
                  <span className={`ac-chevron${expanded.has(sem.id) ? " open" : ""}`}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="ac-sem-num">
                      Semester {sem.semesterNum}
                      <span className="ac-sem-year">{sem.academicYear}</span>
                      {sem.gpa != null && <span className="ac-sem-gpa">GPA {sem.gpa.toFixed(2)}</span>}
                    </p>
                    <p className="ac-sem-meta">{sem.subjects.length} subject{sem.subjects.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>

              {expanded.has(sem.id) && (
                <div className="ac-subjects">
                  {sem.subjects.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table className="ac-table">
                        <thead>
                          <tr>
                            <th className="ac-th">Code</th>
                            <th className="ac-th">Subject</th>
                            <th className="ac-th center">Credits</th>
                            <th className="ac-th">Marks</th>
                            <th className="ac-th center">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sem.subjects.map((sub) => (
                            <tr key={sub.id} className="ac-tr">
                              <td className="ac-td muted">{sub.subjectCode}</td>
                              <td className="ac-td">{sub.subjectName}</td>
                              <td className="ac-td center" style={{ color: "var(--muted-foreground)" }}>{sub.credits}</td>
                              <td className="ac-td">
                                <div className="ac-marks-bar">
                                  <div className="ac-marks-track">
                                    <div
                                      className="ac-marks-fill"
                                      style={{
                                        width: `${sub.marks}%`,
                                        background: sub.marks >= 70 ? "#22c55e" : sub.marks >= 50 ? "#f59e0b" : "#ef4444",
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: ".75rem", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{sub.marks}%</span>
                                </div>
                              </td>
                              <td className="ac-td center">
                                <span
                                  className="ac-grade-pill"
                                  style={{ background: GRADE_BG[sub.grade] ?? "#f3f4f6", color: GRADE_FG[sub.grade] ?? "#374151" }}
                                >
                                  {sub.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="ac-no-subs">No subjects added yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
