"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { useUserPhoto } from "@/contexts/UserPhotoContext"

const PAGE_META: Record<string, { title: string; icon: string; desc: string }> = {
  "/dashboard":              { title: "Dashboard",        icon: "⊞",  desc: "Your learning overview" },
  "/profile":                { title: "My Profile",       icon: "◉",  desc: "Personal information & achievements" },
  "/materials":              { title: "Study Materials",  icon: "📄", desc: "Upload and manage your documents" },
  "/clubs":                  { title: "Clubs",            icon: "◈",  desc: "Explore and join student clubs" },
  "/support/mentors":        { title: "Support",          icon: "◎",  desc: "Connect with mentors & sessions" },
  "/settings":               { title: "Settings",         icon: "⚙",  desc: "Manage account preferences" },
  "/academic":               { title: "Academic Records", icon: "🎓", desc: "Your semester results & GPA" },
  "/admin":                  { title: "Admin Dashboard",  icon: "⊞",  desc: "Platform overview & controls" },
  "/admin/users":            { title: "Users",            icon: "◉",  desc: "Manage student accounts" },
  "/admin/clubs":            { title: "Clubs",            icon: "◈",  desc: "Manage club listings" },
  "/admin/club-applications":{ title: "Applications",     icon: "◎",  desc: "Review pending club applications" },
  "/admin/mentors":          { title: "Mentors",          icon: "◎",  desc: "Manage mentor profiles" },
  "/admin/dean-list":        { title: "Dean List",        icon: "★",  desc: "High-achieving students" },
  "/lecturer":               { title: "Lecturer Dashboard", icon: "⊞", desc: "Your teaching overview" },
  "/lecturer/analytics":     { title: "Analytics",        icon: "◫",  desc: "Performance & engagement data" },
}

// ── Notification types ─────────────────────────────────────────────────────────

type Notif = {
  id: string
  dbId?: number
  type: string
  icon: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  meta: Record<string, unknown>
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function notifAccent(icon: string) {
  if (icon === "club_approved") return { bg: "oklch(0.91 0.08 145 / .15)", dot: "oklch(0.48 0.18 145)", border: "oklch(0.72 0.14 145 / .3)" }
  if (icon === "club_rejected") return { bg: "oklch(0.93 0.08 25 / .15)",  dot: "oklch(0.50 0.22 25)",  border: "oklch(0.72 0.18 25 / .3)" }
  if (icon === "club_wait")     return { bg: "oklch(0.93 0.08 60 / .15)",  dot: "oklch(0.50 0.18 60)",  border: "oklch(0.72 0.16 60 / .3)" }
  if (icon === "session")       return { bg: "oklch(0.92 0.07 270 / .15)", dot: "oklch(0.48 0.2 270)",  border: "oklch(0.70 0.16 270 / .3)" }
  return { bg: "oklch(0.92 0.06 260 / .15)", dot: "oklch(0.4882 0.2172 264.3763)", border: "oklch(0.6231 0.1880 259.8145 / .3)" }
}

function notifEmoji(icon: string) {
  if (icon === "club_approved") return "✅"
  if (icon === "club_rejected") return "❌"
  if (icon === "club_wait")     return "⏳"
  if (icon === "session")       return "📅"
  if (icon === "academic")      return "🎓"
  if (icon === "system")        return "🔔"
  return "📢"
}

// ── CSS ────────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Root ── */
.tb-root {
  height: 68px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem;
  background: var(--card, #fff);
  border-bottom: 1px solid var(--border, #e5e7eb);
  position: relative; gap: 1rem;
}
.tb-root::after {
  content: "";
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg,
    oklch(0.4882 0.2172 264.3763),
    oklch(0.6231 0.1880 259.8145),
    oklch(0.55 0.20 290)
  );
  opacity: .7;
}

/* ── Left ── */
.tb-left { display: flex; align-items: center; gap: .85rem; min-width: 0; flex: 1; }
.tb-page-icon {
  width: 38px; height: 38px; border-radius: .75rem; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763 / .12), oklch(0.6231 0.1880 259.8145 / .06));
  border: 1px solid oklch(0.6231 0.1880 259.8145 / .18);
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; line-height: 1;
  color: oklch(0.4882 0.2172 264.3763);
}
.tb-title-group { min-width: 0; }
.tb-page-title {
  font-size: .97rem; font-weight: 800; letter-spacing: -.028em;
  color: var(--foreground, #090909); line-height: 1.2;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tb-breadcrumb {
  display: flex; align-items: center; gap: .3rem;
  font-size: .7rem; color: var(--muted-foreground, #999); margin-top: .08rem;
}
.tb-breadcrumb span { font-weight: 500; }
.tb-breadcrumb-sep { opacity: .4; font-size: .65rem; }

/* ── Separator ── */
.tb-sep { width: 1px; height: 28px; flex-shrink: 0; background: var(--border, #e5e7eb); }

/* ── Greeting pill ── */
.tb-greeting {
  display: flex; align-items: center; gap: .45rem;
  padding: .32rem .75rem; border-radius: 999px;
  background: oklch(0.4882 0.2172 264.3763 / .07);
  border: 1px solid oklch(0.4882 0.2172 264.3763 / .14);
  white-space: nowrap;
}
.tb-greeting-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: oklch(0.55 0.20 145); flex-shrink: 0;
  box-shadow: 0 0 6px oklch(0.55 0.20 145 / .6);
  animation: tbBlink 2.5s ease-in-out infinite;
}
@keyframes tbBlink { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
.tb-greeting-text { font-size: .72rem; font-weight: 600; color: oklch(0.4882 0.2172 264.3763); }

/* ── Right group ── */
.tb-right { display: flex; align-items: center; gap: .55rem; flex-shrink: 0; }

/* Search bar */
.tb-search {
  display: flex; align-items: center; gap: .5rem;
  padding: .42rem 1rem; border-radius: 999px;
  background: var(--background, #fafafa);
  border: 1px solid var(--border, #e5e7eb);
  cursor: pointer; transition: all .18s; min-width: 160px;
}
.tb-search:hover {
  border-color: oklch(0.6231 0.1880 259.8145 / .55);
  background: oklch(0.6231 0.1880 259.8145 / .04);
  box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .08);
}
.tb-search svg { width: 13px; height: 13px; color: var(--muted-foreground,#bbb); flex-shrink: 0; }
.tb-search-text { font-size: .76rem; color: var(--muted-foreground,#bbb); flex: 1; white-space: nowrap; }
.tb-search-kbd {
  font-size: .6rem; font-weight: 700; padding: .1rem .35rem;
  border-radius: .3rem; border: 1px solid var(--border,#e5e7eb);
  color: var(--muted-foreground,#bbb); background: var(--card,#fff);
  font-family: monospace; letter-spacing: .02em;
}

/* Icon buttons */
.tb-icon-btn {
  position: relative; width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: .75rem; cursor: pointer;
  border: 1px solid var(--border,#e5e7eb);
  background: var(--background,#fafafa);
  transition: all .18s; flex-shrink: 0;
}
.tb-icon-btn:hover {
  border-color: oklch(0.6231 0.1880 259.8145 / .45);
  background: oklch(0.6231 0.1880 259.8145 / .05);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px oklch(0.4882 0.2172 264.3763 / .1);
}
.tb-icon-btn svg { width: 16px; height: 16px; color: var(--foreground,#555); }
.tb-notif-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 16px; height: 16px; border-radius: 999px;
  background: oklch(0.52 0.22 27); color: #fff;
  font-size: .58rem; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  border: 2px solid var(--card,#fff);
}

/* Avatar chip */
.tb-user-chip {
  display: flex; align-items: center; gap: .55rem;
  padding: .28rem .28rem .28rem .65rem;
  border-radius: 999px;
  border: 1px solid var(--border,#e5e7eb);
  background: var(--background,#fafafa);
  cursor: pointer; transition: all .18s;
}
.tb-user-chip:hover {
  border-color: oklch(0.6231 0.1880 259.8145 / .4);
  background: oklch(0.6231 0.1880 259.8145 / .04);
  box-shadow: 0 2px 10px oklch(0.4882 0.2172 264.3763 / .1);
}
.tb-user-name {
  font-size: .8rem; font-weight: 700;
  color: var(--foreground,#090909);
  white-space: nowrap; max-width: 110px;
  overflow: hidden; text-overflow: ellipsis;
}
.tb-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  display: flex; align-items: center; justify-content: center;
  font-size: .7rem; font-weight: 900; color: #fff;
  overflow: hidden; flex-shrink: 0;
  box-shadow: 0 2px 8px oklch(0.4882 0.2172 264.3763 / .35);
  border: 2px solid oklch(0.6231 0.1880 259.8145 / .3);
}
.tb-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* ── Notification Dropdown ── */
.tb-notif-wrap { position: relative; }
.tb-notif-panel {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 380px; max-height: 520px;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1.1rem;
  box-shadow: 0 12px 40px oklch(0.4882 0.2172 264.3763 / .15), 0 2px 8px oklch(0 0 0 / .08);
  z-index: 200;
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: tbSlideIn .18s ease;
}
@keyframes tbSlideIn {
  from { opacity: 0; transform: translateY(-6px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.tb-notif-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: .9rem 1.1rem .7rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.tb-notif-title { font-size: .9rem; font-weight: 800; color: var(--foreground); }
.tb-notif-count {
  font-size: .68rem; font-weight: 700;
  padding: .18rem .55rem; border-radius: 999px;
  background: oklch(0.52 0.22 27 / .12);
  color: oklch(0.52 0.22 27);
  margin-left: .4rem;
}
.tb-mark-read {
  font-size: .72rem; font-weight: 600;
  color: oklch(0.4882 0.2172 264.3763);
  background: none; border: none; cursor: pointer; padding: .2rem .4rem;
  border-radius: .35rem; transition: background .15s;
}
.tb-mark-read:hover { background: oklch(0.4882 0.2172 264.3763 / .08); }
.tb-notif-list { overflow-y: auto; flex: 1; }
.tb-notif-item {
  display: flex; align-items: flex-start; gap: .75rem;
  padding: .85rem 1.1rem; cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background .15s; position: relative;
}
.tb-notif-item:last-child { border-bottom: none; }
.tb-notif-item:hover { background: oklch(0.4882 0.2172 264.3763 / .04); }
.tb-notif-item.unread { background: oklch(0.4882 0.2172 264.3763 / .03); }
.tb-notif-unread-dot {
  position: absolute; top: 1rem; right: 1rem;
  width: 7px; height: 7px; border-radius: 50%;
  background: oklch(0.4882 0.2172 264.3763);
}
.tb-notif-icon-wrap {
  width: 38px; height: 38px; border-radius: .65rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; border: 1px solid;
}
.tb-notif-body { flex: 1; min-width: 0; }
.tb-notif-item-title { font-size: .8rem; font-weight: 700; color: var(--foreground); line-height: 1.3; }
.tb-notif-item-msg { font-size: .73rem; color: var(--muted-foreground); margin-top: .2rem; line-height: 1.45; }
.tb-notif-item-time { font-size: .65rem; color: var(--muted-foreground); margin-top: .3rem; font-weight: 600; opacity: .7; }
.tb-notif-empty {
  padding: 2.5rem 1rem; text-align: center;
  color: var(--muted-foreground); font-size: .82rem;
}
.tb-notif-empty-icon { font-size: 1.8rem; margin-bottom: .5rem; }
.tb-notif-footer {
  padding: .65rem 1.1rem; border-top: 1px solid var(--border);
  text-align: center; flex-shrink: 0;
}
.tb-notif-footer-btn {
  font-size: .75rem; font-weight: 600;
  color: oklch(0.4882 0.2172 264.3763); background: none; border: none;
  cursor: pointer; padding: .25rem .75rem; border-radius: .5rem;
  transition: background .15s;
}
.tb-notif-footer-btn:hover { background: oklch(0.4882 0.2172 264.3763 / .08); }

/* ── Tabs ── */
.tb-notif-tabs { display: flex; gap: 0; padding: .5rem .75rem; flex-shrink: 0; }
.tb-notif-tab {
  flex: 1; font-size: .74rem; font-weight: 600; text-align: center;
  padding: .35rem .5rem; border-radius: .5rem;
  cursor: pointer; transition: all .15s;
  color: var(--muted-foreground); background: none; border: none;
}
.tb-notif-tab.active {
  background: oklch(0.4882 0.2172 264.3763 / .1);
  color: oklch(0.4882 0.2172 264.3763);
}

/* ── Overlay ── */
.tb-overlay {
  position: fixed; inset: 0; z-index: 100;
}

@media (max-width: 768px) {
  .tb-search { display: none; }
  .tb-greeting { display: none; }
  .tb-sep { display: none; }
  .tb-user-name { display: none; }
  .tb-user-chip { padding: .28rem; }
  .tb-notif-panel { width: 320px; right: -40px; }
}
@media (max-width: 480px) {
  .tb-page-icon { display: none; }
  .tb-breadcrumb { display: none; }
  .tb-notif-panel { width: 290px; }
}
`

// ── Component ──────────────────────────────────────────────────────────────────

export default function Topbar({
  name,
  photoUrl: propPhotoUrl,
}: {
  name: string
  photoUrl: string | null
}) {
  const pathname = usePathname()
  const [notifOpen, setNotifOpen]     = useState(false)
  const [tab, setTab]                 = useState<"all" | "unread">("all")
  const [notifs, setNotifs]           = useState<Notif[]>([])
  const [unread, setUnread]           = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)
  const { photoUrl: contextPhotoUrl } = useUserPhoto()
  const panelRef = useRef<HTMLDivElement>(null)

  const photoUrl = contextPhotoUrl ?? propPhotoUrl
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  const firstName = name.split(" ")[0]

  const pageMeta =
    PAGE_META[pathname] ??
    (/^\/admin\/users\/\d+\/academic/.test(pathname) ? { title: "Academic History", icon: "🎓", desc: "Student semester records" } : null) ??
    Object.entries(PAGE_META).find(([k]) => pathname.startsWith(k + "/"))?.[1] ??
    { title: "", icon: "⊞", desc: "" }

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const fetchNotifs = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifs(data.notifications ?? [])
        setUnread(data.unreadCount ?? 0)
      }
    } catch { /* ignore */ }
    setNotifLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" })
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnread(0)
  }

  async function markOneRead(n: Notif) {
    if (n.isRead) return
    if (n.dbId) {
      await fetch(`/api/notifications/${n.dbId}`, { method: "PATCH" })
    }
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const displayed = tab === "unread" ? notifs.filter(n => !n.isRead) : notifs

  return (
    <>
      <style>{CSS}</style>
      {notifOpen && <div className="tb-overlay" onClick={() => setNotifOpen(false)} />}

      <header className="tb-root">

        {/* ── Left ── */}
        <div className="tb-left">
          <div className="tb-page-icon">{pageMeta.icon}</div>
          <div className="tb-title-group">
            <div className="tb-page-title">{pageMeta.title}</div>
            <div className="tb-breadcrumb">
              <span>EduCore</span>
              <span className="tb-breadcrumb-sep">›</span>
              <span style={{ color: "oklch(0.4882 0.2172 264.3763)", fontWeight: 600 }}>{pageMeta.title}</span>
            </div>
          </div>

          <div className="tb-sep" />

          <div className="tb-greeting">
            <span className="tb-greeting-dot" />
            <span className="tb-greeting-text">{greeting}, {firstName}!</span>
          </div>
        </div>

        {/* ── Right ── */}
        <div className="tb-right">

          {/* Search */}
          <div className="tb-search">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="tb-search-text">Quick search…</span>
            <span className="tb-search-kbd">⌘K</span>
          </div>

          {/* Notification bell */}
          <div className="tb-notif-wrap">
            <div
              className="tb-icon-btn"
              onClick={() => { setNotifOpen(v => !v); if (!notifOpen) fetchNotifs() }}
              title="Notifications"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread > 0 && (
                <span className="tb-notif-badge">{unread > 9 ? "9+" : unread}</span>
              )}
            </div>

            {/* Dropdown Panel */}
            {notifOpen && (
              <div className="tb-notif-panel" ref={panelRef}>

                {/* Header */}
                <div className="tb-notif-header">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span className="tb-notif-title">Notifications</span>
                    {unread > 0 && <span className="tb-notif-count">{unread} new</span>}
                  </div>
                  {unread > 0 && (
                    <button className="tb-mark-read" onClick={markAllRead}>Mark all read</button>
                  )}
                </div>

                {/* Tabs */}
                <div className="tb-notif-tabs">
                  <button className={`tb-notif-tab${tab === "all" ? " active" : ""}`} onClick={() => setTab("all")}>
                    All ({notifs.length})
                  </button>
                  <button className={`tb-notif-tab${tab === "unread" ? " active" : ""}`} onClick={() => setTab("unread")}>
                    Unread ({unread})
                  </button>
                </div>

                {/* List */}
                <div className="tb-notif-list">
                  {notifLoading && notifs.length === 0 ? (
                    <div className="tb-notif-empty">
                      <div style={{ fontSize: ".8rem", color: "var(--muted-foreground)" }}>Loading…</div>
                    </div>
                  ) : displayed.length === 0 ? (
                    <div className="tb-notif-empty">
                      <div className="tb-notif-empty-icon">🔔</div>
                      <div>{tab === "unread" ? "All caught up!" : "No notifications yet."}</div>
                    </div>
                  ) : displayed.map(n => {
                    const accent = notifAccent(n.icon)
                    return (
                      <div
                        key={n.id}
                        className={`tb-notif-item${!n.isRead ? " unread" : ""}`}
                        onClick={() => markOneRead(n)}
                      >
                        <div
                          className="tb-notif-icon-wrap"
                          style={{ background: accent.bg, borderColor: accent.border }}
                        >
                          {notifEmoji(n.icon)}
                        </div>
                        <div className="tb-notif-body">
                          <div className="tb-notif-item-title">{n.title}</div>
                          <div className="tb-notif-item-msg">{n.message}</div>
                          <div className="tb-notif-item-time">{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <span className="tb-notif-unread-dot" />}
                      </div>
                    )
                  })}
                </div>

                {/* Footer */}
                {notifs.length > 0 && (
                  <div className="tb-notif-footer">
                    <button className="tb-notif-footer-btn" onClick={() => setNotifOpen(false)}>
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User chip */}
          <div className="tb-user-chip">
            <span className="tb-user-name">{firstName}</span>
            <div className="tb-avatar">
              {photoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photoUrl} alt={name} />
                : initials
              }
            </div>
          </div>

        </div>
      </header>
    </>
  )
}
