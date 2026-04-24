"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = { label: string; href: string; icon: React.ReactNode; badge?: string }

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  materials: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  ),
  clubs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  applications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  academic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
    </svg>
  ),
  deanList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  mentors: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  ),
}

// ── Nav definitions ────────────────────────────────────────────────────────────

const NAV: Record<string, { section: string; items: NavItem[] }[]> = {
  STUDENT: [
    {
      section: "Main Menu",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: ICONS.dashboard },
        { label: "Profile",   href: "/profile",   icon: ICONS.profile   },
        { label: "Materials", href: "/materials", icon: ICONS.materials },
        { label: "Clubs",     href: "/clubs",     icon: ICONS.clubs     },
        { label: "Support",   href: "/support/mentors", icon: ICONS.support },
      ],
    },
    {
      section: "Academic",
      items: [
        { label: "Academic Records", href: "/academic", icon: ICONS.academic },
      ],
    },
    {
      section: "Time Management",
      items: [
        { label: "My Schedule", href: "/time-management", icon: ICONS.clock },
      ],
    },
    {
      section: "System",
      items: [
        { label: "Settings", href: "/settings", icon: ICONS.settings },
      ],
    },
  ],
  ADMIN: [
    {
      section: "Overview",
      items: [
        { label: "Dashboard", href: "/admin", icon: ICONS.dashboard },
      ],
    },
    {
      section: "Management",
      items: [
        { label: "Users",        href: "/admin/users",             icon: ICONS.users        },
        { label: "Clubs",        href: "/admin/clubs",             icon: ICONS.clubs        },
        { label: "Applications", href: "/admin/club-applications", icon: ICONS.applications },
        { label: "Mentors",      href: "/admin/mentors",           icon: ICONS.mentors      },
      ],
    },
    {
      section: "Academic",
      items: [
        { label: "Dean List", href: "/admin/dean-list", icon: ICONS.deanList },
      ],
    },
    {
      section: "System",
      items: [
        { label: "Settings", href: "/settings", icon: ICONS.settings },
      ],
    },
  ],
  LECTURER: [
    {
      section: "Main Menu",
      items: [
        { label: "Dashboard", href: "/lecturer",           icon: ICONS.dashboard },
        { label: "Materials", href: "/materials",          icon: ICONS.materials },
        { label: "Analytics", href: "/lecturer/analytics", icon: ICONS.chart     },
      ],
    },
    {
      section: "System",
      items: [
        { label: "Settings", href: "/settings", icon: ICONS.settings },
      ],
    },
  ],
}

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  ADMIN:    { label: "Admin",    color: "#f87171", bg: "rgba(239,68,68,.12)",   border: "rgba(239,68,68,.22)",   dot: "#f87171" },
  LECTURER: { label: "Lecturer", color: "#c084fc", bg: "rgba(168,85,247,.12)", border: "rgba(168,85,247,.22)", dot: "#c084fc" },
  STUDENT:  { label: "Student",  color: "#93c5fd", bg: "rgba(96,165,250,.12)", border: "rgba(96,165,250,.22)", dot: "#93c5fd" },
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Sidebar({
  role, name, photoUrl, isDeanList = false, mobileOpen = false, onMobileClose,
}: {
  role: string
  name: string
  photoUrl: string | null
  isDeanList?: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const pathname = usePathname()
  const baseSections = NAV[role] ?? NAV.STUDENT
  const sections = (role === "STUDENT" && isDeanList)
    ? baseSections.map(s =>
        s.section === "Academic"
          ? {
              ...s,
              items: [
                ...s.items,
                { label: "My Mentor Profile", href: "/mentor", icon: ICONS.mentors } as NavItem,
              ],
            }
          : s
      )
    : baseSections
  const meta     = ROLE_META[role] ?? ROLE_META.STUDENT
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()

  function isActive(href: string) {
    if (href === "/admin" || href === "/lecturer" || href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      <style>{`
        /* ═══════ ROOT ═══════ */
        .sb-root {
          width: 252px; flex-shrink: 0;
          display: flex; flex-direction: column;
          background: var(--sidebar, #fff);
          border-right: 1px solid var(--sidebar-border, #e5e7eb);
          height: 100vh; overflow: hidden;
        }

        /* ═══════ BANNER ═══════ */
        .sb-banner {
          position: relative; flex-shrink: 0; overflow: hidden;
          height: 64px; display: flex; align-items: center; padding: 0 1.1rem;
          background: linear-gradient(135deg,
            oklch(0.3244 0.1809 265.6377) 0%,
            oklch(0.4882 0.2172 264.3763) 55%,
            oklch(0.5800 0.2000 260) 100%
          );
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .sb-banner::before {
          content:""; position:absolute; inset:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px);
          background-size:28px 28px;
        }
        .sb-banner::after {
          content:""; position:absolute; top:-40px; right:-40px;
          width:150px; height:150px; border-radius:50%; pointer-events:none;
          background:radial-gradient(circle,oklch(0.70 0.18 260 / .45) 0%,transparent 70%);
          animation:sbPulse 4s ease-in-out infinite;
        }
        @keyframes sbPulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }
        .sb-orb2 {
          position:absolute; bottom:-30px; left:-20px;
          width:110px; height:110px; border-radius:50%; pointer-events:none;
          background:radial-gradient(circle,oklch(0.45 0.22 280 / .4) 0%,transparent 70%);
        }
        .sb-logo-row { position:relative; z-index:2; display:flex; align-items:center; gap:.7rem; width:100%; }
        .sb-logo-box {
          width:44px; height:44px; border-radius:12px; flex-shrink:0;
          background:#fff; border:none;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 10px rgba(0,0,0,.25);
          overflow:hidden;
        }
        .sb-logo-box img { width:40px; height:40px; object-fit:contain; }
        .sb-brand-text { font-size:1.05rem; font-weight:900; letter-spacing:-.04em; color:#fff; line-height:1; }
        .sb-brand-text em { font-style:normal; opacity:.7; font-weight:600; }
        .sb-dots {
          position:absolute; z-index:1; top:50%; right:14px; transform:translateY(-50%);
          display:grid; grid-template-columns:repeat(4,6px); gap:5px; opacity:.25;
        }
        .sb-dots span { width:4px; height:4px; border-radius:50%; background:#fff; }

        /* ═══════ ROLE BANNER (admin only) ═══════ */
        .sb-role-banner {
          flex-shrink:0; padding:.55rem .9rem;
          background:linear-gradient(90deg,
            oklch(0.22 0.1 265 / .06),
            oklch(0.4 0.16 260 / .03)
          );
          border-bottom:1px solid var(--sidebar-border,#e5e7eb);
          display:flex; align-items:center; gap:.55rem;
        }
        .sb-role-avatar {
          width:28px; height:28px; border-radius:50%; flex-shrink:0;
          background:linear-gradient(135deg,oklch(0.4882 0.2172 264.3763),oklch(0.62 0.19 258));
          display:flex; align-items:center; justify-content:center;
          font-size:.6rem; font-weight:900; color:#fff; overflow:hidden;
          border:1.5px solid oklch(0.62 0.19 258 / .3);
        }
        .sb-role-avatar img { width:100%; height:100%; object-fit:cover; }
        .sb-role-name { font-size:.78rem; font-weight:700; color:var(--foreground,#090909); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0; }
        .sb-role-badge {
          display:inline-flex; align-items:center; gap:.22rem;
          padding:.13rem .48rem; border-radius:999px;
          font-size:.6rem; font-weight:800; flex-shrink:0;
        }
        .sb-role-dot { width:4px; height:4px; border-radius:50%; }

        /* ═══════ NAV ═══════ */
        .sb-nav {
          flex:1; overflow-y:auto; padding:.6rem .7rem;
          display:flex; flex-direction:column; gap:.12rem;
        }
        .sb-nav::-webkit-scrollbar { width:3px; }
        .sb-nav::-webkit-scrollbar-thumb { background:var(--sidebar-border,#e5e7eb); border-radius:3px; }
        .sb-section-label {
          font-size:.58rem; font-weight:800; letter-spacing:.13em; text-transform:uppercase;
          color:var(--muted-foreground,#9ca3af); padding:.6rem .65rem .22rem; margin-top:.25rem;
        }
        .sb-section-label:first-child { margin-top:0; }
        .sb-item {
          position:relative; display:flex; align-items:center; gap:.7rem;
          padding:.55rem .7rem; border-radius:.75rem; text-decoration:none;
          font-size:.84rem; font-weight:500; color:var(--sidebar-foreground,#555);
          transition:all .17s ease; border:1px solid transparent; overflow:hidden;
        }
        .sb-item:hover {
          background:var(--sidebar-accent,#f3f4f6); color:var(--foreground,#090909);
          border-color:var(--sidebar-border,#e5e7eb); transform:translateX(3px);
        }
        .sb-item.active {
          background:linear-gradient(90deg,
            oklch(0.4882 0.2172 264.3763 / .13) 0%,
            oklch(0.6231 0.1880 259.8145 / .05) 100%
          );
          color:oklch(0.4882 0.2172 264.3763); border-color:oklch(0.6231 0.1880 259.8145 / .22); font-weight:700;
        }
        .sb-item.active::before {
          content:""; position:absolute; left:0; top:18%; bottom:18%;
          width:3px; border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,oklch(0.4882 0.2172 264.3763),oklch(0.6231 0.1880 259.8145));
          box-shadow:0 0 8px oklch(0.4882 0.2172 264.3763 / .5);
        }
        .sb-item.active::after {
          content:""; position:absolute; inset:0;
          background:linear-gradient(90deg,transparent 60%,oklch(0.6231 0.1880 259.8145 / .06) 100%);
          pointer-events:none;
        }
        .sb-icon {
          width:32px; height:32px; flex-shrink:0; border-radius:.55rem;
          display:flex; align-items:center; justify-content:center;
          background:transparent; transition:all .17s ease; position:relative; z-index:1;
        }
        .sb-icon svg { width:16px; height:16px; }
        .sb-item.active .sb-icon {
          background:linear-gradient(135deg,oklch(0.4882 0.2172 264.3763),oklch(0.6231 0.1880 259.8145));
          box-shadow:0 4px 12px oklch(0.4882 0.2172 264.3763 / .35); color:#fff;
        }
        .sb-item:not(.active):hover .sb-icon {
          background:oklch(0.4882 0.2172 264.3763 / .08); color:oklch(0.4882 0.2172 264.3763);
        }

        /* dean list item special highlight */
        .sb-item.dean-item:not(.active):hover .sb-icon {
          background:oklch(0.6 0.2 55 / .15); color:oklch(0.5 0.2 55);
        }
        .sb-item.dean-item.active .sb-icon {
          background:linear-gradient(135deg,oklch(0.58 0.22 55),oklch(0.68 0.2 65));
          box-shadow:0 4px 12px oklch(0.6 0.2 55 / .4);
        }
        .sb-item.dean-item.active {
          background:linear-gradient(90deg,oklch(0.6 0.2 55 / .1) 0%,oklch(0.7 0.18 65 / .04) 100%);
          color:oklch(0.5 0.2 55); border-color:oklch(0.68 0.2 60 / .25);
        }
        .sb-item.dean-item.active::before {
          background:linear-gradient(180deg,oklch(0.58 0.22 55),oklch(0.68 0.2 65));
          box-shadow:0 0 8px oklch(0.6 0.2 55 / .5);
        }

        .sb-item-label { position:relative; z-index:1; }
        .sb-badge {
          margin-left:auto; font-size:.58rem; font-weight:800;
          background:oklch(0.4882 0.2172 264.3763); color:#fff;
          padding:.12rem .42rem; border-radius:999px; min-width:17px;
          text-align:center; position:relative; z-index:1;
        }
        .sb-divider {
          height:1px;
          background:linear-gradient(90deg,transparent,var(--sidebar-border,#e5e7eb),transparent);
          margin:.3rem .5rem;
        }

        /* ═══════ FOOTER ═══════ */
        .sb-footer { padding:.6rem .7rem .7rem; flex-shrink:0; border-top:1px solid var(--sidebar-border,#e5e7eb); }
        .sb-logout {
          width:100%; display:flex; align-items:center; gap:.7rem;
          padding:.55rem .7rem; border-radius:.75rem; border:1px solid transparent;
          background:transparent; cursor:pointer; font-size:.84rem; font-weight:500;
          color:var(--sidebar-foreground,#555); transition:all .17s ease; text-align:left;
        }
        .sb-logout:hover {
          background:rgba(239,68,68,.07); color:#ef4444;
          border-color:rgba(239,68,68,.18); transform:translateX(2px);
        }
        .sb-logout:hover .sb-icon { background:rgba(239,68,68,.1); color:#ef4444; }

        /* ═══════ MOBILE CLOSE BTN ═══════ */
        .sb-mobile-close {
          display:none; position:absolute; top:.75rem; right:.75rem;
          width:32px; height:32px; border-radius:.5rem;
          background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
          color:#fff; cursor:pointer; align-items:center; justify-content:center;
          z-index:3;
        }
        .sb-mobile-close svg { width:16px; height:16px; }

        /* ═══════ MOBILE RESPONSIVE ═══════ */
        @media (max-width: 768px) {
          .sb-root {
            position: fixed;
            left: 0; top: 0; bottom: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform .25s cubic-bezier(.4,0,.2,1);
            box-shadow: none;
          }
          .sb-root.mobile-open {
            transform: translateX(0);
            box-shadow: 4px 0 40px rgba(0,0,0,.2);
          }
          .sb-mobile-close { display:flex; }
        }
      `}</style>

      <aside className={`sb-root${mobileOpen ? " mobile-open" : ""}`}>

        {/* ── Mobile close button ── */}
        <button className="sb-mobile-close" onClick={onMobileClose} aria-label="Close menu">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Banner ── */}
        <div className="sb-banner">
          <div className="sb-dots">{Array.from({length:12}).map((_,i)=><span key={i}/>)}</div>
          <div className="sb-logo-row">
            <div className="sb-logo-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo_icon.png" alt="EduCore" />
            </div>
            <div className="sb-brand-text">Edu<em>Core</em></div>
          </div>
        </div>

        {/* ── Admin user chip (admin only) ── */}
        {role === "ADMIN" && (
          <div className="sb-role-banner">
            <div className="sb-role-avatar">
              {photoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photoUrl} alt={name} />
                : initials
              }
            </div>
            <span className="sb-role-name">{name.split(" ")[0]}</span>
            <span className="sb-role-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
              <span className="sb-role-dot" style={{ background: meta.dot }} />
              {meta.label}
            </span>
          </div>
        )}

        {/* ── Nav ── */}
        <nav className="sb-nav">
          {sections.map((section, si) => (
            <div key={si}>
              {si > 0 && <div className="sb-divider" />}
              <div className="sb-section-label">{section.section}</div>
              {section.items.map((item) => {
                const active = isActive(item.href)
                const isDean = item.href === "/admin/dean-list"
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sb-item${active ? " active" : ""}${isDean ? " dean-item" : ""}`}
                  >
                    <span className="sb-icon">{item.icon}</span>
                    <span className="sb-item-label">{item.label}</span>
                    {item.badge && <span className="sb-badge">{item.badge}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── Sign out ── */}
        <div className="sb-footer">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="sb-logout">
              <span className="sb-icon">{ICONS.logout}</span>
              Sign out
            </button>
          </form>
        </div>

      </aside>
    </>
  )
}
