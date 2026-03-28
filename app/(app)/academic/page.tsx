"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"

// ── Types ──────────────────────────────────────────────────────────────────────

type SubjectResult = {
  id: number
  subjectCode: string
  subjectName: string
  credits: number
  caMarks: number | null
  finalMarks: number | null
  marks: number
  grade: string
}

type SemesterRecord = {
  id: number
  semesterNum: number
  academicYear: string
  gpa: number | null
  subjects: SubjectResult[]
}

type StudentData = {
  fullName: string
  studentId: string
  faculty: string
  degree: string
  intakeYear: number
  photoUrl: string | null
  email: string
  phone: string | null
  gender: string | null
  dateOfBirth: string | null
  createdAt: string
  semesters: SemesterRecord[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D": 1.0, "F": 0.0,
}

function gradeColor(grade: string) {
  if (["A+","A","A-"].includes(grade)) return { color: "oklch(0.38 0.18 145)", bg: "oklch(0.91 0.08 145)" }
  if (["B+","B","B-"].includes(grade)) return { color: "oklch(0.38 0.2 250)",  bg: "oklch(0.91 0.06 250)" }
  if (["C+","C","C-"].includes(grade)) return { color: "oklch(0.44 0.18 55)",  bg: "oklch(0.92 0.08 55)"  }
  return { color: "oklch(0.44 0.22 25)", bg: "oklch(0.92 0.08 25)" }
}

function gpaColor(gpa: number | null) {
  if (!gpa) return { color: "#999", bg: "#f1f1f1", bar: "#ddd" }
  if (gpa >= 3.7) return { color: "oklch(0.38 0.18 145)", bg: "oklch(0.91 0.08 145)", bar: "oklch(0.55 0.18 145)" }
  if (gpa >= 3.0) return { color: "oklch(0.38 0.2 250)",  bg: "oklch(0.91 0.06 250)", bar: "oklch(0.55 0.2 250)" }
  if (gpa >= 2.0) return { color: "oklch(0.44 0.18 55)",  bg: "oklch(0.92 0.08 55)",  bar: "oklch(0.62 0.18 55)" }
  return { color: "oklch(0.44 0.22 25)", bg: "oklch(0.92 0.08 25)", bar: "oklch(0.62 0.22 25)" }
}

function calcCGPA(semesters: SemesterRecord[]) {
  const subjects = semesters.flatMap(s => s.subjects)
  if (!subjects.length) return null
  const pts = subjects.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0)
  const cr  = subjects.reduce((sum, s) => sum + s.credits, 0)
  return cr > 0 ? pts / cr : null
}

function calcSemGPA(subjects: SubjectResult[]) {
  if (!subjects.length) return null
  const pts = subjects.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0)
  const cr  = subjects.reduce((sum, s) => sum + s.credits, 0)
  return cr > 0 ? pts / cr : null
}

function toInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

// ── CSS ────────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ac-root {
  max-width: 1000px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.5rem;
  padding-bottom: 2rem;
}

/* ── Profile Card ── */
.ac-profile {
  border: 1px solid var(--border); border-radius: 1.25rem;
  background: var(--card);
  box-shadow: 0 4px 20px oklch(0.4882 0.2172 264.3763 / .08);
}
.ac-banner {
  height: 120px;
  background: linear-gradient(135deg,
    oklch(0.16 0.09 268) 0%,
    oklch(0.26 0.16 258) 40%,
    oklch(0.33 0.2 270) 70%,
    oklch(0.22 0.1 282) 100%
  );
  position: relative; overflow: hidden;
  border-radius: 1.25rem 1.25rem 0 0;
}
.ac-banner::before {
  content: "";
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 85% 40%, oklch(0.6231 0.1880 259.8145 / .35) 0%, transparent 50%),
    radial-gradient(ellipse at 15% 70%, oklch(0.4882 0.2172 264.3763 / .25) 0%, transparent 45%);
}
.ac-banner-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, oklch(1 0 0 / .07) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* ── Identity row (avatar + name + cgpa) ── */
.ac-identity {
  display: flex; align-items: flex-start; gap: 1.1rem;
  padding: 0 1.75rem;
  position: relative; z-index: 2;
}
.ac-avatar {
  width: 88px; height: 88px; border-radius: 50%;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  border: 4px solid var(--card);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 900; color: #fff;
  overflow: hidden; flex-shrink: 0;
  box-shadow: 0 6px 20px oklch(0.4882 0.2172 264.3763 / .4);
  margin-top: -44px; /* only avatar overlaps banner */
}
.ac-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ac-identity-text { flex: 1; min-width: 0; padding-top: .55rem; }
.ac-name { font-size: 1.18rem; font-weight: 900; color: var(--foreground); letter-spacing: -.025em; line-height: 1.2; }
.ac-sid  { font-size: .76rem; color: oklch(0.4882 0.2172 264.3763); font-weight: 700; margin-top: .2rem; }
.ac-degree { font-size: .75rem; color: var(--muted-foreground); margin-top: .18rem; }
.ac-cgpa-badge {
  display: flex; flex-direction: column; align-items: center;
  padding: .55rem 1.1rem; border-radius: .85rem; flex-shrink: 0;
  background: oklch(0.91 0.08 145 / .9);
  border: 1.5px solid oklch(0.72 0.14 145 / .5);
  box-shadow: 0 3px 12px oklch(0.42 0.18 145 / .15);
  margin-top: .55rem;
}
.ac-cgpa-label { font-size: .6rem; font-weight: 700; color: oklch(0.42 0.18 145); text-transform: uppercase; letter-spacing: .08em; }
.ac-cgpa-val   { font-size: 1.35rem; font-weight: 900; color: oklch(0.30 0.18 145); letter-spacing: -.03em; line-height: 1; margin-top: .1rem; }

/* ── Info section ── */
.ac-profile-body { padding: 1rem 1.75rem 1.5rem; }
.ac-divider { height: 1px; background: var(--border); margin: 1rem 0; }

.ac-info-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: .75rem 1.25rem;
}
.ac-info-item {
  display: flex; align-items: center; gap: .6rem;
  padding: .55rem .75rem; border-radius: .65rem;
  background: var(--muted); border: 1px solid var(--border);
}
.ac-info-icon {
  width: 28px; height: 28px; border-radius: .45rem; flex-shrink: 0;
  background: oklch(0.4882 0.2172 264.3763 / .1);
  border: 1px solid oklch(0.4882 0.2172 264.3763 / .15);
  display: flex; align-items: center; justify-content: center;
  color: oklch(0.4882 0.2172 264.3763); font-size: .8rem;
}
.ac-info-text { min-width: 0; }
.ac-info-label { font-size: .6rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: .05em; }
.ac-info-value { font-size: .8rem; font-weight: 600; color: var(--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: .05rem; }

/* ── Stats row ── */
.ac-stats-row {
  display: flex; margin-top: 1rem;
  border-radius: .85rem; overflow: hidden;
  border: 1px solid var(--border);
}
.ac-stat { flex: 1; text-align: center; padding: .9rem .5rem; position: relative; }
.ac-stat + .ac-stat::before {
  content: ""; position: absolute; left: 0; top: 20%; bottom: 20%;
  width: 1px; background: var(--border);
}
.ac-stat-val { font-size: 1.2rem; font-weight: 900; color: var(--foreground); letter-spacing: -.02em; }
.ac-stat-val.green { color: oklch(0.35 0.18 145); }
.ac-stat-lbl { font-size: .6rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: .05em; margin-top: .2rem; }
.ac-stat-divider { display: none; }

/* ── GPA Trend ── */
.ac-trend-card {
  border: 1px solid var(--border); border-radius: 1.1rem;
  background: var(--card); padding: 1.35rem;
  box-shadow: 0 2px 12px oklch(0.4882 0.2172 264.3763 / .06);
}
.ac-trend-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.25rem;
}
.ac-trend-title { font-size: .9rem; font-weight: 800; color: var(--foreground); }
.ac-trend-sub   { font-size: .72rem; color: var(--muted-foreground); margin-top: .1rem; }
.ac-chart {
  display: flex; align-items: flex-end; gap: 6px;
  height: 130px; padding: 0 .25rem; position: relative;
}
.ac-chart-grid {
  position: absolute; inset: 0; pointer-events: none;
}
.ac-chart-gridline {
  position: absolute; left: 0; right: 0;
  border-top: 1px dashed var(--border);
  font-size: .58rem; color: var(--muted-foreground);
}
.ac-chart-gridline span {
  position: absolute; left: 0; top: -8px;
  font-size: .58rem; color: var(--muted-foreground);
  font-weight: 600;
}
.ac-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; z-index: 1; }
.ac-bar-val { font-size: .65rem; font-weight: 800; }
.ac-bar-body { width: 100%; border-radius: 5px 5px 0 0; min-height: 6px; transition: height .4s ease; }
.ac-bar-lbl { font-size: .62rem; font-weight: 700; color: var(--muted-foreground); white-space: nowrap; margin-top: 4px; }
.ac-bar-yr  { font-size: .56rem; color: var(--muted-foreground); opacity: .7; }

/* ── Semester Cards ── */
.ac-sem-card {
  border: 1px solid var(--border); border-radius: 1.1rem;
  overflow: hidden; background: var(--card);
  box-shadow: 0 2px 8px oklch(0.4882 0.2172 264.3763 / .05);
}
.ac-sem-head {
  display: flex; align-items: center; gap: .9rem;
  padding: 1rem 1.35rem; cursor: pointer;
  transition: background .15s; user-select: none;
}
.ac-sem-head:hover { background: oklch(0.4882 0.2172 264.3763 / .04); }
.ac-sem-badge {
  width: 42px; height: 42px; border-radius: .75rem; flex-shrink: 0;
  background: linear-gradient(135deg,
    oklch(0.4882 0.2172 264.3763 / .12),
    oklch(0.6231 0.1880 259.8145 / .06)
  );
  border: 1px solid oklch(0.4882 0.2172 264.3763 / .2);
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; font-weight: 900;
  color: oklch(0.4882 0.2172 264.3763);
}
.ac-sem-info { flex: 1; min-width: 0; }
.ac-sem-name { font-size: .92rem; font-weight: 800; color: var(--foreground); }
.ac-sem-meta { font-size: .72rem; color: var(--muted-foreground); margin-top: .1rem; }
.ac-gpa-chip {
  font-size: .82rem; font-weight: 900;
  padding: .3rem .8rem; border-radius: .55rem; flex-shrink: 0;
}
.ac-chevron { flex-shrink: 0; color: var(--muted-foreground); transition: transform .2s; }
.ac-chevron.open { transform: rotate(180deg); }

/* ── Subject Table ── */
.ac-tbl-wrap { overflow-x: auto; border-top: 1px solid var(--border); }
.ac-tbl {
  width: 100%; border-collapse: collapse;
  font-size: .8rem; min-width: 620px;
}
.ac-tbl th {
  text-align: left; padding: .55rem 1.1rem;
  background: var(--muted); color: var(--muted-foreground);
  font-size: .65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; white-space: nowrap;
}
.ac-tbl td { padding: .7rem 1.1rem; border-top: 1px solid var(--border); vertical-align: middle; }
.ac-tbl tr:hover td { background: oklch(0.4882 0.2172 264.3763 / .025); }
.ac-grade-pill {
  display: inline-block; font-size: .75rem; font-weight: 900;
  padding: .18rem .6rem; border-radius: .4rem;
}
.ac-dash { color: var(--muted-foreground); }
.ac-tbl-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: .7rem 1.35rem; border-top: 1px solid var(--border);
  background: var(--muted); font-size: .76rem;
  color: var(--muted-foreground);
}
.ac-tbl-foot b { color: var(--foreground); }
.ac-empty-subj { padding: 2rem; text-align: center; font-size: .82rem; color: var(--muted-foreground); }

/* ── States ── */
.ac-skel {
  background: var(--muted); border-radius: .75rem;
  animation: ac-shimmer 1.6s ease-in-out infinite;
}
@keyframes ac-shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }

.ac-empty-state {
  border: 2px dashed oklch(0.4882 0.2172 264.3763 / .2);
  border-radius: 1rem; padding: 3.5rem 1rem; text-align: center;
}
.ac-empty-icon { font-size: 2rem; margin-bottom: .75rem; }
.ac-empty-title { font-size: .95rem; font-weight: 700; color: var(--foreground); }
.ac-empty-sub { font-size: .8rem; color: var(--muted-foreground); margin-top: .3rem; }

@media (max-width: 720px) {
  .ac-info-grid { grid-template-columns: repeat(2, 1fr); }
  .ac-identity { padding: 0 1rem; }
  .ac-profile-body { padding: 1rem 1rem 1.25rem; }
}
@media (max-width: 480px) {
  .ac-info-grid { grid-template-columns: 1fr; }
  .ac-identity { flex-wrap: wrap; }
  .ac-cgpa-badge { flex-direction: row; gap: .5rem; margin-bottom: 0; }
  .ac-sem-head { padding: .85rem 1rem; }
  .ac-tbl th, .ac-tbl td { padding: .55rem .75rem; }
}
`

// ── Component ──────────────────────────────────────────────────────────────────

const CHART_H = 110 // px — usable bar area height

export default function AcademicPage() {
  const [data, setData]       = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSems, setOpenSems] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch("/api/academic")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setData(d)
          setOpenSems(new Set((d.semesters as SemesterRecord[]).map((s: SemesterRecord) => s.id)))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function toggleSem(id: number) {
    setOpenSems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const cgpa          = data ? calcCGPA(data.semesters) : null
  const totalCredits  = data?.semesters.flatMap(s => s.subjects).reduce((sum, s) => sum + s.credits, 0) ?? 0
  const totalSubjects = data?.semesters.flatMap(s => s.subjects).length ?? 0

  const semGpas = data?.semesters.map(s => ({ sem: s, gpa: calcSemGPA(s.subjects) ?? s.gpa })) ?? []
  const maxGpa  = Math.max(4, ...semGpas.map(x => x.gpa ?? 0))

  return (
    <>
      <style>{CSS}</style>
      <div className="ac-root">

        {loading ? (
          <>
            <div className="ac-skel" style={{ height: 260 }} />
            <div className="ac-skel" style={{ height: 180 }} />
            <div className="ac-skel" style={{ height: 90 }} />
            <div className="ac-skel" style={{ height: 90 }} />
          </>
        ) : !data ? (
          <div className="ac-empty-state">
            <div className="ac-empty-icon">🎓</div>
            <div className="ac-empty-title">No records found</div>
            <div className="ac-empty-sub">Contact your academic office.</div>
          </div>
        ) : (
          <>

            {/* ── Profile Card ── */}
            <div className="ac-profile">
              <div className="ac-banner">
                <div className="ac-banner-dots" />
              </div>

              {/* Identity row */}
              <div className="ac-identity">
                <div className="ac-avatar">
                  {data.photoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={data.photoUrl} alt={data.fullName} />
                    : toInitials(data.fullName)
                  }
                </div>
                <div className="ac-identity-text">
                  <div className="ac-name">{data.fullName}</div>
                  <div className="ac-sid">{data.studentId}</div>
                  <div className="ac-degree">{data.degree} · {data.faculty} · Intake {data.intakeYear}</div>
                </div>
                {cgpa !== null && (
                  <div className="ac-cgpa-badge">
                    <span className="ac-cgpa-label">CGPA</span>
                    <span className="ac-cgpa-val">{cgpa.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="ac-profile-body">
                <div className="ac-divider" />

                {/* Info grid */}
                <div className="ac-info-grid">
                  {[
                    { label: "Email",         value: data.email || "—",                          icon: "✉" },
                    { label: "Phone",         value: data.phone || "—",                          icon: "☎" },
                    { label: "Gender",        value: data.gender || "—",                         icon: "⚥" },
                    { label: "Date of Birth", value: fmtDate(data.dateOfBirth),                  icon: "⊡" },
                    { label: "Intake Year",   value: data.intakeYear ? String(data.intakeYear) : "—", icon: "◫" },
                    { label: "Registered",    value: fmtDate(data.createdAt),                    icon: "◑" },
                  ].map(info => (
                    <div className="ac-info-item" key={info.label}>
                      <div className="ac-info-icon">{info.icon}</div>
                      <div className="ac-info-text">
                        <div className="ac-info-label">{info.label}</div>
                        <div className="ac-info-value">{info.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="ac-stats-row">
                  {[
                    { val: data.semesters.length,                        lbl: "Semesters", green: false },
                    { val: totalSubjects,                                 lbl: "Subjects",  green: false },
                    { val: totalCredits,                                  lbl: "Credits",   green: false },
                    { val: cgpa !== null ? cgpa.toFixed(2) : "—",        lbl: "CGPA",      green: true  },
                  ].map(s => (
                    <div className="ac-stat" key={s.lbl}>
                      <div className={`ac-stat-val${s.green ? " green" : ""}`}>{s.val}</div>
                      <div className="ac-stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── GPA Trend Chart ── */}
            {data.semesters.length > 0 && (
              <div className="ac-trend-card">
                <div className="ac-trend-header">
                  <div>
                    <div className="ac-trend-title">GPA Trend by Semester</div>
                    <div className="ac-trend-sub">{data.semesters.length} semester{data.semesters.length !== 1 ? "s" : ""} · Max 4.00</div>
                  </div>
                  {cgpa !== null && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: ".65rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".05em" }}>CGPA</div>
                      <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "oklch(0.38 0.18 145)", letterSpacing: "-.025em" }}>{cgpa.toFixed(2)}</div>
                    </div>
                  )}
                </div>

                {/* Chart */}
                <div style={{ position: "relative", paddingLeft: "2.5rem" }}>

                  {/* Y-axis gridlines (absolute, behind bars) */}
                  <div style={{ position: "absolute", left: "2.5rem", right: 0, top: 0, height: CHART_H }}>
                    {[4.0, 3.0, 2.0, 1.0].map(v => (
                      <div key={v} style={{
                        position: "absolute", left: 0, right: 0,
                        top: `${((4 - v) / 4) * 100}%`,
                        borderTop: "1px dashed var(--border)",
                      }}>
                        <span style={{
                          position: "absolute", right: "calc(100% + .5rem)",
                          fontSize: ".58rem", fontWeight: 600,
                          color: "var(--muted-foreground)",
                          transform: "translateY(-50%)",
                          whiteSpace: "nowrap",
                        }}>{v.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bar columns */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: CHART_H, position: "relative", zIndex: 1 }}>
                    {semGpas.map(({ sem, gpa }) => {
                      const gc = gpaColor(gpa)
                      const barH = gpa !== null ? Math.max(8, (gpa / 4) * CHART_H) : 8
                      return (
                        <div key={sem.id} style={{
                          flex: 1, height: "100%",
                          display: "flex", alignItems: "flex-end",
                          position: "relative",
                        }}>
                          {/* GPA label floats above bar */}
                          <div style={{
                            position: "absolute", bottom: barH + 5,
                            left: 0, right: 0, textAlign: "center",
                            fontSize: ".68rem", fontWeight: 800, color: gc.color,
                          }}>
                            {gpa !== null ? gpa.toFixed(2) : "—"}
                          </div>
                          {/* Bar */}
                          <div style={{
                            width: "100%", height: barH,
                            borderRadius: "6px 6px 0 0",
                            background: `linear-gradient(to top, ${gc.bar}, ${gc.bar}bb)`,
                            boxShadow: `0 -2px 8px ${gc.bar}44`,
                          }} />
                        </div>
                      )
                    })}
                  </div>

                  {/* X-axis labels */}
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {semGpas.map(({ sem }) => (
                      <div key={sem.id} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: ".65rem", fontWeight: 700, color: "var(--muted-foreground)" }}>S{sem.semesterNum}</div>
                        <div style={{ fontSize: ".58rem", color: "var(--muted-foreground)", opacity: .65 }}>{sem.academicYear}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── No Semesters ── */}
            {data.semesters.length === 0 && (
              <div className="ac-empty-state">
                <div className="ac-empty-icon">📋</div>
                <div className="ac-empty-title">No semester records yet</div>
                <div className="ac-empty-sub">Contact your academic office to add your records.</div>
              </div>
            )}

            {/* ── Semester Cards ── */}
            {data.semesters.map(sem => {
              const autoGpa    = calcSemGPA(sem.subjects)
              const displayGpa = autoGpa ?? sem.gpa
              const gc         = gpaColor(displayGpa)
              const semCr      = sem.subjects.reduce((s, subj) => s + subj.credits, 0)
              const isOpen     = openSems.has(sem.id)

              return (
                <div className="ac-sem-card" key={sem.id}>
                  <div className="ac-sem-head" onClick={() => toggleSem(sem.id)}>
                    <div className="ac-sem-badge">S{sem.semesterNum}</div>
                    <div className="ac-sem-info">
                      <div className="ac-sem-name">Semester {sem.semesterNum}</div>
                      <div className="ac-sem-meta">
                        {sem.academicYear} · {sem.subjects.length} subject{sem.subjects.length !== 1 ? "s" : ""} · {semCr} credits
                      </div>
                    </div>
                    <div className="ac-gpa-chip" style={{ color: gc.color, background: gc.bg }}>
                      GPA&nbsp;{displayGpa !== null ? displayGpa.toFixed(2) : "—"}
                    </div>
                    <svg
                      className={`ac-chevron${isOpen ? " open" : ""}`}
                      width="16" height="16" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>

                  {isOpen && (
                    <div className="ac-tbl-wrap">
                      {sem.subjects.length === 0 ? (
                        <div className="ac-empty-subj">No subjects recorded for this semester.</div>
                      ) : (
                        <table className="ac-tbl">
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Subject Name</th>
                              <th style={{ textAlign: "center" }}>Credits</th>
                              <th style={{ textAlign: "center" }}>CA Marks</th>
                              <th style={{ textAlign: "center" }}>Final Exam</th>
                              <th style={{ textAlign: "center" }}>Overall</th>
                              <th style={{ textAlign: "center" }}>Grade</th>
                              <th style={{ textAlign: "center" }}>Grade Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sem.subjects.map(subj => {
                              const gc = gradeColor(subj.grade)
                              const gp = GRADE_POINTS[subj.grade] ?? 0
                              return (
                                <tr key={subj.id}>
                                  <td style={{ fontFamily: "monospace", fontSize: ".76rem", color: "oklch(0.4882 0.2172 264.3763)", fontWeight: 700 }}>
                                    {subj.subjectCode}
                                  </td>
                                  <td style={{ fontWeight: 600 }}>{subj.subjectName}</td>
                                  <td style={{ textAlign: "center" }}>
                                    <span style={{ fontWeight: 700, color: "var(--foreground)" }}>{subj.credits}</span>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    {subj.caMarks !== null
                                      ? <strong>{subj.caMarks.toFixed(1)}</strong>
                                      : <span className="ac-dash">—</span>}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    {subj.finalMarks !== null
                                      ? <strong>{subj.finalMarks.toFixed(1)}</strong>
                                      : <span className="ac-dash">—</span>}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <strong style={{ color: "var(--foreground)" }}>{subj.marks.toFixed(1)}</strong>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <span className="ac-grade-pill" style={{ color: gc.color, background: gc.bg }}>
                                      {subj.grade}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "center", fontWeight: 700, color: "var(--muted-foreground)" }}>
                                    {gp.toFixed(1)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                      {sem.subjects.length > 0 && (
                        <div className="ac-tbl-foot">
                          <span><b>{sem.subjects.length}</b> subject{sem.subjects.length !== 1 ? "s" : ""} · <b>{semCr}</b> credits</span>
                          {displayGpa !== null && (
                            <span>Semester GPA: <b style={{ color: gc.color }}>{displayGpa.toFixed(2)}</b></span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

          </>
        )}
      </div>
    </>
  )
}
