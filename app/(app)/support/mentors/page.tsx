"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"

type Session = {
  id: number
  subject: string
  description: string | null
  date: string
  durationMins: number
  locationOrLink: string | null
  capacity: number
  status: string
  enrolled: number
  hasApplied: boolean
}

type Mentor = {
  id: number
  gpa: number
  subjects: string
  bio: string
  preferredDays: string | null
  contactPreference: string
  sessionsCount: number
  rating: number
  user: {
    fullName: string
    studentId: string
    faculty: string
    degree: string
    photoUrl: string | null
  }
  sessions: Session[]
}

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.sm-root { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.75rem; padding-bottom: 2.5rem; }

/* ── Hero ── */
.sm-hero {
  border-radius: 1.5rem; overflow: hidden; position: relative;
  background: linear-gradient(135deg, oklch(0.15 0.09 268) 0%, oklch(0.26 0.16 258) 50%, oklch(0.20 0.11 278) 100%);
  padding: 2rem 2.25rem 1.75rem;
}
.sm-hero-dots {
  position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, oklch(1 0 0 / .06) 1px, transparent 1px);
  background-size: 22px 22px;
}
.sm-hero-glow {
  position: absolute; top: -60px; right: -60px; width: 260px; height: 260px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, oklch(0.65 0.2 260 / .3) 0%, transparent 70%);
}
.sm-hero-inner { position: relative; z-index: 1; display: flex; align-items: flex-end; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
.sm-hero-left {}
.sm-hero-eyebrow { font-size: .7rem; font-weight: 700; color: rgba(255,255,255,.5); text-transform: uppercase; letter-spacing: .12em; margin-bottom: .5rem; }
.sm-hero-title { font-size: 1.65rem; font-weight: 900; color: #fff; letter-spacing: -.04em; line-height: 1.1; }
.sm-hero-sub { font-size: .85rem; color: rgba(255,255,255,.6); margin-top: .5rem; max-width: 420px; line-height: 1.55; }
.sm-hero-stats { display: flex; gap: 1rem; }
.sm-hstat {
  display: flex; flex-direction: column; align-items: center; gap: .12rem;
  padding: .75rem 1.25rem; border-radius: 1rem;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
  backdrop-filter: blur(8px); min-width: 90px;
}
.sm-hstat-val { font-size: 1.5rem; font-weight: 900; color: #fff; letter-spacing: -.04em; }
.sm-hstat-lbl { font-size: .62rem; font-weight: 600; color: rgba(255,255,255,.55); text-transform: uppercase; letter-spacing: .08em; }

/* ── Filter bar ── */
.sm-bar { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }
.sm-search-wrap {
  flex: 1; min-width: 220px; display: flex; align-items: center;
  border: 1.5px solid var(--border); border-radius: .9rem;
  background: var(--card); overflow: hidden;
  transition: border-color .18s, box-shadow .18s;
}
.sm-search-wrap:focus-within {
  border-color: oklch(0.6231 0.1880 259.8145);
  box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .1);
}
.sm-search-icon { padding: 0 .85rem; color: var(--muted-foreground); font-size: .95rem; flex-shrink: 0; }
.sm-search-input {
  flex: 1; padding: .7rem .5rem .7rem 0; border: none; outline: none;
  background: transparent; color: var(--foreground); font-size: .875rem; font-family: inherit;
}
.sm-filter-chip {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .7rem 1.1rem; border-radius: .9rem; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--card);
  color: var(--muted-foreground); font-size: .82rem; font-weight: 600;
  transition: all .15s; white-space: nowrap;
}
.sm-filter-chip:hover { border-color: oklch(0.6231 0.1880 259.8145); color: var(--foreground); }
.sm-filter-chip.active {
  background: oklch(0.6231 0.1880 259.8145 / .1);
  border-color: oklch(0.6231 0.1880 259.8145);
  color: oklch(0.4882 0.2172 264.3763);
}

/* ── Mentor card ── */
.sm-grid { display: flex; flex-direction: column; gap: 1.25rem; }
.sm-card {
  border: 1px solid var(--border); border-radius: 1.35rem;
  background: var(--card); overflow: hidden;
  box-shadow: 0 2px 16px oklch(0 0 0 / .05);
  transition: box-shadow .22s, transform .18s;
}
.sm-card:hover { box-shadow: 0 8px 32px oklch(0.4882 0.2172 264.3763 / .1); transform: translateY(-1px); }

/* Mentor header */
.sm-card-head {
  padding: 1.35rem 1.6rem 1.1rem;
  display: flex; align-items: flex-start; gap: 1.1rem;
}
.sm-avatar {
  width: 60px; height: 60px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  border: 2.5px solid oklch(0.6231 0.1880 259.8145 / .35);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.15rem; font-weight: 900; color: #fff; overflow: hidden;
  box-shadow: 0 4px 14px oklch(0.4882 0.2172 264.3763 / .25);
}
.sm-avatar img { width: 100%; height: 100%; object-fit: cover; }
.sm-mentor-info { flex: 1; min-width: 0; }
.sm-mentor-name { font-size: 1.05rem; font-weight: 900; color: var(--foreground); letter-spacing: -.02em; }
.sm-mentor-sub  { font-size: .76rem; color: var(--muted-foreground); margin-top: .18rem; }
.sm-subj-tags { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .6rem; }
.sm-subj-tag {
  padding: .24rem .7rem; border-radius: 999px;
  background: oklch(0.6231 0.1880 259.8145 / .1);
  border: 1px solid oklch(0.6231 0.1880 259.8145 / .3);
  font-size: .7rem; font-weight: 700; color: oklch(0.4882 0.2172 264.3763);
}
.sm-mentor-badges { display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; flex-shrink: 0; }
.sm-gpa-pill {
  display: flex; align-items: center; gap: .45rem;
  padding: .38rem .85rem; border-radius: 999px;
  background: oklch(0.91 0.08 145 / .9); border: 1.5px solid oklch(0.72 0.14 145 / .5);
}
.sm-gpa-pill-lbl { font-size: .62rem; font-weight: 700; color: oklch(0.42 0.18 145); text-transform: uppercase; letter-spacing: .06em; }
.sm-gpa-pill-val { font-size: .95rem; font-weight: 900; color: oklch(0.28 0.18 145); }
.sm-rating-pill {
  display: flex; align-items: center; gap: .3rem;
  padding: .28rem .7rem; border-radius: 999px;
  background: oklch(0.93 0.08 55 / .8); border: 1px solid oklch(0.78 0.14 60 / .4);
  font-size: .75rem; font-weight: 700; color: oklch(0.45 0.18 55);
}

/* Bio strip */
.sm-bio-strip {
  margin: 0 1.6rem; padding: .8rem 1rem; border-radius: .85rem;
  background: var(--muted); border: 1px solid var(--border);
  font-size: .82rem; color: var(--foreground); line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* Info tiles row */
.sm-info-row {
  display: flex; gap: .65rem; padding: 1rem 1.6rem;
  border-bottom: 1px solid var(--border); flex-wrap: wrap;
}
.sm-info-tile {
  display: flex; align-items: center; gap: .5rem;
  padding: .45rem .85rem; border-radius: .7rem;
  background: var(--muted); border: 1px solid var(--border);
  font-size: .76rem; font-weight: 600; color: var(--foreground);
}
.sm-info-tile span:first-child { font-size: .9rem; }

/* Sessions section */
.sm-sess-section { padding: 1rem 1.6rem 1.35rem; }
.sm-sess-head {
  display: flex; align-items: center; gap: .6rem; margin-bottom: 1rem;
}
.sm-sess-head-title { font-size: .88rem; font-weight: 800; color: var(--foreground); }
.sm-sess-badge {
  display: inline-flex; align-items: center; justify-content: center;
  height: 20px; min-width: 20px; padding: 0 .4rem; border-radius: 999px;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  color: #fff; font-size: .62rem; font-weight: 800;
}
.sm-no-sess {
  text-align: center; padding: 1.25rem;
  border: 1.5px dashed var(--border); border-radius: .85rem;
  font-size: .8rem; color: var(--muted-foreground);
}

/* Session cards grid */
.sm-sess-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }
@media (max-width: 640px) { .sm-sess-grid { grid-template-columns: 1fr; } }

.sm-sess-card {
  border: 1.5px solid var(--border); border-radius: 1rem;
  background: var(--background); overflow: hidden;
  display: flex; flex-direction: column;
  transition: border-color .18s, box-shadow .18s;
}
.sm-sess-card:hover { border-color: oklch(0.6231 0.1880 259.8145 / .5); box-shadow: 0 4px 16px oklch(0.4882 0.2172 264.3763 / .08); }
.sm-sess-card.joined { border-color: oklch(0.72 0.14 145 / .5); background: oklch(0.97 0.02 145 / .5); }
.sm-sess-card.full   { border-color: oklch(0.75 0.12 27 / .4); opacity: .75; }

/* Session card top bar */
.sm-sess-top {
  padding: .75rem 1rem .6rem;
  display: flex; align-items: flex-start; gap: .65rem;
}
.sm-sess-date-box {
  flex-shrink: 0; display: flex; flex-direction: column; align-items: center;
  padding: .4rem .5rem; border-radius: .6rem; min-width: 44px;
  background: oklch(0.6231 0.1880 259.8145 / .12); border: 1px solid oklch(0.6231 0.1880 259.8145 / .25);
}
.sm-sess-month { font-size: .56rem; font-weight: 700; color: oklch(0.52 0.18 259); text-transform: uppercase; letter-spacing: .04em; }
.sm-sess-day   { font-size: 1.2rem; font-weight: 900; color: oklch(0.4882 0.2172 264.3763); line-height: 1; }
.sm-sess-yr    { font-size: .52rem; color: var(--muted-foreground); font-weight: 600; }
.sm-sess-title-wrap { flex: 1; min-width: 0; }
.sm-sess-subj { font-size: .88rem; font-weight: 800; color: var(--foreground); line-height: 1.25; }
.sm-sess-desc { font-size: .73rem; color: var(--muted-foreground); margin-top: .2rem; line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* Session chips */
.sm-sess-chips { padding: 0 1rem .65rem; display: flex; flex-wrap: wrap; gap: .35rem; }
.sm-chip {
  display: inline-flex; align-items: center; gap: .22rem;
  padding: .2rem .6rem; border-radius: 999px;
  background: var(--muted); border: 1px solid var(--border);
  font-size: .68rem; font-weight: 600; color: var(--muted-foreground);
}

/* Seats row */
.sm-seats-row {
  padding: .6rem 1rem; border-top: 1px solid var(--border);
  display: flex; align-items: center; gap: .65rem;
}
.sm-seats-icons { display: flex; gap: 3px; flex-wrap: wrap; }
.sm-seat { width: 12px; height: 12px; border-radius: 3px; }
.sm-seat-taken { background: oklch(0.4882 0.2172 264.3763); }
.sm-seat-free  { background: var(--border); }
.sm-seats-txt { font-size: .72rem; font-weight: 700; color: var(--muted-foreground); margin-left: auto; white-space: nowrap; }

/* Action footer */
.sm-sess-foot { padding: .65rem 1rem 1rem; }
.sm-btn-join {
  width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  padding: .6rem 1rem; border-radius: .7rem; border: none; cursor: pointer;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  color: #fff; font-size: .82rem; font-weight: 700;
  box-shadow: 0 3px 10px oklch(0.4882 0.2172 264.3763 / .3);
  transition: opacity .18s, transform .15s, box-shadow .18s;
}
.sm-btn-join:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 5px 16px oklch(0.4882 0.2172 264.3763 / .38); }
.sm-btn-join:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
.sm-btn-leave {
  width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  padding: .55rem 1rem; border-radius: .7rem; cursor: pointer;
  background: transparent; border: 1.5px solid var(--border);
  color: var(--muted-foreground); font-size: .78rem; font-weight: 600;
  transition: background .15s; margin-top: .4rem;
}
.sm-btn-leave:hover:not(:disabled) { background: var(--muted); }
.sm-btn-full-tag {
  width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  padding: .58rem 1rem; border-radius: .7rem;
  background: oklch(0.95 0.04 27 / .6); border: 1px solid oklch(0.75 0.12 27 / .4);
  color: oklch(0.48 0.18 27); font-size: .8rem; font-weight: 700;
}
.sm-joined-tag {
  width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  padding: .58rem 1rem; border-radius: .7rem;
  background: oklch(0.91 0.07 145 / .6); border: 1px solid oklch(0.75 0.13 145 / .4);
  color: oklch(0.36 0.18 145); font-size: .8rem; font-weight: 700;
}

/* Empty state */
.sm-empty {
  text-align: center; padding: 4rem 2rem;
  color: var(--muted-foreground);
}

/* Skeleton */
.sm-skel { background: var(--muted); border-radius: 1rem; animation: smSkel 1.5s ease-in-out infinite; }
@keyframes smSkel { 0%,100%{opacity:1} 50%{opacity:.4} }

/* Toast */
.sm-toast {
  position: fixed; bottom: 1.75rem; left: 50%; transform: translateX(-50%);
  background: var(--card); border: 1px solid var(--border); border-radius: 1rem;
  padding: .8rem 1.6rem; font-weight: 600; font-size: .85rem; color: var(--foreground);
  box-shadow: 0 10px 40px oklch(0 0 0 / .18); z-index: 9999; white-space: nowrap;
  animation: smToastIn .25s ease;
}
@keyframes smToastIn { from { opacity:0; transform: translateX(-50%) translateY(8px) } to { opacity:1; transform: translateX(-50%) translateY(0) } }
`

function toInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return {
    month:   d.toLocaleString("en", { month: "short" }),
    day:     d.getDate(),
    year:    d.getFullYear(),
    time:    d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    weekday: d.toLocaleString("en", { weekday: "long" }),
  }
}

function SeatDots({ enrolled, capacity }: { enrolled: number; capacity: number }) {
  return (
    <div className="sm-seats-icons">
      {Array.from({ length: capacity }).map((_, i) => (
        <div key={i} className={`sm-seat ${i < enrolled ? "sm-seat-taken" : "sm-seat-free"}`} />
      ))}
    </div>
  )
}

export default function SupportMentorsPage() {
  const [mentors, setMentors]           = useState<Mentor[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [onlySessions, setOnlySessions] = useState(false)
  const [applying, setApplying]         = useState<number | null>(null)
  const [toast, setToast]               = useState("")

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/support/mentors")
      if (r.ok) setMentors(await r.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3200)
  }

  async function applySession(sessionId: number) {
    setApplying(sessionId)
    try {
      const res  = await fetch(`/api/support/sessions/${sessionId}/apply`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? "Failed to join."); return }
      showToast("✅ Successfully joined the session!")
      setMentors(prev => prev.map(m => ({
        ...m,
        sessions: m.sessions.map(s =>
          s.id === sessionId ? { ...s, hasApplied: true, enrolled: s.enrolled + 1 } : s
        ),
      })))
    } finally { setApplying(null) }
  }

  async function leaveSession(sessionId: number) {
    setApplying(sessionId)
    try {
      const res = await fetch(`/api/support/sessions/${sessionId}/apply`, { method: "DELETE" })
      if (!res.ok) { showToast("Failed to leave session."); return }
      showToast("Left the session.")
      setMentors(prev => prev.map(m => ({
        ...m,
        sessions: m.sessions.map(s =>
          s.id === sessionId ? { ...s, hasApplied: false, enrolled: Math.max(0, s.enrolled - 1) } : s
        ),
      })))
    } finally { setApplying(null) }
  }

  const q        = search.toLowerCase()
  const filtered = mentors.filter(m => {
    const matchSearch = !q
      || m.user.fullName.toLowerCase().includes(q)
      || m.subjects.toLowerCase().includes(q)
      || m.user.faculty.toLowerCase().includes(q)
    const matchSess = !onlySessions || m.sessions.length > 0
    return matchSearch && matchSess
  })

  const totalSessions = mentors.reduce((sum, m) => sum + m.sessions.length, 0)

  return (
    <>
      <style>{CSS}</style>
      <div className="sm-root">

        {/* ── Hero ── */}
        <div className="sm-hero">
          <div className="sm-hero-dots" />
          <div className="sm-hero-glow" />
          <div className="sm-hero-inner">
            <div className="sm-hero-left">
              <div className="sm-hero-eyebrow">Peer Mentorship Program</div>
              <div className="sm-hero-title">Find Your Mentor</div>
              <div className="sm-hero-sub">
                Connect with high-achieving students who can guide you through tough subjects and join their live support sessions.
              </div>
            </div>
            {!loading && (
              <div className="sm-hero-stats">
                <div className="sm-hstat">
                  <span className="sm-hstat-val">{mentors.length}</span>
                  <span className="sm-hstat-lbl">Mentors</span>
                </div>
                <div className="sm-hstat">
                  <span className="sm-hstat-val">{totalSessions}</span>
                  <span className="sm-hstat-lbl">Sessions</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="sm-bar">
          <div className="sm-search-wrap">
            <span className="sm-search-icon">🔍</span>
            <input
              className="sm-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by mentor name, subject or faculty…"
            />
          </div>
          <button
            className={`sm-filter-chip${onlySessions ? " active" : ""}`}
            onClick={() => setOnlySessions(v => !v)}
          >
            📅 Has Open Sessions
          </button>
        </div>

        {/* ── List ── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {[240, 300, 220].map((h, i) => (
              <div key={i} className="sm-skel" style={{ height: h }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="sm-empty">
            <div style={{ fontSize: "3rem", marginBottom: ".75rem" }}>🔭</div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--foreground)", marginBottom: ".35rem" }}>No mentors found</div>
            <div style={{ fontSize: ".85rem" }}>Try a different search term or remove the filter.</div>
          </div>
        ) : (
          <div className="sm-grid">
            {filtered.map(mentor => (
              <div className="sm-card" key={mentor.id}>

                {/* ── Mentor header ── */}
                <div className="sm-card-head">
                  <div className="sm-avatar">
                    {mentor.user.photoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={mentor.user.photoUrl} alt={mentor.user.fullName} />
                      : toInitials(mentor.user.fullName)
                    }
                  </div>
                  <div className="sm-mentor-info">
                    <div className="sm-mentor-name">{mentor.user.fullName}</div>
                    <div className="sm-mentor-sub">{mentor.user.degree} · {mentor.user.faculty}</div>
                    <div className="sm-subj-tags">
                      {mentor.subjects.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                        <span className="sm-subj-tag" key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="sm-mentor-badges">
                    <div className="sm-gpa-pill">
                      <span className="sm-gpa-pill-lbl">GPA</span>
                      <span className="sm-gpa-pill-val">{mentor.gpa.toFixed(2)}</span>
                    </div>
                    {mentor.rating > 0 && (
                      <div className="sm-rating-pill">⭐ {mentor.rating.toFixed(1)}</div>
                    )}
                  </div>
                </div>

                {/* ── Bio ── */}
                {mentor.bio && (
                  <div className="sm-bio-strip">&ldquo;{mentor.bio}&rdquo;</div>
                )}

                {/* ── Info tiles ── */}
                <div className="sm-info-row">
                  <div className="sm-info-tile">
                    <span>📅</span>
                    <span>{mentor.preferredDays || "Flexible schedule"}</span>
                  </div>
                  <div className="sm-info-tile">
                    <span>{mentor.contactPreference === "EMAIL" ? "📧" : "💬"}</span>
                    <span>{mentor.contactPreference === "EMAIL" ? "Email" : "Chat"}</span>
                  </div>
                  <div className="sm-info-tile">
                    <span>🎓</span>
                    <span>{mentor.sessionsCount} sessions held</span>
                  </div>
                </div>

                {/* ── Sessions ── */}
                <div className="sm-sess-section">
                  <div className="sm-sess-head">
                    <span className="sm-sess-head-title">Upcoming Sessions</span>
                    <span className="sm-sess-badge">{mentor.sessions.length}</span>
                  </div>

                  {mentor.sessions.length === 0 ? (
                    <div className="sm-no-sess">📭 No sessions scheduled yet</div>
                  ) : (
                    <div className="sm-sess-grid">
                      {mentor.sessions.map(s => {
                        const d       = fmtDate(s.date)
                        const isFull  = s.enrolled >= s.capacity
                        const isLoading = applying === s.id
                        const free    = s.capacity - s.enrolled

                        return (
                          <div
                            key={s.id}
                            className={`sm-sess-card${s.hasApplied ? " joined" : isFull ? " full" : ""}`}
                          >
                            {/* Top */}
                            <div className="sm-sess-top">
                              <div className="sm-sess-date-box">
                                <span className="sm-sess-month">{d.month}</span>
                                <span className="sm-sess-day">{d.day}</span>
                                <span className="sm-sess-yr">{d.year}</span>
                              </div>
                              <div className="sm-sess-title-wrap">
                                <div className="sm-sess-subj">{s.subject}</div>
                                {s.description && <div className="sm-sess-desc">{s.description}</div>}
                              </div>
                            </div>

                            {/* Chips */}
                            <div className="sm-sess-chips">
                              <span className="sm-chip">📆 {d.weekday}</span>
                              <span className="sm-chip">🕐 {d.time}</span>
                              <span className="sm-chip">⏱ {s.durationMins} min</span>
                              {s.locationOrLink && <span className="sm-chip">🔗 Online</span>}
                            </div>

                            {/* Seat indicators */}
                            <div className="sm-seats-row">
                              <SeatDots enrolled={s.enrolled} capacity={s.capacity} />
                              <span className="sm-seats-txt">
                                {isFull ? "Full" : `${free} seat${free !== 1 ? "s" : ""} left`}
                              </span>
                            </div>

                            {/* Action */}
                            <div className="sm-sess-foot">
                              {s.hasApplied ? (
                                <>
                                  <div className="sm-joined-tag">✅ You&apos;re Joined</div>
                                  <button className="sm-btn-leave" disabled={isLoading} onClick={() => leaveSession(s.id)}>
                                    {isLoading ? "⏳ Leaving…" : "Leave Session"}
                                  </button>
                                </>
                              ) : isFull ? (
                                <div className="sm-btn-full-tag">🔴 Session Full</div>
                              ) : (
                                <button className="sm-btn-join" disabled={isLoading} onClick={() => applySession(s.id)}>
                                  {isLoading ? "⏳ Joining…" : "Join Session"}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="sm-toast">{toast}</div>}
    </>
  )
}
