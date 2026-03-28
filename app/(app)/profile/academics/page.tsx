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
.ac-hero-add {
  position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; gap: .45rem;
  background: rgba(255,255,255,0.12); color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: .55rem 1.1rem; border-radius: .65rem;
  font-size: .8rem; font-weight: 600; cursor: pointer;
  backdrop-filter: blur(8px); transition: background .2s;
}
.ac-hero-add:hover { background: rgba(255,255,255,0.2); }

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
.ac-sem-actions { display: flex; gap: .3rem; flex-shrink: 0; }
.ac-icon-btn {
  padding: .35rem; border-radius: .4rem; border: none; background: transparent;
  color: var(--muted-foreground); cursor: pointer; display: flex; align-items: center;
  transition: background .15s, color .15s;
}
.ac-icon-btn:hover { background: var(--accent); color: var(--foreground); }
.ac-icon-btn.del:hover { background: oklch(0.95 0.05 25); color: oklch(0.55 0.22 25); }

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

.ac-add-sub-row { border-top: 1px solid var(--border); }
.ac-add-sub-form { padding: 1rem 1.25rem; background: oklch(0.97 0.01 250 / 0.4); }
.ac-add-sub-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted-foreground); margin-bottom: .75rem; }
.ac-input-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .65rem; margin-bottom: .75rem; }
@media (min-width: 640px) { .ac-input-grid { grid-template-columns: repeat(4, 1fr); } }

.ac-input {
  width: 100%; border: 1px solid var(--border); background: var(--background);
  border-radius: .55rem; padding: .45rem .65rem; font-size: .82rem;
  color: var(--foreground); outline: none; transition: border-color .2s, box-shadow .2s;
  box-sizing: border-box;
}
.ac-input:focus { border-color: oklch(0.6 0.2 250); box-shadow: 0 0 0 3px oklch(0.6 0.2 250 / 0.15); }
.ac-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .5rem center; background-size: 1rem; padding-right: 2rem; }

.ac-add-link {
  display: flex; align-items: center; gap: .4rem;
  padding: .75rem 1.25rem; font-size: .78rem; font-weight: 600;
  color: oklch(0.6 0.2 250); background: transparent; border: none;
  cursor: pointer; transition: color .15s;
}
.ac-add-link:hover { color: oklch(0.5 0.22 250); }

.ac-no-subs { padding: .75rem 1.25rem; font-size: .82rem; color: var(--muted-foreground); }

.ac-btn-primary {
  display: inline-flex; align-items: center; gap: .4rem;
  background: linear-gradient(135deg, oklch(0.6 0.2 250), oklch(0.52 0.22 265));
  color: #fff; border: none; border-radius: .6rem;
  padding: .55rem 1.2rem; font-size: .82rem; font-weight: 600;
  cursor: pointer; transition: opacity .2s;
}
.ac-btn-primary:hover { opacity: .88; }
.ac-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
.ac-btn-ghost {
  display: inline-flex; align-items: center;
  background: transparent; color: var(--muted-foreground);
  border: 1px solid var(--border); border-radius: .6rem;
  padding: .55rem 1.2rem; font-size: .82rem; font-weight: 500;
  cursor: pointer; transition: background .15s;
}
.ac-btn-ghost:hover { background: var(--accent); color: var(--foreground); }

.ac-add-sem-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; padding: 1.5rem; margin-bottom: 1rem;
}
.ac-add-sem-title { font-size: .9rem; font-weight: 700; color: var(--foreground); margin-bottom: 1rem; }
.ac-sem-grid { display: grid; grid-template-columns: 1fr; gap: .85rem; margin-bottom: 1rem; }
@media (min-width: 640px) { .ac-sem-grid { grid-template-columns: repeat(3, 1fr); } }
.ac-field-label { font-size: .72rem; font-weight: 600; color: var(--muted-foreground); margin-bottom: .4rem; display: block; }

.ac-dashed-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: .5rem;
  border: 2px dashed var(--border); border-radius: 1rem;
  padding: 1rem; font-size: .85rem; font-weight: 600;
  color: var(--muted-foreground); background: transparent; cursor: pointer;
  transition: border-color .2s, color .2s, background .2s;
}
.ac-dashed-btn:hover { border-color: oklch(0.6 0.2 250 / 0.5); color: oklch(0.55 0.2 250); background: oklch(0.6 0.2 250 / 0.04); }

.ac-err {
  background: oklch(0.97 0.05 25 / 0.5); border: 1px solid oklch(0.85 0.1 25);
  border-radius: .65rem; padding: .75rem 1rem; font-size: .82rem;
  color: oklch(0.5 0.2 25); margin-bottom: 1rem;
}

.ac-empty { text-align: center; padding: 3.5rem 1rem; color: var(--muted-foreground); }
.ac-empty-icon { font-size: 2.5rem; margin-bottom: .75rem; }

/* Modal */
.ac-modal-bg {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem; background: rgba(0,0,0,.55);
  backdrop-filter: blur(4px);
}
.ac-modal {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; width: 100%; max-width: 28rem;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  animation: acModalIn .2s ease;
}
@keyframes acModalIn {
  from { opacity: 0; transform: scale(.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.ac-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.4rem; border-bottom: 1px solid var(--border);
}
.ac-modal-title { font-weight: 700; color: var(--foreground); font-size: .95rem; }
.ac-modal-close {
  padding: .3rem; border-radius: .4rem; border: none; background: transparent;
  color: var(--muted-foreground); cursor: pointer;
}
.ac-modal-close:hover { background: var(--accent); color: var(--foreground); }
.ac-modal-body { padding: 1.4rem; }
.ac-modal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .85rem; margin-bottom: .85rem; }
.ac-modal-actions { display: flex; gap: .5rem; margin-top: 1.25rem; }
`

export default function AcademicsPage() {
  const pathname = usePathname()
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [error, setError] = useState("")

  const [showAddSem, setShowAddSem] = useState(false)
  const [semForm, setSemForm] = useState({ semesterNum: "", academicYear: "", gpa: "" })
  const [semSaving, setSemSaving] = useState(false)
  const [editSem, setEditSem] = useState<Semester | null>(null)

  const [addSubjectFor, setAddSubjectFor] = useState<number | null>(null)
  const [subForm, setSubForm] = useState({ subjectCode: "", subjectName: "", credits: "3", marks: "" })
  const [subSaving, setSubSaving] = useState(false)
  const [editSub, setEditSub] = useState<(Subject & { semesterId: number }) | null>(null)

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

  async function addSemester() {
    if (!semForm.semesterNum || !semForm.academicYear) { setError("Semester number and academic year are required."); return }
    setSemSaving(true); setError("")
    const res = await fetch("/api/profile/semesters", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(semForm),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Failed to add semester."); setSemSaving(false); return }
    setSemesters((prev) => [...prev, data].sort((a, b) => a.semesterNum - b.semesterNum))
    setSemForm({ semesterNum: "", academicYear: "", gpa: "" })
    setShowAddSem(false); setSemSaving(false)
  }

  async function updateSemester() {
    if (!editSem) return
    setSemSaving(true); setError("")
    const res = await fetch(`/api/profile/semesters/${editSem.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semesterNum: editSem.semesterNum, academicYear: editSem.academicYear, gpa: editSem.gpa }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Failed to update."); setSemSaving(false); return }
    setSemesters((prev) => prev.map((s) => (s.id === data.id ? data : s)))
    setEditSem(null); setSemSaving(false)
  }

  async function deleteSemester(id: number) {
    if (!confirm("Delete this semester and all its subjects?")) return
    const res = await fetch(`/api/profile/semesters/${id}`, { method: "DELETE" })
    if (res.ok) setSemesters((prev) => prev.filter((s) => s.id !== id))
    else setError("Failed to delete semester.")
  }

  async function addSubject(semId: number) {
    if (!subForm.subjectCode || !subForm.subjectName || !subForm.marks) { setError("Code, name, and marks are required."); return }
    setSubSaving(true); setError("")
    const res = await fetch("/api/profile/subjects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semesterId: semId, ...subForm }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Failed to add subject."); setSubSaving(false); return }
    setSemesters((prev) => prev.map((s) => s.id === semId ? { ...s, subjects: [...s.subjects, data] } : s))
    setSubForm({ subjectCode: "", subjectName: "", credits: "3", marks: "" })
    setAddSubjectFor(null); setSubSaving(false)
  }

  async function updateSubject() {
    if (!editSub) return
    setSubSaving(true); setError("")
    const res = await fetch(`/api/profile/subjects/${editSub.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectCode: editSub.subjectCode, subjectName: editSub.subjectName, credits: editSub.credits, marks: editSub.marks }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Failed to update."); setSubSaving(false); return }
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === editSub.semesterId
          ? { ...s, subjects: s.subjects.map((sub) => (sub.id === data.id ? data : sub)) }
          : s
      )
    )
    setEditSub(null); setSubSaving(false)
  }

  async function deleteSubject(semId: number, subId: number) {
    if (!confirm("Delete this subject?")) return
    const res = await fetch(`/api/profile/subjects/${subId}`, { method: "DELETE" })
    if (res.ok) setSemesters((prev) => prev.map((s) => s.id === semId ? { ...s, subjects: s.subjects.filter((sub) => sub.id !== subId) } : s))
    else setError("Failed to delete subject.")
  }

  const chartData = semesters.filter((s) => s.gpa != null).map((s) => ({ semesterNum: s.semesterNum, academicYear: s.academicYear, gpa: s.gpa! }))

  return (
    <div className="ac-wrap">
      <style>{CSS}</style>

      {/* Hero */}
      <div className="ac-hero">
        <h1 className="ac-hero-title">Academic Records</h1>
        <p className="ac-hero-sub">Manage your semester results and subject grades.</p>
        {!showAddSem && (
          <button className="ac-hero-add" onClick={() => setShowAddSem(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Semester
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="ac-tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`ac-tab${pathname === t.href ? " active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {error && <div className="ac-err">{error}</div>}

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
          <p style={{ fontWeight: 600, marginBottom: ".25rem" }}>No semesters yet.</p>
          <p style={{ fontSize: ".82rem" }}>Add your first semester using the button above.</p>
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
                <div className="ac-sem-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="ac-icon-btn" onClick={() => setEditSem({ ...sem })}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button className="ac-icon-btn del" onClick={() => deleteSemester(sem.id)}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
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
                            <th className="ac-th" />
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
                              <td className="ac-td">
                                <div style={{ display: "flex", gap: ".25rem", justifyContent: "flex-end" }}>
                                  <button className="ac-icon-btn" onClick={() => setEditSub({ ...sub, semesterId: sem.id })}>
                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                    </svg>
                                  </button>
                                  <button className="ac-icon-btn del" onClick={() => deleteSubject(sem.id, sub.id)}>
                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="ac-no-subs">No subjects added yet.</p>
                  )}

                  <div className="ac-add-sub-row">
                    {addSubjectFor === sem.id ? (
                      <div className="ac-add-sub-form">
                        <p className="ac-add-sub-label">Add Subject</p>
                        <div className="ac-input-grid">
                          <input className="ac-input" placeholder="Code e.g. CS1010" value={subForm.subjectCode}
                            onChange={(e) => setSubForm((p) => ({ ...p, subjectCode: e.target.value }))} />
                          <input className="ac-input" placeholder="Subject Name" value={subForm.subjectName}
                            onChange={(e) => setSubForm((p) => ({ ...p, subjectName: e.target.value }))} />
                          <input className="ac-input" type="number" placeholder="Credits" min={1} max={6} value={subForm.credits}
                            onChange={(e) => setSubForm((p) => ({ ...p, credits: e.target.value }))} />
                          <input className="ac-input" type="number" placeholder="Marks %" min={0} max={100} value={subForm.marks}
                            onChange={(e) => setSubForm((p) => ({ ...p, marks: e.target.value }))} />
                        </div>
                        <div style={{ display: "flex", gap: ".5rem" }}>
                          <button className="ac-btn-primary" onClick={() => addSubject(sem.id)} disabled={subSaving}>
                            {subSaving ? "Saving…" : "Add Subject"}
                          </button>
                          <button className="ac-btn-ghost" onClick={() => { setAddSubjectFor(null); setSubForm({ subjectCode: "", subjectName: "", credits: "3", marks: "" }) }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="ac-add-link" onClick={() => { setAddSubjectFor(sem.id); setSubForm({ subjectCode: "", subjectName: "", credits: "3", marks: "" }) }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Subject
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Semester form */}
      {showAddSem ? (
        <div className="ac-add-sem-card">
          <p className="ac-add-sem-title">Add Semester</p>
          <div className="ac-sem-grid">
            <div>
              <label className="ac-field-label">Semester Number</label>
              <select className="ac-input ac-select" value={semForm.semesterNum}
                onChange={(e) => setSemForm((p) => ({ ...p, semesterNum: e.target.value }))}>
                <option value="">Select…</option>
                {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>Semester {n}</option>)}
              </select>
            </div>
            <div>
              <label className="ac-field-label">Academic Year</label>
              <input className="ac-input" placeholder="e.g. 2022/2023" value={semForm.academicYear}
                onChange={(e) => setSemForm((p) => ({ ...p, academicYear: e.target.value }))} />
            </div>
            <div>
              <label className="ac-field-label">GPA (optional)</label>
              <input className="ac-input" type="number" step="0.01" min="0" max="4" placeholder="e.g. 3.50" value={semForm.gpa}
                onChange={(e) => setSemForm((p) => ({ ...p, gpa: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <button className="ac-btn-primary" onClick={addSemester} disabled={semSaving}>{semSaving ? "Saving…" : "Add Semester"}</button>
            <button className="ac-btn-ghost" onClick={() => { setShowAddSem(false); setSemForm({ semesterNum: "", academicYear: "", gpa: "" }) }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="ac-dashed-btn" onClick={() => setShowAddSem(true)}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Semester
        </button>
      )}

      {/* Edit Semester Modal */}
      {editSem && (
        <div className="ac-modal-bg">
          <div className="ac-modal">
            <div className="ac-modal-head">
              <span className="ac-modal-title">Edit Semester</span>
              <button className="ac-modal-close" onClick={() => setEditSem(null)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="ac-modal-body">
              <div className="ac-modal-grid">
                <div>
                  <label className="ac-field-label">Semester Number</label>
                  <select className="ac-input ac-select" value={editSem.semesterNum}
                    onChange={(e) => setEditSem((p) => p ? { ...p, semesterNum: Number(e.target.value) } : null)}>
                    {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ac-field-label">Academic Year</label>
                  <input className="ac-input" value={editSem.academicYear}
                    onChange={(e) => setEditSem((p) => p ? { ...p, academicYear: e.target.value } : null)} />
                </div>
              </div>
              <div>
                <label className="ac-field-label">GPA (optional)</label>
                <input className="ac-input" type="number" step="0.01" min="0" max="4" value={editSem.gpa ?? ""}
                  onChange={(e) => setEditSem((p) => p ? { ...p, gpa: e.target.value === "" ? null : Number(e.target.value) } : null)} />
              </div>
              <div className="ac-modal-actions">
                <button className="ac-btn-primary" onClick={updateSemester} disabled={semSaving}>{semSaving ? "Saving…" : "Save Changes"}</button>
                <button className="ac-btn-ghost" onClick={() => setEditSem(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editSub && (
        <div className="ac-modal-bg">
          <div className="ac-modal">
            <div className="ac-modal-head">
              <span className="ac-modal-title">Edit Subject</span>
              <button className="ac-modal-close" onClick={() => setEditSub(null)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="ac-modal-body">
              <div className="ac-modal-grid">
                <div>
                  <label className="ac-field-label">Subject Code</label>
                  <input className="ac-input" value={editSub.subjectCode}
                    onChange={(e) => setEditSub((p) => p ? { ...p, subjectCode: e.target.value } : null)} />
                </div>
                <div>
                  <label className="ac-field-label">Credits</label>
                  <input className="ac-input" type="number" min={1} max={6} value={editSub.credits}
                    onChange={(e) => setEditSub((p) => p ? { ...p, credits: Number(e.target.value) } : null)} />
                </div>
              </div>
              <div style={{ marginBottom: ".85rem" }}>
                <label className="ac-field-label">Subject Name</label>
                <input className="ac-input" value={editSub.subjectName}
                  onChange={(e) => setEditSub((p) => p ? { ...p, subjectName: e.target.value } : null)} />
              </div>
              <div>
                <label className="ac-field-label">Marks (%)</label>
                <input className="ac-input" type="number" min={0} max={100} value={editSub.marks}
                  onChange={(e) => setEditSub((p) => p ? { ...p, marks: Number(e.target.value) } : null)} />
              </div>
              <div className="ac-modal-actions">
                <button className="ac-btn-primary" onClick={updateSubject} disabled={subSaving}>{subSaving ? "Saving…" : "Save Changes"}</button>
                <button className="ac-btn-ghost" onClick={() => setEditSub(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
