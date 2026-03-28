"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const NAV = [
  { label: "Features",    href: "#features"    },
  { label: "How It Works",href: "#how-it-works" },
  { label: "Testimonials",href: "#testimonials" },
  { label: "Contact",     href: "#contact"      },
];

export default function Navbar() {
  const [open,    setOpen]    = useState(false);
  const [scrolled,setScrolled]= useState(false);
  const [active,  setActive]  = useState("");
  const [banner,  setBanner]  = useState(true);
  const drawerRef = useRef<HTMLDivElement>(null);

  /* scroll spy + shrink */
  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 24);
      for (let i = NAV.length - 1; i >= 0; i--) {
        const el = document.getElementById(NAV[i].href.slice(1));
        if (el && el.getBoundingClientRect().top < 130) {
          setActive(NAV[i].href); return;
        }
      }
      setActive("");
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* outside-click close */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* body scroll lock */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  };

  const bannerH = banner ? 36 : 0;

  return (
    <>
      {/* ─── Announcement strip ───────────────────────────── */}
      <div
        className="fixed left-0 right-0 z-[70] overflow-hidden transition-all duration-500"
        style={{ top: 0, height: bannerH, opacity: banner ? 1 : 0 }}
      >
        <div
          className="h-9 flex items-center justify-center px-10 text-white text-xs font-semibold tracking-wide animate-gradient-pan"
          style={{ background: "linear-gradient(135deg, oklch(0.6231 0.1880 259.8145), oklch(0.4244 0.1809 265.6377), oklch(0.6231 0.1880 259.8145))" }}
        >
          <span className="mr-2">⚡</span>
          EduCore v2 is live — smarter study tools, clubs &amp; progress tracking
          <a
            href="#features"
            className="ml-3 underline underline-offset-2 opacity-80 hover:opacity-100 hidden sm:inline"
          >
            Explore →
          </a>
          <button
            onClick={() => setBanner(false)}
            className="absolute right-4 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Main header ──────────────────────────────────── */}
      <header
        style={{ top: bannerH }}
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-2xl shadow-[0_2px_32px_rgba(0,0,0,0.08)] border-b border-white/60"
            : "bg-transparent"
        }`}
      >
        {/* animated top-border */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
          style={{
            background:
              "linear-gradient(90deg,transparent 0%,oklch(0.6231 0.1880 259.8145) 30%,oklch(0.4882 0.2172 264.3763) 70%,transparent 100%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-[66px]">

          {/* ── Desktop nav ───────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ label, href }) => {
              const isActive = active === href;
              return (
                <button
                  key={href}
                  onClick={() => go(href)}
                  className={`relative px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "text-primary bg-primary/8"
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  {label}
                  <span
                    className={`absolute bottom-[5px] left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-5 bg-primary opacity-100"
                        : "w-0 bg-primary opacity-0 group-hover:w-3 group-hover:opacity-40"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* ── Desktop auth ──────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            {/* Sign In */}
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-foreground/80 rounded-xl border border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10,17 15,12 10,7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sign In
            </Link>

            {/* Sign Up */}
            <Link
              href="/register"
              className="relative inline-flex items-center gap-2 px-5 py-2 text-[13px] font-black text-white rounded-xl overflow-hidden active:scale-95 transition-transform shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg,oklch(0.6231 0.1880 259.8145) 0%,oklch(0.4882 0.2172 264.3763) 100%)",
                boxShadow: "0 4px 24px oklch(0.6231 0.1880 259.8145 / 0.35)",
              }}
            >
              {/* shimmer sweep */}
              <span className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] -translate-x-full animate-shimmer" />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span className="relative z-10">Get Started</span>
              <span className="relative z-10 ml-0.5 text-white/70">→</span>
            </Link>
          </div>

          {/* ── Mobile hamburger ──────────────────────────── */}
          <button
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-xl hover:bg-secondary transition-colors"
            onClick={() => setOpen(v => !v)}
            aria-label="Menu"
          >
            <span className={`block h-[2px] rounded-full bg-foreground transition-all duration-300 ${open ? "w-[22px] rotate-45 translate-y-[7px]" : "w-[22px]"}`} />
            <span className={`block h-[2px] rounded-full bg-foreground transition-all duration-300 ${open ? "w-0 opacity-0" : "w-[15px]"}`} />
            <span className={`block h-[2px] rounded-full bg-foreground transition-all duration-300 ${open ? "w-[22px] -rotate-45 -translate-y-[7px]" : "w-[22px]"}`} />
          </button>
        </div>
      </header>

      {/* ─── Mobile backdrop ─────────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* ─── Mobile drawer ───────────────────────────────── */}
      <div
        ref={drawerRef}
        style={{ top: bannerH }}
        className={`fixed right-0 bottom-0 z-50 w-[290px] md:hidden flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* frosted glass panel */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-2xl border-l border-white/50 shadow-2xl" />

        <div className="relative flex flex-col h-full">
          {/* header */}
          <div className="flex items-center justify-between px-5 h-[66px] border-b border-border/60 shrink-0">
            <span style={{ fontSize:"1rem", fontWeight:800, letterSpacing:"-.03em", color:"var(--foreground)" }}>EduCore</span>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* links */}
          <div className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
            {NAV.map(({ label, href }, i) => (
              <button
                key={href}
                onClick={() => go(href)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-foreground hover:bg-primary/8 hover:text-primary transition-all group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span
                  className="w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-black text-muted-foreground border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-left">{label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            ))}
          </div>

          {/* footer */}
          <div className="px-4 pb-6 pt-4 border-t border-border/60 space-y-3 shrink-0">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-foreground border-2 border-border rounded-2xl hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="relative flex items-center justify-center gap-2 w-full py-3 text-sm font-black text-white rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg,oklch(0.6231 0.1880 259.8145),oklch(0.4882 0.2172 264.3763))",
                boxShadow: "0 4px 20px oklch(0.6231 0.1880 259.8145 / 0.4)",
              }}
            >
              <span className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] -translate-x-full animate-shimmer" />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              <span className="relative z-10">Get Started Free</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
