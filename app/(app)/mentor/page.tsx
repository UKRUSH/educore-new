"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"

type MentorProfile = {
  id: number
  gpa: number
  subjects: string
  bio: string
  preferredDays: string | null
  contactPreference: string
  isActive: boolean
  sessionsCount: number
  rating: number
}

type UserInfo = {
  fullName: string
  studentId: string
  faculty: string
  degree: string
  photoUrl: string | null
}

type EnrolledStudent = {
  id: number
  fullName: string
  studentId: string
  faculty: string
  degree: string
  photoUrl: string | null
  joinedAt: string
}

type SupportSession = {
  id: number
  subject: string
  description: string | null
  date: string
  durationMins: number
  locationOrLink: string | null
  capacity: number
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED"
  enrolled: number
  students: EnrolledStudent[]
}

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.mp-root { max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 2rem; }

/* Hero */
.mp-hero {
  border-radius: 1.25rem; overflow: hidden;
  background: linear-gradient(135deg, oklch(0.16 0.09 268), oklch(0.28 0.16 258) 50%, oklch(0.22 0.1 282));
  position: relative;
}
.mp-hero-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, oklch(1 0 0 / .07) 1px, transparent 1px);
  background-size: 20px 20px;
}
.mp-hero-body { position: relative; z-index: 1; padding: 1.75rem 2rem; display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
.mp-hero-avatar {
  width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  border: 3px solid rgba(255,255,255,.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; font-weight: 900; color: #fff; overflow: hidden;
}
.mp-hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
.mp-hero-info { flex: 1; min-width: 0; }
.mp-hero-name { font-size: 1.15rem; font-weight: 900; color: #fff; letter-spacing: -.025em; }
.mp-hero-sid  { font-size: .76rem; color: rgba(255,255,255,.6); font-weight: 600; margin-top: .18rem; }
.mp-hero-deg  { font-size: .78rem; color: rgba(255,255,255,.55); margin-top: .1rem; }
.mp-hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; }
.mp-cgpa-badge {
  display: flex; flex-direction: column; align-items: center;
  padding: .5rem 1rem; border-radius: .85rem;
  background: oklch(0.91 0.08 145 / .9); border: 1.5px solid oklch(0.72 0.14 145 / .5);
}
.mp-cgpa-label { font-size: .6rem; font-weight: 700; color: oklch(0.42 0.18 145); text-transform: uppercase; letter-spacing: .07em; }
.mp-cgpa-val   { font-size: 1.25rem; font-weight: 900; color: oklch(0.30 0.18 145); letter-spacing: -.03em; }
.mp-dl-badge {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .3rem .8rem; border-radius: 999px;
  background: oklch(0.55 0.22 55 / .25); border: 1px solid oklch(0.72 0.18 60 / .5);
  font-size: .72rem; font-weight: 700; color: oklch(0.92 0.12 75);
}

/* Card */
.mp-card {
  border: 1px solid var(--border); border-radius: 1.25rem;
  background: var(--card); overflow: hidden;
  box-shadow: 0 4px 24px oklch(0.4882 0.2172 264.3763 / .07);
}

/* Status banners */
.mp-status-pending {
  display: flex; align-items: center; gap: .75rem;
  padding: .85rem 1.1rem; border-radius: .85rem;
  background: oklch(0.93 0.07 60 / .5); border: 1px solid oklch(0.82 0.12 60 / .5);
  font-size: .82rem; color: oklch(0.44 0.18 55);
}
.mp-status-active {
  display: flex; align-items: center; gap: .75rem;
  padding: .85rem 1.1rem; border-radius: .85rem;
  background: oklch(0.92 0.07 145 / .5); border: 1px solid oklch(0.78 0.12 145 / .5);
  font-size: .82rem; color: oklch(0.38 0.18 145);
}

/* Profile info grid */
.mp-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.mp-info-item { display: flex; flex-direction: column; gap: .15rem; padding: .65rem .85rem; border-radius: .65rem; background: var(--muted); border: 1px solid var(--border); }
.mp-info-label { font-size: .62rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: .05em; }
.mp-info-value { font-size: .85rem; font-weight: 600; color: var(--foreground); }

/* Stats row */
.mp-stats { display: flex; gap: 1rem; }
.mp-stat { flex: 1; text-align: center; padding: .85rem; border-radius: .75rem; border: 1px solid var(--border); background: var(--muted); }
.mp-stat-val { font-size: 1.2rem; font-weight: 900; color: var(--foreground); }
.mp-stat-lbl { font-size: .62rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: .04em; margin-top: .15rem; }

/* Profile card sections */
.mp-profile-header {
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.mp-profile-title { font-size: 1rem; font-weight: 800; color: var(--foreground); display: flex; align-items: center; gap: .5rem; }
.mp-profile-body { padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; }

/* =====================  FORM  ===================== */
.mp-elig-banner {
  padding: 1.25rem 1.75rem;
  background: linear-gradient(120deg, oklch(0.28 0.12 264), oklch(0.32 0.16 258));
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 1rem;
}
.mp-elig-icon {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.60 0.22 55), oklch(0.72 0.18 60));
  border: 1.5px solid oklch(0.82 0.18 60 / .6);
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
}
.mp-elig-text { flex: 1; min-width: 0; }
.mp-elig-title { font-size: .9rem; font-weight: 800; color: #fff; }
.mp-elig-sub { font-size: .78rem; color: rgba(255,255,255,.8); margin-top: .15rem; }

.mp-form-body { padding: 1.75rem; display: flex; flex-direction: column; gap: 1.5rem; }
.mp-step { display: flex; flex-direction: column; gap: 1rem; }
.mp-step-header { display: flex; align-items: center; gap: .65rem; }
.mp-step-num {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  display: flex; align-items: center; justify-content: center;
  font-size: .7rem; font-weight: 900; color: #fff;
}
.mp-step-title { font-size: .92rem; font-weight: 800; color: var(--foreground); }
.mp-step-body { display: flex; flex-direction: column; gap: .9rem; padding-left: 2.25rem; }
.mp-divider { height: 1px; background: var(--border); }
.mp-field { display: flex; flex-direction: column; gap: .4rem; }
.mp-label { font-size: .8rem; font-weight: 700; color: var(--foreground); display: flex; align-items: center; gap: .4rem; }
.mp-label-req { color: oklch(0.55 0.22 27); font-size: .75rem; }
.mp-label-opt { font-size: .72rem; color: var(--muted-foreground); font-weight: 400; }
.mp-hint { font-size: .72rem; color: var(--muted-foreground); }

.mp-input-wrap {
  display: flex; align-items: center; gap: 0;
  border: 1.5px solid var(--border); border-radius: .75rem;
  background: var(--background); overflow: hidden;
  transition: border-color .18s, box-shadow .18s;
}
.mp-input-wrap:focus-within {
  border-color: oklch(0.6231 0.1880 259.8145);
  box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .12);
}
.mp-input-icon {
  padding: 0 .75rem; height: 44px; display: flex; align-items: center;
  font-size: .95rem; background: var(--muted);
  border-right: 1.5px solid var(--border); flex-shrink: 0;
}
.mp-input-bare {
  flex: 1; padding: .7rem .85rem; border: none; outline: none;
  background: transparent; color: var(--foreground);
  font-size: .875rem; font-family: inherit;
}
.mp-textarea-bare {
  width: 100%; padding: .75rem .9rem; border: 1.5px solid var(--border); border-radius: .75rem;
  background: var(--background); color: var(--foreground);
  font-size: .875rem; font-family: inherit; outline: none; resize: vertical; min-height: 90px;
  transition: border-color .18s, box-shadow .18s;
}
.mp-textarea-bare:focus {
  border-color: oklch(0.6231 0.1880 259.8145);
  box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .12);
}
.mp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }

/* Day chips */
.mp-days-grid { display: flex; flex-wrap: wrap; gap: .5rem; }
.mp-day-chip {
  padding: .45rem 1rem; border-radius: 999px; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--muted);
  color: var(--muted-foreground); font-size: .8rem; font-weight: 600;
  transition: all .18s; user-select: none;
}
.mp-day-chip:hover { border-color: oklch(0.6231 0.1880 259.8145); color: var(--foreground); }
.mp-day-chip.active {
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  border-color: transparent; color: #fff;
}

/* Contact preference */
.mp-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
.mp-contact-opt {
  display: flex; align-items: center; gap: .75rem;
  padding: .85rem 1rem; border-radius: .75rem;
  border: 1.5px solid var(--border); background: var(--muted);
  cursor: pointer; transition: all .18s; user-select: none;
}
.mp-contact-opt:hover { border-color: oklch(0.6231 0.1880 259.8145); }
.mp-contact-opt.active { border-color: oklch(0.6231 0.1880 259.8145); background: oklch(0.6231 0.1880 259.8145 / .08); }
.mp-contact-radio {
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid var(--border); display: flex; align-items: center; justify-content: center;
  transition: border-color .15s;
}
.mp-contact-opt.active .mp-contact-radio { border-color: oklch(0.6231 0.1880 259.8145); }
.mp-contact-dot { width: 9px; height: 9px; border-radius: 50%; background: oklch(0.6231 0.1880 259.8145); }
.mp-contact-label { display: flex; flex-direction: column; gap: .08rem; }
.mp-contact-title { font-size: .85rem; font-weight: 700; color: var(--foreground); }
.mp-contact-sub { font-size: .72rem; color: var(--muted-foreground); }

/* Error / success */
.mp-err-box {
  display: flex; align-items: center; gap: .6rem;
  padding: .75rem 1rem; border-radius: .75rem;
  background: oklch(0.95 0.04 27 / .6); border: 1px solid oklch(0.75 0.15 27 / .4);
  font-size: .82rem; color: oklch(0.45 0.22 27); font-weight: 600;
}
.mp-ok-box {
  display: flex; align-items: center; gap: .6rem;
  padding: .75rem 1rem; border-radius: .75rem;
  background: oklch(0.92 0.07 145 / .5); border: 1px solid oklch(0.78 0.12 145 / .5);
  font-size: .82rem; color: oklch(0.38 0.18 145); font-weight: 600;
}

/* Buttons */
.mp-form-footer { padding: 0 1.75rem 1.75rem; display: flex; gap: .75rem; align-items: center; }
.mp-btn-primary {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .72rem 1.75rem; border-radius: .75rem; border: none; cursor: pointer;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  color: #fff; font-size: .9rem; font-weight: 700;
  transition: opacity .18s, transform .15s, box-shadow .18s;
  box-shadow: 0 4px 14px oklch(0.4882 0.2172 264.3763 / .35);
}
.mp-btn-primary:hover { opacity: .92; transform: translateY(-1px); box-shadow: 0 6px 20px oklch(0.4882 0.2172 264.3763 / .4); }
.mp-btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
.mp-btn-secondary {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .72rem 1.25rem; border-radius: .75rem; cursor: pointer;
  background: var(--muted); border: 1.5px solid var(--border);
  color: var(--foreground); font-size: .875rem; font-weight: 600;
  transition: background .15s;
}
.mp-btn-secondary:hover { background: var(--border); }
.mp-btn-sm {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .45rem 1rem; border-radius: .65rem; border: none; cursor: pointer;
  font-size: .8rem; font-weight: 700; transition: all .15s;
}
.mp-btn-sm-blue {
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  color: #fff; box-shadow: 0 2px 8px oklch(0.4882 0.2172 264.3763 / .3);
}
.mp-btn-sm-blue:hover { opacity: .88; transform: translateY(-1px); }
.mp-btn-sm-muted {
  background: var(--muted); border: 1.5px solid var(--border); color: var(--foreground);
}
.mp-btn-sm-muted:hover { background: var(--border); }
.mp-btn-sm-red {
  background: oklch(0.95 0.04 27 / .7); border: 1px solid oklch(0.75 0.15 27 / .4);
  color: oklch(0.45 0.22 27);
}
.mp-btn-sm-red:hover { background: oklch(0.90 0.06 27 / .8); }
.mp-btn-sm-delete {
  background: oklch(0.40 0.22 27); border: 1px solid oklch(0.35 0.22 27);
  color: #fff;
}
.mp-btn-sm-delete:hover { background: oklch(0.35 0.24 27); }

/* ============  SESSIONS  ============ */
.mp-sess-header {
  padding: 1.1rem 1.75rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.mp-sess-title { font-size: .98rem; font-weight: 800; color: var(--foreground); display: flex; align-items: center; gap: .5rem; }
.mp-sess-list { display: flex; flex-direction: column; gap: 0; }
.mp-sess-empty {
  padding: 2.5rem; text-align: center;
  color: var(--muted-foreground); font-size: .85rem;
}
.mp-sess-item {
  padding: 1.1rem 1.75rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: flex-start; gap: 1rem;
}
.mp-sess-item:last-child { border-bottom: none; }
.mp-sess-date-box {
  flex-shrink: 0; width: 52px; display: flex; flex-direction: column; align-items: center;
  padding: .5rem .4rem; border-radius: .75rem;
  background: oklch(0.6231 0.1880 259.8145 / .1); border: 1.5px solid oklch(0.6231 0.1880 259.8145 / .25);
}
.mp-sess-month { font-size: .6rem; font-weight: 700; color: oklch(0.55 0.18 259); text-transform: uppercase; letter-spacing: .06em; }
.mp-sess-day   { font-size: 1.35rem; font-weight: 900; color: oklch(0.4882 0.2172 264.3763); line-height: 1; }
.mp-sess-year  { font-size: .58rem; color: var(--muted-foreground); font-weight: 600; }
.mp-sess-body  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .3rem; }
.mp-sess-subj  { font-size: .9rem; font-weight: 800; color: var(--foreground); }
.mp-sess-desc  { font-size: .78rem; color: var(--muted-foreground); }
.mp-sess-meta  { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .3rem; }
.mp-sess-tag {
  display: inline-flex; align-items: center; gap: .25rem;
  padding: .2rem .6rem; border-radius: 999px;
  background: var(--muted); border: 1px solid var(--border);
  font-size: .7rem; font-weight: 600; color: var(--muted-foreground);
}
.mp-sess-actions { display: flex; gap: .4rem; align-items: center; flex-shrink: 0; }
.mp-status-pill {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .25rem .7rem; border-radius: 999px; font-size: .7rem; font-weight: 700;
}
.mp-pill-upcoming  { background: oklch(0.92 0.07 259 / .5); color: oklch(0.42 0.18 259); border: 1px solid oklch(0.78 0.12 259 / .4); }
.mp-pill-ongoing   { background: oklch(0.92 0.08 145 / .5); color: oklch(0.38 0.18 145); border: 1px solid oklch(0.78 0.12 145 / .4); }
.mp-pill-completed { background: var(--muted); color: var(--muted-foreground); border: 1px solid var(--border); }
.mp-pill-cancelled { background: oklch(0.95 0.04 27 / .5); color: oklch(0.45 0.18 27); border: 1px solid oklch(0.75 0.12 27 / .4); }

/* Create session modal overlay */
.mp-modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: oklch(0 0 0 / .45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.mp-modal {
  background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem;
  width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px oklch(0 0 0 / .3);
}
.mp-modal-head {
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.mp-modal-title { font-size: 1rem; font-weight: 800; color: var(--foreground); }
.mp-modal-close {
  width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
  background: var(--muted); color: var(--muted-foreground); font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.mp-modal-close:hover { background: var(--border); }
.mp-modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.mp-modal-foot { padding: 0 1.5rem 1.5rem; display: flex; gap: .75rem; }

/* ====  Enrolled students panel  ==== */
.mp-students-toggle {
  display: flex; align-items: center; gap: .5rem;
  padding: .42rem .85rem; border-radius: .65rem; cursor: pointer;
  background: var(--muted); border: 1.5px solid var(--border);
  color: var(--foreground); font-size: .75rem; font-weight: 700;
  transition: all .15s; flex-shrink: 0;
}
.mp-students-toggle:hover { border-color: oklch(0.6231 0.1880 259.8145); background: oklch(0.6231 0.1880 259.8145 / .07); }
.mp-students-toggle.open { border-color: oklch(0.6231 0.1880 259.8145); background: oklch(0.6231 0.1880 259.8145 / .1); color: oklch(0.4882 0.2172 264.3763); }
.mp-enroll-count {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%;
  background: oklch(0.6231 0.1880 259.8145); color: #fff; font-size: .6rem; font-weight: 800;
}
.mp-students-panel {
  border-top: 1px solid var(--border);
  background: oklch(0.6231 0.1880 259.8145 / .03);
}
.mp-students-head {
  padding: .65rem 1.75rem; display: flex; align-items: center; gap: .5rem;
  border-bottom: 1px solid var(--border);
  font-size: .78rem; font-weight: 800; color: var(--foreground);
}
.mp-students-list { padding: .65rem 1.75rem; display: flex; flex-direction: column; gap: .55rem; }
.mp-student-row {
  display: flex; align-items: center; gap: .85rem;
  padding: .65rem .85rem; border-radius: .75rem;
  background: var(--card); border: 1px solid var(--border);
}
.mp-student-av {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145));
  display: flex; align-items: center; justify-content: center;
  font-size: .7rem; font-weight: 900; color: #fff; overflow: hidden;
}
.mp-student-av img { width: 100%; height: 100%; object-fit: cover; }
.mp-student-info { flex: 1; min-width: 0; }
.mp-student-name { font-size: .82rem; font-weight: 700; color: var(--foreground); }
.mp-student-meta { font-size: .7rem; color: var(--muted-foreground); margin-top: .08rem; }
.mp-student-sid {
  display: inline-flex; align-items: center;
  padding: .18rem .55rem; border-radius: 999px;
  background: var(--muted); border: 1px solid var(--border);
  font-size: .68rem; font-weight: 700; color: var(--muted-foreground);
}
.mp-no-students {
  padding: 1rem; text-align: center; font-size: .8rem; color: var(--muted-foreground);
  border: 1.5px dashed var(--border); border-radius: .75rem;
}

/* Skeleton */
.mp-skel { background: var(--muted); border-radius: .75rem; animation: mpShimmer 1.5s ease-in-out infinite; }
@keyframes mpShimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
`

function toInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const CONTACT_OPTS = [
  { value: "EMAIL", icon: "📧", title: "Email",  sub: "Receive messages via email" },
  { value: "CHAT",  icon: "💬", title: "Chat",   sub: "Connect through in-app chat" },
]

const STATUS_PILL: Record<string, string> = {
  UPCOMING:  "mp-pill-upcoming",
  ONGOING:   "mp-pill-ongoing",
  COMPLETED: "mp-pill-completed",
  CANCELLED: "mp-pill-cancelled",
}
const STATUS_DOT: Record<string, string> = {
  UPCOMING: "🔵", ONGOING: "🟢", COMPLETED: "⚪", CANCELLED: "🔴",
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return {
    month: d.toLocaleString("en", { month: "short" }),
    day:   d.getDate(),
    year:  d.getFullYear(),
    time:  d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
  }
}

// local datetime string for input value
function toLocalDatetimeStr(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const EMPTY_SESS_FORM = {
  subject: "",
  topic: "",
  description: "",
  date: "",
  durationMins: "60",
  locationOrLink: "",
  capacity: "10",
}

export default function MentorProfilePage() {
  const [userInfo, setUserInfo]   = useState<UserInfo | null>(null)
  const [profile, setProfile]     = useState<MentorProfile | null>(null)
  const [cgpa, setCgpa]           = useState<number>(0)
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState("")
  const [success, setSuccess]     = useState("")

  // profile form
  const [form, setForm] = useState({
    subjects: "",
    bio: "",
    preferredDays: "",
    contactPreference: "EMAIL",
  })

  // sessions
  const [sessions, setSessions]         = useState<SupportSession[]>([])
  const [sessLoading, setSessLoading]   = useState(false)
  const [showModal, setShowModal]       = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [sessForm, setSessForm]         = useState({ ...EMPTY_SESS_FORM })
  const [sessErr, setSessErr]           = useState("")
  const [sessFieldErr, setSessFieldErr] = useState<Record<string, string>>({})
  const [sessSaving, setSessSaving]     = useState(false)
  const [expandedSession, setExpandedSession] = useState<number | null>(null)

  const selectedDays = form.preferredDays
    ? form.preferredDays.split(",").map(d => d.trim()).filter(Boolean)
    : []

  function toggleDay(day: string) {
    const next = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day]
    setForm(f => ({ ...f, preferredDays: next.join(", ") }))
  }

  async function loadSessions() {
    setSessLoading(true)
    try {
      const r = await fetch("/api/mentor/sessions")
      if (r.ok) setSessions(await r.json())
    } finally { setSessLoading(false) }
  }

  useEffect(() => {
    fetch("/api/mentor-profile")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setUserInfo(d.user)
          setCgpa(d.cgpa)
          setProfile(d.mentorProfile)
          if (d.mentorProfile) {
            setForm({
              subjects: d.mentorProfile.subjects,
              bio: d.mentorProfile.bio,
              preferredDays: d.mentorProfile.preferredDays ?? "",
              contactPreference: d.mentorProfile.contactPreference,
            })
            if (d.mentorProfile.isActive) loadSessions()
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit() {
    setErr(""); setSuccess("")
    if (!form.bio.trim())      { setErr("Bio is required."); return }
    if (!form.subjects.trim()) { setErr("Subjects field is required."); return }
    setSaving(true)
    try {
      const method = profile ? "PUT" : "POST"
      const res = await fetch("/api/mentor-profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, gpa: cgpa }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? "Failed."); return }
      setProfile(data)
      setEditing(false)
      setSuccess(profile ? "Profile updated successfully." : "Application submitted! Pending admin approval.")
    } catch { setErr("Something went wrong.") }
    finally { setSaving(false) }
  }

  function validateSessForm() {
    const fe: Record<string, string> = {}
    if (!sessForm.subject) fe.subject = "Please select a subject."
    if (!sessForm.topic.trim()) fe.topic = "Topic is required."
    else if (sessForm.topic.trim().length > 100) fe.topic = "Topic must be 100 characters or fewer."
    if (!sessForm.date) {
      fe.date = "Date & time is required."
    } else if (new Date(sessForm.date) <= new Date()) {
      fe.date = "Session must be scheduled in the future."
    }
    const dur = parseInt(sessForm.durationMins)
    if (isNaN(dur) || dur < 15) fe.durationMins = "Duration must be at least 15 minutes."
    else if (dur > 240) fe.durationMins = "Duration cannot exceed 240 minutes."
    if (!sessForm.locationOrLink.trim()) fe.locationOrLink = "Session link is required."
    else if (!/^https?:\/\/.+/.test(sessForm.locationOrLink.trim())) fe.locationOrLink = "Please enter a valid link starting with http:// or https://"
    const cap = parseInt(sessForm.capacity)
    if (isNaN(cap) || cap < 1) fe.capacity = "At least 1 student is required."
    else if (cap > 10) fe.capacity = "Max students cannot exceed 10 per session."
    return fe
  }

  async function handleSaveSession() {
    setSessErr("")
    const fe = validateSessForm()
    setSessFieldErr(fe)
    if (Object.keys(fe).length > 0) return

    setSessSaving(true)
    const fullSubject = sessForm.topic.trim()
      ? `${sessForm.subject} — ${sessForm.topic.trim()}`
      : sessForm.subject
    try {
      const isEdit = editingSessionId !== null
      const url = isEdit ? `/api/mentor/sessions/${editingSessionId}` : "/api/mentor/sessions"
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sessForm, subject: fullSubject }),
      })
      const data = await res.json()
      if (!res.ok) { setSessErr(data.error ?? "Failed to save session."); return }
      setShowModal(false)
      setEditingSessionId(null)
      setSessForm({ ...EMPTY_SESS_FORM })
      await loadSessions()
    } catch { setSessErr("Something went wrong.") }
    finally { setSessSaving(false) }
  }

  async function cancelSession(id: number) {
    if (!confirm("Cancel this session? Students will be notified.")) return
    await fetch(`/api/mentor/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    })
    await loadSessions()
  }

  async function deleteSession(id: number) {
    if (!confirm("Permanently delete this session? This cannot be undone.")) return
    await fetch(`/api/mentor/sessions/${id}`, { method: "DELETE" })
    setExpandedSession(prev => prev === id ? null : prev)
    await loadSessions()
  }

  function openCreateModal() {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10, 0, 0, 0)
    setSessForm({ ...EMPTY_SESS_FORM, date: toLocalDatetimeStr(tomorrow) })
    setSessErr(""); setSessFieldErr({})
    setEditingSessionId(null)
    setShowModal(true)
  }

  function openEditModal(s: SupportSession) {
    // Parse subject — may be "Subject — Topic" format
    const dashIdx = s.subject.indexOf(" — ")
    const subjectPart = dashIdx >= 0 ? s.subject.slice(0, dashIdx) : s.subject
    const topicPart   = dashIdx >= 0 ? s.subject.slice(dashIdx + 3) : ""
    setSessForm({
      subject:       subjectPart,
      topic:         topicPart,
      description:   s.description ?? "",
      date:          toLocalDatetimeStr(new Date(s.date)),
      durationMins:  String(s.durationMins),
      locationOrLink: s.locationOrLink ?? "",
      capacity:      String(s.capacity),
    })
    setSessErr(""); setSessFieldErr({})
    setEditingSessionId(s.id)
    setShowModal(true)
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="mp-root">
        {loading ? (
          <>
            <div className="mp-skel" style={{ height: 130 }} />
            <div className="mp-skel" style={{ height: 400 }} />
          </>
        ) : !userInfo ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted-foreground)" }}>Failed to load profile.</div>
        ) : (
          <>
            {/* Hero */}
            <div className="mp-hero">
              <div className="mp-hero-dots" />
              <div className="mp-hero-body">
                <div className="mp-hero-avatar">
                  {userInfo.photoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={userInfo.photoUrl} alt={userInfo.fullName} />
                    : toInitials(userInfo.fullName)
                  }
                </div>
                <div className="mp-hero-info">
                  <div className="mp-hero-name">{userInfo.fullName}</div>
                  <div className="mp-hero-sid">{userInfo.studentId}</div>
                  <div className="mp-hero-deg">{userInfo.degree} · {userInfo.faculty}</div>
                </div>
                <div className="mp-hero-right">
                  <div className="mp-cgpa-badge">
                    <span className="mp-cgpa-label">CGPA</span>
                    <span className="mp-cgpa-val">{cgpa.toFixed(2)}</span>
                  </div>
                  <span className="mp-dl-badge">🏆 Dean&apos;s List</span>
                </div>
              </div>
            </div>

            {/* Profile exists — show info */}
            {profile && !editing && (
              <div className="mp-card">
                <div className="mp-profile-header">
                  <div className="mp-profile-title">👤 Mentor Profile</div>
                  <button className="mp-btn-primary" style={{ padding: ".5rem 1.1rem", fontSize: ".82rem" }}
                    onClick={() => { setEditing(true); setSuccess("") }}>
                    ✏️ Edit Profile
                  </button>
                </div>
                <div className="mp-profile-body">
                  {profile.isActive ? (
                    <div className="mp-status-active">✅ Your mentor profile is <strong>Active</strong> — students can book sessions with you.</div>
                  ) : (
                    <div className="mp-status-pending">⏳ Your profile is <strong>pending admin approval</strong>. You will be notified once approved.</div>
                  )}
                  <div className="mp-info-grid">
                    {[
                      { label: "Subjects",           value: profile.subjects },
                      { label: "Contact Preference", value: profile.contactPreference },
                      { label: "Preferred Days",     value: profile.preferredDays || "—" },
                      { label: "GPA",                value: profile.gpa.toFixed(2) },
                    ].map(i => (
                      <div className="mp-info-item" key={i.label}>
                        <span className="mp-info-label">{i.label}</span>
                        <span className="mp-info-value">{i.value}</span>
                      </div>
                    ))}
                    <div className="mp-info-item" style={{ gridColumn: "1 / -1" }}>
                      <span className="mp-info-label">Bio</span>
                      <span className="mp-info-value" style={{ whiteSpace: "pre-wrap" }}>{profile.bio}</span>
                    </div>
                  </div>
                  <div className="mp-stats">
                    <div className="mp-stat">
                      <div className="mp-stat-val">{profile.sessionsCount}</div>
                      <div className="mp-stat-lbl">Sessions</div>
                    </div>
                    <div className="mp-stat">
                      <div className="mp-stat-val">{profile.rating > 0 ? profile.rating.toFixed(1) : "—"}</div>
                      <div className="mp-stat-lbl">Rating</div>
                    </div>
                    <div className="mp-stat">
                      <div className="mp-stat-val" style={{ color: profile.isActive ? "oklch(0.38 0.18 145)" : "oklch(0.5 0.18 55)" }}>
                        {profile.isActive ? "Active" : "Pending"}
                      </div>
                      <div className="mp-stat-lbl">Status</div>
                    </div>
                  </div>
                  {success && <div className="mp-ok-box">✓ {success}</div>}
                </div>
              </div>
            )}

            {/* ====== Support Sessions (only active mentors) ====== */}
            {profile?.isActive && !editing && (
              <div className="mp-card">
                <div className="mp-sess-header">
                  <div className="mp-sess-title">📅 My Support Sessions</div>
                  <button className="mp-btn-primary" style={{ padding: ".55rem 1.1rem", fontSize: ".82rem" }}
                    onClick={openCreateModal}>
                    + Create Session
                  </button>
                </div>

                {sessLoading ? (
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: ".75rem" }}>
                    {[90, 90].map((h, i) => <div key={i} className="mp-skel" style={{ height: h }} />)}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="mp-sess-empty">
                    <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📭</div>
                    <div style={{ fontWeight: 700, color: "var(--foreground)", marginBottom: ".25rem" }}>No sessions yet</div>
                    <div>Create your first support session for students to join.</div>
                  </div>
                ) : (
                  <div className="mp-sess-list">
                    {sessions.map(s => {
                      const d = fmtDate(s.date)
                      const isPast = new Date(s.date) < new Date()
                      return (
                        <div key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          {/* Main row */}
                          <div className="mp-sess-item" style={{ borderBottom: "none" }}>
                            <div className="mp-sess-date-box">
                              <span className="mp-sess-month">{d.month}</span>
                              <span className="mp-sess-day">{d.day}</span>
                              <span className="mp-sess-year">{d.year}</span>
                            </div>
                            <div className="mp-sess-body">
                              <div className="mp-sess-subj">{s.subject}</div>
                              {s.description && <div className="mp-sess-desc">{s.description}</div>}
                              <div className="mp-sess-meta">
                                <span className="mp-sess-tag">🕐 {d.time}</span>
                                <span className="mp-sess-tag">⏱ {s.durationMins} min</span>
                                {s.locationOrLink && <span className="mp-sess-tag">🔗 Session Link</span>}
                                <span className={`mp-status-pill ${STATUS_PILL[s.status]}`}>
                                  {STATUS_DOT[s.status]} {s.status}
                                </span>
                              </div>
                            </div>
                            <div className="mp-sess-actions">
                              {/* Students toggle */}
                              <button
                                className={`mp-students-toggle${expandedSession === s.id ? " open" : ""}`}
                                onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                              >
                                👥
                                <span className="mp-enroll-count">{s.enrolled}</span>
                                / {s.capacity}
                                <span style={{ marginLeft: ".2rem" }}>{expandedSession === s.id ? "▲" : "▼"}</span>
                              </button>
                              {s.status === "UPCOMING" && !isPast && (
                                <>
                                  <button className="mp-btn-sm mp-btn-sm-muted" onClick={() => openEditModal(s)}>
                                    ✏️ Edit
                                  </button>
                                  <button className="mp-btn-sm mp-btn-sm-red" onClick={() => cancelSession(s.id)}>
                                    Cancel
                                  </button>
                                </>
                              )}
                              <button className="mp-btn-sm mp-btn-sm-delete" onClick={() => deleteSession(s.id)}>
                                🗑 Delete
                              </button>
                            </div>
                          </div>

                          {/* Enrolled students panel */}
                          {expandedSession === s.id && (
                            <div className="mp-students-panel">
                              <div className="mp-students-head">
                                👥 Enrolled Students
                                <span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
                                  ({s.enrolled} / {s.capacity} seats filled)
                                </span>
                              </div>
                              <div className="mp-students-list">
                                {s.students.length === 0 ? (
                                  <div className="mp-no-students">No students have joined this session yet.</div>
                                ) : (
                                  s.students.map(st => (
                                    <div className="mp-student-row" key={st.id}>
                                      <div className="mp-student-av">
                                        {st.photoUrl
                                          // eslint-disable-next-line @next/next/no-img-element
                                          ? <img src={st.photoUrl} alt={st.fullName} />
                                          : st.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                                        }
                                      </div>
                                      <div className="mp-student-info">
                                        <div className="mp-student-name">{st.fullName}</div>
                                        <div className="mp-student-meta">{st.degree} · {st.faculty}</div>
                                      </div>
                                      <span className="mp-student-sid">{st.studentId}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Apply / Edit form */}
            {(!profile || editing) && (
              <div className="mp-card">
                {!profile && (
                  <div className="mp-elig-banner">
                    <div className="mp-elig-icon">🎓</div>
                    <div className="mp-elig-text">
                      <div className="mp-elig-title">You&apos;re eligible to become a Peer Mentor!</div>
                      <div className="mp-elig-sub">Dean&apos;s List students can guide others and grow as leaders. Complete the form below to apply.</div>
                    </div>
                  </div>
                )}

                <div className="mp-form-body">
                  {editing && (
                    <div style={{ display: "flex", alignItems: "center", gap: ".65rem", marginBottom: ".25rem" }}>
                      <span style={{ fontSize: "1.05rem" }}>✏️</span>
                      <span style={{ fontSize: ".98rem", fontWeight: 800, color: "var(--foreground)" }}>Edit Mentor Profile</span>
                    </div>
                  )}

                  {err     && <div className="mp-err-box">⚠ {err}</div>}
                  {success && <div className="mp-ok-box">✓ {success}</div>}

                  {/* Step 1 */}
                  <div className="mp-step">
                    <div className="mp-step-header">
                      <div className="mp-step-num">1</div>
                      <div className="mp-step-title">What can you teach?</div>
                    </div>
                    <div className="mp-step-body">
                      <div className="mp-field">
                        <label className="mp-label">
                          Subjects You Can Mentor <span className="mp-label-req">*</span>
                        </label>
                        <div className="mp-input-wrap">
                          <div className="mp-input-icon">📚</div>
                          <input
                            className="mp-input-bare"
                            value={form.subjects}
                            onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))}
                            placeholder="e.g. Data Structures, Calculus, Programming"
                          />
                        </div>
                        <span className="mp-hint">Separate multiple subjects with commas.</span>
                      </div>
                    </div>
                  </div>

                  <div className="mp-divider" />

                  {/* Step 2 */}
                  <div className="mp-step">
                    <div className="mp-step-header">
                      <div className="mp-step-num">2</div>
                      <div className="mp-step-title">Tell students about yourself</div>
                    </div>
                    <div className="mp-step-body">
                      <div className="mp-field">
                        <label className="mp-label">Bio <span className="mp-label-req">*</span></label>
                        <textarea
                          className="mp-textarea-bare"
                          value={form.bio}
                          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                          placeholder="e.g. I am a 3rd year IT student with strong problem-solving skills..."
                          rows={4}
                        />
                        <span className="mp-hint">Share your learning style, strengths, and what makes you a great mentor.</span>
                      </div>
                    </div>
                  </div>

                  <div className="mp-divider" />

                  {/* Step 3 */}
                  <div className="mp-step">
                    <div className="mp-step-header">
                      <div className="mp-step-num">3</div>
                      <div className="mp-step-title">Availability &amp; Contact</div>
                    </div>
                    <div className="mp-step-body">
                      <div className="mp-field">
                        <label className="mp-label">
                          Preferred Days <span className="mp-label-opt">— optional</span>
                        </label>
                        <div className="mp-days-grid">
                          {DAYS.map(day => (
                            <button
                              key={day}
                              type="button"
                              className={`mp-day-chip${selectedDays.includes(day) ? " active" : ""}`}
                              onClick={() => toggleDay(day)}
                            >
                              {selectedDays.includes(day) ? "✓ " : ""}{day}
                            </button>
                          ))}
                        </div>
                        <span className="mp-hint">Click to select the days you&apos;re available for mentoring sessions.</span>
                      </div>

                      <div className="mp-field">
                        <label className="mp-label">How should students contact you?</label>
                        <div className="mp-contact-grid">
                          {CONTACT_OPTS.map(opt => (
                            <div
                              key={opt.value}
                              className={`mp-contact-opt${form.contactPreference === opt.value ? " active" : ""}`}
                              onClick={() => setForm(f => ({ ...f, contactPreference: opt.value }))}
                            >
                              <div className="mp-contact-radio">
                                {form.contactPreference === opt.value && <div className="mp-contact-dot" />}
                              </div>
                              <span style={{ fontSize: "1.1rem" }}>{opt.icon}</span>
                              <div className="mp-contact-label">
                                <span className="mp-contact-title">{opt.title}</span>
                                <span className="mp-contact-sub">{opt.sub}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mp-form-footer">
                  <button className="mp-btn-primary" onClick={handleSubmit} disabled={saving}>
                    {saving ? "⏳ Saving…" : profile ? "💾 Save Changes" : "🚀 Submit Application"}
                  </button>
                  {editing && (
                    <button className="mp-btn-secondary" onClick={() => { setEditing(false); setErr("") }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit Session Modal */}
      {showModal && (
        <div className="mp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setEditingSessionId(null) } }}>
          <div className="mp-modal">
            <div className="mp-modal-head">
              <div className="mp-modal-title">
                {editingSessionId ? "✏️ Edit Support Session" : "📅 Create Support Session"}
              </div>
              <button className="mp-modal-close" onClick={() => { setShowModal(false); setEditingSessionId(null) }}>✕</button>
            </div>

            <div className="mp-modal-body">
              {sessErr && <div className="mp-err-box">⚠ {sessErr}</div>}

              {/* Subject */}
              <div className="mp-field">
                <label className="mp-label">Subject <span className="mp-label-req">*</span></label>
                <div className="mp-input-wrap" style={sessFieldErr.subject ? { borderColor: "oklch(0.6 0.2 27)" } : {}}>
                  <div className="mp-input-icon">📖</div>
                  <select
                    className="mp-input-bare"
                    value={sessForm.subject}
                    onChange={e => { setSessForm(f => ({ ...f, subject: e.target.value })); setSessFieldErr(fe => ({ ...fe, subject: "" })) }}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">— Select a subject —</option>
                    {(profile?.subjects ?? "").split(",").map(s => s.trim()).filter(Boolean).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {sessFieldErr.subject && <span style={{ fontSize: ".72rem", color: "oklch(0.5 0.22 27)", marginTop: ".2rem" }}>⚠ {sessFieldErr.subject}</span>}
              </div>

              {/* Topic */}
              <div className="mp-field">
                <label className="mp-label">Topic <span className="mp-label-req">*</span></label>
                <div className="mp-input-wrap" style={sessFieldErr.topic ? { borderColor: "oklch(0.6 0.2 27)" } : {}}>
                  <div className="mp-input-icon">✏️</div>
                  <input
                    className="mp-input-bare"
                    value={sessForm.topic ?? ""}
                    onChange={e => { setSessForm(f => ({ ...f, topic: e.target.value })); setSessFieldErr(fe => ({ ...fe, topic: "" })) }}
                    placeholder="e.g. Binary Trees, Sorting Algorithms"
                    maxLength={100}
                  />
                </div>
                {sessFieldErr.topic && <span style={{ fontSize: ".72rem", color: "oklch(0.5 0.22 27)", marginTop: ".2rem" }}>⚠ {sessFieldErr.topic}</span>}
              </div>

              {/* Description */}
              <div className="mp-field">
                <label className="mp-label">Description <span className="mp-label-opt">— optional</span></label>
                <textarea
                  className="mp-textarea-bare"
                  value={sessForm.description}
                  onChange={e => setSessForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What will this session cover? Any prerequisites?"
                  rows={3}
                />
              </div>

              {/* Date & Duration */}
              <div className="mp-form-row">
                <div className="mp-field">
                  <label className="mp-label">Date &amp; Time <span className="mp-label-req">*</span></label>
                  <div className="mp-input-wrap" style={sessFieldErr.date ? { borderColor: "oklch(0.6 0.2 27)" } : {}}>
                    <div className="mp-input-icon">🗓</div>
                    <input
                      type="datetime-local"
                      className="mp-input-bare"
                      value={sessForm.date}
                      onChange={e => { setSessForm(f => ({ ...f, date: e.target.value })); setSessFieldErr(fe => ({ ...fe, date: "" })) }}
                    />
                  </div>
                  {sessFieldErr.date && <span style={{ fontSize: ".72rem", color: "oklch(0.5 0.22 27)", marginTop: ".2rem" }}>⚠ {sessFieldErr.date}</span>}
                </div>
                <div className="mp-field">
                  <label className="mp-label">Duration <span className="mp-label-opt">(minutes)</span></label>
                  <div className="mp-input-wrap" style={sessFieldErr.durationMins ? { borderColor: "oklch(0.6 0.2 27)" } : {}}>
                    <div className="mp-input-icon">⏱</div>
                    <input
                      type="number"
                      className="mp-input-bare"
                      value={sessForm.durationMins}
                      min={15} max={240}
                      onChange={e => { setSessForm(f => ({ ...f, durationMins: e.target.value })); setSessFieldErr(fe => ({ ...fe, durationMins: "" })) }}
                    />
                  </div>
                  {sessFieldErr.durationMins && <span style={{ fontSize: ".72rem", color: "oklch(0.5 0.22 27)", marginTop: ".2rem" }}>⚠ {sessFieldErr.durationMins}</span>}
                </div>
              </div>

              {/* Location & Capacity */}
              <div className="mp-form-row">
                <div className="mp-field">
                  <label className="mp-label">Session Link <span className="mp-label-req">*</span></label>
                  <div className="mp-input-wrap" style={sessFieldErr.locationOrLink ? { borderColor: "oklch(0.6 0.2 27)" } : {}}>
                    <div className="mp-input-icon">🔗</div>
                    <input
                      className="mp-input-bare"
                      value={sessForm.locationOrLink}
                      onChange={e => { setSessForm(f => ({ ...f, locationOrLink: e.target.value })); setSessFieldErr(fe => ({ ...fe, locationOrLink: "" })) }}
                      placeholder="https://zoom.us/j/... or Google Meet link"
                      maxLength={300}
                    />
                  </div>
                  {sessFieldErr.locationOrLink && <span style={{ fontSize: ".72rem", color: "oklch(0.5 0.22 27)", marginTop: ".2rem" }}>⚠ {sessFieldErr.locationOrLink}</span>}
                </div>
                <div className="mp-field">
                  <label className="mp-label">Max Students</label>
                  <div className="mp-input-wrap" style={sessFieldErr.capacity ? { borderColor: "oklch(0.6 0.2 27)" } : {}}>
                    <div className="mp-input-icon">👥</div>
                    <input
                      type="number"
                      className="mp-input-bare"
                      value={sessForm.capacity}
                      min={1} max={10}
                      onChange={e => { setSessForm(f => ({ ...f, capacity: e.target.value })); setSessFieldErr(fe => ({ ...fe, capacity: "" })) }}
                    />
                  </div>
                  {sessFieldErr.capacity && <span style={{ fontSize: ".72rem", color: "oklch(0.5 0.22 27)", marginTop: ".2rem" }}>⚠ {sessFieldErr.capacity}</span>}
                </div>
              </div>
            </div>

            <div className="mp-modal-foot">
              <button className="mp-btn-primary" onClick={handleSaveSession} disabled={sessSaving}>
                {sessSaving
                  ? "⏳ Saving…"
                  : editingSessionId ? "💾 Save Changes" : "🚀 Create Session"}
              </button>
              <button className="mp-btn-secondary" onClick={() => { setShowModal(false); setEditingSessionId(null) }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
