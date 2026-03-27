"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import { useUserPhoto } from "@/contexts/UserPhotoContext"

const PAGE_META: Record<string, { title: string; icon: string; desc: string }> = {
  "/dashboard":              { title: "Dashboard",        icon: "⊞",  desc: "Your learning overview" },
  "/profile":                { title: "My Profile",       icon: "◉",  desc: "Personal information & achievements" },
  "/materials":              { title: "Study Materials",  icon: "📄", desc: "Upload and manage your documents" },
  "/clubs":                  { title: "Clubs",            icon: "◈",  desc: "Explore and join student clubs" },
  "/support/mentors":        { title: "Support",          icon: "◎",  desc: "Connect with mentors & sessions" },
  "/settings":               { title: "Settings",         icon: "⚙",  desc: "Manage account preferences" },
  "/admin":                  { title: "Admin Dashboard",  icon: "⊞",  desc: "Platform overview & controls" },
  "/admin/users":            { title: "Users",            icon: "◉",  desc: "Manage student accounts" },
  "/admin/clubs":            { title: "Clubs",            icon: "◈",  desc: "Manage club listings" },
  "/admin/club-applications":{ title: "Applications",     icon: "◎",  desc: "Review pending club applications" },
  "/admin/mentors":          { title: "Mentors",          icon: "◎",  desc: "Manage mentor profiles" },
  "/admin/dean-list":        { title: "Dean List",        icon: "★",  desc: "High-achieving students" },
  "/lecturer":               { title: "Lecturer Dashboard", icon: "⊞", desc: "Your teaching overview" },
  "/lecturer/analytics":     { title: "Analytics",        icon: "◫",  desc: "Performance & engagement data" },
}

export default function Topbar({
  name,
  photoUrl: propPhotoUrl,
}: {
  name: string
  photoUrl: string | null
}) {
  const pathname = usePathname()
  const [notifOpen, setNotifOpen] = useState(false)
  const { photoUrl: contextPhotoUrl } = useUserPhoto()

  // Context wins (updated client-side after upload); fall back to server prop
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

  return (
    <>
      <style>{`
        /* ── Root ── */
        .tb-root {
          height: 68px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.5rem;
          background: var(--card, #fff);
          border-bottom: 1px solid var(--border, #e5e7eb);
          position: relative; gap: 1rem;
        }

        /* subtle gradient top accent line */
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
        .tb-left {
          display: flex; align-items: center; gap: .85rem; min-width: 0; flex: 1;
        }
        .tb-page-icon {
          width: 38px; height: 38px; border-radius: .75rem; flex-shrink: 0;
          background: linear-gradient(135deg,
            oklch(0.4882 0.2172 264.3763 / .12),
            oklch(0.6231 0.1880 259.8145 / .06)
          );
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
        .tb-sep {
          width: 1px; height: 28px; flex-shrink: 0;
          background: var(--border, #e5e7eb);
        }

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
        @keyframes tbBlink {
          0%,100% { opacity: 1; } 50% { opacity: .4; }
        }
        .tb-greeting-text {
          font-size: .72rem; font-weight: 600;
          color: oklch(0.4882 0.2172 264.3763);
        }

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
        .tb-search-text {
          font-size: .76rem; color: var(--muted-foreground,#bbb);
          flex: 1; white-space: nowrap;
        }
        .tb-search-kbd {
          font-size: .6rem; font-weight: 700; padding: .1rem .35rem;
          border-radius: .3rem; border: 1px solid var(--border,#e5e7eb);
          color: var(--muted-foreground,#bbb); background: var(--card,#fff);
          font-family: monospace; letter-spacing: .02em;
        }

        /* Icon buttons (bell, etc.) */
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
        .tb-notif-dot {
          position: absolute; top: 8px; right: 8px;
          width: 7px; height: 7px; border-radius: 50%;
          background: oklch(0.6231 0.1880 259.8145);
          border: 2px solid var(--card,#fff);
          animation: tbBlink 2.5s ease-in-out infinite;
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

        @media (max-width: 768px) {
          .tb-search { display: none; }
          .tb-greeting { display: none; }
          .tb-sep { display: none; }
          .tb-user-name { display: none; }
          .tb-user-chip { padding: .28rem; }
        }
        @media (max-width: 480px) {
          .tb-page-icon { display: none; }
          .tb-breadcrumb { display: none; }
        }
      `}</style>

      <header className="tb-root">

        {/* ── Left: page title + breadcrumb ── */}
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

          {/* Greeting pill */}
          <div className="tb-greeting">
            <span className="tb-greeting-dot" />
            <span className="tb-greeting-text">{greeting}, {firstName}!</span>
          </div>
        </div>

        {/* ── Right: search · bell · user ── */}
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
          <div className="tb-icon-btn" onClick={() => setNotifOpen(v => !v)} title="Notifications">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="tb-notif-dot" />
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
