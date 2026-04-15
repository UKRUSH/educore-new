"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { label: "Overview",  href: "/profile" },
  { label: "Academics", href: "/profile/academics" },
  { label: "Clubs",     href: "/profile/clubs" },
  { label: "Sports",    href: "/profile/sports" },
  { label: "Progress",  href: "/profile/progress" },
]

const ACHIEVEMENT_TYPES = ["TROPHY", "MEDAL", "CERTIFICATE"] as const
const TYPE_ICON: Record<string, string> = { TROPHY: "🏆", MEDAL: "🥇", CERTIFICATE: "📜" }
const TYPE_STYLE: Record<string, { bg: string; fg: string }> = {
  TROPHY:      { bg: "oklch(0.97 0.08 80)",  fg: "oklch(0.48 0.2 80)"  },
  MEDAL:       { bg: "oklch(0.96 0.02 250)", fg: "oklch(0.42 0.06 250)" },
  CERTIFICATE: { bg: "oklch(0.94 0.05 240)", fg: "oklch(0.42 0.18 240)" },
}

type Achievement = {
  id: number; sportName: string; achievementType: string
  position: string | null; date: string; points: number
  fileAsset?: { fileUrl: string } | null
}

type BatchCert = {
  id: string
  file: File
  preview: string
  status: "pending" | "scanning" | "saved" | "failed"
  message: string
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const VALID_ACHIEVEMENT_TYPES = new Set(["TROPHY", "MEDAL", "CERTIFICATE"])
const CLIENT_SCAN_TIMEOUT_MS = 45000

const EMPTY_FORM = { sportName: "", achievementType: "TROPHY", position: "", date: "", points: "0.5", eventName: "" }

// Marks scale used for display
const MARKS_LEGEND = [
  { label: "1st Place",     marks: 3,   color: "oklch(0.55 0.22 55)",  bg: "oklch(0.97 0.06 55)" },
  { label: "2nd Place",     marks: 2,   color: "oklch(0.42 0.06 250)", bg: "oklch(0.96 0.02 250)" },
  { label: "3rd Place",     marks: 1,   color: "oklch(0.45 0.2 25)",   bg: "oklch(0.97 0.04 25)"  },
  { label: "Participation", marks: 0.5, color: "oklch(0.45 0.18 145)", bg: "oklch(0.95 0.04 145)" },
]

const CSS = `
.sp-wrap { max-width: 900px; margin: 0 auto; }

.sp-hero {
  background: linear-gradient(135deg, oklch(0.24 0.1 145) 0%, oklch(0.2 0.12 155) 100%);
  border-radius: 1rem; padding: 1.5rem 1.75rem;
  position: relative; overflow: hidden; margin-bottom: 1.5rem;
}
.sp-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}
.sp-hero-title { color: #fff; font-size: 1.35rem; font-weight: 700; margin: 0 0 .25rem; }
.sp-hero-sub { color: oklch(0.8 0.05 145); font-size: .875rem; margin: 0; }
.sp-hero-add {
  position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; gap: .45rem;
  background: rgba(255,255,255,0.12); color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: .55rem 1.1rem; border-radius: .65rem;
  font-size: .8rem; font-weight: 600; cursor: pointer;
  backdrop-filter: blur(8px); transition: background .2s;
}
.sp-hero-add:hover { background: rgba(255,255,255,0.22); }

.sp-tabs {
  display: flex; gap: .35rem; margin-bottom: 1.5rem;
  background: var(--card); border: 1px solid var(--border);
  border-radius: .75rem; padding: .35rem; overflow-x: auto;
}
.sp-tab {
  flex-shrink: 0; padding: .45rem 1rem; border-radius: .5rem;
  font-size: .8rem; font-weight: 500; color: var(--muted-foreground);
  text-decoration: none; transition: all .2s; white-space: nowrap;
}
.sp-tab:hover { color: var(--foreground); background: var(--accent); }
.sp-tab.active {
  background: linear-gradient(135deg, oklch(0.45 0.2 145), oklch(0.38 0.22 155));
  color: #fff; font-weight: 600;
  box-shadow: 0 2px 8px oklch(0.45 0.2 145 / 0.4);
}

/* Score card */
.sp-score-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; padding: 1.25rem 1.5rem;
  display: flex; align-items: center; gap: 1.25rem;
  margin-bottom: 1.5rem; position: relative; overflow: hidden;
}
.sp-score-card::before {
  content: ''; position: absolute; right: -1rem; top: -1rem;
  width: 8rem; height: 8rem; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.55 0.18 145 / 0.12), transparent 70%);
  pointer-events: none;
}
.sp-score-icon {
  width: 3.5rem; height: 3.5rem; border-radius: 50%;
  background: linear-gradient(135deg, oklch(0.88 0.1 145), oklch(0.82 0.12 155));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; flex-shrink: 0;
}
.sp-score-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted-foreground); }
.sp-score-val { font-size: 2.25rem; font-weight: 800; color: var(--foreground); line-height: 1; }
.sp-score-unit { font-size: .875rem; font-weight: 400; color: var(--muted-foreground); }
.sp-score-meta { font-size: .75rem; color: var(--muted-foreground); margin-top: .25rem; }
.sp-score-bar-wrap { flex: 1; display: none; }
@media (min-width: 640px) { .sp-score-bar-wrap { display: block; } }
.sp-score-track { height: .5rem; background: var(--muted); border-radius: 9999px; overflow: hidden; }
.sp-score-fill { height: 100%; border-radius: 9999px; background: linear-gradient(90deg, oklch(0.55 0.22 145), oklch(0.45 0.2 155)); transition: width .6s ease; }
.sp-score-pct { font-size: .72rem; color: var(--muted-foreground); text-align: right; margin-top: .3rem; }

/* Add form */
.sp-form-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; overflow: hidden; margin-bottom: 1.5rem;
  divide-y: 1px solid var(--border);
}
.sp-section { padding: 1.25rem 1.5rem; }
.sp-section + .sp-section { border-top: 1px solid var(--border); }
.sp-section-head { display: flex; align-items: center; gap: .65rem; margin-bottom: .75rem; }
.sp-step {
  width: 1.5rem; height: 1.5rem; border-radius: 50%;
  background: linear-gradient(135deg, oklch(0.55 0.22 145), oklch(0.45 0.2 155));
  color: #fff; font-size: .72rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.sp-section-title { font-size: .875rem; font-weight: 700; color: var(--foreground); }
.sp-section-desc { font-size: .78rem; color: var(--muted-foreground); margin-bottom: 1rem; }

.sp-dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .75rem;
  border: 2px dashed var(--border); border-radius: .85rem; padding: 2.5rem 1rem;
  cursor: pointer; transition: border-color .2s, background .2s;
}
.sp-dropzone:hover { border-color: oklch(0.55 0.2 145 / 0.6); background: oklch(0.55 0.2 145 / 0.04); }
.sp-dropzone-icon { color: var(--muted-foreground); }
.sp-dropzone-text { font-size: .85rem; font-weight: 600; color: var(--foreground); }
.sp-dropzone-sub { font-size: .75rem; color: var(--muted-foreground); }

.sp-preview-row { display: flex; flex-direction: column; gap: 1rem; }
@media (min-width: 640px) { .sp-preview-row { flex-direction: row; } }
.sp-img-wrap { position: relative; flex-shrink: 0; }
.sp-cert-img {
  height: 10rem; width: auto; max-width: 12rem; border-radius: .6rem;
  border: 1px solid var(--border); object-fit: contain; background: var(--muted);
}
.sp-img-remove {
  position: absolute; top: -.4rem; right: -.4rem;
  width: 1.5rem; height: 1.5rem; border-radius: 50%;
  background: oklch(0.55 0.22 25); color: #fff;
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.2);
}
.sp-scan-col { display: flex; flex-direction: column; justify-content: center; gap: .75rem; }
.sp-filename { font-size: .75rem; color: var(--muted-foreground); max-width: 14rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-scan-btn {
  display: inline-flex; align-items: center; gap: .45rem;
  background: linear-gradient(135deg, oklch(0.55 0.22 145), oklch(0.45 0.2 155));
  color: #fff; border: none; border-radius: .6rem;
  padding: .55rem 1.1rem; font-size: .8rem; font-weight: 600;
  cursor: pointer; transition: opacity .2s; width: fit-content;
}
.sp-scan-btn:hover { opacity: .88; }
.sp-scan-btn:disabled { opacity: .55; cursor: not-allowed; }
.sp-scan-msg { font-size: .75rem; }
.sp-scan-ok { color: oklch(0.45 0.18 145); }
.sp-scan-err { color: oklch(0.5 0.22 25); }

.sp-bulk-box {
  margin-top: 1rem;
  border: 1px solid var(--border);
  border-radius: .8rem;
  padding: .95rem;
  background: var(--background);
}
.sp-bulk-title { font-size: .8rem; font-weight: 700; color: var(--foreground); margin: 0 0 .25rem; }
.sp-bulk-sub { font-size: .74rem; color: var(--muted-foreground); margin: 0 0 .8rem; }
.sp-bulk-actions { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.sp-bulk-pick {
  display: inline-flex; align-items: center; gap: .45rem;
  border: 1px solid var(--border); border-radius: .55rem;
  padding: .45rem .8rem; font-size: .78rem; font-weight: 600;
  background: var(--card); color: var(--foreground); cursor: pointer;
}
.sp-bulk-list { margin-top: .75rem; display: flex; flex-direction: column; gap: .5rem; }
.sp-bulk-item {
  display: flex; align-items: center; gap: .65rem;
  border: 1px solid var(--border); border-radius: .55rem;
  padding: .45rem .6rem; background: var(--card);
}
.sp-bulk-thumb {
  width: 2.2rem; height: 2.2rem; border-radius: .35rem;
  object-fit: cover; border: 1px solid var(--border); background: var(--muted);
}
.sp-bulk-name {
  flex: 1; min-width: 0; font-size: .75rem; color: var(--foreground);
  white-space: nowrap; text-overflow: ellipsis; overflow: hidden;
}
.sp-bulk-state { font-size: .7rem; font-weight: 700; }
.sp-bulk-state.pending { color: var(--muted-foreground); }
.sp-bulk-state.scanning { color: oklch(0.44 0.18 240); }
.sp-bulk-state.saved { color: oklch(0.45 0.18 145); }
.sp-bulk-state.failed { color: oklch(0.55 0.22 25); }
.sp-bulk-msg { margin-top: .7rem; font-size: .74rem; }
.sp-bulk-msg.ok { color: oklch(0.45 0.18 145); }
.sp-bulk-msg.err { color: oklch(0.55 0.22 25); }

.sp-form-grid { display: grid; grid-template-columns: 1fr; gap: .85rem; }
@media (min-width: 640px) { .sp-form-grid { grid-template-columns: repeat(2, 1fr); } }
.sp-field-label { font-size: .72rem; font-weight: 600; color: var(--muted-foreground); margin-bottom: .4rem; display: block; }
.sp-req { color: oklch(0.55 0.22 25); }
.sp-input {
  width: 100%; border: 1px solid var(--border); background: var(--background);
  border-radius: .55rem; padding: .5rem .75rem; font-size: .83rem;
  color: var(--foreground); outline: none; transition: border-color .2s, box-shadow .2s;
  box-sizing: border-box;
}
.sp-input:focus { border-color: oklch(0.55 0.22 145); box-shadow: 0 0 0 3px oklch(0.55 0.22 145 / 0.15); }
.sp-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .5rem center; background-size: 1rem; padding-right: 2rem; }

.sp-form-actions { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; gap: .5rem; }
.sp-btn-primary {
  display: inline-flex; align-items: center; gap: .4rem;
  background: linear-gradient(135deg, oklch(0.55 0.22 145), oklch(0.45 0.2 155));
  color: #fff; border: none; border-radius: .6rem;
  padding: .55rem 1.25rem; font-size: .83rem; font-weight: 600;
  cursor: pointer; transition: opacity .2s;
}
.sp-btn-primary:hover { opacity: .88; }
.sp-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
.sp-btn-ghost {
  display: inline-flex; align-items: center;
  background: transparent; color: var(--muted-foreground);
  border: 1px solid var(--border); border-radius: .6rem;
  padding: .55rem 1.25rem; font-size: .83rem; font-weight: 500;
  cursor: pointer; transition: background .15s;
}
.sp-btn-ghost:hover { background: var(--accent); color: var(--foreground); }

/* Achievement grid */
.sp-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 640px) { .sp-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 900px) { .sp-grid { grid-template-columns: repeat(3, 1fr); } }

.sp-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; overflow: hidden; display: flex; flex-direction: column;
  transition: box-shadow .2s, border-color .2s;
}
.sp-card:hover { border-color: oklch(0.6 0.18 145 / 0.35); box-shadow: 0 4px 18px oklch(0.5 0.18 145 / 0.1); }
.sp-cert-preview { height: 9rem; background: var(--muted); overflow: hidden; }
.sp-cert-preview img { width: 100%; height: 100%; object-fit: contain; }
.sp-card-body { padding: 1rem; display: flex; flex-direction: column; gap: .75rem; flex: 1; }
.sp-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
.sp-card-left { display: flex; align-items: center; gap: .65rem; }
.sp-type-icon { font-size: 1.5rem; line-height: 1; }
.sp-sport-name { font-weight: 700; font-size: .875rem; color: var(--foreground); line-height: 1.2; }
.sp-type-badge {
  display: inline-block; font-size: .68rem; font-weight: 600;
  padding: .15rem .5rem; border-radius: .35rem; margin-top: .3rem;
}
.sp-card-actions { display: flex; gap: .2rem; flex-shrink: 0; }
.sp-icon-btn {
  padding: .35rem; border-radius: .4rem; border: none; background: transparent;
  color: var(--muted-foreground); cursor: pointer; display: flex; align-items: center;
  transition: background .15s, color .15s;
}
.sp-icon-btn:hover { background: var(--accent); color: var(--foreground); }
.sp-icon-btn.del:hover { background: oklch(0.95 0.05 25); color: oklch(0.55 0.22 25); }

.sp-card-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: .5rem; border-top: 1px solid var(--border); padding-top: .65rem; margin-top: auto; }
.sp-stat-label { font-size: .68rem; color: var(--muted-foreground); }
.sp-stat-val { font-size: .8rem; font-weight: 700; color: var(--foreground); margin-top: .1rem; }
.sp-stat-pts { color: oklch(0.45 0.2 145); }

/* Empty */
.sp-empty { text-align: center; padding: 4rem 1rem; color: var(--muted-foreground); }
.sp-empty-icon { font-size: 2.75rem; margin-bottom: .75rem; }

/* Marks legend */
.sp-marks-legend {
  display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .65rem;
}
.sp-marks-pill {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .28rem .75rem; border-radius: 999px;
  font-size: .72rem; font-weight: 700; border: 1px solid transparent;
}
.sp-marks-val {
  font-size: .78rem; font-weight: 900;
}

/* Scan result highlight */
.sp-scan-result {
  display: flex; align-items: center; gap: .65rem;
  padding: .65rem .9rem; border-radius: .7rem;
  background: oklch(0.93 0.06 145 / .5); border: 1px solid oklch(0.78 0.12 145 / .5);
  font-size: .78rem; color: oklch(0.38 0.18 145); font-weight: 600;
}
.sp-scan-marks-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0;
  font-size: .9rem; font-weight: 900; color: #fff;
  background: linear-gradient(135deg, oklch(0.45 0.2 145), oklch(0.38 0.22 155));
}

/* Error */
.sp-err {
  background: oklch(0.97 0.05 25 / 0.5); border: 1px solid oklch(0.85 0.1 25);
  border-radius: .65rem; padding: .75rem 1rem; font-size: .82rem;
  color: oklch(0.5 0.2 25); margin-bottom: 1rem;
}

/* Modal */
.sp-modal-bg {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem; background: rgba(0,0,0,.55);
  backdrop-filter: blur(4px);
}
.sp-modal {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; width: 100%; max-width: 26rem;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  animation: spModalIn .2s ease;
}
@keyframes spModalIn {
  from { opacity: 0; transform: scale(.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.sp-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.4rem; border-bottom: 1px solid var(--border);
}
.sp-modal-title { font-weight: 700; color: var(--foreground); font-size: .95rem; }
.sp-modal-close {
  padding: .3rem; border-radius: .4rem; border: none; background: transparent;
  color: var(--muted-foreground); cursor: pointer;
}
.sp-modal-close:hover { background: var(--accent); color: var(--foreground); }
.sp-modal-body { padding: 1.4rem; display: flex; flex-direction: column; gap: .85rem; }
.sp-modal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .85rem; }
.sp-modal-actions { display: flex; gap: .5rem; padding-top: .35rem; }
`

export default function SportsPage() {
  const pathname = usePathname()
  const fileRef = useRef<HTMLInputElement>(null)
  const bulkFileRef = useRef<HTMLInputElement>(null)

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  const [certFile, setCertFile] = useState<File | null>(null)
  const [certPreview, setCertPreview] = useState<string | null>(null)
  const [certUrl, setCertUrl] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState("")
  const [scanMarks, setScanMarks] = useState<number | null>(null)

  const [batchCerts, setBatchCerts] = useState<BatchCert[]>([])
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchMsg, setBatchMsg] = useState("")

  const [editEntry, setEditEntry] = useState<Achievement | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/profile/sports")
    if (res.ok) setAchievements(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const totalPoints = achievements.reduce((s, a) => s + a.points, 0)
  const sportsScore = Math.min(totalPoints, 100)

  function setBatchStatus(id: string, status: BatchCert["status"], message: string) {
    setBatchCerts((prev) => prev.map((c) => (c.id === id ? { ...c, status, message } : c)))
  }

  function resizeForScan(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round((height * MAX) / width)
            width = MAX
          } else {
            width = Math.round((width * MAX) / height)
            height = MAX
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl)
          if (!blob) {
            reject(new Error("Failed to resize image"))
            return
          }
          resolve(new File([blob], file.name, { type: "image/jpeg" }))
        }, "image/jpeg", 0.82)
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error("Invalid image file"))
      }

      img.src = objectUrl
    })
  }

  function normalizeAchievementType(value: unknown): string {
    const raw = typeof value === "string" ? value.trim().toUpperCase() : ""
    if (!raw) return "CERTIFICATE"
    if (VALID_ACHIEVEMENT_TYPES.has(raw)) return raw
    if (raw.includes("MEDAL")) return "MEDAL"
    if (raw.includes("TROPHY") || raw.includes("CUP")) return "TROPHY"
    return "CERTIFICATE"
  }

  function normalizeDate(value: unknown): string {
    const today = new Date().toISOString().split("T")[0]
    if (typeof value !== "string") return today

    const v = value.trim()
    if (!v || v.toLowerCase() === "null" || v.toLowerCase() === "n/a") return today
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v

    const dmy = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
    if (dmy) {
      const dd = dmy[1].padStart(2, "0")
      const mm = dmy[2].padStart(2, "0")
      return `${dmy[3]}-${mm}-${dd}`
    }

    const parsed = new Date(v)
    return Number.isNaN(parsed.getTime()) ? today : parsed.toISOString().split("T")[0]
  }

  function normalizePoints(value: unknown, position: string | null): number {
    const points = Number(value)
    if ([3, 2, 1, 0.5].includes(points)) return points
    const pos = (position ?? "").toLowerCase()
    if (/1st|first|champion|gold|winner/.test(pos)) return 3
    if (/2nd|second|runner.?up|silver/.test(pos)) return 2
    if (/3rd|third|bronze/.test(pos)) return 1
    return 0.5
  }

  function fallbackSportName(fileName: string): string {
    const cleaned = fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    return cleaned || "Sports Achievement"
  }

  async function fetchJsonWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { ...init, signal: controller.signal })
      const payload = await response.json().catch(() => ({}))
      return { response, payload }
    } finally {
      clearTimeout(timer)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    resizeForScan(f)
      .then((resized) => {
        setCertFile(resized)
        setCertPreview(URL.createObjectURL(resized))
        setCertUrl(null)
        setScanMsg("")
        setScanMarks(null)
      })
      .catch(() => setFormError("Invalid certificate image."))
  }

  async function handleBatchFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setBatchMsg("")
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setBatchMsg(`Unsupported file type: ${file.name}. Use JPG, PNG, or WebP.`)
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setBatchMsg(`${file.name} is larger than 5 MB.`)
        continue
      }
      try {
        const resized = await resizeForScan(file)
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        setBatchCerts((prev) => [
          ...prev,
          {
            id,
            file: resized,
            preview: URL.createObjectURL(resized),
            status: "pending",
            message: "Ready",
          },
        ])
      } catch {
        setBatchMsg(`Failed to process: ${file.name}`)
      }
    }

    if (bulkFileRef.current) bulkFileRef.current.value = ""
  }

  function removeBatchCert(id: string) {
    setBatchCerts((prev) => {
      const target = prev.find((c) => c.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((c) => c.id !== id)
    })
  }

  function clearBatchCerts() {
    setBatchCerts((prev) => {
      prev.forEach((c) => URL.revokeObjectURL(c.preview))
      return []
    })
    setBatchMsg("")
  }

  async function scanAndAddBatch() {
    const queue = batchCerts.filter((c) => c.status === "pending" || c.status === "failed")
    if (!queue.length) {
      setBatchMsg("No pending certificates to process.")
      return
    }

    setBatchSaving(true)
    setBatchMsg("")

    let savedCount = 0
    const created: Achievement[] = []

    for (const cert of queue) {
      setBatchStatus(cert.id, "scanning", "Scanning certificate...")

      const fd = new FormData()
      fd.append("image", cert.file)

      try {
        const { response: scanRes, payload: scanData } = await fetchJsonWithTimeout(
          "/api/profile/sports/scan",
          { method: "POST", body: fd },
          CLIENT_SCAN_TIMEOUT_MS,
        )

        if (!scanRes.ok) {
          setBatchStatus(cert.id, "failed", scanData.error ?? "Scan failed")
          continue
        }

        const position = typeof scanData.position === "string" && scanData.position.trim()
          ? scanData.position.trim()
          : null
        const sportName =
          (typeof scanData.sportName === "string" && scanData.sportName.trim()) ||
          (typeof scanData.eventName === "string" && scanData.eventName.trim()) ||
          fallbackSportName(cert.file.name)
        const achievementType = normalizeAchievementType(scanData.achievementType)
        const normalizedDate = normalizeDate(scanData.date)
        const points = normalizePoints(scanData.points, position)

        const saveRes = await fetch("/api/profile/sports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sportName,
            achievementType,
            position,
            date: normalizedDate,
            points,
            certificateUrl: scanData.fileUrl,
            certificateFileName: cert.file.name,
          }),
        })

        const saveData = await saveRes.json()
        if (!saveRes.ok) {
          setBatchStatus(cert.id, "failed", saveData.error ?? "Failed to save")
          continue
        }

        created.push(saveData as Achievement)
        savedCount += 1
        setBatchStatus(cert.id, "saved", "Saved")
      } catch (error) {
        const msg = error instanceof Error && error.name === "AbortError"
          ? "Scan timed out"
          : "Unexpected error"
        setBatchStatus(cert.id, "failed", msg)
      }
    }

    if (created.length) setAchievements((prev) => [...created, ...prev])
    const failedCount = queue.length - savedCount
    setBatchMsg(
      failedCount === 0
        ? `Added ${savedCount} achievement${savedCount !== 1 ? "s" : ""} from certificates.`
        : `Added ${savedCount} achievement${savedCount !== 1 ? "s" : ""}. ${failedCount} failed.`
    )
    setBatchSaving(false)
  }

  function removeCert() {
    setCertFile(null); setCertPreview(null); setCertUrl(null); setScanMsg(""); setScanMarks(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function scanCertificate() {
    if (!certFile) return
    setScanning(true); setScanMsg(""); setScanMarks(null); setFormError("")
    const fd = new FormData()
    fd.append("image", certFile)
    try {
      const { response: res, payload: data } = await fetchJsonWithTimeout(
        "/api/profile/sports/scan",
        { method: "POST", body: fd },
        CLIENT_SCAN_TIMEOUT_MS,
      )
      if (!res.ok) { setScanMsg(data.error ?? "Scan failed."); if (data.fileUrl) setCertUrl(data.fileUrl); return }
      const marks = data.points ?? 0.5
      setForm((prev) => ({
        ...prev,
        sportName:       data.sportName       ?? prev.sportName,
        achievementType: data.achievementType  ?? prev.achievementType,
        position:        data.position        ?? prev.position,
        date:            data.date            ?? prev.date,
        points:          String(marks),
        eventName:       data.eventName       ?? prev.eventName,
      }))
      setCertUrl(data.fileUrl)
      setScanMarks(marks)
      setScanMsg("Certificate scanned — fields auto-filled. Review before saving.")
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setScanMsg("Scan timed out. Please try again with a clearer image.")
      } else {
        setScanMsg("Scan error. Please fill in details manually.")
      }
    }
    finally { setScanning(false) }
  }

  async function addAchievement() {
    if (!form.sportName || !form.date) { setFormError("Sport name and date are required."); return }
    setSaving(true); setFormError("")
    const res = await fetch("/api/profile/sports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sportName: form.sportName, achievementType: form.achievementType,
        position: form.position || null, date: form.date, points: Number(form.points),
        certificateUrl: certUrl, certificateFileName: certFile?.name,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error ?? "Failed to add."); setSaving(false); return }
    setAchievements((prev) => [data, ...prev])
    setForm(EMPTY_FORM); removeCert(); setShowForm(false); setSaving(false)
  }

  async function updateAchievement() {
    if (!editEntry) return
    setEditSaving(true)
    const res = await fetch(`/api/profile/sports/${editEntry.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sportName: editEntry.sportName, achievementType: editEntry.achievementType, position: editEntry.position, date: editEntry.date, points: editEntry.points }),
    })
    const data = await res.json()
    if (res.ok) setAchievements((prev) => prev.map((a) => (a.id === data.id ? data : a)))
    else setPageError(data.error ?? "Failed to update.")
    setEditEntry(null); setEditSaving(false)
  }

  async function deleteAchievement(id: number) {
    if (!confirm("Delete this achievement?")) return
    const res = await fetch(`/api/profile/sports/${id}`, { method: "DELETE" })
    if (res.ok) setAchievements((prev) => prev.filter((a) => a.id !== id))
    else setPageError("Failed to delete.")
  }

  return (
    <div className="sp-wrap">
      <style>{CSS}</style>

      {/* Hero */}
      <div className="sp-hero">
        <h1 className="sp-hero-title">Sports Achievements</h1>
        <p className="sp-hero-sub">Record trophies, medals, and certificates. Upload one or more certificates to auto-scan.</p>
        {!showForm && (
          <button className="sp-hero-add" onClick={() => { setShowForm(true); setFormError("") }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Achievement
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="sp-tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`sp-tab${pathname === t.href ? " active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* Score card */}
      <div className="sp-score-card">
        <div className="sp-score-icon">🏃</div>
        <div>
          <p className="sp-score-label">Sports Score</p>
          <p className="sp-score-val">{sportsScore}<span className="sp-score-unit"> / 100</span></p>
          <p className="sp-score-meta">{achievements.length} achievement{achievements.length !== 1 ? "s" : ""} · {totalPoints} total marks</p>
        </div>
        <div className="sp-score-bar-wrap">
          <div className="sp-score-track">
            <div className="sp-score-fill" style={{ width: `${sportsScore}%` }} />
          </div>
          <p className="sp-score-pct">{sportsScore}%</p>
        </div>
      </div>

      {pageError && <div className="sp-err">{pageError}</div>}

      {/* Add form */}
      {showForm && (
        <div className="sp-form-card" style={{ marginBottom: "1.5rem" }}>
          {/* Step 1 — Upload */}
          <div className="sp-section">
            <div className="sp-section-head">
              <span className="sp-step">1</span>
              <h3 className="sp-section-title">Upload Certificate(s) (optional)</h3>
            </div>
            <p className="sp-section-desc">Upload one or more certificate photos. AI can auto-fill details and marks from each certificate.</p>
            <div className="sp-marks-legend">
              {MARKS_LEGEND.map((m) => (
                <span key={m.label} className="sp-marks-pill" style={{ background: m.bg, color: m.color, borderColor: m.color + "44" }}>
                  <span className="sp-marks-val">{m.marks}</span> {m.label}
                </span>
              ))}
            </div>

            <div className="sp-bulk-box">
              <p className="sp-bulk-title">Bulk Add Certificates</p>
              <p className="sp-bulk-sub">Select one or more certificates to auto-fill details and add all as achievements.</p>
              <div className="sp-bulk-actions">
                <label className="sp-bulk-pick">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Select Certificates
                  <input ref={bulkFileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleBatchFileChange} />
                </label>
                <button type="button" className="sp-btn-primary" disabled={batchSaving || batchCerts.length === 0} onClick={scanAndAddBatch}>
                  {batchSaving ? "Auto Filling..." : "Auto Fill & Add All"}
                </button>
                {batchCerts.length > 0 && (
                  <button type="button" className="sp-btn-ghost" onClick={clearBatchCerts} disabled={batchSaving}>Clear</button>
                )}
              </div>

              {batchCerts.length > 0 && (
                <div className="sp-bulk-list">
                  {batchCerts.map((cert) => (
                    <div key={cert.id} className="sp-bulk-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cert.preview} alt="Certificate preview" className="sp-bulk-thumb" />
                      <span className="sp-bulk-name" title={cert.file.name}>{cert.file.name}</span>
                      <span className={`sp-bulk-state ${cert.status}`}>{cert.message}</span>
                      {cert.status !== "scanning" && cert.status !== "saved" && (
                        <button type="button" className="sp-icon-btn del" onClick={() => removeBatchCert(cert.id)}>
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {batchMsg && (
                <p className={`sp-bulk-msg ${batchMsg.includes("failed") ? "err" : "ok"}`}>{batchMsg}</p>
              )}
            </div>

            {!certPreview ? (
              <label className="sp-dropzone">
                <svg className="sp-dropzone-icon" width="40" height="40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="sp-dropzone-text">Click to upload certificate</span>
                <span className="sp-dropzone-sub">JPG, PNG or WebP · max 5 MB</span>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleFileChange} />
              </label>
            ) : (
              <div className="sp-preview-row">
                <div className="sp-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={certPreview} alt="Certificate preview" className="sp-cert-img" />
                  <button type="button" className="sp-img-remove" onClick={removeCert}>
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="sp-scan-col">
                  <p className="sp-filename">{certFile?.name}</p>
                  <button type="button" className="sp-scan-btn" onClick={scanCertificate} disabled={scanning}>
                    {scanning ? (
                      <>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="animate-spin">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: .25 }} />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" style={{ opacity: .75 }} />
                        </svg>
                        Scanning…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Scan Certificate
                      </>
                    )}
                  </button>
                  {scanMarks !== null && (
                    <div className="sp-scan-result">
                      <span className="sp-scan-marks-badge">{scanMarks}</span>
                      <span>
                        <strong>{scanMarks === 3 ? "1st Place" : scanMarks === 2 ? "2nd Place" : scanMarks === 1 ? "3rd Place" : "Participation"}</strong>
                        {" "}detected — <strong>{scanMarks} mark{scanMarks !== 1 ? "s" : ""}</strong> awarded
                      </span>
                    </div>
                  )}
                  {scanMsg && !scanMarks && (
                    <p className={`sp-scan-msg ${scanMsg.includes("auto-filled") ? "sp-scan-ok" : "sp-scan-err"}`}>{scanMsg}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2 — Details */}
          <div className="sp-section">
            <div className="sp-section-head">
              <span className="sp-step">2</span>
              <h3 className="sp-section-title">Achievement Details</h3>
            </div>
            {formError && <div className="sp-err" style={{ marginBottom: ".75rem" }}>{formError}</div>}
            <div className="sp-form-grid">
              <div>
                <label className="sp-field-label">Sport / Event Name <span className="sp-req">*</span></label>
                <input className="sp-input" placeholder="e.g. Badminton" value={form.sportName}
                  onChange={(e) => setForm((p) => ({ ...p, sportName: e.target.value }))} />
              </div>
              <div>
                <label className="sp-field-label">Achievement Type</label>
                <select className="sp-input sp-select" value={form.achievementType}
                  onChange={(e) => setForm((p) => ({ ...p, achievementType: e.target.value }))}>
                  {ACHIEVEMENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_ICON[t]} {t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="sp-field-label">Position / Place</label>
                <input className="sp-input" placeholder="e.g. 1st, Champion, Runner-up" value={form.position}
                  onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} />
              </div>
              <div>
                <label className="sp-field-label">Date <span className="sp-req">*</span></label>
                <input className="sp-input" type="date" value={form.date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="sp-field-label">Marks Awarded</label>
                <select className="sp-input sp-select" value={form.points}
                  onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}>
                  <option value="3">3 — 1st Place / Champion</option>
                  <option value="2">2 — 2nd Place / Runner-up</option>
                  <option value="1">1 — 3rd Place</option>
                  <option value="0.5">0.5 — Participation</option>
                </select>
              </div>
              <div>
                <label className="sp-field-label">Competition / Event Name</label>
                <input className="sp-input" placeholder="e.g. Inter-university Games 2024" value={form.eventName}
                  onChange={(e) => setForm((p) => ({ ...p, eventName: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="sp-form-actions">
            <button className="sp-btn-primary" onClick={addAchievement} disabled={saving}>{saving ? "Saving…" : "Add Achievement"}</button>
            <button className="sp-btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); removeCert(); setFormError("") }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Achievement list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)", fontSize: ".875rem" }}>Loading…</div>
      ) : achievements.length === 0 ? (
        <div className="sp-empty">
          <div className="sp-empty-icon">🏆</div>
          <p style={{ fontWeight: 600, marginBottom: ".25rem" }}>No achievements recorded yet.</p>
          <p style={{ fontSize: ".82rem" }}>Upload a certificate or add your sports achievements to boost your score.</p>
        </div>
      ) : (
        <div className="sp-grid">
          {achievements.map((ach) => {
            const ts = TYPE_STYLE[ach.achievementType] ?? TYPE_STYLE.TROPHY
            return (
              <div key={ach.id} className="sp-card">
                {ach.fileAsset?.fileUrl && (
                  <div className="sp-cert-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ach.fileAsset.fileUrl} alt="Certificate" />
                  </div>
                )}
                <div className="sp-card-body">
                  <div className="sp-card-top">
                    <div className="sp-card-left">
                      <span className="sp-type-icon">{TYPE_ICON[ach.achievementType] ?? "🏅"}</span>
                      <div>
                        <p className="sp-sport-name">{ach.sportName}</p>
                        <span className="sp-type-badge" style={{ background: ts.bg, color: ts.fg }}>
                          {ach.achievementType.charAt(0) + ach.achievementType.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <div className="sp-card-actions">
                      <button className="sp-icon-btn" onClick={() => setEditEntry({ ...ach })}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button className="sp-icon-btn del" onClick={() => deleteAchievement(ach.id)}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="sp-card-stats">
                    {ach.position && (
                      <div>
                        <p className="sp-stat-label">Position</p>
                        <p className="sp-stat-val">{ach.position}</p>
                      </div>
                    )}
                    <div>
                      <p className="sp-stat-label">Points</p>
                      <p className="sp-stat-val sp-stat-pts">+{ach.points} marks</p>
                    </div>
                    <div className={ach.position ? "" : "col-span-2"}>
                      <p className="sp-stat-label">Date</p>
                      <p className="sp-stat-val">{new Date(ach.date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editEntry && (
        <div className="sp-modal-bg">
          <div className="sp-modal">
            <div className="sp-modal-head">
              <span className="sp-modal-title">Edit Achievement</span>
              <button className="sp-modal-close" onClick={() => setEditEntry(null)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="sp-modal-body">
              <div className="sp-modal-grid">
                <div>
                  <label className="sp-field-label">Sport Name</label>
                  <input className="sp-input" value={editEntry.sportName}
                    onChange={(e) => setEditEntry((p) => p ? { ...p, sportName: e.target.value } : null)} />
                </div>
                <div>
                  <label className="sp-field-label">Type</label>
                  <select className="sp-input sp-select" value={editEntry.achievementType}
                    onChange={(e) => setEditEntry((p) => p ? { ...p, achievementType: e.target.value } : null)}>
                    {ACHIEVEMENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_ICON[t]} {t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="sp-field-label">Position</label>
                  <input className="sp-input" value={editEntry.position ?? ""}
                    onChange={(e) => setEditEntry((p) => p ? { ...p, position: e.target.value || null } : null)} />
                </div>
                <div>
                  <label className="sp-field-label">Marks</label>
                  <select className="sp-input sp-select" value={editEntry.points}
                    onChange={(e) => setEditEntry((p) => p ? { ...p, points: Number(e.target.value) } : null)}>
                    <option value={3}>3 — 1st Place</option>
                    <option value={2}>2 — 2nd Place</option>
                    <option value={1}>1 — 3rd Place</option>
                    <option value={0.5}>0.5 — Participation</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="sp-field-label">Date</label>
                <input className="sp-input" type="date" value={new Date(editEntry.date).toISOString().split("T")[0]}
                  onChange={(e) => setEditEntry((p) => p ? { ...p, date: e.target.value } : null)} />
              </div>
              <div className="sp-modal-actions">
                <button className="sp-btn-primary" onClick={updateAchievement} disabled={editSaving}>{editSaving ? "Saving…" : "Save Changes"}</button>
                <button className="sp-btn-ghost" onClick={() => setEditEntry(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
