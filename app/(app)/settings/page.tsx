"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"

const CSS = `
/* ── Page Shell ── */
.st-page { max-width: 900px; margin: 0 auto; }

/* ── Header ── */
.st-header {
  margin-bottom: 1.75rem;
}
.st-header h1 {
  font-size: clamp(1.4rem, 2.5vw, 1.75rem);
  font-weight: 900; letter-spacing: -.035em;
  color: var(--foreground, #090909); margin-bottom: .25rem;
}
.st-header p { font-size: .85rem; color: var(--muted-foreground, #888); }

/* ── Tab bar ── */
.st-tabs {
  display: flex; gap: .35rem; flex-wrap: wrap;
  border-bottom: 1px solid var(--border, #e5e7eb);
  margin-bottom: 1.75rem; padding-bottom: 0;
}
.st-tab {
  display: flex; align-items: center; gap: .45rem;
  padding: .55rem 1rem; border-radius: .65rem .65rem 0 0;
  font-size: .82rem; font-weight: 600;
  color: var(--muted-foreground, #888);
  background: transparent; border: none; cursor: pointer;
  transition: all .15s; position: relative;
}
.st-tab:hover { color: var(--foreground, #090909); }
.st-tab.active {
  color: oklch(0.4882 0.2172 264.3763);
  background: oklch(0.4882 0.2172 264.3763 / .06);
}
.st-tab.active::after {
  content: "";
  position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  border-radius: 2px 2px 0 0;
}
.st-tab svg { width: 15px; height: 15px; flex-shrink: 0; }

/* ── Card ── */
.st-card {
  background: var(--card, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 1rem; overflow: hidden;
  margin-bottom: 1.25rem;
}
.st-card-head {
  display: flex; align-items: center; gap: .75rem;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid var(--border, #e5e7eb);
}
.st-card-icon {
  width: 36px; height: 36px; border-radius: .65rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
}
.st-card-head h2 { font-size: .95rem; font-weight: 700; color: var(--foreground, #090909); margin: 0; }
.st-card-head p { font-size: .75rem; color: var(--muted-foreground, #888); margin: 0; }
.st-card-body { padding: 1.4rem 1.5rem; }

/* ── Field row ── */
.st-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.st-row.full { grid-template-columns: 1fr; }
@media (max-width: 600px) { .st-row { grid-template-columns: 1fr; } }

.st-field { display: flex; flex-direction: column; gap: .35rem; }
.st-label {
  font-size: .75rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  color: var(--muted-foreground, #666);
}
.st-input {
  padding: .6rem .875rem; border-radius: .65rem;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--background, #fafafa);
  color: var(--foreground, #090909);
  font-size: .875rem; outline: none;
  transition: border-color .15s, box-shadow .15s;
  width: 100%;
}
.st-input:focus {
  border-color: oklch(0.6231 0.1880 259.8145 / .6);
  box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .1);
}
.st-select {
  padding: .6rem .875rem; border-radius: .65rem;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--background, #fafafa);
  color: var(--foreground, #090909);
  font-size: .875rem; outline: none; cursor: pointer;
  transition: border-color .15s; width: 100%;
}
.st-select:focus { border-color: oklch(0.6231 0.1880 259.8145 / .6); }
.st-textarea {
  padding: .65rem .875rem; border-radius: .65rem;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--background, #fafafa);
  color: var(--foreground, #090909);
  font-size: .875rem; outline: none; resize: vertical;
  min-height: 90px; width: 100%;
  transition: border-color .15s, box-shadow .15s;
}
.st-textarea:focus {
  border-color: oklch(0.6231 0.1880 259.8145 / .6);
  box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .1);
}
.st-hint { font-size: .72rem; color: var(--muted-foreground, #aaa); margin-top: .15rem; }

/* ── Avatar section ── */
.st-avatar-row {
  display: flex; align-items: center; gap: 1.25rem;
  padding: 1.25rem 0; border-bottom: 1px solid var(--border, #e5e7eb);
  margin-bottom: 1.25rem;
}
.st-avatar-big {
  width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 900; color: #fff;
  box-shadow: 0 6px 20px oklch(0.4882 0.2172 264.3763 / .3);
  border: 3px solid oklch(0.6231 0.1880 259.8145 / .25);
}
.st-avatar-info { flex: 1; }
.st-avatar-info p { font-size: .82rem; color: var(--muted-foreground, #888); margin: .25rem 0 0; }
.st-avatar-btns { display: flex; gap: .5rem; flex-wrap: wrap; }

/* ── Toggle switch ── */
.st-toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: .875rem 0;
  border-bottom: 1px solid var(--border, #e5e7eb);
}
.st-toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
.st-toggle-row:first-child { padding-top: 0; }
.st-toggle-info h3 { font-size: .875rem; font-weight: 600; color: var(--foreground, #090909); margin: 0 0 .2rem; }
.st-toggle-info p { font-size: .78rem; color: var(--muted-foreground, #888); margin: 0; }
.st-switch {
  position: relative; width: 40px; height: 22px; flex-shrink: 0;
}
.st-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.st-track {
  position: absolute; inset: 0; border-radius: 999px; cursor: pointer;
  background: var(--border, #d1d5db); transition: background .2s;
}
.st-switch input:checked + .st-track { background: oklch(0.4882 0.2172 264.3763); }
.st-track::after {
  content: ""; position: absolute;
  top: 3px; left: 3px; width: 16px; height: 16px;
  border-radius: 50%; background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,.2);
  transition: transform .2s;
}
.st-switch input:checked + .st-track::after { transform: translateX(18px); }

/* ── Theme tiles ── */
.st-themes { display: flex; gap: .75rem; flex-wrap: wrap; }
.st-theme-tile {
  display: flex; flex-direction: column; align-items: center; gap: .55rem;
  padding: .875rem 1.1rem; border-radius: .85rem;
  border: 2px solid var(--border, #e5e7eb);
  background: var(--background, #fafafa);
  cursor: pointer; transition: all .15s; min-width: 90px;
}
.st-theme-tile:hover { border-color: oklch(0.6231 0.1880 259.8145 / .5); }
.st-theme-tile.selected { border-color: oklch(0.4882 0.2172 264.3763); background: oklch(0.4882 0.2172 264.3763 / .06); }
.st-theme-preview { width: 48px; height: 32px; border-radius: .4rem; overflow: hidden; border: 1px solid var(--border, #e5e7eb); }
.st-theme-label { font-size: .72rem; font-weight: 700; color: var(--foreground, #090909); }
.st-theme-check {
  width: 16px; height: 16px; border-radius: 50%;
  background: oklch(0.4882 0.2172 264.3763); display: none;
  align-items: center; justify-content: center;
}
.st-theme-tile.selected .st-theme-check { display: flex; }
.st-theme-check svg { width: 9px; height: 9px; color: #fff; }

/* ── Danger zone ── */
.st-danger { border-color: rgba(239,68,68,.25) !important; }
.st-danger .st-card-head { border-bottom-color: rgba(239,68,68,.2) !important; }
.st-danger-row {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: .875rem 0; border-bottom: 1px solid rgba(239,68,68,.1);
}
.st-danger-row:last-child { border-bottom: none; padding-bottom: 0; }
.st-danger-row:first-child { padding-top: 0; }
.st-danger-row h3 { font-size: .875rem; font-weight: 600; color: #ef4444; margin: 0 0 .2rem; }
.st-danger-row p { font-size: .78rem; color: var(--muted-foreground, #888); margin: 0; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .55rem 1.25rem; border-radius: .65rem;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  color: #fff; font-size: .82rem; font-weight: 700;
  border: none; cursor: pointer; transition: opacity .15s, transform .1s;
  box-shadow: 0 4px 12px oklch(0.4882 0.2172 264.3763 / .3);
}
.btn-primary:hover { opacity: .9; transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
.btn-outline {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .55rem 1.1rem; border-radius: .65rem;
  background: transparent; color: var(--foreground, #090909);
  border: 1px solid var(--border, #e5e7eb);
  font-size: .82rem; font-weight: 600; cursor: pointer;
  transition: all .15s;
}
.btn-outline:hover { border-color: oklch(0.6231 0.1880 259.8145 / .5); background: oklch(0.6231 0.1880 259.8145 / .04); }
.btn-danger {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .5rem 1.1rem; border-radius: .65rem;
  background: transparent; color: #ef4444;
  border: 1px solid rgba(239,68,68,.35);
  font-size: .82rem; font-weight: 600; cursor: pointer;
  transition: all .15s;
}
.btn-danger:hover { background: rgba(239,68,68,.06); border-color: #ef4444; }

/* ── Password strength ── */
.pw-strength { display: flex; gap: 3px; margin-top: .4rem; }
.pw-bar { height: 3px; flex: 1; border-radius: 2px; background: var(--border, #e5e7eb); transition: background .2s; }
.pw-bar.w { background: #ef4444; }
.pw-bar.f { background: #f97316; }
.pw-bar.g { background: #22c55e; }
.pw-bar.s { background: oklch(0.4882 0.2172 264.3763); }

/* ── Save bar ── */
.st-save-bar {
  position: sticky; bottom: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: .875rem 1.5rem;
  background: var(--card, #fff);
  border-top: 1px solid var(--border, #e5e7eb);
  border-radius: 0 0 1rem 1rem;
  gap: 1rem;
}
.st-save-bar p { font-size: .78rem; color: var(--muted-foreground, #888); }

/* ── Saved toast ── */
.st-toast {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999;
  display: flex; align-items: center; gap: .6rem;
  padding: .7rem 1.1rem; border-radius: .85rem;
  background: oklch(0.3244 0.1809 265.6377);
  color: #fff; font-size: .82rem; font-weight: 600;
  box-shadow: 0 8px 32px rgba(0,0,0,.25);
  animation: toastIn .25s ease;
}
@keyframes toastIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
`

const TABS = [
  { id: "account",       label: "Account",       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  { id: "appearance",    label: "Appearance",    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> },
  { id: "notifications", label: "Notifications", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { id: "security",      label: "Security",      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: "privacy",       label: "Privacy",       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { id: "danger",        label: "Danger Zone",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
]

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <label className="st-switch">
      <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />
      <span className="st-track" />
    </label>
  )
}

function pwStrength(pw: string) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

export default function SettingsPage() {
  const [tab, setTab] = useState("account")
  const [theme, setTheme] = useState("system")
  const [accent, setAccent] = useState("blue")
  const [pw, setPw] = useState("")
  const [toast, setToast] = useState(false)

  const strength = pwStrength(pw)
  const barClass = ["", "w", "f", "g", "s"][strength]

  function save() {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  return (
    <>
      <style>{CSS}</style>

      <div className="st-page">
        {/* Header */}
        <div className="st-header">
          <h1>Settings</h1>
          <p>Manage your account preferences, appearance, and security options.</p>
        </div>

        {/* Tabs */}
        <div className="st-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`st-tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Account ── */}
        {tab === "account" && (
          <>
            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon" style={{ background: "oklch(0.4882 0.2172 264.3763 / .1)" }}>👤</div>
                <div>
                  <h2>Profile Information</h2>
                  <p>Update your personal details and public profile</p>
                </div>
              </div>
              <div className="st-card-body">
                {/* Avatar */}
                <div className="st-avatar-row">
                  <div className="st-avatar-big">JD</div>
                  <div className="st-avatar-info">
                    <strong style={{ fontSize: ".875rem", color: "var(--foreground,#090909)" }}>Profile Photo</strong>
                    <p>JPG, GIF or PNG · Max 2 MB</p>
                    <div className="st-avatar-btns" style={{ marginTop: ".6rem" }}>
                      <button className="btn-outline">Upload Photo</button>
                      <button className="btn-outline" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,.3)" }}>Remove</button>
                    </div>
                  </div>
                </div>

                <div className="st-row">
                  <div className="st-field">
                    <label className="st-label">Full Name</label>
                    <input className="st-input" defaultValue="John Doe" />
                  </div>
                  <div className="st-field">
                    <label className="st-label">Student ID</label>
                    <input className="st-input" defaultValue="STU2024001" />
                  </div>
                </div>
                <div className="st-row">
                  <div className="st-field">
                    <label className="st-label">Email Address</label>
                    <input className="st-input" type="email" defaultValue="john@university.edu" />
                  </div>
                  <div className="st-field">
                    <label className="st-label">Phone Number</label>
                    <input className="st-input" type="tel" defaultValue="+60 12 345 6789" />
                  </div>
                </div>
                <div className="st-row">
                  <div className="st-field">
                    <label className="st-label">Faculty</label>
                    <input className="st-input" defaultValue="Faculty of Computer Science" />
                  </div>
                  <div className="st-field">
                    <label className="st-label">Degree Programme</label>
                    <input className="st-input" defaultValue="Bachelor of Computer Science" />
                  </div>
                </div>
                <div className="st-row">
                  <div className="st-field">
                    <label className="st-label">Intake Year</label>
                    <select className="st-select">
                      {[2021,2022,2023,2024,2025].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="st-field">
                    <label className="st-label">Gender</label>
                    <select className="st-select">
                      <option>Male</option><option>Female</option><option>Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="st-row full">
                  <div className="st-field">
                    <label className="st-label">Bio</label>
                    <textarea className="st-textarea" placeholder="Tell us a little about yourself…" />
                    <span className="st-hint">Max 200 characters. Shown on your public profile.</span>
                  </div>
                </div>
              </div>
              <div className="st-save-bar">
                <p>Changes are saved securely to your account.</p>
                <div style={{ display: "flex", gap: ".6rem" }}>
                  <button className="btn-outline">Discard</button>
                  <button className="btn-primary" onClick={save}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Appearance ── */}
        {tab === "appearance" && (
          <>
            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon" style={{ background: "oklch(0.70 0.18 65 / .12)" }}>🎨</div>
                <div><h2>Theme</h2><p>Choose how EduCore looks on your device</p></div>
              </div>
              <div className="st-card-body">
                <div className="st-themes">
                  {[
                    { id: "light",  label: "Light",  top: "#fff",    bottom: "#f3f4f6" },
                    { id: "dark",   label: "Dark",   top: "#0f172a", bottom: "#1e293b" },
                    { id: "system", label: "System", top: "#f3f4f6", bottom: "#1e293b" },
                  ].map(t => (
                    <button key={t.id} className={`st-theme-tile${theme === t.id ? " selected" : ""}`} onClick={() => setTheme(t.id)}>
                      <div className="st-theme-preview" style={{ background: `linear-gradient(180deg, ${t.top} 50%, ${t.bottom} 50%)` }} />
                      <span className="st-theme-label">{t.label}</span>
                      <span className="st-theme-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon" style={{ background: "oklch(0.55 0.20 145 / .12)" }}>🖌️</div>
                <div><h2>Accent Color</h2><p>Pick your preferred highlight color</p></div>
              </div>
              <div className="st-card-body">
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                  {[
                    { id: "blue",   color: "oklch(0.4882 0.2172 264.3763)", label: "Blue" },
                    { id: "purple", color: "oklch(0.55 0.20 290)",          label: "Purple" },
                    { id: "green",  color: "oklch(0.55 0.20 145)",          label: "Green" },
                    { id: "orange", color: "oklch(0.70 0.18 55)",           label: "Orange" },
                    { id: "pink",   color: "oklch(0.60 0.20 345)",          label: "Pink" },
                  ].map(c => (
                    <button key={c.id} onClick={() => setAccent(c.id)} style={{
                      display: "flex", alignItems: "center", gap: ".55rem",
                      padding: ".45rem .9rem", borderRadius: "999px",
                      border: `2px solid ${accent === c.id ? c.color : "var(--border,#e5e7eb)"}`,
                      background: accent === c.id ? `${c.color}1a` : "transparent",
                      cursor: "pointer", transition: "all .15s",
                    }}>
                      <span style={{ width: 14, height: 14, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--foreground,#090909)" }}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon" style={{ background: "oklch(0.60 0.20 320 / .12)" }}>✨</div>
                <div><h2>Display Preferences</h2><p>Adjust layout and visual effects</p></div>
              </div>
              <div className="st-card-body" style={{ padding: "0 1.5rem" }}>
                {[
                  { label: "Compact sidebar",        desc: "Reduce sidebar padding for more content space", def: false },
                  { label: "Animations & transitions", desc: "Enable smooth transitions across the UI",       def: true  },
                  { label: "High contrast mode",      desc: "Increase contrast for better readability",      def: false },
                  { label: "Reduce motion",           desc: "Minimize animations for accessibility",         def: false },
                ].map(r => (
                  <div className="st-toggle-row" key={r.label}>
                    <div className="st-toggle-info"><h3>{r.label}</h3><p>{r.desc}</p></div>
                    <Toggle defaultChecked={r.def} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Notifications ── */}
        {tab === "notifications" && (
          <>
            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon" style={{ background: "oklch(0.6231 0.1880 259.8145 / .12)" }}>🔔</div>
                <div><h2>Email Notifications</h2><p>Choose what emails you want to receive</p></div>
              </div>
              <div className="st-card-body" style={{ padding: "0 1.5rem" }}>
                {[
                  { label: "Club application updates", desc: "Get notified when your applications are reviewed", def: true  },
                  { label: "Material summaries ready",  desc: "Email when your AI summary is complete",         def: true  },
                  { label: "New session slots",         desc: "Alerts when new support sessions open up",       def: false },
                  { label: "Weekly digest",             desc: "Summary of your activity every Monday",          def: true  },
                  { label: "Announcement emails",       desc: "University and system-wide announcements",       def: false },
                ].map(r => (
                  <div className="st-toggle-row" key={r.label}>
                    <div className="st-toggle-info"><h3>{r.label}</h3><p>{r.desc}</p></div>
                    <Toggle defaultChecked={r.def} />
                  </div>
                ))}
              </div>
            </div>

            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon" style={{ background: "oklch(0.55 0.20 145 / .12)" }}>📲</div>
                <div><h2>In-App Notifications</h2><p>Real-time alerts within EduCore</p></div>
              </div>
              <div className="st-card-body" style={{ padding: "0 1.5rem" }}>
                {[
                  { label: "Push notifications",      desc: "Browser push alerts when the tab is in background", def: true  },
                  { label: "Sound effects",            desc: "Play a sound for important notifications",          def: false },
                  { label: "Badge counter on sidebar", desc: "Show unread count on sidebar icons",                def: true  },
                ].map(r => (
                  <div className="st-toggle-row" key={r.label}>
                    <div className="st-toggle-info"><h3>{r.label}</h3><p>{r.desc}</p></div>
                    <Toggle defaultChecked={r.def} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Security ── */}
        {tab === "security" && (
          <>
            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon" style={{ background: "oklch(0.55 0.20 145 / .12)" }}>🔑</div>
                <div><h2>Change Password</h2><p>Use a strong, unique password</p></div>
              </div>
              <div className="st-card-body">
                <div className="st-row full" style={{ marginBottom: ".75rem" }}>
                  <div className="st-field">
                    <label className="st-label">Current Password</label>
                    <input className="st-input" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="st-row">
                  <div className="st-field">
                    <label className="st-label">New Password</label>
                    <input className="st-input" type="password" placeholder="Min 8 characters" value={pw} onChange={e => setPw(e.target.value)} />
                    {pw && (
                      <div className="pw-strength">
                        {[1,2,3,4].map(i => <div key={i} className={`pw-bar${i <= strength ? ` ${barClass}` : ""}`} />)}
                      </div>
                    )}
                    <span className="st-hint">{["","Weak — add uppercase letters","Fair — add a number","Good — add a symbol","Strong password ✓"][strength]}</span>
                  </div>
                  <div className="st-field">
                    <label className="st-label">Confirm New Password</label>
                    <input className="st-input" type="password" placeholder="Repeat new password" />
                  </div>
                </div>
              </div>
              <div className="st-save-bar">
                <p>Password must be at least 8 characters long.</p>
                <button className="btn-primary" onClick={save}>Update Password</button>
              </div>
            </div>

            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon" style={{ background: "oklch(0.70 0.18 65 / .12)" }}>🛡️</div>
                <div><h2>Two-Factor Authentication</h2><p>Add an extra layer of security</p></div>
              </div>
              <div className="st-card-body" style={{ padding: "0 1.5rem" }}>
                {[
                  { label: "Authenticator app (TOTP)", desc: "Use Google Authenticator or Authy",       def: false },
                  { label: "SMS verification",          desc: "Receive a code via text message",         def: false },
                  { label: "Email verification",        desc: "One-time code sent to your email",        def: true  },
                ].map(r => (
                  <div className="st-toggle-row" key={r.label}>
                    <div className="st-toggle-info"><h3>{r.label}</h3><p>{r.desc}</p></div>
                    <Toggle defaultChecked={r.def} />
                  </div>
                ))}
              </div>
            </div>

            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-icon" style={{ background: "oklch(0.4882 0.2172 264.3763 / .1)" }}>📋</div>
                <div><h2>Active Sessions</h2><p>Devices logged into your account</p></div>
              </div>
              <div className="st-card-body">
                {[
                  { device: "Chrome on Windows 11", location: "Kuala Lumpur, MY", time: "Now", current: true },
                  { device: "Safari on iPhone 15",  location: "Kuala Lumpur, MY", time: "2 hours ago", current: false },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: ".75rem 0", borderBottom: i === 0 ? "1px solid var(--border,#e5e7eb)" : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: ".65rem", background: "oklch(0.4882 0.2172 264.3763 / .1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                      {s.device.includes("iPhone") ? "📱" : "💻"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: ".85rem", fontWeight: 600, color: "var(--foreground,#090909)" }}>{s.device}</p>
                      <p style={{ margin: 0, fontSize: ".75rem", color: "var(--muted-foreground,#888)" }}>{s.location} · {s.time}</p>
                    </div>
                    {s.current
                      ? <span style={{ fontSize: ".68rem", fontWeight: 700, padding: ".2rem .6rem", borderRadius: "999px", background: "oklch(0.55 0.20 145 / .12)", color: "oklch(0.45 0.20 145)", border: "1px solid oklch(0.55 0.20 145 / .25)" }}>Current</span>
                      : <button className="btn-danger" style={{ padding: ".35rem .75rem", fontSize: ".75rem" }}>Revoke</button>
                    }
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Privacy ── */}
        {tab === "privacy" && (
          <div className="st-card">
            <div className="st-card-head">
              <div className="st-card-icon" style={{ background: "oklch(0.4882 0.2172 264.3763 / .1)" }}>🔒</div>
              <div><h2>Privacy Controls</h2><p>Manage what others can see about you</p></div>
            </div>
            <div className="st-card-body" style={{ padding: "0 1.5rem" }}>
              {[
                { label: "Public profile",            desc: "Allow other students to view your profile page",  def: true  },
                { label: "Show GPA on profile",       desc: "Display your academic GPA publicly",              def: false },
                { label: "Show club memberships",     desc: "List clubs you have joined on your profile",      def: true  },
                { label: "Allow mentor requests",     desc: "Let mentors reach out to you for sessions",       def: true  },
                { label: "Analytics participation",   desc: "Contribute anonymized data to improve EduCore",   def: true  },
                { label: "Data download available",   desc: "You can request a full export of your data",      def: true  },
              ].map(r => (
                <div className="st-toggle-row" key={r.label}>
                  <div className="st-toggle-info"><h3>{r.label}</h3><p>{r.desc}</p></div>
                  <Toggle defaultChecked={r.def} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Danger Zone ── */}
        {tab === "danger" && (
          <div className="st-card st-danger">
            <div className="st-card-head" style={{ background: "rgba(239,68,68,.04)" }}>
              <div className="st-card-icon" style={{ background: "rgba(239,68,68,.12)", fontSize: "1rem" }}>⚠️</div>
              <div>
                <h2 style={{ color: "#ef4444" }}>Danger Zone</h2>
                <p>These actions are irreversible — proceed with caution</p>
              </div>
            </div>
            <div className="st-card-body">
              {[
                { title: "Export my data",      desc: "Download a full copy of all your EduCore data as JSON.",         btn: "Export",         style: {} },
                { title: "Deactivate account",  desc: "Temporarily hide your account. You can reactivate anytime.",     btn: "Deactivate",     style: {} },
                { title: "Delete account",      desc: "Permanently delete your account and all associated data forever.", btn: "Delete Account", style: { color: "#ef4444", borderColor: "rgba(239,68,68,.4)" } },
              ].map(r => (
                <div className="st-danger-row" key={r.title}>
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.desc}</p>
                  </div>
                  <button className="btn-danger" style={r.style}>{r.btn}</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="st-toast">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Changes saved successfully
        </div>
      )}
    </>
  )
}
