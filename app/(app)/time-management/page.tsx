"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, Fragment } from "react"

type AvailSlot = {
  id: number
  dayOfWeek: number
  startTime: string
  endTime: string
  label: string | null
}

type MatchedSession = {
  id: number
  subject: string
  description: string | null
  date: string
  durationMins: number
  locationOrLink: string | null
  capacity: number
  enrolled: number
  hasApplied: boolean
  mentor: {
    name: string
    gpa: number
    photoUrl: string | null
  }
}

const DAYS_FULL  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const HOUR_LABELS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 7   // 07:00 → 21:00
  return `${String(h).padStart(2, "0")}:00`
})

/* ═══════════════════════════════════ CSS ═══════════════════════════════════ */
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.tm-root {
  max-width: 1100px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.75rem;
  padding-bottom: 3rem;
}

/* ── Hero ── */
.tm-hero {
  border-radius: 1.5rem; overflow: hidden; position: relative;
  background: linear-gradient(135deg,
    oklch(0.14 0.09 55) 0%,
    oklch(0.26 0.16 45) 50%,
    oklch(0.18 0.10 35) 100%
  );
  padding: 2rem 2.25rem 1.75rem;
}
.tm-hero-dots {
  position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, oklch(1 0 0 / .06) 1px, transparent 1px);
  background-size: 22px 22px;
}
.tm-hero-glow {
  position: absolute; top: -60px; right: -60px; width: 260px; height: 260px;
  border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, oklch(0.72 0.2 55 / .3) 0%, transparent 70%);
}
.tm-hero-inner {
  position: relative; z-index: 1;
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 1.5rem; flex-wrap: wrap;
}
.tm-hero-eyebrow {
  font-size: .7rem; font-weight: 700; color: rgba(255,255,255,.5);
  text-transform: uppercase; letter-spacing: .12em; margin-bottom: .5rem;
}
.tm-hero-title {
  font-size: 1.65rem; font-weight: 900; color: #fff;
  letter-spacing: -.04em; line-height: 1.1;
}
.tm-hero-sub {
  font-size: .85rem; color: rgba(255,255,255,.6);
  margin-top: .5rem; max-width: 420px; line-height: 1.55;
}
.tm-stats { display: flex; gap: .85rem; }
.tm-stat {
  display: flex; flex-direction: column; align-items: center; gap: .12rem;
  padding: .65rem 1.1rem; border-radius: 1rem;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
  backdrop-filter: blur(8px); min-width: 80px;
}
.tm-stat-val { font-size: 1.4rem; font-weight: 900; color: #fff; letter-spacing: -.04em; }
.tm-stat-lbl { font-size: .6rem; font-weight: 600; color: rgba(255,255,255,.55); text-transform: uppercase; letter-spacing: .08em; }

/* ── Two-column body ── */
.tm-body {
  display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: flex-start;
}
@media (max-width: 900px) { .tm-body { grid-template-columns: 1fr; } }

/* ── Section heading ── */
.tm-sec-head {
  display: flex; align-items: center; gap: .65rem; margin-bottom: 1rem;
}
.tm-sec-icon {
  width: 34px; height: 34px; border-radius: .7rem; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.38 0.18 55), oklch(0.58 0.16 55));
  display: flex; align-items: center; justify-content: center; font-size: .9rem;
  box-shadow: 0 3px 10px oklch(0.38 0.18 55 / .3);
}
.tm-sec-title { font-size: .95rem; font-weight: 800; color: var(--foreground); }
.tm-sec-sub   { font-size: .74rem; color: var(--muted-foreground); margin-top: .1rem; }

/* ══════════════ VISUAL CALENDAR ══════════════ */
.tm-cal {
  border: 1px solid var(--border); border-radius: 1.35rem;
  background: var(--card); overflow: hidden;
  box-shadow: 0 2px 16px oklch(0 0 0 / .05);
}
.tm-cal-header { padding: 1.25rem 1.5rem 1rem; border-bottom: 1px solid var(--border); }

.tm-cal-grid {
  display: grid;
  grid-template-columns: 52px repeat(7, 1fr);
  overflow-x: auto;
}
.tm-cal-grid::-webkit-scrollbar { height: 4px; }
.tm-cal-grid::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

/* Day header row */
.tm-cal-day-header {
  display: contents;
}
.tm-cal-corner {
  background: var(--muted); border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
}
.tm-cal-day-th {
  padding: .55rem .25rem; text-align: center; font-size: .68rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: .06em; color: var(--muted-foreground);
  background: var(--muted); border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
}
.tm-cal-day-th:last-child { border-right: none; }
.tm-cal-day-th.has-slots { color: oklch(0.42 0.18 55); }

/* Time rows */
.tm-cal-row { display: contents; }
.tm-cal-time-cell {
  padding: 0 .5rem; font-size: .6rem; font-weight: 700; color: var(--muted-foreground);
  display: flex; align-items: flex-start; justify-content: flex-end; padding-top: 4px;
  border-right: 1px solid var(--border); background: var(--muted);
  height: 36px;
}
.tm-cal-cell {
  border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);
  height: 36px; position: relative; cursor: default;
  transition: background .1s;
}
.tm-cal-cell:last-child { border-right: none; }
.tm-cal-cell.filled {
  background: oklch(0.93 0.08 55 / .55);
  border-color: oklch(0.78 0.14 55 / .35);
}
.tm-cal-cell.filled-start {
  border-top: 2px solid oklch(0.62 0.18 55);
  border-radius: 4px 4px 0 0;
}
.tm-cal-cell.filled-end {
  border-bottom: 2px solid oklch(0.62 0.18 55);
  border-radius: 0 0 4px 4px;
}
.tm-cal-slot-label {
  position: absolute; top: 2px; left: 3px; right: 3px;
  font-size: .55rem; font-weight: 700; color: oklch(0.36 0.18 55);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  pointer-events: none;
}

/* ══════════════ SLOT LIST ══════════════ */
.tm-slot-list {
  border: 1px solid var(--border); border-radius: 1.35rem;
  background: var(--card); overflow: hidden;
  box-shadow: 0 2px 16px oklch(0 0 0 / .05);
}
.tm-slot-list-head { padding: 1.25rem 1.5rem 1rem; border-bottom: 1px solid var(--border); }
.tm-slot-list-body { padding: .75rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: .4rem; }

.tm-day-group { margin-bottom: .5rem; }
.tm-day-group-label {
  font-size: .65rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em;
  color: var(--muted-foreground); margin-bottom: .35rem; padding-left: .25rem;
}
.tm-slot-row {
  display: flex; align-items: center; gap: .75rem;
  padding: .5rem .85rem; border-radius: .75rem;
  background: oklch(0.93 0.08 55 / .4); border: 1px solid oklch(0.78 0.14 55 / .4);
  transition: background .15s;
}
.tm-slot-row:hover { background: oklch(0.93 0.08 55 / .65); }
.tm-slot-time {
  font-size: .78rem; font-weight: 800; color: oklch(0.36 0.18 55); white-space: nowrap;
}
.tm-slot-label { font-size: .74rem; color: var(--muted-foreground); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tm-slot-del {
  width: 22px; height: 22px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0;
  background: oklch(0.65 0.18 27 / .15); color: oklch(0.5 0.2 27);
  display: flex; align-items: center; justify-content: center; font-size: .7rem;
  transition: background .15s;
}
.tm-slot-del:hover { background: oklch(0.65 0.18 27 / .35); }
.tm-no-slots {
  padding: 1.5rem; text-align: center;
  font-size: .82rem; color: var(--muted-foreground); line-height: 1.6;
  border: 1.5px dashed var(--border); border-radius: .85rem;
}

/* ══════════════ SIDEBAR ══════════════ */
.tm-sidebar { display: flex; flex-direction: column; gap: 1.25rem; }

/* Add slot form card */
.tm-add-card {
  border: 1px solid var(--border); border-radius: 1.35rem;
  background: var(--card); overflow: hidden;
  box-shadow: 0 2px 16px oklch(0 0 0 / .05);
}
.tm-add-head {
  padding: 1.1rem 1.25rem 1rem;
  background: linear-gradient(135deg, oklch(0.16 0.08 55) 0%, oklch(0.28 0.14 45) 100%);
  position: relative; overflow: hidden;
}
.tm-add-head-glow {
  position: absolute; top: -30px; right: -30px; width: 120px; height: 120px;
  border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, oklch(0.75 0.18 55 / .25) 0%, transparent 70%);
}
.tm-add-head-inner { position: relative; z-index: 1; }
.tm-add-head-row { display: flex; align-items: center; gap: .6rem; margin-bottom: .2rem; }
.tm-add-head-icon {
  width: 30px; height: 30px; border-radius: .55rem; flex-shrink: 0;
  background: oklch(0.72 0.18 55 / .25); border: 1px solid oklch(0.72 0.18 55 / .35);
  display: flex; align-items: center; justify-content: center; font-size: .9rem;
}
.tm-add-head-title { font-size: .9rem; font-weight: 800; color: #fff; }
.tm-add-head-sub { font-size: .7rem; color: rgba(255,255,255,.6); line-height: 1.4; }
.tm-add-body { padding: 1.1rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: .6rem; }
.tm-field { display: flex; flex-direction: column; gap: .28rem; }
.tm-flabel { font-size: .64rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: .05em; }
.tm-select, .tm-input {
  padding: .52rem .8rem; border-radius: .65rem;
  border: 1.5px solid var(--border); background: var(--background);
  color: var(--foreground); font-size: .82rem; font-family: inherit;
  outline: none; transition: border-color .15s; width: 100%;
}
.tm-select:focus, .tm-input:focus { border-color: oklch(0.72 0.18 55); }
.tm-row { display: flex; gap: .5rem; }
.tm-row .tm-field { flex: 1; }
.tm-btn-add {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: .45rem;
  padding: .65rem 1rem; border-radius: .75rem; border: none; cursor: pointer;
  background: linear-gradient(135deg, oklch(0.38 0.18 55), oklch(0.58 0.16 55));
  color: #fff; font-size: .84rem; font-weight: 700; margin-top: .25rem;
  box-shadow: 0 3px 12px oklch(0.38 0.18 55 / .3);
  transition: opacity .18s, transform .15s;
}
.tm-btn-add:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.tm-btn-add:disabled { opacity: .5; cursor: not-allowed; }

/* Matched sessions card */
.tm-match-card {
  border: 1px solid var(--border); border-radius: 1.35rem;
  background: var(--card); overflow: hidden;
  box-shadow: 0 2px 16px oklch(0 0 0 / .05);
}
.tm-match-head { padding: 1.1rem 1.25rem 1rem; border-bottom: 1px solid var(--border); }
.tm-match-body { padding: .75rem 1.1rem 1.1rem; display: flex; flex-direction: column; gap: .55rem; }
.tm-msess {
  padding: .75rem .9rem; border-radius: .85rem;
  border: 1.5px solid oklch(0.78 0.14 55 / .4);
  background: oklch(0.97 0.03 55 / .5);
  display: flex; flex-direction: column; gap: .35rem;
}
.tm-msess-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; }
.tm-msess-subj { font-size: .84rem; font-weight: 800; color: var(--foreground); }
.tm-msess-mentor { font-size: .7rem; color: var(--muted-foreground); }
.tm-msess-badge {
  padding: .2rem .55rem; border-radius: 999px; flex-shrink: 0;
  background: oklch(0.93 0.08 55 / .6); border: 1px solid oklch(0.78 0.14 55 / .5);
  font-size: .64rem; font-weight: 700; color: oklch(0.38 0.18 55);
}
.tm-msess-chips { display: flex; flex-wrap: wrap; gap: .3rem; }
.tm-msess-chip {
  display: inline-flex; align-items: center; gap: .2rem;
  padding: .18rem .5rem; border-radius: 999px;
  background: var(--muted); border: 1px solid var(--border);
  font-size: .65rem; font-weight: 600; color: var(--muted-foreground);
}
.tm-msess-link {
  display: inline-flex; align-items: center; justify-content: center; gap: .35rem;
  padding: .42rem .85rem; border-radius: .6rem; border: none; cursor: pointer;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  color: #fff; font-size: .74rem; font-weight: 700; text-decoration: none;
  box-shadow: 0 2px 8px oklch(0.4882 0.2172 264.3763 / .25);
  transition: opacity .15s; margin-top: .15rem;
}
.tm-msess-link:hover { opacity: .88; }
.tm-no-match {
  padding: 1.25rem; text-align: center;
  font-size: .78rem; color: var(--muted-foreground); line-height: 1.55;
}

/* ── Skeleton / Toast ── */
.tm-skel { background: var(--muted); border-radius: 1.35rem; animation: tmSkel 1.5s ease-in-out infinite; }
@keyframes tmSkel { 0%,100%{opacity:1} 50%{opacity:.4} }
.tm-toast {
  position: fixed; bottom: 1.75rem; left: 50%; transform: translateX(-50%);
  background: var(--card); border: 1px solid var(--border); border-radius: 1rem;
  padding: .8rem 1.6rem; font-weight: 600; font-size: .85rem; color: var(--foreground);
  box-shadow: 0 10px 40px oklch(0 0 0 / .18); z-index: 9999; white-space: nowrap;
  animation: tmToastIn .25s ease;
}
@keyframes tmToastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
`

/* ══════════════════════════════ helpers ══════════════════════════════ */
function addMins(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function fmtDateFull(iso: string) {
  const d = new Date(iso)
  return {
    date:    d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }),
    time:    d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    dow:     d.getDay(),
    timeStr: d.toTimeString().slice(0, 5),
  }
}

function sessionMatchesSlots(session: MatchedSession, slots: AvailSlot[]): boolean {
  if (!slots.length) return false
  const d = fmtDateFull(session.date)
  const sessionEnd = addMins(d.timeStr, session.durationMins)
  return slots.some(sl =>
    sl.dayOfWeek === d.dow &&
    sl.startTime <= d.timeStr &&
    sl.endTime   >= sessionEnd
  )
}

function toInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

/* ══════════════════════════════════ Calendar grid ══════════════════════════════════ */
function CalendarGrid({ slots }: { slots: AvailSlot[] }) {
  const byDay: Record<number, AvailSlot[]> = {}
  for (let i = 0; i <= 6; i++) byDay[i] = []
  slots.forEach(s => byDay[s.dayOfWeek].push(s))

  function isCovered(day: number, hourLabel: string): { filled: boolean; isStart: boolean; isEnd: boolean; label?: string } {
    for (const sl of byDay[day]) {
      const rowStart = hourLabel
      const rowEnd   = addMins(hourLabel, 60)
      if (sl.startTime < rowEnd && sl.endTime > rowStart) {
        const isStart = sl.startTime >= rowStart && sl.startTime < rowEnd
        return {
          filled:  true,
          isStart,
          isEnd:   sl.endTime > rowStart && sl.endTime <= rowEnd,
          label:   isStart ? (sl.label ?? `${sl.startTime}–${sl.endTime}`) : undefined,
        }
      }
    }
    return { filled: false, isStart: false, isEnd: false }
  }

  return (
    <div className="tm-cal-grid">
      {/* Day headers */}
      <div className="tm-cal-corner" />
      {DAYS_SHORT.map((d, i) => (
        <div key={i} className={`tm-cal-day-th${byDay[i].length > 0 ? " has-slots" : ""}`}>
          {d}
          {byDay[i].length > 0 && (
            <div style={{ fontSize: ".52rem", marginTop: ".1rem", color: "oklch(0.55 0.18 55)" }}>
              {byDay[i].length} slot{byDay[i].length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      ))}

      {/* Hour rows */}
      {HOUR_LABELS.map(hourLabel => (
        <Fragment key={`r-${hourLabel}`}>
          <div className="tm-cal-time-cell">{hourLabel}</div>
          {Array.from({ length: 7 }, (_, dayIdx) => {
            const info = isCovered(dayIdx, hourLabel)
            return (
              <div
                key={`c-${dayIdx}-${hourLabel}`}
                className={`tm-cal-cell${info.filled ? " filled" : ""}${info.isStart ? " filled-start" : ""}${info.isEnd ? " filled-end" : ""}`}
              >
                {info.filled && info.isStart && info.label && (
                  <span className="tm-cal-slot-label">{info.label}</span>
                )}
              </div>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}

/* ══════════════════════════════════ Main page ══════════════════════════════════ */
export default function TimeManagementPage() {
  const [slots, setSlots]       = useState<AvailSlot[]>([])
  const [sessions, setSessions] = useState<MatchedSession[]>([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [toast, setToast]       = useState("")

  // Form state
  const [day, setDay]     = useState("1")
  const [start, setStart] = useState("09:00")
  const [end, setEnd]     = useState("11:00")
  const [label, setLabel] = useState("")

  async function load() {
    setLoading(true)
    try {
      const [slotsRes, mentorsRes] = await Promise.all([
        fetch("/api/student/availability"),
        fetch("/api/support/mentors"),
      ])
      if (slotsRes.ok) setSlots(await slotsRes.json())
      if (mentorsRes.ok) {
        const mentors = await mentorsRes.json()
        const all: MatchedSession[] = mentors.flatMap((m: {
          sessions: { id: number; subject: string; description: string | null; date: string; durationMins: number; locationOrLink: string | null; capacity: number; enrolled: number; hasApplied: boolean }[];
          user: { fullName: string; photoUrl: string | null };
          gpa: number;
        }) =>
          m.sessions.map((s) => ({
            ...s,
            mentor: { name: m.user.fullName, gpa: m.gpa, photoUrl: m.user.photoUrl },
          }))
        )
        setSessions(all)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3200)
  }

  async function handleAdd() {
    if (!start || !end || start >= end) return
    setAdding(true)
    try {
      const res = await fetch("/api/student/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek: parseInt(day), startTime: start, endTime: end, label }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? "Failed to add slot."); return }
      setSlots(prev => [...prev, data].sort((a, b) =>
        a.dayOfWeek !== b.dayOfWeek ? a.dayOfWeek - b.dayOfWeek : a.startTime.localeCompare(b.startTime)
      ))
      setLabel("")
      showToast("✅ Time slot added!")
    } finally { setAdding(false) }
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/student/availability/${id}`, { method: "DELETE" })
      if (!res.ok) { showToast("Failed to remove slot."); return }
      setSlots(prev => prev.filter(s => s.id !== id))
      showToast("Slot removed.")
    } finally { setDeleting(null) }
  }

  // Group slots by day
  const byDay: Record<number, AvailSlot[]> = {}
  for (let i = 0; i <= 6; i++) byDay[i] = []
  slots.forEach(s => byDay[s.dayOfWeek].push(s))

  const daysWithSlots = DAYS_SHORT.map((_, i) => i).filter(i => byDay[i].length > 0)

  // Matched sessions
  const matched = sessions.filter(s => sessionMatchesSlots(s, slots))

  return (
    <>
      <style>{CSS}</style>
      <div className="tm-root">

        {/* ── Hero ── */}
        <div className="tm-hero">
          <div className="tm-hero-dots" />
          <div className="tm-hero-glow" />
          <div className="tm-hero-inner">
            <div>
              <div className="tm-hero-eyebrow">Student Time Management</div>
              <div className="tm-hero-title">My Available Schedule</div>
              <div className="tm-hero-sub">
                Set your weekly free slots so mentors know when you&apos;re available. Sessions that fit your schedule are automatically highlighted.
              </div>
            </div>
            {!loading && (
              <div className="tm-stats">
                <div className="tm-stat">
                  <span className="tm-stat-val">{slots.length}</span>
                  <span className="tm-stat-lbl">Slots</span>
                </div>
                <div className="tm-stat">
                  <span className="tm-stat-val">{daysWithSlots.length}</span>
                  <span className="tm-stat-lbl">Days</span>
                </div>
                <div className="tm-stat">
                  <span className="tm-stat-val">{matched.length}</span>
                  <span className="tm-stat-lbl">Matches</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="tm-skel" style={{ height: 380 }} />
            <div className="tm-skel" style={{ height: 200 }} />
          </div>
        ) : (
          <div className="tm-body">

            {/* ══ LEFT — calendar + slot list ══ */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Visual weekly calendar */}
              <div className="tm-cal">
                <div className="tm-cal-header">
                  <div className="tm-sec-head" style={{ marginBottom: 0 }}>
                    <div className="tm-sec-icon">📅</div>
                    <div>
                      <div className="tm-sec-title">Weekly Availability Calendar</div>
                      <div className="tm-sec-sub">Your free slots are shown in amber across the week</div>
                    </div>
                  </div>
                </div>
                <CalendarGrid slots={slots} />
              </div>

              {/* Slot list by day */}
              <div className="tm-slot-list">
                <div className="tm-slot-list-head">
                  <div className="tm-sec-head" style={{ marginBottom: 0 }}>
                    <div className="tm-sec-icon">🗓</div>
                    <div>
                      <div className="tm-sec-title">My Time Slots</div>
                      <div className="tm-sec-sub">
                        {slots.length === 0 ? "No slots yet — add your first slot on the right" : `${slots.length} slot${slots.length !== 1 ? "s" : ""} across ${daysWithSlots.length} day${daysWithSlots.length !== 1 ? "s" : ""}`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tm-slot-list-body">
                  {slots.length === 0 ? (
                    <div className="tm-no-slots">
                      🕐 No available time slots yet.<br />
                      Use the form on the right to add your first slot.
                    </div>
                  ) : (
                    daysWithSlots.map(dayIdx => (
                      <div className="tm-day-group" key={dayIdx}>
                        <div className="tm-day-group-label">{DAYS_FULL[dayIdx]}</div>
                        {byDay[dayIdx].map(sl => (
                          <div className="tm-slot-row" key={sl.id}>
                            <div className="tm-slot-time">
                              {sl.startTime} – {sl.endTime}
                            </div>
                            {sl.label && (
                              <div className="tm-slot-label">{sl.label}</div>
                            )}
                            <button
                              className="tm-slot-del"
                              disabled={deleting === sl.id}
                              onClick={() => handleDelete(sl.id)}
                              title="Remove slot"
                            >
                              {deleting === sl.id ? "…" : "✕"}
                            </button>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ══ RIGHT — add form + matched sessions ══ */}
            <div className="tm-sidebar">

              {/* Add slot form */}
              <div className="tm-add-card">
                <div className="tm-add-head">
                  <div className="tm-add-head-glow" />
                  <div className="tm-add-head-inner">
                    <div className="tm-add-head-row">
                      <div className="tm-add-head-icon">＋</div>
                      <div className="tm-add-head-title">Add Time Slot</div>
                    </div>
                    <div className="tm-add-head-sub">Pick a day and time range when you&apos;re free each week.</div>
                  </div>
                </div>
                <div className="tm-add-body">
                  <div className="tm-field">
                    <label className="tm-flabel">Day of week</label>
                    <select className="tm-select" value={day} onChange={e => setDay(e.target.value)}>
                      {DAYS_FULL.map((d, i) => (
                        <option key={i} value={i}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="tm-row">
                    <div className="tm-field">
                      <label className="tm-flabel">From</label>
                      <input className="tm-input" type="time" value={start} onChange={e => setStart(e.target.value)} />
                    </div>
                    <div className="tm-field">
                      <label className="tm-flabel">To</label>
                      <input className="tm-input" type="time" value={end} onChange={e => setEnd(e.target.value)} />
                    </div>
                  </div>
                  <div className="tm-field">
                    <label className="tm-flabel">Label (optional)</label>
                    <input
                      className="tm-input"
                      type="text"
                      placeholder="e.g. Morning study, Lunch break"
                      value={label}
                      maxLength={30}
                      onChange={e => setLabel(e.target.value)}
                    />
                  </div>
                  <button
                    className="tm-btn-add"
                    disabled={adding || !start || !end || start >= end}
                    onClick={handleAdd}
                  >
                    {adding ? "⏳ Adding…" : "＋ Add Time Slot"}
                  </button>
                </div>
              </div>

              {/* Matched sessions */}
              <div className="tm-match-card">
                <div className="tm-match-head">
                  <div className="tm-sec-head" style={{ marginBottom: 0 }}>
                    <div className="tm-sec-icon">✨</div>
                    <div>
                      <div className="tm-sec-title">Sessions Matching My Schedule</div>
                      <div className="tm-sec-sub">
                        {matched.length === 0
                          ? slots.length === 0 ? "Add slots to see matching sessions" : "No sessions match your current slots"
                          : `${matched.length} session${matched.length !== 1 ? "s" : ""} fit your availability`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tm-match-body">
                  {matched.length === 0 ? (
                    <div className="tm-no-match">
                      {slots.length === 0
                        ? "🕐 Set your available time slots first to see which mentor sessions fit your schedule."
                        : "📭 No upcoming sessions currently match your available time slots."}
                    </div>
                  ) : (
                    matched.slice(0, 6).map(s => {
                      const d = fmtDateFull(s.date)
                      const free = s.capacity - s.enrolled
                      return (
                        <div className="tm-msess" key={s.id}>
                          <div className="tm-msess-top">
                            <div>
                              <div className="tm-msess-subj">{s.subject}</div>
                              <div className="tm-msess-mentor">
                                by {s.mentor.name} · GPA {s.mentor.gpa.toFixed(2)}
                              </div>
                            </div>
                            <div className="tm-msess-badge">✨ Match</div>
                          </div>
                          <div className="tm-msess-chips">
                            <span className="tm-msess-chip">📆 {d.date}</span>
                            <span className="tm-msess-chip">🕐 {d.time}</span>
                            <span className="tm-msess-chip">⏱ {s.durationMins}min</span>
                            <span className="tm-msess-chip">{free > 0 ? `${free} seats` : "Full"}</span>
                          </div>
                          <a href="/support/mentors" className="tm-msess-link">
                            View on Mentors →
                          </a>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {toast && <div className="tm-toast">{toast}</div>}
    </>
  )
}
