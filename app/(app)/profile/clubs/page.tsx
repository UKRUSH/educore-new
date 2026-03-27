"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { label: "Overview",  href: "/profile" },
  { label: "Academics", href: "/profile/academics" },
  { label: "Clubs",     href: "/profile/clubs" },
  { label: "Sports",    href: "/profile/sports" },
  { label: "Progress",  href: "/profile/progress" },
]

const CAT_STYLE: Record<string, { bg: string; fg: string; glow: string }> = {
  ACADEMIC:  { bg: "oklch(0.94 0.05 240)", fg: "oklch(0.42 0.18 240)", glow: "oklch(0.6 0.18 240 / 0.3)" },
  SPORTS:    { bg: "oklch(0.94 0.08 145)", fg: "oklch(0.38 0.18 145)", glow: "oklch(0.6 0.18 145 / 0.3)" },
  CULTURAL:  { bg: "oklch(0.94 0.07 300)", fg: "oklch(0.42 0.18 300)", glow: "oklch(0.6 0.18 300 / 0.3)" },
  RELIGIOUS: { bg: "oklch(0.97 0.08 75)",  fg: "oklch(0.48 0.18 75)",  glow: "oklch(0.6 0.18 75 / 0.3)"  },
  OTHER:     { bg: "var(--muted)",          fg: "var(--muted-foreground)", glow: "transparent" },
}

type ClubInfo = { id: number; name: string; category: string; logoUrl: string | null }
type ClubEntry = {
  id: number; role: string; joinedDate: string
  participationPoints: number; isActive: boolean; club: ClubInfo
}

const CSS = `
.cl-wrap { max-width: 900px; margin: 0 auto; }

.cl-hero {
  background: linear-gradient(135deg, oklch(0.28 0.1 295) 0%, oklch(0.22 0.14 285) 100%);
  border-radius: 1rem; padding: 1.5rem 1.75rem;
  position: relative; overflow: hidden; margin-bottom: 1.5rem;
}
.cl-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}
.cl-hero-title { color: #fff; font-size: 1.35rem; font-weight: 700; margin: 0 0 .25rem; }
.cl-hero-sub { color: oklch(0.8 0.05 290); font-size: .875rem; margin: 0; }
.cl-hero-add {
  position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; gap: .45rem;
  background: rgba(255,255,255,0.12); color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: .55rem 1.1rem; border-radius: .65rem;
  font-size: .8rem; font-weight: 600; cursor: pointer;
  backdrop-filter: blur(8px); transition: background .2s;
}
.cl-hero-add:hover { background: rgba(255,255,255,0.22); }

.cl-tabs {
  display: flex; gap: .35rem; margin-bottom: 1.5rem;
  background: var(--card); border: 1px solid var(--border);
  border-radius: .75rem; padding: .35rem; overflow-x: auto;
}
.cl-tab {
  flex-shrink: 0; padding: .45rem 1rem; border-radius: .5rem;
  font-size: .8rem; font-weight: 500; color: var(--muted-foreground);
  text-decoration: none; transition: all .2s; white-space: nowrap;
}
.cl-tab:hover { color: var(--foreground); background: var(--accent); }
.cl-tab.active {
  background: linear-gradient(135deg, oklch(0.5 0.22 295), oklch(0.43 0.24 280));
  color: #fff; font-weight: 600;
  box-shadow: 0 2px 8px oklch(0.5 0.22 295 / 0.4);
}

/* Score card */
.cl-score-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; padding: 1.25rem 1.5rem;
  display: flex; align-items: center; gap: 1.25rem;
  margin-bottom: 1.5rem; position: relative; overflow: hidden;
}
.cl-score-card::before {
  content: '';
  position: absolute; right: -1rem; top: -1rem;
  width: 8rem; height: 8rem; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.6 0.18 295 / 0.12), transparent 70%);
  pointer-events: none;
}
.cl-score-icon {
  width: 3.5rem; height: 3.5rem; border-radius: 50%;
  background: linear-gradient(135deg, oklch(0.88 0.08 295), oklch(0.82 0.1 285));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; flex-shrink: 0;
}
.cl-score-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted-foreground); }
.cl-score-val { font-size: 2.25rem; font-weight: 800; color: var(--foreground); line-height: 1; }
.cl-score-unit { font-size: .875rem; font-weight: 400; color: var(--muted-foreground); }
.cl-score-meta { font-size: .75rem; color: var(--muted-foreground); margin-top: .25rem; }
.cl-score-bar-wrap { flex: 1; display: none; }
@media (min-width: 640px) { .cl-score-bar-wrap { display: block; } }
.cl-score-track { height: .5rem; background: var(--muted); border-radius: 9999px; overflow: hidden; }
.cl-score-fill { height: 100%; border-radius: 9999px; background: linear-gradient(90deg, oklch(0.6 0.2 295), oklch(0.5 0.22 280)); transition: width .6s ease; }
.cl-score-pct { font-size: .72rem; color: var(--muted-foreground); text-align: right; margin-top: .3rem; }

/* Add form */
.cl-form-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem;
}
.cl-form-title { font-size: .9rem; font-weight: 700; color: var(--foreground); margin-bottom: 1.1rem; }
.cl-form-grid { display: grid; grid-template-columns: 1fr; gap: .85rem; margin-bottom: 1rem; }
@media (min-width: 640px) { .cl-form-grid { grid-template-columns: repeat(2, 1fr); } }
.cl-field-label { font-size: .72rem; font-weight: 600; color: var(--muted-foreground); margin-bottom: .4rem; display: block; }
.cl-req { color: oklch(0.55 0.22 25); }
.cl-input {
  width: 100%; border: 1px solid var(--border); background: var(--background);
  border-radius: .55rem; padding: .5rem .75rem; font-size: .83rem;
  color: var(--foreground); outline: none; transition: border-color .2s, box-shadow .2s;
  box-sizing: border-box;
}
.cl-input:focus { border-color: oklch(0.55 0.22 295); box-shadow: 0 0 0 3px oklch(0.55 0.22 295 / 0.15); }
.cl-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .5rem center; background-size: 1rem; padding-right: 2rem; }

.cl-btn-primary {
  display: inline-flex; align-items: center; gap: .4rem;
  background: linear-gradient(135deg, oklch(0.55 0.22 295), oklch(0.47 0.24 280));
  color: #fff; border: none; border-radius: .6rem;
  padding: .55rem 1.25rem; font-size: .83rem; font-weight: 600;
  cursor: pointer; transition: opacity .2s;
}
.cl-btn-primary:hover { opacity: .88; }
.cl-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
.cl-btn-ghost {
  display: inline-flex; align-items: center;
  background: transparent; color: var(--muted-foreground);
  border: 1px solid var(--border); border-radius: .6rem;
  padding: .55rem 1.25rem; font-size: .83rem; font-weight: 500;
  cursor: pointer; transition: background .15s;
}
.cl-btn-ghost:hover { background: var(--accent); color: var(--foreground); }

/* Club grid */
.cl-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 640px) { .cl-grid { grid-template-columns: repeat(2, 1fr); } }

.cl-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; padding: 1.25rem;
  display: flex; flex-direction: column; gap: .9rem;
  transition: box-shadow .2s, border-color .2s;
}
.cl-card:hover { border-color: oklch(0.6 0.18 295 / 0.35); box-shadow: 0 4px 18px oklch(0.5 0.18 295 / 0.08); }

.cl-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; }
.cl-card-left { display: flex; align-items: center; gap: .85rem; }
.cl-avatar {
  width: 2.75rem; height: 2.75rem; border-radius: .6rem;
  background: linear-gradient(135deg, oklch(0.88 0.08 295), oklch(0.82 0.12 280));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; font-weight: 800; color: oklch(0.45 0.22 295);
  flex-shrink: 0;
}
.cl-name { font-weight: 700; font-size: .9rem; color: var(--foreground); line-height: 1.2; }
.cl-badges { display: flex; align-items: center; gap: .4rem; margin-top: .35rem; flex-wrap: wrap; }
.cl-badge {
  font-size: .68rem; font-weight: 600; padding: .15rem .55rem;
  border-radius: .35rem;
}
.cl-active { background: oklch(0.94 0.07 145); color: oklch(0.38 0.18 145); }
.cl-inactive { background: var(--muted); color: var(--muted-foreground); }

.cl-card-actions { display: flex; gap: .25rem; flex-shrink: 0; }
.cl-icon-btn {
  padding: .35rem; border-radius: .4rem; border: none; background: transparent;
  color: var(--muted-foreground); cursor: pointer; display: flex; align-items: center;
  transition: background .15s, color .15s;
}
.cl-icon-btn:hover { background: var(--accent); color: var(--foreground); }
.cl-icon-btn.del:hover { background: oklch(0.95 0.05 25); color: oklch(0.55 0.22 25); }

.cl-card-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; }
.cl-stat { }
.cl-stat-label { font-size: .68rem; color: var(--muted-foreground); }
.cl-stat-val { font-size: .82rem; font-weight: 700; color: var(--foreground); margin-top: .1rem; }
.cl-stat-pts { color: oklch(0.5 0.22 295); }

/* Empty */
.cl-empty { text-align: center; padding: 4rem 1rem; color: var(--muted-foreground); }
.cl-empty-icon { font-size: 2.75rem; margin-bottom: .75rem; }

/* Error */
.cl-err {
  background: oklch(0.97 0.05 25 / 0.5); border: 1px solid oklch(0.85 0.1 25);
  border-radius: .65rem; padding: .75rem 1rem; font-size: .82rem;
  color: oklch(0.5 0.2 25); margin-bottom: 1rem;
}

/* Modal */
.cl-modal-bg {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem; background: rgba(0,0,0,.55);
  backdrop-filter: blur(4px);
}
.cl-modal {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1rem; width: 100%; max-width: 26rem;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  animation: clModalIn .2s ease;
}
@keyframes clModalIn {
  from { opacity: 0; transform: scale(.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.cl-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.4rem; border-bottom: 1px solid var(--border);
}
.cl-modal-title { font-weight: 700; color: var(--foreground); font-size: .95rem; }
.cl-modal-close {
  padding: .3rem; border-radius: .4rem; border: none; background: transparent;
  color: var(--muted-foreground); cursor: pointer;
}
.cl-modal-close:hover { background: var(--accent); color: var(--foreground); }
.cl-modal-body { padding: 1.4rem; display: flex; flex-direction: column; gap: .85rem; }
.cl-modal-actions { display: flex; gap: .5rem; padding-top: .35rem; }

.cl-toggle-row { display: flex; align-items: center; gap: .75rem; }
.cl-toggle {
  position: relative; display: inline-flex; width: 2.75rem; height: 1.5rem;
  border-radius: 9999px; cursor: pointer; border: none;
  transition: background .2s;
}
.cl-toggle-thumb {
  position: absolute; top: .2rem; width: 1.1rem; height: 1.1rem;
  background: white; border-radius: 50%;
  transition: left .2s;
  box-shadow: 0 1px 4px rgba(0,0,0,.2);
}
`

export default function ClubsPage() {
  const pathname = usePathname()
  const [entries, setEntries] = useState<ClubEntry[]>([])
  const [allClubs, setAllClubs] = useState<{ id: number; name: string; category: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ clubId: "", role: "Member", joinedDate: "", participationPoints: "0" })
  const [saving, setSaving] = useState(false)
  const [editEntry, setEditEntry] = useState<ClubEntry | null>(null)

  async function load() {
    setLoading(true)
    const [clubsRes, allRes] = await Promise.all([fetch("/api/profile/clubs"), fetch("/api/clubs")])
    if (clubsRes.ok) setEntries(await clubsRes.json())
    if (allRes.ok) setAllClubs(await allRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const joinedIds = new Set(entries.map((e) => e.club.id))
  const availableClubs = allClubs.filter((c) => !joinedIds.has(c.id))
  const totalPoints = entries.filter((e) => e.isActive).reduce((s, e) => s + e.participationPoints, 0)
  const societyScore = Math.min(totalPoints, 100)
  const activeCount = entries.filter((e) => e.isActive).length

  async function addClub() {
    if (!form.clubId) { setError("Please select a club."); return }
    setSaving(true); setError("")
    const res = await fetch("/api/profile/clubs", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Failed to add club."); setSaving(false); return }
    setEntries((prev) => [data, ...prev])
    setForm({ clubId: "", role: "Member", joinedDate: "", participationPoints: "0" })
    setShowForm(false); setSaving(false)
  }

  async function updateEntry() {
    if (!editEntry) return
    setSaving(true); setError("")
    const res = await fetch(`/api/profile/clubs/${editEntry.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editEntry.role, participationPoints: editEntry.participationPoints, isActive: editEntry.isActive }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Failed to update."); setSaving(false); return }
    setEntries((prev) => prev.map((e) => (e.id === data.id ? data : e)))
    setEditEntry(null); setSaving(false)
  }

  async function deleteEntry(id: number) {
    if (!confirm("Remove this club membership?")) return
    const res = await fetch(`/api/profile/clubs/${id}`, { method: "DELETE" })
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id))
    else setError("Failed to remove club.")
  }

  return (
    <div className="cl-wrap">
      <style>{CSS}</style>

      {/* Hero */}
      <div className="cl-hero">
        <h1 className="cl-hero-title">Club Memberships</h1>
        <p className="cl-hero-sub">Track your club and society involvement.</p>
        {!showForm && (
          <button className="cl-hero-add" onClick={() => setShowForm(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Join Club
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="cl-tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`cl-tab${pathname === t.href ? " active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* Society score */}
      <div className="cl-score-card">
        <div className="cl-score-icon">👥</div>
        <div>
          <p className="cl-score-label">Society Score</p>
          <p className="cl-score-val">{societyScore}<span className="cl-score-unit"> / 100</span></p>
          <p className="cl-score-meta">{activeCount} active club{activeCount !== 1 ? "s" : ""} · {totalPoints} participation pts</p>
        </div>
        <div className="cl-score-bar-wrap">
          <div className="cl-score-track">
            <div className="cl-score-fill" style={{ width: `${societyScore}%` }} />
          </div>
          <p className="cl-score-pct">{societyScore}%</p>
        </div>
      </div>

      {error && <div className="cl-err">{error}</div>}

      {/* Add form */}
      {showForm && (
        <div className="cl-form-card">
          <p className="cl-form-title">Add Club Membership</p>
          <div className="cl-form-grid">
            <div>
              <label className="cl-field-label">Club <span className="cl-req">*</span></label>
              <select className="cl-input cl-select" value={form.clubId}
                onChange={(e) => setForm((p) => ({ ...p, clubId: e.target.value }))}>
                <option value="">Select a club…</option>
                {availableClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="cl-field-label">Role</label>
              <select className="cl-input cl-select" value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                {["Member","Secretary","President","Vice President","Treasurer","Committee"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="cl-field-label">Joined Date</label>
              <input className="cl-input" type="date" value={form.joinedDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm((p) => ({ ...p, joinedDate: e.target.value }))} />
            </div>
            <div>
              <label className="cl-field-label">Participation Points</label>
              <input className="cl-input" type="number" min={0} value={form.participationPoints}
                onChange={(e) => setForm((p) => ({ ...p, participationPoints: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <button className="cl-btn-primary" onClick={addClub} disabled={saving}>{saving ? "Saving…" : "Add Club"}</button>
            <button className="cl-btn-ghost" onClick={() => { setShowForm(false); setForm({ clubId: "", role: "Member", joinedDate: "", participationPoints: "0" }) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Club list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)", fontSize: ".875rem" }}>Loading…</div>
      ) : entries.length === 0 ? (
        <div className="cl-empty">
          <div className="cl-empty-icon">🏛️</div>
          <p style={{ fontWeight: 600, marginBottom: ".25rem" }}>No clubs joined yet.</p>
          <p style={{ fontSize: ".82rem" }}>Add your club memberships to build your society score.</p>
        </div>
      ) : (
        <div className="cl-grid">
          {entries.map((entry) => {
            const cat = CAT_STYLE[entry.club.category] ?? CAT_STYLE.OTHER
            return (
              <div key={entry.id} className="cl-card">
                <div className="cl-card-top">
                  <div className="cl-card-left">
                    <div className="cl-avatar">{entry.club.name.charAt(0)}</div>
                    <div>
                      <p className="cl-name">{entry.club.name}</p>
                      <div className="cl-badges">
                        <span className="cl-badge" style={{ background: cat.bg, color: cat.fg }}>{entry.club.category}</span>
                        <span className={`cl-badge ${entry.isActive ? "cl-active" : "cl-inactive"}`}>
                          {entry.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="cl-card-actions">
                    <button className="cl-icon-btn" onClick={() => setEditEntry({ ...entry })}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button className="cl-icon-btn del" onClick={() => deleteEntry(entry.id)}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="cl-card-stats">
                  <div className="cl-stat">
                    <p className="cl-stat-label">Role</p>
                    <p className="cl-stat-val">{entry.role}</p>
                  </div>
                  <div className="cl-stat">
                    <p className="cl-stat-label">Points</p>
                    <p className="cl-stat-val cl-stat-pts">{entry.participationPoints} pts</p>
                  </div>
                  <div className="cl-stat">
                    <p className="cl-stat-label">Joined</p>
                    <p className="cl-stat-val">{new Date(entry.joinedDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "2-digit" })}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editEntry && (
        <div className="cl-modal-bg">
          <div className="cl-modal">
            <div className="cl-modal-head">
              <span className="cl-modal-title">Edit Membership</span>
              <button className="cl-modal-close" onClick={() => setEditEntry(null)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="cl-modal-body">
              <div>
                <label className="cl-field-label">Club</label>
                <input className="cl-input" value={editEntry.club.name} readOnly style={{ opacity: .6, cursor: "not-allowed" }} />
              </div>
              <div>
                <label className="cl-field-label">Role</label>
                <select className="cl-input cl-select" value={editEntry.role}
                  onChange={(e) => setEditEntry((p) => p ? { ...p, role: e.target.value } : null)}>
                  {["Member","Secretary","President","Vice President","Treasurer","Committee"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cl-field-label">Participation Points</label>
                <input className="cl-input" type="number" min={0} value={editEntry.participationPoints}
                  onChange={(e) => setEditEntry((p) => p ? { ...p, participationPoints: Number(e.target.value) } : null)} />
              </div>
              <div className="cl-toggle-row">
                <label style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--foreground)" }}>Active</label>
                <button
                  type="button"
                  onClick={() => setEditEntry((p) => p ? { ...p, isActive: !p.isActive } : null)}
                  className="cl-toggle"
                  style={{ background: editEntry.isActive ? "oklch(0.55 0.22 295)" : "var(--muted)" }}
                >
                  <span className="cl-toggle-thumb" style={{ left: editEntry.isActive ? "1.35rem" : ".2rem" }} />
                </button>
              </div>
              <div className="cl-modal-actions">
                <button className="cl-btn-primary" onClick={updateEntry} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
                <button className="cl-btn-ghost" onClick={() => setEditEntry(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
