"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

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

type StudentAcademic = {
  id: number
  fullName: string
  studentId: string
  faculty: string
  degree: string
  intakeYear: number
  photoUrl: string | null
  semesters: SemesterRecord[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D": 1.0, "F": 0.0,
}

const GRADE_OPTIONS = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]

function gradeColor(grade: string) {
  if (["A+", "A", "A-"].includes(grade)) return { color: "oklch(0.42 0.18 145)", bg: "oklch(0.92 0.07 145)" }
  if (["B+", "B", "B-"].includes(grade)) return { color: "oklch(0.42 0.2 250)", bg: "oklch(0.92 0.05 250)" }
  if (["C+", "C", "C-"].includes(grade)) return { color: "oklch(0.48 0.18 55)", bg: "oklch(0.93 0.07 55)" }
  return { color: "oklch(0.48 0.22 25)", bg: "oklch(0.93 0.07 25)" }
}

function gpaColor(gpa: number | null) {
  if (gpa === null) return { color: "var(--muted-foreground)", bg: "var(--muted)" }
  if (gpa >= 3.7) return { color: "oklch(0.42 0.18 145)", bg: "oklch(0.92 0.07 145)" }
  if (gpa >= 3.5) return { color: "oklch(0.42 0.2 250)", bg: "oklch(0.92 0.05 250)" }
  if (gpa >= 3.0) return { color: "oklch(0.48 0.18 55)", bg: "oklch(0.93 0.07 55)" }
  return { color: "oklch(0.48 0.22 25)", bg: "oklch(0.93 0.07 25)" }
}

function marksToGrade(marks: number): string {
  if (marks >= 90) return "A+"
  if (marks >= 80) return "A"
  if (marks >= 75) return "A-"
  if (marks >= 70) return "B+"
  if (marks >= 65) return "B"
  if (marks >= 60) return "B-"
  if (marks >= 55) return "C+"
  if (marks >= 50) return "C"
  if (marks >= 45) return "C-"
  if (marks >= 40) return "D"
  return "F"
}

function calcCGPA(semesters: SemesterRecord[]) {
  const all = semesters.flatMap(s => s.subjects)
  if (!all.length) return null
  const totalPts = all.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0)
  const totalCr = all.reduce((sum, s) => sum + s.credits, 0)
  return totalCr > 0 ? totalPts / totalCr : null
}

function calcSemGPA(subjects: SubjectResult[]) {
  if (!subjects.length) return null
  const totalPts = subjects.reduce((sum, s) => sum + (GRADE_POINTS[s.grade] ?? 0) * s.credits, 0)
  const totalCr = subjects.reduce((sum, s) => sum + s.credits, 0)
  return totalCr > 0 ? totalPts / totalCr : null
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

// ── Empty forms ───────────────────────────────────────────────────────────────

const EMPTY_SEM = { semesterNum: "", academicYear: "" }
const EMPTY_SUBJ = { subjectCode: "", subjectName: "", credits: "3", caMarks: "", finalMarks: "", marks: "", grade: "A" }

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; }

.ah-root { max-width: 980px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

/* back */
.ah-back { display: inline-flex; align-items: center; gap: .4rem; font-size: .82rem; font-weight: 600; color: oklch(0.4882 0.2172 264.3763); text-decoration: none; padding: .35rem .75rem; border-radius: .65rem; border: 1px solid oklch(0.4882 0.2172 264.3763 / .2); background: oklch(0.4882 0.2172 264.3763 / .06); transition: all .15s; }
.ah-back:hover { background: oklch(0.4882 0.2172 264.3763 / .12); }

/* hero */
.ah-hero { border-radius: 1.25rem; padding: 1.75rem; background: linear-gradient(135deg, oklch(0.22 0.1 265), oklch(0.30 0.14 258)); color: #fff; position: relative; overflow: hidden; }
.ah-hero::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 80% 50%, oklch(0.6231 0.1880 259.8145 / .25) 0%, transparent 60%); pointer-events: none; }
.ah-hero-inner { position: relative; display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
.ah-hero-avatar { width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0; background: oklch(1 0 0 / .15); border: 3px solid oklch(1 0 0 / .3); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 900; overflow: hidden; }
.ah-hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ah-hero-info { flex: 1; min-width: 0; }
.ah-hero-name { font-size: 1.25rem; font-weight: 900; letter-spacing: -.02em; line-height: 1.2; }
.ah-hero-sub { font-size: .78rem; opacity: .75; margin-top: .2rem; }
.ah-hero-stats { display: flex; gap: 1rem; margin-top: .75rem; flex-wrap: wrap; }
.ah-hero-stat { background: oklch(1 0 0 / .12); border: 1px solid oklch(1 0 0 / .18); border-radius: .75rem; padding: .5rem .9rem; text-align: center; }
.ah-hero-stat-val { font-size: 1.15rem; font-weight: 900; }
.ah-hero-stat-lbl { font-size: .62rem; font-weight: 600; opacity: .7; text-transform: uppercase; letter-spacing: .05em; margin-top: .05rem; }
.ah-hero-cgpa { background: oklch(0.68 0.18 55 / .22); border-color: oklch(0.75 0.18 55 / .4); }
.ah-hero-cgpa .ah-hero-stat-val { color: oklch(0.92 0.12 75); }

/* toolbar */
.ah-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.ah-toolbar-title { font-size: 1rem; font-weight: 800; color: var(--foreground); }

/* btn */
.ah-btn-primary { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem 1rem; border-radius: .75rem; font-size: .82rem; font-weight: 700; background: oklch(0.4882 0.2172 264.3763); color: #fff; border: none; cursor: pointer; transition: opacity .15s; }
.ah-btn-primary:hover { opacity: .88; }
.ah-btn-ghost { display: inline-flex; align-items: center; gap: .4rem; padding: .4rem .75rem; border-radius: .65rem; font-size: .78rem; font-weight: 600; background: var(--muted); color: var(--foreground); border: 1px solid var(--border); cursor: pointer; transition: all .15s; }
.ah-btn-ghost:hover { background: oklch(0.4882 0.2172 264.3763 / .08); border-color: oklch(0.4882 0.2172 264.3763 / .35); }
.ah-btn-danger { display: inline-flex; align-items: center; gap: .35rem; padding: .35rem .65rem; border-radius: .55rem; font-size: .73rem; font-weight: 700; background: oklch(0.93 0.07 25); color: oklch(0.48 0.22 25); border: 1px solid oklch(0.85 0.1 25); cursor: pointer; transition: all .15s; }
.ah-btn-danger:hover { background: oklch(0.88 0.1 25); }
.ah-btn-edit { display: inline-flex; align-items: center; gap: .35rem; padding: .35rem .65rem; border-radius: .55rem; font-size: .73rem; font-weight: 700; background: oklch(0.92 0.05 250); color: oklch(0.42 0.2 250); border: 1px solid oklch(0.82 0.09 250); cursor: pointer; transition: all .15s; }
.ah-btn-edit:hover { background: oklch(0.87 0.08 250); }

/* semester card */
.ah-sem-card { border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; background: var(--card); }
.ah-sem-head { display: flex; align-items: center; gap: .85rem; padding: 1rem 1.25rem; cursor: pointer; transition: background .15s; }
.ah-sem-head:hover { background: oklch(0.4882 0.2172 264.3763 / .04); }
.ah-sem-icon { width: 38px; height: 38px; border-radius: .65rem; background: oklch(0.4882 0.2172 264.3763 / .1); border: 1px solid oklch(0.4882 0.2172 264.3763 / .2); display: flex; align-items: center; justify-content: center; font-size: .78rem; font-weight: 900; color: oklch(0.4882 0.2172 264.3763); flex-shrink: 0; }
.ah-sem-info { flex: 1; min-width: 0; }
.ah-sem-title { font-size: .9rem; font-weight: 800; color: var(--foreground); }
.ah-sem-sub { font-size: .72rem; color: var(--muted-foreground); margin-top: .1rem; }
.ah-sem-gpa-badge { font-size: .82rem; font-weight: 900; padding: .25rem .7rem; border-radius: .55rem; flex-shrink: 0; }
.ah-sem-actions { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }
.ah-chevron { flex-shrink: 0; transition: transform .2s; color: var(--muted-foreground); }
.ah-chevron.open { transform: rotate(180deg); }

/* subject table */
.ah-subj-wrap { border-top: 1px solid var(--border); }
.ah-subj-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
.ah-subj-table th { text-align: left; padding: .55rem 1rem; background: var(--muted, #f4f4f5); color: var(--muted-foreground); font-size: .67rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
.ah-subj-table td { padding: .6rem 1rem; border-top: 1px solid var(--border); vertical-align: middle; }
.ah-subj-table tr:hover td { background: oklch(0.4882 0.2172 264.3763 / .03); }
.ah-grade-badge { font-size: .75rem; font-weight: 900; padding: .15rem .5rem; border-radius: .4rem; }
.ah-marks-val { font-weight: 700; font-size: .82rem; }
.ah-subj-footer { padding: .75rem 1.25rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--muted, #f4f4f5); }
.ah-sem-total { font-size: .75rem; color: var(--muted-foreground); }
.ah-sem-total span { font-weight: 700; color: var(--foreground); }
.ah-empty-subj { padding: 1.5rem 1.25rem; font-size: .82rem; color: var(--muted-foreground); text-align: center; }

/* modal */
.ah-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: oklch(0 0 0 / .5); padding: 1rem; }
.ah-modal { background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; box-shadow: 0 24px 64px oklch(0 0 0 / .18); }
.ah-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
.ah-modal-title { font-size: .95rem; font-weight: 800; color: var(--foreground); }
.ah-modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.ah-modal-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }
.ah-modal-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .85rem; }
.ah-field label { display: block; font-size: .75rem; font-weight: 700; color: var(--foreground); margin-bottom: .35rem; }
.ah-input { width: 100%; border: 1px solid var(--border); background: var(--background); border-radius: .65rem; padding: .55rem .85rem; font-size: .84rem; color: var(--foreground); outline: none; transition: border-color .15s, box-shadow .15s; }
.ah-input:focus { border-color: oklch(0.4882 0.2172 264.3763 / .5); box-shadow: 0 0 0 3px oklch(0.4882 0.2172 264.3763 / .1); }
.ah-input.err { border-color: oklch(0.65 0.22 25); box-shadow: 0 0 0 3px oklch(0.65 0.22 25 / .12); }
.ah-input.readonly { background: var(--muted); color: var(--muted-foreground); cursor: not-allowed; }
.ah-field-err { font-size: .71rem; color: oklch(0.48 0.22 25); margin-top: .3rem; display: flex; align-items: center; gap: .25rem; }
.ah-modal-footer { display: flex; gap: .75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border); }
.ah-modal-footer button { flex: 1; padding: .65rem; border-radius: .75rem; font-size: .84rem; font-weight: 700; cursor: pointer; border: none; transition: opacity .15s; }
.ah-modal-footer .cancel { background: var(--muted); color: var(--foreground); border: 1px solid var(--border); }
.ah-modal-footer .cancel:hover { opacity: .8; }
.ah-modal-footer .confirm { background: oklch(0.4882 0.2172 264.3763); color: #fff; }
.ah-modal-footer .confirm:hover { opacity: .88; }
.ah-modal-footer .confirm:disabled { opacity: .55; cursor: default; }
.ah-err { font-size: .78rem; color: oklch(0.48 0.22 25); background: oklch(0.94 0.06 25); border: 1px solid oklch(0.86 0.1 25); border-radius: .55rem; padding: .55rem .85rem; }

/* marks breakdown bar */
.ah-marks-bar-wrap { border-radius: .75rem; border: 1px solid var(--border); background: var(--muted); padding: .85rem 1rem; display: flex; flex-direction: column; gap: .55rem; }
.ah-marks-bar-label { font-size: .72rem; font-weight: 700; color: var(--muted-foreground); display: flex; justify-content: space-between; }
.ah-marks-bar-track { height: 10px; border-radius: 999px; background: var(--border); overflow: hidden; display: flex; gap: 2px; }
.ah-marks-bar-ca { height: 100%; background: oklch(0.55 0.2 250); border-radius: 999px 0 0 999px; transition: width .3s; }
.ah-marks-bar-fin { height: 100%; background: oklch(0.55 0.18 145); border-radius: 0 999px 999px 0; transition: width .3s; }
.ah-marks-legend { display: flex; gap: 1rem; font-size: .7rem; color: var(--muted-foreground); }
.ah-marks-legend span { display: flex; align-items: center; gap: .3rem; }
.ah-marks-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ah-auto-badge { display: inline-flex; align-items: center; gap: .3rem; font-size: .66rem; font-weight: 700; color: oklch(0.42 0.2 250); background: oklch(0.92 0.05 250); border: 1px solid oklch(0.82 0.09 250); border-radius: .4rem; padding: .1rem .45rem; margin-left: .4rem; }

/* skeleton */
.ah-skel { background: var(--muted); border-radius: .5rem; animation: ah-pulse 1.5s ease-in-out infinite; }
@keyframes ah-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* confirm dialog */
.ah-confirm { background: var(--card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; max-width: 360px; width: 100%; }
.ah-confirm h3 { font-size: .95rem; font-weight: 800; color: var(--foreground); margin-bottom: .5rem; }
.ah-confirm p { font-size: .82rem; color: var(--muted-foreground); margin-bottom: 1.25rem; }
.ah-confirm-btns { display: flex; gap: .65rem; }
.ah-confirm-btns button { flex: 1; padding: .6rem; border-radius: .75rem; font-size: .82rem; font-weight: 700; border: none; cursor: pointer; transition: opacity .15s; }
`

// ── Component ─────────────────────────────────────────────────────────────────

export default function AcademicPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [student, setStudent] = useState<StudentAcademic | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSems, setOpenSems] = useState<Set<number>>(new Set())

  // Semester modal
  const [semModal, setSemModal] = useState<"add" | "edit" | null>(null)
  const [semForm, setSemForm] = useState(EMPTY_SEM)
  const [semEditId, setSemEditId] = useState<number | null>(null)
  const [semSaving, setSemSaving] = useState(false)
  const [semErr, setSemErr] = useState("")

  // Subject modal
  const [subjModal, setSubjModal] = useState<"add" | "edit" | null>(null)
  const [subjForm, setSubjForm] = useState(EMPTY_SUBJ)
  const [subjSemId, setSubjSemId] = useState<number | null>(null)
  const [subjEditId, setSubjEditId] = useState<number | null>(null)
  const [subjSaving, setSubjSaving] = useState(false)
  const [subjErr, setSubjErr] = useState("")
  const [subjFieldErrors, setSubjFieldErrors] = useState<Record<string, string>>({})

  // Delete confirms
  const [deleteSemId, setDeleteSemId] = useState<number | null>(null)
  const [deleteSubjId, setDeleteSubjId] = useState<number | null>(null)

  const fetchStudent = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`)
      if (!res.ok) { setLoading(false); return }
      const text = await res.text()
      if (!text) { setLoading(false); return }
      const data = JSON.parse(text)
      setStudent(data)
      if (data?.semesters) setOpenSems(new Set(data.semesters.map((s: SemesterRecord) => s.id)))
    } catch (e) {
      console.error("fetchStudent error:", e)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchStudent() }, [fetchStudent])

  function toggleSem(semId: number) {
    setOpenSems(prev => {
      const next = new Set(prev)
      next.has(semId) ? next.delete(semId) : next.add(semId)
      return next
    })
  }

  // ── Semester CRUD ────────────────────────────────────────────────────────────

  function openAddSem() {
    setSemForm(EMPTY_SEM)
    setSemEditId(null)
    setSemErr("")
    setSemModal("add")
  }

  function openEditSem(sem: SemesterRecord) {
    setSemForm({ semesterNum: String(sem.semesterNum), academicYear: sem.academicYear })
    setSemEditId(sem.id)
    setSemErr("")
    setSemModal("edit")
  }

  async function saveSem() {
    const currentYear = new Date().getFullYear()
    if (!semForm.semesterNum || !semForm.academicYear.trim()) {
      setSemErr("All fields are required."); return
    }
    const semNum = Number(semForm.semesterNum)
    if (semNum !== 1 && semNum !== 2) {
      setSemErr("Semester number must be 1 or 2."); return
    }
    const yr = semForm.academicYear.trim()
    if (!/^\d{4}$/.test(yr)) {
      setSemErr("Academic year must be exactly 4 digits (e.g. 2024)."); return
    }
    const yrNum = Number(yr)
    if (yrNum < 2000) {
      setSemErr("Academic year must be 2000 or later."); return
    }
    if (yrNum > currentYear) {
      setSemErr(`Academic year cannot be in the future (max ${currentYear}).`); return
    }
    setSemSaving(true); setSemErr("")
    try {
      const url = semModal === "add" ? "/api/admin/semesters" : `/api/admin/semesters/${semEditId}`
      const method = semModal === "add" ? "POST" : "PUT"
      const body = semModal === "add"
        ? { userId: Number(id), ...semForm, semesterNum: Number(semForm.semesterNum) }
        : { ...semForm, semesterNum: Number(semForm.semesterNum) }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); setSemErr(d.error ?? "Failed."); return }
      setSemModal(null)
      fetchStudent()
    } catch { setSemErr("Something went wrong.") }
    finally { setSemSaving(false) }
  }

  async function deleteSem(semId: number) {
    await fetch(`/api/admin/semesters/${semId}`, { method: "DELETE" })
    setDeleteSemId(null)
    fetchStudent()
  }

  // ── Subject CRUD ─────────────────────────────────────────────────────────────

  function openAddSubj(semId: number) {
    setSubjForm(EMPTY_SUBJ)
    setSubjSemId(semId)
    setSubjEditId(null)
    setSubjErr("")
    setSubjFieldErrors({})
    setSubjModal("add")
  }

  function openEditSubj(subj: SubjectResult, semId: number) {
    setSubjForm({
      subjectCode: subj.subjectCode,
      subjectName: subj.subjectName,
      credits: String(subj.credits),
      caMarks: subj.caMarks !== null ? String(subj.caMarks) : "",
      finalMarks: subj.finalMarks !== null ? String(subj.finalMarks) : "",
      marks: String(subj.marks),
      grade: subj.grade,
    })
    setSubjSemId(semId)
    setSubjEditId(subj.id)
    setSubjErr("")
    setSubjFieldErrors({})
    setSubjModal("edit")
  }

  async function saveSubj() {
    const errs: Record<string, string> = {}

    const rawCode = subjForm.subjectCode.trim().toUpperCase()
    if (!rawCode)
      errs.subjectCode = "Subject code is required."
    else if (!/^[A-Z]{2}\d{4}$/.test(rawCode))
      errs.subjectCode = "Format: 2 letters + 4 digits (e.g. IT1010)."

    if (!subjForm.subjectName.trim())
      errs.subjectName = "Subject name is required."

    const credits = Number(subjForm.credits)
    if (!subjForm.credits || isNaN(credits) || credits < 1 || credits > 4)
      errs.credits = "Credits must be 1 – 4."

    const ca  = subjForm.caMarks    !== "" ? Number(subjForm.caMarks)    : null
    const fin = subjForm.finalMarks !== "" ? Number(subjForm.finalMarks) : null

    if (ca !== null && (isNaN(ca) || ca < 0 || ca > 100))
      errs.caMarks = "CA marks must be 0 – 100."

    if (fin !== null && (isNaN(fin) || fin < 0 || fin > 100))
      errs.finalMarks = "Final marks must be 0 – 100."

    const marks = Number(subjForm.marks)
    if (subjForm.marks === "" || isNaN(marks))
      errs.marks = "Overall marks is required."
    else if (marks < 0 || marks > 100)
      errs.marks = "Overall marks must be 0 – 100."

    // Duplicate subject code check within the same semester
    if (!errs.subjectCode && rawCode) {
      const sem = student?.semesters.find(s => s.id === subjSemId)
      const duplicate = sem?.subjects.find(
        s => s.subjectCode.toUpperCase() === rawCode && s.id !== subjEditId
      )
      if (duplicate)
        errs.subjectCode = `"${duplicate.subjectCode}" already exists in this semester.`
    }

    if (Object.keys(errs).length > 0) {
      setSubjFieldErrors(errs)
      setSubjErr("")
      return
    }

    setSubjFieldErrors({})
    setSubjSaving(true); setSubjErr("")
    try {
      const url = subjModal === "add" ? "/api/admin/subject-results" : `/api/admin/subject-results/${subjEditId}`
      const method = subjModal === "add" ? "POST" : "PUT"
      const body = subjModal === "add"
        ? { semesterId: subjSemId, ...subjForm, credits: Number(subjForm.credits), marks: Number(subjForm.marks), caMarks: subjForm.caMarks, finalMarks: subjForm.finalMarks }
        : { ...subjForm, credits: Number(subjForm.credits), marks: Number(subjForm.marks), caMarks: subjForm.caMarks, finalMarks: subjForm.finalMarks }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); setSubjErr(d.error ?? "Failed."); return }
      setSubjModal(null)
      fetchStudent()
    } catch { setSubjErr("Something went wrong.") }
    finally { setSubjSaving(false) }
  }

  async function deleteSubj(subjId: number) {
    await fetch(`/api/admin/subject-results/${subjId}`, { method: "DELETE" })
    setDeleteSubjId(null)
    fetchStudent()
  }

  // ── Form change: auto-calc Overall = CA + Final, clear field errors ──────────

  function handleSubjFormChange(field: keyof typeof subjForm, value: string) {
    // Clear the error for this field on change
    if (subjFieldErrors[field]) {
      setSubjFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    }

    setSubjForm(prev => {
      const next = { ...prev, [field]: value }

      // Live subject code validation
      if (field === "subjectCode") {
        const code = value.trim().toUpperCase()
        if (code && !/^[A-Z]{0,2}\d{0,4}$/.test(code)) {
          setSubjFieldErrors(prev => ({ ...prev, subjectCode: "Format: 2 letters + 4 digits (e.g. IT1010)." }))
        } else if (code.length === 6 && !/^[A-Z]{2}\d{4}$/.test(code)) {
          setSubjFieldErrors(prev => ({ ...prev, subjectCode: "Format: 2 letters + 4 digits (e.g. IT1010)." }))
        } else if (code) {
          // Duplicate check
          const sem = student?.semesters.find(s => s.id === subjSemId)
          const dup = sem?.subjects.find(s => s.subjectCode.toUpperCase() === code && s.id !== subjEditId)
          if (dup)
            setSubjFieldErrors(prev => ({ ...prev, subjectCode: `"${dup.subjectCode}" already exists in this semester.` }))
        }
      }

      // Auto-calculate Overall = (CA + Final) / 2, then auto-set Grade
      if (field === "caMarks" || field === "finalMarks") {
        const ca  = next.caMarks    !== "" ? Number(next.caMarks)    : null
        const fin = next.finalMarks !== "" ? Number(next.finalMarks) : null
        if (ca !== null && fin !== null && !isNaN(ca) && !isNaN(fin)) {
          const total = parseFloat(((ca + fin) / 2).toFixed(2))
          next.marks = String(total)
          next.grade = marksToGrade(total)
          setSubjFieldErrors(prev => {
            const n = { ...prev }
            delete n.finalMarks; delete n.marks; delete n.grade
            return n
          })
        }
      }

      // Auto-set Grade when Overall marks typed directly (without CA/Final)
      if (field === "marks") {
        const m = Number(value)
        if (!isNaN(m) && value !== "") {
          next.grade = marksToGrade(m)
          setSubjFieldErrors(prev => { const n = { ...prev }; delete n.grade; return n })
        }
      }

      return next
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const cgpa = student ? calcCGPA(student.semesters) : null
  const totalCredits = student?.semesters.flatMap(s => s.subjects).reduce((sum, s) => sum + s.credits, 0) ?? 0

  return (
    <>
      <style>{CSS}</style>
      <div className="ah-root">

        {/* Back */}
        <div>
          <Link href="/admin/users" className="ah-back">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
            Back to Users
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="ah-skel" style={{ height: "140px", borderRadius: "1.25rem" }} />
            {[1,2].map(i => <div key={i} className="ah-skel" style={{ height: "80px", borderRadius: "1rem" }} />)}
          </div>
        ) : !student ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>Student not found.</div>
        ) : (
          <>
            {/* Hero */}
            <div className="ah-hero">
              <div className="ah-hero-inner">
                <div className="ah-hero-avatar">
                  {student.photoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={student.photoUrl} alt={student.fullName} />
                    : initials(student.fullName)
                  }
                </div>
                <div className="ah-hero-info">
                  <div className="ah-hero-name">{student.fullName}</div>
                  <div className="ah-hero-sub">{student.studentId} · {student.degree}</div>
                  <div className="ah-hero-sub">{student.faculty} · Intake {student.intakeYear}</div>
                  <div className="ah-hero-stats">
                    <div className={`ah-hero-stat ah-hero-cgpa`}>
                      <div className="ah-hero-stat-val">{cgpa !== null ? cgpa.toFixed(2) : "—"}</div>
                      <div className="ah-hero-stat-lbl">CGPA</div>
                    </div>
                    <div className="ah-hero-stat">
                      <div className="ah-hero-stat-val">{student.semesters.length}</div>
                      <div className="ah-hero-stat-lbl">Semesters</div>
                    </div>
                    <div className="ah-hero-stat">
                      <div className="ah-hero-stat-val">{totalCredits}</div>
                      <div className="ah-hero-stat-lbl">Total Credits</div>
                    </div>
                    <div className="ah-hero-stat">
                      <div className="ah-hero-stat-val">{student.semesters.flatMap(s => s.subjects).length}</div>
                      <div className="ah-hero-stat-lbl">Subjects</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="ah-toolbar">
              <div className="ah-toolbar-title">Academic Records</div>
              <button className="ah-btn-primary" onClick={openAddSem}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                Add Semester
              </button>
            </div>

            {/* No semesters */}
            {student.semesters.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)", border: "2px dashed var(--border)", borderRadius: "1rem", fontSize: ".88rem" }}>
                No academic records yet. Click <strong>Add Semester</strong> to get started.
              </div>
            )}

            {/* Semester cards */}
            {student.semesters.map((sem) => {
              const isOpen = openSems.has(sem.id)
              const autoGpa = calcSemGPA(sem.subjects)
              const displayGpa = sem.gpa ?? autoGpa
              const gc = gpaColor(displayGpa)
              const totalSemCr = sem.subjects.reduce((s, subj) => s + subj.credits, 0)

              return (
                <div className="ah-sem-card" key={sem.id}>
                  {/* Semester header */}
                  <div className="ah-sem-head" onClick={() => toggleSem(sem.id)}>
                    <div className="ah-sem-icon">S{sem.semesterNum}</div>
                    <div className="ah-sem-info">
                      <div className="ah-sem-title">Semester {sem.semesterNum}</div>
                      <div className="ah-sem-sub">{sem.academicYear} · {sem.subjects.length} subject{sem.subjects.length !== 1 ? "s" : ""} · {totalSemCr} credits</div>
                    </div>
                    <div className="ah-sem-gpa-badge" style={{ color: gc.color, background: gc.bg }}>
                      GPA {displayGpa !== null ? displayGpa.toFixed(2) : "—"}
                    </div>
                    <div className="ah-sem-actions" onClick={e => e.stopPropagation()}>
                      <button className="ah-btn-edit" onClick={() => openEditSem(sem)}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
                        Edit
                      </button>
                      <button className="ah-btn-danger" onClick={() => setDeleteSemId(sem.id)}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
                        Delete
                      </button>
                    </div>
                    <svg className={`ah-chevron${isOpen ? " open" : ""}`} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>

                  {/* Subject table */}
                  {isOpen && (
                    <div className="ah-subj-wrap">
                      {sem.subjects.length === 0 ? (
                        <div className="ah-empty-subj">No subjects yet.</div>
                      ) : (
                        <table className="ah-subj-table">
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Subject Name</th>
                              <th style={{ textAlign: "center" }}>Credits</th>
                              <th style={{ textAlign: "center" }}>CA Marks</th>
                              <th style={{ textAlign: "center" }}>Final Exam</th>
                              <th style={{ textAlign: "center" }}>Overall</th>
                              <th style={{ textAlign: "center" }}>Grade</th>
                              <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sem.subjects.map((subj) => {
                              const gc = gradeColor(subj.grade)
                              return (
                                <tr key={subj.id}>
                                  <td style={{ fontFamily: "monospace", fontSize: ".74rem", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{subj.subjectCode}</td>
                                  <td style={{ fontWeight: 600, minWidth: "160px" }}>{subj.subjectName}</td>
                                  <td style={{ textAlign: "center", color: "var(--muted-foreground)" }}>{subj.credits}</td>
                                  <td style={{ textAlign: "center" }}>
                                    {subj.caMarks !== null
                                      ? <span className="ah-marks-val">{subj.caMarks.toFixed(1)}</span>
                                      : <span style={{ color: "var(--muted-foreground)", fontSize: ".72rem" }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    {subj.finalMarks !== null
                                      ? <span className="ah-marks-val">{subj.finalMarks.toFixed(1)}</span>
                                      : <span style={{ color: "var(--muted-foreground)", fontSize: ".72rem" }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <span className="ah-marks-val">{subj.marks.toFixed(1)}</span>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <span className="ah-grade-badge" style={{ color: gc.color, background: gc.bg }}>{subj.grade}</span>
                                  </td>
                                  <td style={{ textAlign: "right" }}>
                                    <div style={{ display: "flex", gap: ".35rem", justifyContent: "flex-end" }}>
                                      <button className="ah-btn-edit" onClick={() => openEditSubj(subj, sem.id)}>Edit</button>
                                      <button className="ah-btn-danger" onClick={() => setDeleteSubjId(subj.id)}>Del</button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                      <div className="ah-subj-footer">
                        <span className="ah-sem-total">
                          {sem.subjects.length} subject{sem.subjects.length !== 1 ? "s" : ""} ·{" "}
                          <span>{totalSemCr} credits</span>
                          {autoGpa !== null && <> · Calculated GPA: <span>{autoGpa.toFixed(2)}</span></>}
                        </span>
                        <button className="ah-btn-primary" style={{ fontSize: ".75rem", padding: ".38rem .75rem" }} onClick={() => openAddSubj(sem.id)}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                          Add Subject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* ── Semester Modal ── */}
        {semModal && (
          <div className="ah-overlay">
            <div className="ah-modal">
              <div className="ah-modal-head">
                <span className="ah-modal-title">{semModal === "add" ? "Add Semester" : "Edit Semester"}</span>
                <button onClick={() => setSemModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex" }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="ah-modal-body">
                {semErr && <div className="ah-err">{semErr}</div>}
                <div className="ah-modal-row2">
                  <div className="ah-field">
                    <label>Semester Number *</label>
                    <select className="ah-input" value={semForm.semesterNum}
                      onChange={e => setSemForm(f => ({ ...f, semesterNum: e.target.value }))}>
                      <option value="">Select…</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                  <div className="ah-field">
                    <label>Academic Year * <span style={{ fontSize: ".65rem", color: "var(--muted-foreground)", fontWeight: 400 }}>(e.g. 2024)</span></label>
                    <input
                      className="ah-input"
                      type="number"
                      min={2000}
                      max={new Date().getFullYear()}
                      value={semForm.academicYear}
                      onChange={e => {
                        // only allow up to 4 digits
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4)
                        setSemForm(f => ({ ...f, academicYear: val }))
                      }}
                      placeholder={String(new Date().getFullYear())}
                    />
                  </div>
                </div>
              </div>
              <div className="ah-modal-footer">
                <button className="cancel" onClick={() => setSemModal(null)}>Cancel</button>
                <button className="confirm" onClick={saveSem} disabled={semSaving}>
                  {semSaving ? "Saving…" : semModal === "add" ? "Add Semester" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Subject Modal ── */}
        {subjModal && (() => {
          const ca  = subjForm.caMarks    !== "" ? Number(subjForm.caMarks)    : null
          const fin = subjForm.finalMarks !== "" ? Number(subjForm.finalMarks) : null
          const bothFilled = ca !== null && fin !== null && !isNaN(ca) && !isNaN(fin)
          const caWidth  = ca  !== null && !isNaN(ca)  ? Math.min(ca,  100) : 0
          const finWidth = fin !== null && !isNaN(fin) ? Math.min(fin, 100) : 0

          return (
            <div className="ah-overlay">
              <div className="ah-modal" style={{ maxWidth: "580px" }}>
                <div className="ah-modal-head">
                  <span className="ah-modal-title">{subjModal === "add" ? "Add Subject" : "Edit Subject"}</span>
                  <button onClick={() => setSubjModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex" }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                <div className="ah-modal-body">
                  {subjErr && <div className="ah-err">{subjErr}</div>}

                  {/* Row 1: Code + Credits */}
                  <div className="ah-modal-row2">
                    <div className="ah-field">
                      <label>Subject Code * <span style={{ fontSize: ".63rem", color: "var(--muted-foreground)", fontWeight: 400 }}>2 letters + 4 digits</span></label>
                      <input className={`ah-input${subjFieldErrors.subjectCode ? " err" : ""}`}
                        type="text" value={subjForm.subjectCode}
                        maxLength={6}
                        onChange={e => {
                          const raw = e.target.value.toUpperCase()
                          // Allow: up to 2 letters, then up to 4 digits only
                          const letters = raw.slice(0, 2).replace(/[^A-Z]/g, "")
                          const digits  = raw.slice(2).replace(/\D/g, "").slice(0, 4)
                          handleSubjFormChange("subjectCode", letters + digits)
                        }}
                        placeholder="e.g. IT1010" />
                      {subjFieldErrors.subjectCode && (
                        <div className="ah-field-err">
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                          {subjFieldErrors.subjectCode}
                        </div>
                      )}
                    </div>
                    <div className="ah-field">
                      <label>Credits (1–4) *</label>
                      <input className={`ah-input${subjFieldErrors.credits ? " err" : ""}`}
                        type="number" min={1} max={4} value={subjForm.credits}
                        onChange={e => handleSubjFormChange("credits", e.target.value)}
                        placeholder="3" />
                      {subjFieldErrors.credits && (
                        <div className="ah-field-err">
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                          {subjFieldErrors.credits}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subject Name */}
                  <div className="ah-field">
                    <label>Subject Name *</label>
                    <input className={`ah-input${subjFieldErrors.subjectName ? " err" : ""}`}
                      type="text" value={subjForm.subjectName}
                      onChange={e => handleSubjFormChange("subjectName", e.target.value)}
                      placeholder="e.g. Programming Fundamentals" />
                    {subjFieldErrors.subjectName && (
                      <div className="ah-field-err">
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                        {subjFieldErrors.subjectName}
                      </div>
                    )}
                  </div>

                  {/* Marks row: CA + Final + Overall */}
                  <div className="ah-modal-row3">
                    <div className="ah-field">
                      <label>CA Marks (0–100)</label>
                      <input className={`ah-input${subjFieldErrors.caMarks ? " err" : ""}`}
                        type="number" min={0} max={100} step={0.1} value={subjForm.caMarks}
                        onChange={e => handleSubjFormChange("caMarks", e.target.value)}
                        placeholder="e.g. 35" />
                      {subjFieldErrors.caMarks && (
                        <div className="ah-field-err">
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                          {subjFieldErrors.caMarks}
                        </div>
                      )}
                    </div>
                    <div className="ah-field">
                      <label>Final Exam (0–100)</label>
                      <input className={`ah-input${subjFieldErrors.finalMarks ? " err" : ""}`}
                        type="number" min={0} max={100} step={0.1} value={subjForm.finalMarks}
                        onChange={e => handleSubjFormChange("finalMarks", e.target.value)}
                        placeholder="e.g. 45" />
                      {subjFieldErrors.finalMarks && (
                        <div className="ah-field-err">
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                          {subjFieldErrors.finalMarks}
                        </div>
                      )}
                    </div>
                    <div className="ah-field">
                      <label>
                        Overall (0–100) *
                        {bothFilled && (
                          <span className="ah-auto-badge">
                            <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                            Auto
                          </span>
                        )}
                      </label>
                      <input
                        className={`ah-input${subjFieldErrors.marks ? " err" : ""}${bothFilled ? " readonly" : ""}`}
                        type="number" min={0} max={100} step={0.1}
                        value={subjForm.marks}
                        readOnly={bothFilled}
                        onChange={e => !bothFilled && handleSubjFormChange("marks", e.target.value)}
                        placeholder="0–100" />
                      {subjFieldErrors.marks && (
                        <div className="ah-field-err">
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                          {subjFieldErrors.marks}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Marks breakdown bar (shown when at least one mark entered) */}
                  {(ca !== null || fin !== null) && (
                    <div className="ah-marks-bar-wrap">
                      <div className="ah-marks-bar-label">
                        <span>Marks Breakdown</span>
                        {bothFilled && (
                          <span style={{ fontWeight: 900, color: "oklch(0.42 0.18 145)" }}>
                            ({ca} + {fin}) ÷ 2 = {((ca + fin) / 2).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="ah-marks-bar-track">
                        {caWidth > 0 && (
                          <div className="ah-marks-bar-ca" style={{ width: `${caWidth / 2}%` }} />
                        )}
                        {finWidth > 0 && (
                          <div className="ah-marks-bar-fin" style={{ width: `${finWidth / 2}%` }} />
                        )}
                      </div>
                      <div className="ah-marks-legend">
                        <span><span className="ah-marks-legend-dot" style={{ background: "oklch(0.55 0.2 250)" }}/> CA: {ca !== null ? ca : "—"}</span>
                        <span><span className="ah-marks-legend-dot" style={{ background: "oklch(0.55 0.18 145)" }}/> Final: {fin !== null ? fin : "—"}</span>
                        {bothFilled && <span style={{ marginLeft: "auto", fontWeight: 700, color: "oklch(0.42 0.18 145)" }}>Overall: {((ca + fin) / 2).toFixed(2)}</span>}
                      </div>
                    </div>
                  )}

                  {/* Grade — auto-set from marks, still manually overridable */}
                  <div className="ah-field">
                    <label>
                      Grade *
                      {subjForm.marks !== "" && !isNaN(Number(subjForm.marks)) && (
                        <span className="ah-auto-badge">
                          <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                          Auto · {subjForm.marks}%
                        </span>
                      )}
                    </label>
                    <select className="ah-input" value={subjForm.grade}
                      onChange={e => handleSubjFormChange("grade", e.target.value)}>
                      {GRADE_OPTIONS.map(g => (
                        <option key={g} value={g}>{g} — {GRADE_POINTS[g]?.toFixed(1)} pts ({
                          g === "A+" ? "≥ 90" : g === "A" ? "≥ 80" : g === "A-" ? "≥ 75" :
                          g === "B+" ? "≥ 70" : g === "B" ? "≥ 65" : g === "B-" ? "≥ 60" :
                          g === "C+" ? "≥ 55" : g === "C" ? "≥ 50" : g === "C-" ? "≥ 45" :
                          g === "D"  ? "≥ 40" : "< 40"
                        })</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ah-modal-footer">
                  <button className="cancel" onClick={() => setSubjModal(null)}>Cancel</button>
                  <button className="confirm" onClick={saveSubj} disabled={subjSaving}>
                    {subjSaving ? "Saving…" : subjModal === "add" ? "Add Subject" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── Delete Semester Confirm ── */}
        {deleteSemId !== null && (
          <div className="ah-overlay">
            <div className="ah-confirm">
              <h3>Delete Semester</h3>
              <p>This will permanently delete the semester and all its subject records. This cannot be undone.</p>
              <div className="ah-confirm-btns">
                <button style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }} onClick={() => setDeleteSemId(null)}>Cancel</button>
                <button style={{ background: "oklch(0.48 0.22 25)", color: "#fff" }} onClick={() => deleteSem(deleteSemId)}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Subject Confirm ── */}
        {deleteSubjId !== null && (
          <div className="ah-overlay">
            <div className="ah-confirm">
              <h3>Delete Subject</h3>
              <p>Remove this subject result? This action cannot be undone.</p>
              <div className="ah-confirm-btns">
                <button style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }} onClick={() => setDeleteSubjId(null)}>Cancel</button>
                <button style={{ background: "oklch(0.48 0.22 25)", color: "#fff" }} onClick={() => deleteSubj(deleteSubjId)}>Delete</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
