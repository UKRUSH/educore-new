"use client"

import { useState, useEffect, useMemo } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

type Application = { id: number; status: string }
type Member      = { id: number; isActive: boolean; role: string }

type MyApplication = {
  id: number
  status: "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED"
  motivation: string
  contribution: string | null
  experience: string | null
  availableDays: string | null
  additionalInfo: string | null
  currentYear: number | null
  currentSemester: number | null
  gpa: number | null
  createdAt: string
  updatedAt: string
  club: { id: number; name: string; category: string; logoUrl: string | null }
  feedback: { message: string } | null
}

type Club = {
  id: number
  name: string
  category: string
  status: string
  description: string
  requirements: string | null
  capacity: number
  logoUrl: string | null
  email: string | null
  social: string | null
  applications: Application[]
  members: Member[]
  _count: { members: number }
}

type UserProfile = {
  fullName: string
  studentId: string
  faculty: string
  degree: string
  intakeYear: number
}

type Semester = {
  id: number
  semesterNum: number
  academicYear: string
  gpa: number | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CLUB_CATS    = ["SPORTS", "CULTURAL", "OTHER"]
const SOCIETY_CATS = ["ACADEMIC", "RELIGIOUS"]

const CATEGORY_ICON: Record<string, string> = {
  SPORTS:    "⚽",
  CULTURAL:  "🎭",
  OTHER:     "🌐",
  ACADEMIC:  "📚",
  RELIGIOUS: "🕌",
}

const CATEGORY_COLOR: Record<string, string> = {
  ACADEMIC:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SPORTS:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CULTURAL:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  RELIGIOUS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  OTHER:     "bg-muted text-muted-foreground",
}

const STATUS_STYLE: Record<string, string> = {
  OPEN:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FULL:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CLOSED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const APP_STYLE: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  WAITLISTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

const INPUT    = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
const TEXTAREA = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
const READONLY = "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"

// Extra fields shown per category in the apply form
const EXTRA_FIELDS: Record<string, { label: string; key: string; placeholder: string; textarea?: boolean }[]> = {
  SPORTS: [
    { label: "Position / role applying for", key: "position", placeholder: "e.g. Forward, Goalkeeper, Team Captain…" },
    { label: "Sports achievements & competitions", key: "achievements", placeholder: "State tournaments, medals, rankings…", textarea: true },
    { label: "Training availability (days & times)", key: "training", placeholder: "e.g. Mon/Wed/Fri evenings" },
  ],
  CULTURAL: [
    { label: "Cultural arts skill (dance / music / drama / art)", key: "artSkill", placeholder: "e.g. Traditional dance, violin, oil painting…" },
    { label: "Previous performances or exhibitions", key: "performances", placeholder: "Past shows, concerts, galleries…", textarea: true },
    { label: "Languages spoken", key: "languages", placeholder: "e.g. Malay, English, Mandarin, Tamil…" },
  ],
  ACADEMIC: [
    { label: "Research interests or specialisation", key: "researchInterest", placeholder: "e.g. Machine learning, molecular biology…" },
    { label: "Academic achievements (dean's list, awards)", key: "academicAchievements", placeholder: "Honours, prizes, recognitions…", textarea: true },
    { label: "Projects or publications", key: "projects", placeholder: "FYP title, conference paper, GitHub projects…", textarea: true },
  ],
  RELIGIOUS: [
    { label: "Religious activities you are interested in", key: "activities", placeholder: "e.g. Weekly usrah, Quran recitation class, charity drives…" },
    { label: "Previous religious community involvement", key: "communityInvolvement", placeholder: "Committees, camps, volunteer work…", textarea: true },
  ],
  OTHER: [],
}

function cap(s: string) { return s.charAt(0) + s.slice(1).toLowerCase() }
function isSociety(cat: string) { return SOCIETY_CATS.includes(cat) }

// Pack extra fields into additionalInfo JSON
function packExtra(category: string, formData: Record<string, string>): string | null {
  const obj: Record<string, string> = {}
  for (const field of (EXTRA_FIELDS[category] ?? [])) {
    if (formData[field.key]?.trim()) obj[field.key] = formData[field.key].trim()
  }
  if (formData.height?.trim())         obj.height  = formData.height.trim()
  if (formData.weight?.trim())         obj.weight  = formData.weight.trim()
  if (formData.additionalInfo?.trim()) obj._notes  = formData.additionalInfo.trim()
  return Object.keys(obj).length ? JSON.stringify(obj) : null
}

// Unpack additionalInfo JSON back into a flat form record
function unpackExtra(additionalInfo: string | null): Record<string, string> {
  if (!additionalInfo) return {}
  try {
    const parsed = JSON.parse(additionalInfo)
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") out[k === "_notes" ? "additionalInfo" : k] = v
    }
    return out
  } catch {
    return { additionalInfo: additionalInfo }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClubsPage() {
  const [tab, setTab]             = useState<"browse" | "applications">("browse")
  const [clubs, setClubs]         = useState<Club[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [catFilter, setCatFilter] = useState("ALL")

  // Profile & semesters for auto-fill
  const [profile, setProfile]     = useState<UserProfile | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])

  // My Applications
  const [myApps, setMyApps]           = useState<MyApplication[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [viewApp, setViewApp]         = useState<MyApplication | null>(null)
  const [editApp, setEditApp]         = useState<MyApplication | null>(null)
  const [editForm, setEditForm]       = useState<Record<string, string>>({})
  const [editError, setEditError]     = useState("")
  const [saving, setSaving]           = useState(false)
  const [appsError, setAppsError]     = useState("")

  // Modals
  const [detailClub, setDetailClub] = useState<Club | null>(null)
  const [applyClub, setApplyClub]   = useState<Club | null>(null)

  // Apply form
  const [form, setForm]             = useState<Record<string, string>>({})
  const [applyError, setApplyError] = useState("")
  const [applying, setApplying]     = useState(false)

  // ── Load data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch("/api/clubs").then((r) => r.ok ? r.json() : []),
      fetch("/api/profile/me").then((r) => r.ok ? r.json() : null),
      fetch("/api/profile/semesters").then((r) => r.ok ? r.json() : []),
      fetch("/api/clubs/applications").then((r) => r.ok ? r.json() : []),
    ]).then(([c, p, s, apps]) => {
      setClubs(c)
      setProfile(p)
      setSemesters(s)
      setMyApps(apps)
      setLoading(false)
    })
  }, [])

  async function loadApplications() {
    setAppsLoading(true)
    const res = await fetch("/api/clubs/applications")
    if (res.ok) setMyApps(await res.json())
    setAppsLoading(false)
  }

  function openEdit(app: MyApplication) {
    const unpacked = unpackExtra(app.additionalInfo)
    const extras: Record<string, string> = {}
    ;(EXTRA_FIELDS[app.club.category] ?? []).forEach((field) => {
      extras[field.key] = unpacked[field.key] ?? ""
    })
    setEditForm({
      motivation:     app.motivation ?? "",
      contribution:   app.contribution ?? "",
      experience:     app.experience ?? "",
      additionalInfo: unpacked.additionalInfo ?? "",
      height:         unpacked.height ?? "",
      weight:         unpacked.weight ?? "",
      ...extras,
    })
    setEditError("")
    setViewApp(null)
    setEditApp(app)
  }

  async function saveEdit() {
    if (!editApp) return
    if (!editForm.motivation?.trim()) { setEditError("Motivation is required."); return }
    setSaving(true)
    setEditError("")
    const res = await fetch(`/api/clubs/applications/${editApp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motivation:     editForm.motivation,
        contribution:   editForm.contribution,
        experience:     editForm.experience,
        additionalInfo: packExtra(editApp.club.category, editForm),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error ?? "Failed to save."); setSaving(false); return }
    setMyApps((prev) => prev.map((a) => a.id === editApp.id ? data : a))
    setEditApp(null)
    setSaving(false)
  }

  async function deleteApp(id: number) {
    if (!confirm("Withdraw this application? This cannot be undone.")) return
    setAppsError("")
    const res = await fetch(`/api/clubs/applications/${id}`, { method: "DELETE" })
    if (res.ok) {
      setMyApps((prev) => prev.filter((a) => a.id !== id))
      setViewApp(null)
      // Re-sync clubs so Apply button reappears
      const cr = await fetch("/api/clubs")
      if (cr.ok) setClubs(await cr.json())
    } else {
      setAppsError("Failed to withdraw application.")
    }
  }

  // ── Derived auto-fill values ──────────────────────────────────────────────

  const latestSem = useMemo(() => {
    if (!semesters.length) return null
    return [...semesters].sort((a, b) => b.semesterNum - a.semesterNum)[0]
  }, [semesters])

  const autoYear = useMemo(() => {
    if (!profile) return ""
    return String(Math.min(Math.max(new Date().getFullYear() - profile.intakeYear + 1, 1), 4))
  }, [profile])

  const autoSemester = useMemo(() => latestSem ? String(latestSem.semesterNum) : "", [latestSem])
  const autoGpa      = useMemo(() => latestSem?.gpa != null ? latestSem.gpa.toFixed(2) : "", [latestSem])

  // ── Filtered lists ────────────────────────────────────────────────────────

  const base = useMemo(() => {
    const q = search.toLowerCase()
    return clubs.filter((c) =>
      (!q || c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)) &&
      (catFilter === "ALL" || c.category === catFilter)
    )
  }, [clubs, search, catFilter])

  const clubList    = useMemo(() => base.filter((c) => CLUB_CATS.includes(c.category)),    [base])
  const societyList = useMemo(() => base.filter((c) => SOCIETY_CATS.includes(c.category)), [base])

  // ── Helpers ───────────────────────────────────────────────────────────────

  function appStatus(club: Club): string | null {
    if (club.members.some((m) => m.isActive)) return "MEMBER"
    return club.applications[0]?.status ?? null
  }

  function openApply(club: Club) {
    const extras: Record<string, string> = {}
    ;(EXTRA_FIELDS[club.category] ?? []).forEach((f) => { extras[f.key] = "" })
    setForm({ motivation: "", contribution: "", experience: "", availableDays: "", additionalInfo: "", ...extras })
    setApplyError("")
    setDetailClub(null)
    setApplyClub(club)
  }

  function f(key: string) { return form[key] ?? "" }
  function setF(key: string, val: string) { setForm((p) => ({ ...p, [key]: val })) }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function submitApplication() {
    if (!applyClub) return
    if (!form.motivation?.trim()) { setApplyError("Please tell us your motivation for joining."); return }
    setApplying(true)
    setApplyError("")

    const res = await fetch(`/api/clubs/${applyClub.id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motivation:      form.motivation,
        contribution:    form.contribution,
        experience:      form.experience,
        additionalInfo:  packExtra(applyClub.category, form),
        currentYear:     autoYear,
        currentSemester: autoSemester,
        gpa:             autoGpa,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setApplyError(data.error ?? "Failed to submit application."); setApplying(false); return }

    setClubs((prev) =>
      prev.map((c) => c.id === applyClub.id ? { ...c, applications: [{ id: data.id, status: "PENDING" }] } : c)
    )
    setApplyClub(null)
    setApplying(false)
  }

  // ── Club card ─────────────────────────────────────────────────────────────

  function ClubCard({ club }: { club: Club }) {
    const st  = appStatus(club)
    const pct = Math.min((club._count.members / club.capacity) * 100, 100)
    const soc = isSociety(club.category)

    return (
      <div className="bg-card border border-border rounded-xl flex flex-col hover:border-primary/40 hover:shadow-sm transition-all">
        <div className={`h-1 rounded-t-xl ${soc ? "bg-linear-to-r from-blue-500 to-indigo-500" : "bg-linear-to-r from-emerald-500 to-teal-500"}`} />

        <div className="p-5 flex-1">
          <div className="flex items-start gap-3 mb-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${soc ? "bg-blue-50 dark:bg-blue-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
              {club.logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover rounded-xl" />
                : CATEGORY_ICON[club.category] ?? "🏛️"}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm leading-tight">{club.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[club.category] ?? CATEGORY_COLOR.OTHER}`}>
                  {cap(club.category)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[club.status]}`}>
                  {cap(club.status)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">{club.description}</p>

          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Members</span>
              <span className="font-medium text-foreground">{club._count.members} / {club.capacity}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : soc ? "#6366f1" : "#22c55e" }} />
            </div>
          </div>

          {club.email && <p className="text-xs text-muted-foreground truncate mt-2">✉ {club.email}</p>}
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-2">
          <button onClick={() => setDetailClub(club)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            View details →
          </button>

          {st === "MEMBER" ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">✓ Member</span>
          ) : st ? (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${APP_STYLE[st]}`}>{cap(st)}</span>
          ) : club.status === "OPEN" ? (
            <button onClick={() => openApply(club)}
              className={`text-xs px-3 py-1.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity ${soc ? "bg-indigo-600" : "bg-emerald-600"}`}>
              Apply Now
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Not accepting</span>
          )}
        </div>
      </div>
    )
  }

  // ── Section block ─────────────────────────────────────────────────────────

  function Section({ title, subtitle, icon, list, soc, cats }: {
    title: string; subtitle: string; icon: string; list: Club[]
    soc: boolean; cats: string[]
  }) {
    return (
      <div>
        {/* Section header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-border">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${soc ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${soc ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                {list.length} available
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          {/* Category filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {cats.map((cat) => (
              <button key={cat}
                onClick={() => setCatFilter(catFilter === cat ? "ALL" : cat)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  catFilter === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}>
                {CATEGORY_ICON[cat]} {cap(cat)}
                <span className="opacity-60">({clubs.filter((c) => c.category === cat).length})</span>
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground rounded-xl border border-dashed border-border">
            <span className="text-3xl mb-2">{icon}</span>
            <p className="text-sm">No {title.toLowerCase()} found{search ? ` matching "${search}"` : ""}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((c) => <ClubCard key={c.id} club={c} />)}
          </div>
        )}
      </div>
    )
  }

  // ── Page ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clubs & Societies</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse and apply to clubs and societies at your institution.</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
            Clubs ({clubs.filter((c) => CLUB_CATS.includes(c.category)).length})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" />
            Societies ({clubs.filter((c) => SOCIETY_CATS.includes(c.category)).length})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
            Open ({clubs.filter((c) => c.status === "OPEN").length})
          </span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border">
        <button
          onClick={() => setTab("browse")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "browse"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => { setTab("applications"); loadApplications() }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "applications"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Applications
          {myApps.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              myApps.some((a) => a.status === "PENDING")
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-muted text-muted-foreground"
            }`}>
              {myApps.length}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className={`relative ${tab !== "browse" ? "hidden" : ""}`}>
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          placeholder="Search clubs or societies by name or description…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCatFilter("ALL") }}
          className="w-full rounded-xl border border-input bg-background pl-10 pr-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── BROWSE TAB ──────────────────────────────────────────────────── */}
      {tab === "browse" && (
        loading ? (
          <div className="space-y-10">
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="h-10 w-48 rounded-lg bg-muted/50 animate-pulse mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-60 rounded-xl bg-muted/50 animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-14">
            <Section title="Clubs" subtitle="Sports, cultural, and recreational clubs open to all students."
              icon="🏅" list={clubList} soc={false} cats={CLUB_CATS} />
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Societies</span>
              </div>
            </div>
            <Section title="Societies" subtitle="Academic and religious societies for knowledge, faith, and community."
              icon="🎓" list={societyList} soc={true} cats={SOCIETY_CATS} />
          </div>
        )
      )}

      {/* ── MY APPLICATIONS TAB ─────────────────────────────────────────── */}
      {tab === "applications" && (
        <div className="space-y-4">
          {appsError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{appsError}</div>
          )}

          {appsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />)}
            </div>
          ) : myApps.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-base font-medium mb-1">No applications yet</p>
              <p className="text-sm">Browse clubs and societies and click <strong>Apply Now</strong> to get started.</p>
              <button onClick={() => setTab("browse")} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Browse Clubs & Societies
              </button>
            </div>
          ) : (
            <>
              {/* Status summary bar */}
              <div className="flex flex-wrap gap-3 pb-2">
                {(["PENDING", "APPROVED", "WAITLISTED", "REJECTED"] as const).map((s) => {
                  const count = myApps.filter((a) => a.status === s).length
                  if (!count) return null
                  return (
                    <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${APP_STYLE[s]}`}>
                      <span>{s === "PENDING" ? "⏳" : s === "APPROVED" ? "✅" : s === "REJECTED" ? "❌" : "⏸"}</span>
                      {count} {cap(s)}
                    </div>
                  )
                })}
              </div>

              {/* Application cards */}
              <div className="space-y-3">
                {myApps.map((app) => (
                  <div key={app.id} className={`bg-card border rounded-xl overflow-hidden transition-colors ${
                    app.status === "REJECTED" ? "border-red-200 dark:border-red-900/40" :
                    app.status === "APPROVED" ? "border-green-200 dark:border-green-900/40" :
                    app.status === "PENDING"  ? "border-yellow-200 dark:border-yellow-900/40" :
                    "border-border"
                  }`}>
                    {/* Status strip */}
                    <div className={`h-1 ${
                      app.status === "REJECTED"   ? "bg-red-500" :
                      app.status === "APPROVED"   ? "bg-green-500" :
                      app.status === "WAITLISTED" ? "bg-blue-500" : "bg-yellow-400"
                    }`} />

                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Club icon */}
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isSociety(app.club.category) ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"
                      }`}>
                        {CATEGORY_ICON[app.club.category] ?? "🏛️"}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground text-sm">{app.club.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[app.club.category] ?? CATEGORY_COLOR.OTHER}`}>
                            {cap(app.club.category)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${APP_STYLE[app.status]}`}>
                            {app.status === "PENDING" ? "⏳" : app.status === "APPROVED" ? "✅" : app.status === "REJECTED" ? "❌" : "⏸"} {cap(app.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>Applied {new Date(app.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</span>
                          {app.updatedAt !== app.createdAt && (
                            <span>· Updated {new Date(app.updatedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</span>
                          )}
                          {app.currentYear && <span>· Year {app.currentYear}</span>}
                          {app.currentSemester && <span>Sem {app.currentSemester}</span>}
                        </div>
                        {/* Feedback banner */}
                        {app.feedback && (
                          <div className={`mt-2 text-xs px-3 py-1.5 rounded-lg ${
                            app.status === "REJECTED"
                              ? "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30"
                              : "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30"
                          }`}>
                            <strong>Committee note:</strong> {app.feedback.message}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* View */}
                        <button
                          onClick={() => setViewApp(app)}
                          title="View application"
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.574-3.007-9.964-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        {/* Edit — only for PENDING */}
                        {app.status === "PENDING" && (
                          <button
                            onClick={() => openEdit(app)}
                            title="Edit application"
                            className="p-2 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                        )}
                        {/* Delete / withdraw */}
                        <button
                          onClick={() => deleteApp(app.id)}
                          title={app.status === "PENDING" ? "Withdraw application" : "Remove record"}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DETAIL MODAL ───────────────────────────────────────────────────── */}
      {detailClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetailClub(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className={`h-1.5 rounded-t-2xl ${isSociety(detailClub.category) ? "bg-linear-to-r from-blue-500 to-indigo-500" : "bg-linear-to-r from-emerald-500 to-teal-500"}`} />

            <div className="flex items-start justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${isSociety(detailClub.category) ? "bg-blue-50 dark:bg-blue-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
                  {CATEGORY_ICON[detailClub.category] ?? "🏛️"}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{detailClub.name}</h3>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[detailClub.category] ?? CATEGORY_COLOR.OTHER}`}>{cap(detailClub.category)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[detailClub.status]}`}>{cap(detailClub.status)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDetailClub(null)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">About</p>
                <p className="text-sm text-foreground leading-relaxed">{detailClub.description}</p>
              </div>
              {detailClub.requirements && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Requirements</p>
                  <p className="text-sm text-foreground leading-relaxed">{detailClub.requirements}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Capacity</p>
                  <p className="font-medium text-foreground">{detailClub._count.members} / {detailClub.capacity} members</p>
                </div>
                {detailClub.email && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                    <a href={`mailto:${detailClub.email}`} className="text-primary hover:underline break-all">{detailClub.email}</a>
                  </div>
                )}
                {detailClub.social && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Social</p>
                    <p className="text-foreground break-all">{detailClub.social}</p>
                  </div>
                )}
              </div>

              {(() => {
                const st = appStatus(detailClub)
                if (st === "MEMBER") return (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
                    ✓ You are a member of this {isSociety(detailClub.category) ? "society" : "club"}.
                  </div>
                )
                if (st) return (
                  <div className={`p-3 rounded-lg border text-sm ${APP_STYLE[st]}`}>
                    Application status: <strong>{cap(st)}</strong>
                  </div>
                )
                if (detailClub.status === "OPEN") return (
                  <button onClick={() => openApply(detailClub)}
                    className={`w-full py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity ${isSociety(detailClub.category) ? "bg-indigo-600" : "bg-emerald-600"}`}>
                    Apply to Join
                  </button>
                )
                return null
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── APPLY MODAL ────────────────────────────────────────────────────── */}
      {applyClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setApplyClub(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Top strip */}
            <div className={`h-1.5 rounded-t-2xl ${isSociety(applyClub.category) ? "bg-linear-to-r from-blue-500 to-indigo-500" : "bg-linear-to-r from-emerald-500 to-teal-500"}`} />

            {/* Modal header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${isSociety(applyClub.category) ? "bg-blue-50 dark:bg-blue-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
                  {CATEGORY_ICON[applyClub.category] ?? "🏛️"}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Apply — {applyClub.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isSociety(applyClub.category) ? "Society" : "Club"} · {cap(applyClub.category)}
                  </p>
                </div>
              </div>
              <button onClick={() => setApplyClub(null)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-7">
              {applyError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">{applyError}</div>
              )}

              {/* ── AUTO-FILLED STUDENT INFO ─────────────────────────────── */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Student Information</p>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Auto-filled
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                    <div className={READONLY}>{profile?.fullName ?? "—"}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Student ID</label>
                    <div className={`${READONLY} font-mono tracking-wide`}>{profile?.studentId ?? "—"}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Faculty</label>
                    <div className={READONLY}>{profile?.faculty ?? "—"}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Degree Programme</label>
                    <div className={READONLY}>{profile?.degree ?? "—"}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Year</label>
                    <div className={READONLY}>{autoYear ? `Year ${autoYear}` : "—"}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Semester</label>
                    <div className={READONLY}>{autoSemester ? `Semester ${autoSemester}` : "—"}</div>
                  </div>
                </div>
              </div>

              {/* ── APPLICATION DETAILS ─────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Application Details</p>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-4">
                  {/* Motivation — always required */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Why do you want to join {applyClub.name}? <span className="text-destructive">*</span>
                    </label>
                    <textarea rows={4}
                      placeholder={`Tell us what motivates you to join this ${isSociety(applyClub.category) ? "society" : "club"} and what you hope to achieve…`}
                      value={f("motivation")} onChange={(e) => setF("motivation", e.target.value)} className={TEXTAREA} />
                  </div>

                  {/* Category-specific fields */}
                  {(EXTRA_FIELDS[applyClub.category] ?? []).map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
                      {field.textarea
                        ? <textarea rows={3} placeholder={field.placeholder} value={f(field.key)} onChange={(e) => setF(field.key, e.target.value)} className={TEXTAREA} />
                        : <input placeholder={field.placeholder} value={f(field.key)} onChange={(e) => setF(field.key, e.target.value)} className={INPUT} />}
                    </div>
                  ))}

                  {/* Common optional fields */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      What can you contribute? <span className="opacity-60">(optional)</span>
                    </label>
                    <textarea rows={3} placeholder="Skills, time commitment, leadership ideas…"
                      value={f("contribution")} onChange={(e) => setF("contribution", e.target.value)} className={TEXTAREA} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Relevant past experience <span className="opacity-60">(optional)</span>
                    </label>
                    <textarea rows={2} placeholder="Previous club memberships, competitions, events organised…"
                      value={f("experience")} onChange={(e) => setF("experience", e.target.value)} className={TEXTAREA} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Anything else you'd like to add <span className="opacity-60">(optional)</span>
                    </label>
                    <textarea rows={2} placeholder="Extra information for the committee…"
                      value={f("additionalInfo")} onChange={(e) => setF("additionalInfo", e.target.value)} className={TEXTAREA} />
                  </div>
                </div>
              </div>

              {/* ── PHYSICAL DETAILS ─────────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Physical Details</p>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground opacity-60">(optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Height</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        max="250"
                        placeholder="e.g. 170"
                        value={f("height")}
                        onChange={(e) => setF("height", e.target.value)}
                        className={INPUT}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">cm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Weight</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="30"
                        max="200"
                        placeholder="e.g. 65"
                        value={f("weight")}
                        onChange={(e) => setF("weight", e.target.value)}
                        className={INPUT}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-1">
                <button onClick={submitApplication} disabled={applying}
                  className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2 ${isSociety(applyClub.category) ? "bg-indigo-600" : "bg-emerald-600"}`}>
                  {applying ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>Submitting…</>
                  ) : "Submit Application"}
                </button>
                <button onClick={() => setApplyClub(null)}
                  className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-accent">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW APPLICATION MODAL ──────────────────────────────────────── */}
      {viewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewApp(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className={`h-1.5 rounded-t-2xl ${
              viewApp.status === "REJECTED" ? "bg-red-500" :
              viewApp.status === "APPROVED" ? "bg-green-500" :
              viewApp.status === "WAITLISTED" ? "bg-blue-500" : "bg-yellow-400"
            }`} />

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  isSociety(viewApp.club.category) ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"
                }`}>
                  {CATEGORY_ICON[viewApp.club.category] ?? "🏛️"}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{viewApp.club.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[viewApp.club.category] ?? CATEGORY_COLOR.OTHER}`}>
                      {cap(viewApp.club.category)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${APP_STYLE[viewApp.status]}`}>
                      {viewApp.status === "PENDING" ? "⏳" : viewApp.status === "APPROVED" ? "✅" : viewApp.status === "REJECTED" ? "❌" : "⏸"} {cap(viewApp.status)}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewApp(null)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* Committee feedback */}
              {viewApp.feedback && (
                <div className={`p-3 rounded-lg border text-sm ${
                  viewApp.status === "REJECTED"
                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400"
                    : "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400"
                }`}>
                  <p className="font-semibold mb-1">Committee Feedback</p>
                  <p>{viewApp.feedback.message}</p>
                </div>
              )}

              {/* ── Student info snapshot ─────────────────────────────────── */}
              {(() => {
                const extra = unpackExtra(viewApp.additionalInfo)
                return (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Student Information</p>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { label: "Full Name",        value: profile?.fullName },
                          { label: "Student ID",       value: profile?.studentId },
                          { label: "Faculty",          value: profile?.faculty },
                          { label: "Degree",           value: profile?.degree },
                          { label: "Year",             value: viewApp.currentYear ? `Year ${viewApp.currentYear}` : null },
                          { label: "Semester",         value: viewApp.currentSemester ? `Semester ${viewApp.currentSemester}` : null },
                        ].filter((r) => r.value).map((r) => (
                          <div key={r.label} className="bg-muted/40 rounded-lg px-3 py-2">
                            <p className="text-xs text-muted-foreground mb-0.5">{r.label}</p>
                            <p className="text-sm font-medium text-foreground">{r.value}</p>
                          </div>
                        ))}
                        {(extra.height || extra.weight) && (
                          <>
                            {extra.height && (
                              <div className="bg-muted/40 rounded-lg px-3 py-2">
                                <p className="text-xs text-muted-foreground mb-0.5">Height</p>
                                <p className="text-sm font-medium text-foreground">{extra.height} cm</p>
                              </div>
                            )}
                            {extra.weight && (
                              <div className="bg-muted/40 rounded-lg px-3 py-2">
                                <p className="text-xs text-muted-foreground mb-0.5">Weight</p>
                                <p className="text-sm font-medium text-foreground">{extra.weight} kg</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Application answers ───────────────────────────────── */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Application Details</p>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="space-y-3">
                        {/* Motivation always first */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Motivation</p>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/30 rounded-lg px-3 py-2.5">{viewApp.motivation}</p>
                        </div>

                        {/* Category-specific fields */}
                        {(EXTRA_FIELDS[viewApp.club.category] ?? []).map((field) =>
                          extra[field.key] ? (
                            <div key={field.key}>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{field.label}</p>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/30 rounded-lg px-3 py-2.5">{extra[field.key]}</p>
                            </div>
                          ) : null
                        )}

                        {/* Common fields */}
                        {[
                          { label: "Contribution",     value: viewApp.contribution },
                          { label: "Past Experience",  value: viewApp.experience },
                          { label: "Additional Notes", value: extra.additionalInfo },
                        ].filter((r) => r.value).map((r) => (
                          <div key={r.label}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{r.label}</p>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/30 rounded-lg px-3 py-2.5">{r.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )
              })()}

              <div className="flex gap-2 pt-1">
                {viewApp.status === "PENDING" && (
                  <button onClick={() => openEdit(viewApp)}
                    className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    Edit Application
                  </button>
                )}
                <button onClick={() => deleteApp(viewApp.id)}
                  className={`${viewApp.status === "PENDING" ? "" : "flex-1"} px-5 py-2.5 rounded-lg border border-destructive/40 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors`}>
                  {viewApp.status === "PENDING" ? "Withdraw" : "Remove Record"}
                </button>
                <button onClick={() => setViewApp(null)}
                  className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-accent">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT APPLICATION MODAL ──────────────────────────────────────── */}
      {editApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditApp(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 rounded-t-2xl bg-blue-500" />

            <div className="flex items-start justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground">Edit Application — {editApp.club.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Only pending applications can be edited.</p>
              </div>
              <button onClick={() => setEditApp(null)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              {editError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">{editError}</div>
              )}

              {/* ── Motivation ──────────────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Application Details</p>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Why do you want to join {editApp.club.name}? <span className="text-destructive">*</span>
                    </label>
                    <textarea rows={4} value={editForm.motivation ?? ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, motivation: e.target.value }))}
                      className={TEXTAREA} />
                  </div>

                  {/* Category-specific fields */}
                  {(EXTRA_FIELDS[editApp.club.category] ?? []).map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
                      {field.textarea
                        ? <textarea rows={3} placeholder={field.placeholder}
                            value={editForm[field.key] ?? ""}
                            onChange={(e) => setEditForm((p) => ({ ...p, [field.key]: e.target.value }))}
                            className={TEXTAREA} />
                        : <input placeholder={field.placeholder}
                            value={editForm[field.key] ?? ""}
                            onChange={(e) => setEditForm((p) => ({ ...p, [field.key]: e.target.value }))}
                            className={INPUT} />}
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">What can you contribute? <span className="opacity-60">(optional)</span></label>
                    <textarea rows={3} value={editForm.contribution ?? ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, contribution: e.target.value }))}
                      placeholder="Skills, time commitment, ideas…" className={TEXTAREA} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Relevant past experience <span className="opacity-60">(optional)</span></label>
                    <textarea rows={2} value={editForm.experience ?? ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, experience: e.target.value }))}
                      placeholder="Previous memberships, competitions…" className={TEXTAREA} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Additional info <span className="opacity-60">(optional)</span></label>
                    <textarea rows={2} value={editForm.additionalInfo ?? ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, additionalInfo: e.target.value }))}
                      placeholder="Anything else for the committee…" className={TEXTAREA} />
                  </div>
                </div>
              </div>

              {/* ── Physical Details ─────────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Physical Details</p>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground opacity-60">(optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Height</label>
                    <div className="relative">
                      <input type="number" min="100" max="250" placeholder="e.g. 170"
                        value={editForm.height ?? ""}
                        onChange={(e) => setEditForm((p) => ({ ...p, height: e.target.value }))}
                        className={INPUT} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">cm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Weight</label>
                    <div className="relative">
                      <input type="number" min="30" max="200" placeholder="e.g. 65"
                        value={editForm.weight ?? ""}
                        onChange={(e) => setEditForm((p) => ({ ...p, weight: e.target.value }))}
                        className={INPUT} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kg</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2">
                  {saving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>Saving…</>
                  ) : "Save Changes"}
                </button>
                <button onClick={() => setEditApp(null)}
                  className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-accent">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
