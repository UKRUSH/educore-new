"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo } from "react"
import QRScannerModal from "@/components/QRScannerModal"

// ── Types ────────────────────────────────────────────────────────────────────

type Application = { id: number; status: string }
type Member      = { id: number; isActive: boolean; role: string }

type FullApplication = {
  id: number; status: string; clubId: number;
  motivation: string; currentYear: number | null;
  currentSemester: number | null; gpa: number | null;
  contribution: string | null; experience: string | null;
  availableDays: string | null; createdAt: string;
  club: { name: string; category: string }
}
type Club = {
  id: number; name: string; category: string; status: string
  description: string; requirements: string | null
  capacity: number; logoUrl: string | null
  email: string | null; social: string | null
  applications: Application[]; members: Member[]
  _count: { members: number }
}
type MyClub = {
  membershipId: number; clubId: number; role: string
  joinedDate: string; participationPoints: number; attendanceCount: number
  club: { id: number; name: string; category: string; logoUrl: string | null; _count: { members: number } }
}
type AttendanceQR = { token: string; label: string; expiresAt: string; qrDataUrl: string; clubId: number }
type StudentProfile = { fullName: string; studentId: string }
type ScanResult = {
  success: boolean
  clubName?: string
  clubId?: number
  label?: string
  scannedAt?: string
  attendanceId?: number
  studentName?: string
  studentId?: string
  error?: string
}
type AttendanceRecord = {
  attendanceId: number
  clubName: string
  label: string
  scannedAt: string
  studentName: string
  studentId: string
  status: "COMPLETED"
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["ALL", "ACADEMIC", "SPORTS", "CULTURAL", "RELIGIOUS", "OTHER"]

const CAT_META: Record<string, { icon: string; bg: string; fg: string; hero: string }> = {
  ACADEMIC: { icon: "🎓", bg: "oklch(0.93 0.05 250)", fg: "oklch(0.42 0.2 250)",  hero: "oklch(0.55 0.2 250)" },
  SPORTS:   { icon: "⚽", bg: "oklch(0.93 0.06 145)", fg: "oklch(0.4 0.2 145)",   hero: "oklch(0.5 0.2 145)"  },
  CULTURAL: { icon: "🎭", bg: "oklch(0.93 0.06 295)", fg: "oklch(0.42 0.2 295)",  hero: "oklch(0.5 0.2 295)"  },
  RELIGIOUS:{ icon: "☪️", bg: "oklch(0.94 0.06 55)",  fg: "oklch(0.45 0.2 55)",   hero: "oklch(0.52 0.18 55)" },
  OTHER:    { icon: "✦",  bg: "oklch(0.94 0.02 260)", fg: "oklch(0.45 0.06 260)", hero: "oklch(0.5 0.1 260)"  },
}

const STATUS_META: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  OPEN:   { label: "Open",   bg: "oklch(0.93 0.06 145)", fg: "oklch(0.4 0.2 145)",  dot: "oklch(0.55 0.2 145)"  },
  FULL:   { label: "Full",   bg: "oklch(0.94 0.06 55)",  fg: "oklch(0.45 0.2 55)",  dot: "oklch(0.6 0.18 55)"   },
  CLOSED: { label: "Closed", bg: "oklch(0.95 0.05 25)",  fg: "oklch(0.5 0.22 25)",  dot: "oklch(0.6 0.22 25)"   },
}

const APP_META: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING:    { label: "Pending",    bg: "oklch(0.95 0.06 80)",  fg: "oklch(0.48 0.2 80)"  },
  APPROVED:   { label: "Approved",   bg: "oklch(0.93 0.06 145)", fg: "oklch(0.4 0.2 145)"  },
  REJECTED:   { label: "Rejected",   bg: "oklch(0.95 0.05 25)",  fg: "oklch(0.5 0.22 25)"  },
  WAITLISTED: { label: "Waitlisted", bg: "oklch(0.93 0.05 250)", fg: "oklch(0.42 0.2 250)" },
}

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; }

/* ── Hero ── */
.cb-hero {
  border-radius: 1.25rem; overflow: hidden; margin-bottom: 1.75rem; position: relative;
  background: linear-gradient(135deg,
    oklch(0.22 0.1 265) 0%,
    oklch(0.32 0.14 258) 55%,
    oklch(0.42 0.16 252) 100%);
  padding: 2rem 2rem 1.75rem;
}
.cb-hero::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 32px 32px;
}
.cb-hero-glow-a {
  position: absolute; top: -80px; right: -80px; pointer-events: none;
  width: 320px; height: 320px; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.65 0.2 260 / 0.28) 0%, transparent 70%);
}
.cb-hero-glow-b {
  position: absolute; bottom: -60px; left: -40px; pointer-events: none;
  width: 220px; height: 220px; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.45 0.22 280 / 0.22) 0%, transparent 70%);
}
.cb-hero-inner { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
.cb-hero-tag {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .28rem .8rem; border-radius: 999px; margin-bottom: .85rem;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
  font-size: .72rem; font-weight: 700; letter-spacing: .06em; color: rgba(255,255,255,.85); text-transform: uppercase;
}
.cb-hero-dot { width: 6px; height: 6px; border-radius: 50%; background: oklch(0.75 0.2 145); box-shadow: 0 0 6px oklch(0.75 0.2 145 / 0.8); animation: cbBlink 2s ease-in-out infinite; }
@keyframes cbBlink { 0%,100% { opacity:1; } 50% { opacity:.35; } }
.cb-hero-title { font-size: 1.65rem; font-weight: 900; color: #fff; letter-spacing: -.04em; margin: 0 0 .4rem; line-height: 1.15; }
.cb-hero-sub { font-size: .875rem; color: rgba(255,255,255,.65); line-height: 1.6; max-width: 440px; }
.cb-hero-stats { display: flex; gap: .65rem; flex-wrap: wrap; padding-top: 1.65rem; }
.cb-hero-stat {
  display: flex; flex-direction: column; align-items: center;
  padding: .7rem 1.1rem; border-radius: .85rem;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
  min-width: 5.5rem; text-align: center; backdrop-filter: blur(8px);
}
.cb-hero-stat-val { font-size: 1.35rem; font-weight: 900; color: #fff; line-height: 1; }
.cb-hero-stat-lbl { font-size: .65rem; font-weight: 600; color: rgba(255,255,255,.6); margin-top: .25rem; letter-spacing: .04em; text-transform: uppercase; }

/* ── Toolbar ── */
.cb-toolbar { display: flex; gap: .75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
.cb-search-wrap { flex: 1; min-width: 200px; position: relative; }
.cb-search-icon { position: absolute; left: .85rem; top: 50%; transform: translateY(-50%); color: var(--muted-foreground); pointer-events: none; }
.cb-search-icon svg { width: 15px; height: 15px; }
.cb-search {
  width: 100%; padding: .65rem .85rem .65rem 2.5rem;
  border: 1.5px solid var(--border); border-radius: .75rem;
  background: var(--background); color: var(--foreground);
  font-size: .875rem; outline: none; transition: border-color .2s, box-shadow .2s;
}
.cb-search:focus { border-color: oklch(0.62 0.2 260); box-shadow: 0 0 0 3px oklch(0.62 0.2 260 / 0.12); }
.cb-search::placeholder { color: var(--muted-foreground); }

/* ── Category pills ── */
.cb-cats { display: flex; gap: .4rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.cb-cat-btn {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .45rem .9rem; border-radius: 999px;
  font-size: .78rem; font-weight: 700; border: 1.5px solid var(--border);
  background: var(--background); color: var(--muted-foreground);
  cursor: pointer; transition: all .18s;
}
.cb-cat-btn:hover { border-color: oklch(0.62 0.2 260 / 0.45); color: var(--foreground); }
.cb-cat-btn.active {
  background: linear-gradient(135deg, oklch(0.62 0.2 260), oklch(0.5 0.22 265));
  border-color: transparent; color: #fff;
  box-shadow: 0 2px 10px oklch(0.6 0.2 260 / 0.3);
}
.cb-cat-count { font-size: .68rem; opacity: .75; font-weight: 600; }

/* ── Stats strip ── */
.cb-stats { display: flex; gap: .9rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.cb-stat-chip {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .3rem .8rem; border-radius: 999px;
  background: var(--muted); border: 1px solid var(--border);
  font-size: .75rem; font-weight: 600; color: var(--muted-foreground);
}
.cb-stat-chip.open { background: oklch(0.93 0.06 145 / 0.5); border-color: oklch(0.82 0.1 145); color: oklch(0.38 0.18 145); }
.cb-stat-chip.member { background: oklch(0.93 0.06 250 / 0.4); border-color: oklch(0.82 0.08 250); color: oklch(0.42 0.18 250); }
.cb-stat-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

/* ── Grid ── */
.cb-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.1rem; }
@media (max-width: 900px) { .cb-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 560px) { .cb-grid { grid-template-columns: 1fr; } }

/* ── Skeleton ── */
.cb-skel { background: var(--muted); border-radius: 1.15rem; animation: cbSkel 1.4s ease-in-out infinite; }
@keyframes cbSkel { 0%,100% { opacity:1; } 50% { opacity:.4; } }

/* ── Empty ── */
.cb-empty { text-align: center; padding: 4rem 1.5rem; display: flex; flex-direction: column; align-items: center; gap: .6rem; }
.cb-empty-icon { width: 5rem; height: 5rem; border-radius: 1.35rem; background: var(--muted); display: flex; align-items: center; justify-content: center; font-size: 2.25rem; margin-bottom: .35rem; }
.cb-empty-title { font-size: 1rem; font-weight: 700; color: var(--foreground); }
.cb-empty-sub { font-size: .875rem; color: var(--muted-foreground); }

/* ── Club card ── */
.cb-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1.15rem; overflow: hidden; display: flex; flex-direction: column;
  transition: box-shadow .2s, border-color .2s, transform .2s;
}
.cb-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.09); border-color: oklch(0.84 0.008 260); transform: translateY(-2px); }

.cb-card-top { height: 5px; }

.cb-card-body { padding: 1.2rem; flex: 1; display: flex; flex-direction: column; gap: .85rem; }

.cb-card-header { display: flex; align-items: flex-start; gap: .85rem; }
.cb-card-logo {
  width: 3rem; height: 3rem; border-radius: .85rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.35rem; font-weight: 900; color: #fff;
  overflow: hidden;
}
.cb-card-logo img { width: 100%; height: 100%; object-fit: cover; }
.cb-card-name { font-size: .925rem; font-weight: 800; color: var(--foreground); line-height: 1.3; margin-bottom: .4rem; }
.cb-badges { display: flex; gap: .35rem; flex-wrap: wrap; }
.cb-badge {
  display: inline-flex; align-items: center; gap: .25rem;
  padding: .18rem .55rem; border-radius: 999px;
  font-size: .67rem; font-weight: 700; letter-spacing: .02em;
}
.cb-status-dot { width: 5px; height: 5px; border-radius: 50%; }

.cb-desc {
  font-size: .8rem; color: var(--muted-foreground); line-height: 1.65;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}

/* Capacity bar */
.cb-cap-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: .4rem; }
.cb-cap-label { font-size: .72rem; color: var(--muted-foreground); font-weight: 600; }
.cb-cap-val { font-size: .72rem; font-weight: 700; color: var(--foreground); }
.cb-cap-track { height: 5px; border-radius: 999px; background: var(--muted); overflow: hidden; }
.cb-cap-fill { height: 100%; border-radius: 999px; transition: width .5s cubic-bezier(.4,0,.2,1); }

.cb-card-email { font-size: .72rem; color: var(--muted-foreground); display: flex; align-items: center; gap: .35rem; }
.cb-card-email svg { width: 11px; height: 11px; flex-shrink: 0; }

/* Card footer */
.cb-card-footer {
  padding: .8rem 1.2rem; border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: .65rem;
}
.cb-details-btn {
  font-size: .78rem; font-weight: 600; color: var(--muted-foreground); background: none; border: none; cursor: pointer;
  padding: .35rem .65rem; border-radius: .5rem; transition: color .15s, background .15s;
  display: flex; align-items: center; gap: .3rem;
}
.cb-details-btn:hover { color: var(--foreground); background: var(--accent); }
.cb-details-btn svg { width: 12px; height: 12px; }
.cb-apply-btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .45rem 1rem; border-radius: .65rem;
  background: linear-gradient(135deg, oklch(0.62 0.2 260), oklch(0.5 0.22 265));
  color: #fff; font-size: .78rem; font-weight: 800; border: none; cursor: pointer;
  box-shadow: 0 2px 10px oklch(0.6 0.2 260 / 0.3);
  transition: opacity .18s, transform .15s;
}
.cb-apply-btn:hover { opacity: .9; transform: translateY(-1px); }
.cb-member-badge {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .35rem .8rem; border-radius: 999px;
  background: oklch(0.93 0.06 145 / 0.5); color: oklch(0.38 0.18 145);
  border: 1px solid oklch(0.82 0.1 145 / 0.5);
  font-size: .75rem; font-weight: 700;
}
.cb-status-badge {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .35rem .8rem; border-radius: 999px;
  font-size: .75rem; font-weight: 700; border: 1px solid transparent;
}

/* ── Modal backdrop ── */
.cb-backdrop {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
  animation: cbFadeIn .2s ease;
}
@keyframes cbFadeIn { from { opacity: 0; } to { opacity: 1; } }

/* ── Modal ── */
.cb-modal {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1.35rem; width: 100%; max-width: 520px;
  box-shadow: 0 24px 80px rgba(0,0,0,.25);
  max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column;
  animation: cbSlideUp .28s cubic-bezier(.22,1,.36,1);
}
@keyframes cbSlideUp { from { opacity: 0; transform: translateY(20px) scale(.97); } to { opacity: 1; transform: none; } }
.cb-modal::-webkit-scrollbar { width: 4px; }
.cb-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

.cb-modal-top { height: 5px; border-radius: 1.35rem 1.35rem 0 0; flex-shrink: 0; }

.cb-modal-header {
  padding: 1.25rem 1.5rem 1rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  flex-shrink: 0;
}
.cb-modal-logo {
  width: 3.25rem; height: 3.25rem; border-radius: .9rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 900; color: #fff; overflow: hidden;
}
.cb-modal-logo img { width: 100%; height: 100%; object-fit: cover; }
.cb-modal-name { font-size: 1.1rem; font-weight: 900; color: var(--foreground); letter-spacing: -.02em; margin-bottom: .4rem; }
.cb-modal-close {
  width: 2rem; height: 2rem; border-radius: .55rem; background: var(--muted);
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--muted-foreground); flex-shrink: 0; transition: background .15s, color .15s;
}
.cb-modal-close:hover { background: var(--accent); color: var(--foreground); }
.cb-modal-close svg { width: 14px; height: 14px; }

.cb-modal-body { padding: 1.35rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

.cb-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }
.cb-info-block {}
.cb-info-label { font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--muted-foreground); margin-bottom: .35rem; }
.cb-info-value { font-size: .875rem; font-weight: 600; color: var(--foreground); }
.cb-info-value a { color: oklch(0.52 0.2 260); text-decoration: none; }
.cb-info-value a:hover { text-decoration: underline; }

.cb-section-title { font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--muted-foreground); margin-bottom: .55rem; }
.cb-body-text { font-size: .875rem; color: var(--foreground); line-height: 1.7; }

.cb-req-box {
  background: oklch(0.97 0.015 260 / 0.5); border: 1px solid oklch(0.9 0.04 260);
  border-radius: .75rem; padding: .9rem 1rem;
}

.cb-member-box {
  background: oklch(0.93 0.06 145 / 0.35); border: 1px solid oklch(0.82 0.1 145 / 0.5);
  border-radius: .75rem; padding: .85rem 1rem;
  display: flex; align-items: center; gap: .6rem;
  font-size: .875rem; font-weight: 600; color: oklch(0.35 0.18 145);
}
.cb-app-box {
  border-radius: .75rem; padding: .85rem 1rem;
  font-size: .875rem; font-weight: 600;
  display: flex; align-items: center; gap: .5rem;
}

.cb-modal-apply-btn {
  width: 100%; padding: .85rem; border-radius: .85rem;
  background: linear-gradient(135deg, oklch(0.62 0.2 260), oklch(0.5 0.22 265));
  color: #fff; font-size: .925rem; font-weight: 800; border: none; cursor: pointer;
  box-shadow: 0 4px 18px oklch(0.58 0.2 260 / 0.38);
  transition: opacity .2s, transform .15s;
}
.cb-modal-apply-btn:hover { opacity: .9; transform: translateY(-1px); }

/* ── Apply form ── */
.cb-form { display: flex; flex-direction: column; gap: 1.1rem; }
.cb-form-grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: .75rem; }
@media (max-width: 480px) { .cb-form-grid3 { grid-template-columns: 1fr 1fr; } }
.cb-field { display: flex; flex-direction: column; gap: .32rem; }
.cb-lbl { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted-foreground); }
.cb-lbl-req { color: oklch(0.55 0.22 25); }
.cb-inp {
  width: 100%; border: 1.5px solid var(--border); background: var(--background);
  border-radius: .65rem; padding: .6rem .85rem; font-size: .875rem;
  color: var(--foreground); outline: none; transition: border-color .2s, box-shadow .2s;
}
.cb-inp:focus { border-color: oklch(0.62 0.2 260); box-shadow: 0 0 0 3px oklch(0.62 0.2 260 / 0.12); }
.cb-inp::placeholder { color: var(--muted-foreground); }
.cb-inp-invalid { border-color: oklch(0.6 0.22 25) !important; box-shadow: 0 0 0 3px oklch(0.6 0.22 25 / 0.1) !important; }
.cb-inp-valid   { border-color: oklch(0.55 0.18 145); }
.cb-sel { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .65rem center; background-size: 1rem; padding-right: 2.5rem; cursor: pointer; }
.cb-ta { resize: none; }

.cb-apply-err {
  background: oklch(0.97 0.05 25 / 0.5); border: 1px solid oklch(0.88 0.1 25 / 0.4);
  border-radius: .65rem; padding: .65rem .9rem;
  font-size: .82rem; color: oklch(0.5 0.22 25); display: flex; align-items: center; gap: .45rem;
}

.cb-form-actions { display: flex; gap: .65rem; padding-top: .25rem; }
.cb-submit-btn {
  flex: 1; padding: .8rem; border-radius: .8rem;
  background: linear-gradient(135deg, oklch(0.62 0.2 260), oklch(0.5 0.22 265));
  color: #fff; font-size: .9rem; font-weight: 800; border: none; cursor: pointer;
  box-shadow: 0 3px 14px oklch(0.58 0.2 260 / 0.35);
  transition: opacity .2s; display: flex; align-items: center; justify-content: center; gap: .5rem;
}
.cb-submit-btn:hover { opacity: .9; }
.cb-submit-btn:disabled { opacity: .5; cursor: not-allowed; }
.cb-cancel-btn {
  padding: .8rem 1.25rem; border-radius: .8rem;
  background: transparent; border: 1.5px solid var(--border);
  color: var(--muted-foreground); font-size: .875rem; font-weight: 600;
  cursor: pointer; transition: background .15s, color .15s;
}
.cb-cancel-btn:hover { background: var(--accent); color: var(--foreground); }

@keyframes cbSpin { to { transform: rotate(360deg); } }
.cb-spin { animation: cbSpin .8s linear infinite; }

/* ── View Application Modal ── */
.cb-field-view { display: flex; flex-direction: column; gap: .3rem; }
.cb-field-view-label { font-size: .67rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--muted-foreground); }
.cb-field-view-value { font-size: .875rem; color: var(--foreground); line-height: 1.65; }
.cb-field-view-empty { font-size: .82rem; color: var(--muted-foreground); font-style: italic; }
.cb-modal-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .75rem; }
@media (max-width: 480px) { .cb-modal-grid3 { grid-template-columns: 1fr 1fr; } }

.cb-btn-edit {
  flex: 1; padding: .75rem; border-radius: .8rem;
  background: oklch(0.93 0.05 260 / 0.5); border: 1.5px solid oklch(0.82 0.1 260 / 0.5);
  color: oklch(0.42 0.2 260); font-size: .875rem; font-weight: 700;
  cursor: pointer; transition: all .18s;
  display: flex; align-items: center; justify-content: center; gap: .4rem;
}
.cb-btn-edit:hover { background: oklch(0.89 0.08 260 / 0.6); }

.cb-btn-withdraw {
  padding: .75rem 1.25rem; border-radius: .8rem;
  background: oklch(0.97 0.05 25 / 0.5); border: 1.5px solid oklch(0.88 0.1 25 / 0.4);
  color: oklch(0.5 0.22 25); font-size: .875rem; font-weight: 700;
  cursor: pointer; transition: all .18s;
  display: flex; align-items: center; justify-content: center; gap: .4rem;
}
.cb-btn-withdraw:hover { background: oklch(0.93 0.08 25 / 0.5); }

.cb-confirm-box {
  background: oklch(0.97 0.05 25 / 0.5); border: 1px solid oklch(0.88 0.1 25 / 0.4);
  border-radius: .85rem; padding: 1rem 1.1rem;
}
.cb-confirm-title { font-size: .9rem; font-weight: 800; color: oklch(0.48 0.22 25); margin-bottom: .35rem; }
.cb-confirm-text { font-size: .82rem; color: var(--muted-foreground); line-height: 1.55; margin-bottom: .85rem; }
.cb-confirm-btns { display: flex; gap: .55rem; }
.cb-btn-confirm-del {
  flex: 1; padding: .65rem; border-radius: .7rem;
  background: oklch(0.55 0.22 25); color: #fff;
  font-size: .82rem; font-weight: 700; border: none; cursor: pointer;
  transition: opacity .18s;
}
.cb-btn-confirm-del:hover { opacity: .85; }
.cb-btn-confirm-del:disabled { opacity: .5; cursor: not-allowed; }
.cb-btn-confirm-cancel {
  padding: .65rem 1rem; border-radius: .7rem;
  background: transparent; border: 1.5px solid var(--border);
  color: var(--muted-foreground); font-size: .82rem; font-weight: 600;
  cursor: pointer; transition: background .15s, color .15s;
}
.cb-btn-confirm-cancel:hover { background: var(--accent); color: var(--foreground); }

/* Clickable status badge (card footer) */
.cb-status-badge-btn {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .35rem .8rem; border-radius: 999px;
  font-size: .75rem; font-weight: 700; border: 1px solid transparent;
  cursor: pointer; transition: opacity .18s, transform .15s; background: none;
}
.cb-status-badge-btn:hover { opacity: .78; transform: translateY(-1px); }

/* View-app loading skeleton */
.cb-view-loading { display: flex; flex-direction: column; gap: .85rem; padding: .5rem 0; }
.cb-view-skel { border-radius: .55rem; background: var(--muted); animation: cbSkel 1.4s ease-in-out infinite; }

/* ── My Clubs section ── */
.cb-my-section {
  margin-bottom: 2rem; background: var(--card);
  border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden;
}
.cb-my-header {
  padding: 1rem 1.4rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(90deg, oklch(0.96 0.025 145), var(--card));
}
.cb-my-title { font-size: .95rem; font-weight: 800; color: var(--foreground); display: flex; align-items: center; gap: .5rem; }
.cb-my-count {
  display: inline-flex; align-items: center;
  padding: .18rem .65rem; border-radius: 999px;
  background: oklch(0.93 0.06 145 / 0.5); border: 1px solid oklch(0.82 0.1 145 / 0.5);
  font-size: .72rem; font-weight: 700; color: oklch(0.38 0.18 145);
}
.cb-my-body { padding: 1.1rem 1.4rem; display: flex; flex-direction: column; gap: .75rem; }

.cb-my-card {
  display: flex; align-items: center; gap: 1rem;
  padding: .9rem 1rem; border-radius: .9rem;
  background: var(--background); border: 1px solid var(--border);
  transition: border-color .18s, box-shadow .18s;
}
.cb-my-card:hover { border-color: oklch(0.82 0.1 145 / 0.5); box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.cb-my-logo {
  width: 2.75rem; height: 2.75rem; border-radius: .75rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; font-weight: 900; color: #fff; overflow: hidden;
}
.cb-my-logo img { width: 100%; height: 100%; object-fit: cover; }
.cb-my-info { flex: 1; min-width: 0; }
.cb-my-name { font-size: .9rem; font-weight: 800; color: var(--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cb-my-meta { display: flex; gap: .65rem; align-items: center; flex-wrap: wrap; margin-top: .2rem; }
.cb-my-role {
  display: inline-flex; align-items: center; gap: .2rem;
  padding: .12rem .55rem; border-radius: 999px;
  font-size: .67rem; font-weight: 700;
  background: oklch(0.93 0.05 260 / 0.45); color: oklch(0.42 0.2 260);
  border: 1px solid oklch(0.82 0.1 260 / 0.4);
}
.cb-my-stat { font-size: .72rem; color: var(--muted-foreground); display: flex; align-items: center; gap: .25rem; }
.cb-my-actions { display: flex; gap: .5rem; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }

.cb-scan-btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .45rem .95rem; border-radius: .65rem;
  background: linear-gradient(135deg, oklch(0.55 0.2 145), oklch(0.45 0.2 150));
  color: #fff; font-size: .78rem; font-weight: 800; border: none; cursor: pointer;
  box-shadow: 0 2px 8px oklch(0.5 0.18 145 / 0.3);
  transition: opacity .18s, transform .15s;
}
.cb-scan-btn:hover { opacity: .9; transform: translateY(-1px); }

.cb-qr-btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .45rem .95rem; border-radius: .65rem;
  background: oklch(0.93 0.05 260 / 0.45); border: 1.5px solid oklch(0.82 0.1 260 / 0.5);
  color: oklch(0.42 0.2 260); font-size: .78rem; font-weight: 700;
  cursor: pointer; transition: all .18s;
}
.cb-qr-btn:hover { background: oklch(0.88 0.08 260 / 0.5); }
.cb-qr-btn:disabled { opacity: .5; cursor: not-allowed; }

/* QR display modal */
.cb-qr-display-modal {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1.35rem; width: 100%; max-width: 360px;
  box-shadow: 0 24px 80px rgba(0,0,0,.25);
  display: flex; flex-direction: column; overflow: hidden;
  animation: cbSlideUp .28s cubic-bezier(.22,1,.36,1);
}
.cb-qr-display-header {
  padding: 1rem 1.4rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.cb-qr-display-title { font-size: .95rem; font-weight: 800; color: var(--foreground); }
.cb-qr-display-body { padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.cb-qr-display-img { border-radius: .75rem; border: 1px solid var(--border); }
.cb-qr-expire { font-size: .78rem; color: var(--muted-foreground); text-align: center; }
.cb-qr-label-inp {
  width: 100%; border: 1.5px solid var(--border); background: var(--background);
  border-radius: .65rem; padding: .55rem .85rem; font-size: .875rem;
  color: var(--foreground); outline: none; transition: border-color .2s;
}
.cb-qr-label-inp:focus { border-color: oklch(0.62 0.2 260); }
.cb-gen-btn {
  width: 100%; padding: .75rem; border-radius: .75rem;
  background: linear-gradient(135deg, oklch(0.62 0.2 260), oklch(0.5 0.22 265));
  color: #fff; font-size: .875rem; font-weight: 800; border: none; cursor: pointer;
  transition: opacity .18s;
}
.cb-gen-btn:hover { opacity: .9; }
.cb-gen-btn:disabled { opacity: .5; cursor: not-allowed; }

/* Attendance confirmation */
.cb-att-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
@media (max-width: 640px) { .cb-att-form-grid { grid-template-columns: 1fr; } }
.cb-att-readonly {
  width: 100%; border: 1.5px solid var(--border); border-radius: .65rem;
  padding: .62rem .85rem; font-size: .86rem; color: var(--foreground);
  background: var(--muted); min-height: 2.45rem; display: flex; align-items: center;
}
.cb-att-status {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .3rem .75rem; border-radius: 999px;
  background: oklch(0.93 0.06 145 / 0.35); color: oklch(0.38 0.18 145);
  border: 1px solid oklch(0.82 0.1 145 / 0.5); font-size: .76rem; font-weight: 800;
}
`

// ── Component ────────────────────────────────────────────────────────────────

export default function ClubsPage() {
  const [clubs, setClubs]       = useState<Club[]>([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState("ALL")
  const [search, setSearch]     = useState("")

  const [studentProfile, setStudentProfile] = useState<StudentProfile>({ fullName: "", studentId: "" })

  const [applyClub, setApplyClub] = useState<Club | null>(null)
  const [applyForm, setApplyForm] = useState({
    motivation: "", contribution: "", experience: "", availableDays: "",
  })
  const [applyTouched, setApplyTouched] = useState({ motivation: false })
  const [applyError, setApplyError] = useState("")
  const [applying, setApplying]     = useState(false)
  const [detailClub, setDetailClub] = useState<Club | null>(null)

  // View / Edit / Delete application
  const [viewApp, setViewApp]           = useState<FullApplication | null>(null)
  const [viewLoading, setViewLoading]   = useState(false)
  const [editMode, setEditMode]         = useState(false)
  const [editForm, setEditForm]         = useState({ motivation: "", currentYear: "", currentSemester: "", gpa: "", contribution: "", experience: "", availableDays: "" })
  const [editError, setEditError]       = useState("")
  const [saving, setSaving]             = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting]         = useState(false)

  const [myClubs, setMyClubs]           = useState<MyClub[]>([])
  const [myClubsLoading, setMyClubsLoading] = useState(true)
  const [showScanner, setShowScanner]   = useState(false)
  const [scanSuccess, setScanSuccess]   = useState<{ clubName: string; label: string } | null>(null)
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null)
  const [showQRFor, setShowQRFor]       = useState<MyClub | null>(null)
  const [qrData, setQrData]             = useState<AttendanceQR | null>(null)
  const [qrLabel, setQrLabel]           = useState("Club Meeting")
  const [generatingQR, setGeneratingQR] = useState(false)
  const [qrError, setQrError]           = useState("")

  async function load() {
    setLoading(true)
    const [clubsRes, myRes, meRes] = await Promise.all([
      fetch("/api/clubs"),
      fetch("/api/clubs/my"),
      fetch("/api/profile/me"),
    ])
    if (clubsRes.ok) setClubs(await clubsRes.json())
    if (myRes.ok) setMyClubs(await myRes.json())
    if (meRes.ok) {
      const me: { fullName: string; studentId: string } = await meRes.json()
      setStudentProfile({ fullName: me.fullName, studentId: me.studentId })
    }
    setLoading(false)
    setMyClubsLoading(false)
  }
  useEffect(() => { load() }, [])

  async function generateQR(membership: MyClub) {
    setGeneratingQR(true); setQrError(""); setQrData(null)
    const res = await fetch("/api/clubs/attendance/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId: membership.clubId, label: qrLabel, expiresInMinutes: 120 }),
    })
    const data = await res.json()
    if (!res.ok) { setQrError(data.error ?? "Failed to generate QR."); setGeneratingQR(false); return }
    setQrData(data)
    setGeneratingQR(false)
  }

  const filtered = useMemo(() =>
    clubs
      .filter((c) => category === "ALL" || c.category === category)
      .filter((c) => {
        const q = search.toLowerCase()
        return !q || c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
      }),
    [clubs, category, search]
  )

  function userApplicationStatus(club: Club): string | null {
    if (club.members.some((m) => m.isActive)) return "MEMBER"
    return club.applications[0]?.status ?? null
  }

  function openApply(club: Club) {
    setApplyClub(club)
    setApplyError("")
    setApplyTouched({ motivation: false })
    setApplyForm({ motivation: "", contribution: "", experience: "", availableDays: "" })
  }

  const motivationErr = applyTouched.motivation && applyForm.motivation.trim().length < 20
    ? "Please write at least 20 characters."
    : ""

  async function submitApplication() {
    if (!applyClub) return
    setApplyTouched({ motivation: true })
    if (!applyForm.motivation.trim() || applyForm.motivation.trim().length < 20) {
      setApplyError("Please write at least 20 characters in the motivation field.")
      return
    }
    setApplying(true); setApplyError("")
    const res = await fetch(`/api/clubs/${applyClub.id}/apply`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(applyForm),
    })
    const data = await res.json()
    if (!res.ok) { setApplyError(data.error ?? "Failed to apply."); setApplying(false); return }
    setClubs((prev) => prev.map((c) => c.id === applyClub.id ? { ...c, applications: [{ id: data.id, status: "PENDING" }] } : c))
    setApplyClub(null)
    setApplyForm({ motivation: "", contribution: "", experience: "", availableDays: "" })
    setApplyTouched({ motivation: false })
    setApplying(false)
  }

  async function openViewApp(appId: number) {
    setViewLoading(true)
    setViewApp(null)
    setEditMode(false)
    setDeleteConfirm(false)
    setEditError("")
    const res = await fetch(`/api/clubs/applications/${appId}`)
    if (res.ok) {
      const data: FullApplication = await res.json()
      setViewApp(data)
      setEditForm({
        motivation:      data.motivation ?? "",
        currentYear:     data.currentYear      ? String(data.currentYear)      : "",
        currentSemester: data.currentSemester  ? String(data.currentSemester)  : "",
        gpa:             data.gpa              ? String(data.gpa)              : "",
        contribution:    data.contribution  ?? "",
        experience:      data.experience    ?? "",
        availableDays:   data.availableDays ?? "",
      })
    }
    setViewLoading(false)
  }

  async function saveEdit() {
    if (!viewApp) return
    if (!editForm.motivation.trim()) { setEditError("Motivation is required."); return }
    setSaving(true); setEditError("")
    const res = await fetch(`/api/clubs/applications/${viewApp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error ?? "Failed to save."); setSaving(false); return }
    setViewApp(data as FullApplication)
    setEditMode(false)
    setSaving(false)
  }

  async function withdrawApp() {
    if (!viewApp) return
    setDeleting(true)
    const res = await fetch(`/api/clubs/applications/${viewApp.id}`, { method: "DELETE" })
    if (res.ok) {
      setClubs((prev) => prev.map((c) => c.id === viewApp.clubId ? { ...c, applications: [] } : c))
      setViewApp(null)
      setDeleteConfirm(false)
    }
    setDeleting(false)
  }

  function closeViewApp() {
    setViewApp(null)
    setViewLoading(false)
    setEditMode(false)
    setDeleteConfirm(false)
    setEditError("")
  }

  const openCount   = clubs.filter((c) => c.status === "OPEN").length
  const memberCount = clubs.filter((c) => c.members.some((m) => m.isActive)).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* ── Hero ── */}
        <div className="cb-hero">
          <div className="cb-hero-glow-a" />
          <div className="cb-hero-glow-b" />
          <div className="cb-hero-inner">
            <div>
              <div className="cb-hero-tag"><span className="cb-hero-dot" /> Student Clubs</div>
              <h1 className="cb-hero-title">Clubs & Societies</h1>
              <p className="cb-hero-sub">
                Discover and join student clubs across academics, sports, culture and more.
                Build your society score while making lasting connections.
              </p>
            </div>
            <div className="cb-hero-stats">
              <div className="cb-hero-stat">
                <div className="cb-hero-stat-val">{clubs.length}</div>
                <div className="cb-hero-stat-lbl">Total Clubs</div>
              </div>
              <div className="cb-hero-stat">
                <div className="cb-hero-stat-val">{openCount}</div>
                <div className="cb-hero-stat-lbl">Open</div>
              </div>
              <div className="cb-hero-stat">
                <div className="cb-hero-stat-val">{memberCount}</div>
                <div className="cb-hero-stat-lbl">Joined</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── My Clubs ── */}
        <div className="cb-my-section">
          <div className="cb-my-header">
            <div className="cb-my-title">
              <span>🏅</span> My Clubs
              {!myClubsLoading && <span className="cb-my-count">{myClubs.length}</span>}
            </div>
          </div>
          <div className="cb-my-body">
            {myClubsLoading ? (
              <>
                {[1,2].map((i) => <div key={i} className="cb-my-card" style={{ height: "4rem", background: "var(--muted)", animation: "cbSkel 1.4s ease-in-out infinite" }} />)}
              </>
            ) : myClubs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.75rem 1rem", color: "var(--muted-foreground)", fontSize: ".875rem" }}>
                <div style={{ fontSize: "1.75rem", marginBottom: ".5rem" }}>🏛️</div>
                You haven&apos;t joined any clubs yet. Apply to a club below to get started!
              </div>
            ) : myClubs.map((m) => {
                const catMeta  = CAT_META[m.club.category] ?? CAT_META.OTHER
                const heroGrad = `linear-gradient(135deg, ${catMeta.hero}, oklch(0.38 0.18 265))`
                return (
                  <div key={m.membershipId} className="cb-my-card">
                    <div className="cb-my-logo" style={{ background: heroGrad }}>
                      {m.club.logoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={m.club.logoUrl} alt={m.club.name} />
                        : catMeta.icon}
                    </div>
                    <div className="cb-my-info">
                      <div className="cb-my-name">{m.club.name}</div>
                      <div className="cb-my-meta">
                        <span className="cb-my-role">⭐ {m.role}</span>
                        <span className="cb-my-stat">
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          {m.club._count.members} members
                        </span>
                        <span className="cb-my-stat">
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {m.attendanceCount} attended
                        </span>
                        <span className="cb-my-stat">✦ {m.participationPoints} pts</span>
                      </div>
                    </div>
                    <div className="cb-my-actions">
                      <button className="cb-scan-btn" onClick={() => { setScanSuccess(null); setShowScanner(true) }}>
                        📷 Scan QR
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Scan success toast */}
        {scanSuccess && (
          <div style={{ marginBottom: "1rem", background: "oklch(0.93 0.06 145 / 0.35)", border: "1px solid oklch(0.82 0.1 145 / 0.5)", borderRadius: ".75rem", padding: ".75rem 1rem", fontSize: ".875rem", fontWeight: 600, color: "oklch(0.35 0.18 145)", display: "flex", alignItems: "center", gap: ".5rem" }}>
            ✓ Attendance marked for <strong>{scanSuccess.clubName}</strong> — {scanSuccess.label}
            <button style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "oklch(0.45 0.2 145)", fontWeight: 700 }} onClick={() => setScanSuccess(null)}>✕</button>
          </div>
        )}

        {/* ── Search ── */}
        <div className="cb-toolbar">
          <div className="cb-search-wrap">
            <span className="cb-search-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input className="cb-search" placeholder="Search clubs by name or description…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* ── Category pills ── */}
        <div className="cb-cats">
          {CATEGORIES.map((cat) => {
            const meta = CAT_META[cat]
            const count = cat === "ALL" ? clubs.length : clubs.filter((c) => c.category === cat).length
            return (
              <button key={cat} className={`cb-cat-btn${category === cat ? " active" : ""}`}
                onClick={() => setCategory(cat)}>
                {meta?.icon && <span>{meta.icon}</span>}
                {cat === "ALL" ? "All" : cap(cat)}
                {count > 0 && <span className="cb-cat-count">{count}</span>}
              </button>
            )
          })}
        </div>

        {/* ── Stats ── */}
        <div className="cb-stats">
          <span className="cb-stat-chip"><span className="cb-stat-dot" />{filtered.length} club{filtered.length !== 1 ? "s" : ""}</span>
          {openCount > 0 && <span className="cb-stat-chip open"><span className="cb-stat-dot" />{openCount} accepting members</span>}
          {memberCount > 0 && <span className="cb-stat-chip member"><span className="cb-stat-dot" />{memberCount} joined</span>}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="cb-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="cb-skel" style={{ height: "16rem" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="cb-empty">
            <div className="cb-empty-icon">🏛️</div>
            <div className="cb-empty-title">No clubs found.</div>
            <div className="cb-empty-sub">{search ? "Try a different search term." : "Check back later for new clubs."}</div>
          </div>
        ) : (
          <div className="cb-grid">
            {filtered.map((club) => {
              const appStatus  = userApplicationStatus(club)
              const capPct     = Math.min((club._count.members / club.capacity) * 100, 100)
              const catMeta    = CAT_META[club.category] ?? CAT_META.OTHER
              const statMeta   = STATUS_META[club.status] ?? STATUS_META.CLOSED
              const capColor   = capPct >= 90 ? "oklch(0.55 0.22 25)" : capPct >= 70 ? "oklch(0.6 0.2 55)" : "oklch(0.5 0.2 145)"
              const heroGrad   = `linear-gradient(135deg, ${catMeta.hero}, oklch(0.38 0.18 265))`

              return (
                <div key={club.id} className="cb-card">
                  {/* top accent */}
                  <div className="cb-card-top" style={{ background: heroGrad }} />

                  <div className="cb-card-body">
                    {/* Header row */}
                    <div className="cb-card-header">
                      <div className="cb-card-logo" style={{ background: heroGrad }}>
                        {club.logoUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={club.logoUrl} alt={club.name} />
                          : catMeta.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="cb-card-name">{club.name}</div>
                        <div className="cb-badges">
                          <span className="cb-badge" style={{ background: catMeta.bg, color: catMeta.fg }}>
                            {catMeta.icon} {cap(club.category)}
                          </span>
                          <span className="cb-badge" style={{ background: statMeta.bg, color: statMeta.fg }}>
                            <span className="cb-status-dot" style={{ background: statMeta.dot }} />
                            {statMeta.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="cb-desc">{club.description}</p>

                    {/* Capacity */}
                    <div>
                      <div className="cb-cap-row">
                        <span className="cb-cap-label">Members</span>
                        <span className="cb-cap-val">{club._count.members} / {club.capacity}</span>
                      </div>
                      <div className="cb-cap-track">
                        <div className="cb-cap-fill" style={{ width: `${capPct}%`, background: capColor }} />
                      </div>
                    </div>

                    {/* Email */}
                    {club.email && (
                      <div className="cb-card-email">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{club.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="cb-card-footer">
                    <button className="cb-details-btn" onClick={() => setDetailClub(club)}>
                      View details
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>

                    {appStatus === "MEMBER" ? (
                      <span className="cb-member-badge">✓ Member</span>
                    ) : appStatus ? (
                      <button className="cb-status-badge-btn"
                        style={{ background: APP_META[appStatus]?.bg, color: APP_META[appStatus]?.fg }}
                        onClick={() => openViewApp(club.applications[0].id)}
                        title="View your application">
                        {APP_META[appStatus]?.label ?? appStatus} →
                      </button>
                    ) : club.status === "OPEN" ? (
                      <button className="cb-apply-btn" onClick={() => openApply(club)}>
                        Apply →
                      </button>
                    ) : (
                      <span style={{ fontSize: ".75rem", color: "var(--muted-foreground)" }}>Closed</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Detail Modal ── */}
        {detailClub && (() => {
          const catMeta  = CAT_META[detailClub.category] ?? CAT_META.OTHER
          const statMeta = STATUS_META[detailClub.status] ?? STATUS_META.CLOSED
          const heroGrad = `linear-gradient(135deg, ${catMeta.hero}, oklch(0.38 0.18 265))`
          const appStatus = userApplicationStatus(detailClub)
          const capPct   = Math.min((detailClub._count.members / detailClub.capacity) * 100, 100)
          const capColor = capPct >= 90 ? "oklch(0.55 0.22 25)" : capPct >= 70 ? "oklch(0.6 0.2 55)" : "oklch(0.5 0.2 145)"

          return (
            <div className="cb-backdrop" onClick={() => setDetailClub(null)}>
              <div className="cb-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cb-modal-top" style={{ background: heroGrad }} />

                <div className="cb-modal-header">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: ".85rem", flex: 1, minWidth: 0 }}>
                    <div className="cb-modal-logo" style={{ background: heroGrad }}>
                      {detailClub.logoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={detailClub.logoUrl} alt={detailClub.name} />
                        : catMeta.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="cb-modal-name">{detailClub.name}</div>
                      <div className="cb-badges">
                        <span className="cb-badge" style={{ background: catMeta.bg, color: catMeta.fg }}>
                          {catMeta.icon} {cap(detailClub.category)}
                        </span>
                        <span className="cb-badge" style={{ background: statMeta.bg, color: statMeta.fg }}>
                          <span className="cb-status-dot" style={{ background: statMeta.dot }} />
                          {statMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="cb-modal-close" onClick={() => setDetailClub(null)}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <div className="cb-modal-body">
                  {/* About */}
                  <div>
                    <div className="cb-section-title">About</div>
                    <p className="cb-body-text">{detailClub.description}</p>
                  </div>

                  {/* Requirements */}
                  {detailClub.requirements && (
                    <div>
                      <div className="cb-section-title">Requirements</div>
                      <div className="cb-req-box">
                        <p className="cb-body-text" style={{ fontSize: ".82rem" }}>{detailClub.requirements}</p>
                      </div>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="cb-info-grid">
                    <div className="cb-info-block">
                      <div className="cb-info-label">Capacity</div>
                      <div className="cb-info-value">{detailClub._count.members} / {detailClub.capacity} members</div>
                      <div style={{ marginTop: ".5rem" }}>
                        <div className="cb-cap-track">
                          <div className="cb-cap-fill" style={{ width: `${capPct}%`, background: capColor }} />
                        </div>
                      </div>
                    </div>
                    {detailClub.email && (
                      <div className="cb-info-block">
                        <div className="cb-info-label">Contact</div>
                        <div className="cb-info-value">
                          <a href={`mailto:${detailClub.email}`}>{detailClub.email}</a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  {appStatus === "MEMBER" ? (
                    <div className="cb-member-box">
                      <span>✓</span> You are a member of this club.
                    </div>
                  ) : appStatus ? (
                    <button className="cb-modal-apply-btn"
                      style={{ background: APP_META[appStatus]?.bg ?? "var(--muted)", color: APP_META[appStatus]?.fg ?? "var(--foreground)", boxShadow: "none", border: "1.5px solid transparent" }}
                      onClick={() => { setDetailClub(null); openViewApp(detailClub.applications[0].id) }}>
                      📋 View My Application ({APP_META[appStatus]?.label ?? appStatus}) →
                    </button>
                  ) : detailClub.status === "OPEN" ? (
                    <button className="cb-modal-apply-btn"
                      onClick={() => { setDetailClub(null); openApply(detailClub) }}>
                      Apply to Join →
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── Apply Modal ── */}
        {applyClub && (() => {
          const catMeta  = CAT_META[applyClub.category] ?? CAT_META.OTHER
          const heroGrad = `linear-gradient(135deg, ${catMeta.hero}, oklch(0.38 0.18 265))`
          return (
            <div className="cb-backdrop" onClick={() => setApplyClub(null)}>
              <div className="cb-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cb-modal-top" style={{ background: heroGrad }} />

                <div className="cb-modal-header">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: ".85rem", flex: 1, minWidth: 0 }}>
                    <div className="cb-modal-logo" style={{ background: heroGrad }}>{catMeta.icon}</div>
                    <div>
                      <div className="cb-modal-name">Apply — {applyClub.name}</div>
                      <div style={{ fontSize: ".78rem", color: "var(--muted-foreground)", marginTop: ".2rem" }}>
                        Fill in the form to submit your application.
                      </div>
                    </div>
                  </div>
                  <button className="cb-modal-close" onClick={() => { setApplyClub(null); setApplyTouched({ motivation: false }) }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <div className="cb-modal-body">
                  {applyError && (
                    <div className="cb-apply-err">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {applyError}
                    </div>
                  )}

                  <div className="cb-form">
                    {/* Applicant identity — auto-filled */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                      <div className="cb-field">
                        <label className="cb-lbl">Index Number</label>
                        <div className="cb-inp" style={{ background: "var(--muted)", color: "var(--foreground)", fontWeight: 700, cursor: "default", userSelect: "none" }}>
                          {studentProfile.studentId || "—"}
                        </div>
                      </div>
                      <div className="cb-field">
                        <label className="cb-lbl">Full Name</label>
                        <div className="cb-inp" style={{ background: "var(--muted)", color: "var(--foreground)", fontWeight: 600, cursor: "default", userSelect: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {studentProfile.fullName || "—"}
                        </div>
                      </div>
                    </div>

                    {/* Motivation */}
                    <div className="cb-field">
                      <label className="cb-lbl">Why do you want to join? <span className="cb-lbl-req">*</span></label>
                      <textarea
                        className={`cb-inp cb-ta${motivationErr ? " cb-inp-invalid" : applyTouched.motivation && applyForm.motivation.trim().length >= 20 ? " cb-inp-valid" : ""}`}
                        rows={4}
                        placeholder="Share your motivation for joining this club…"
                        value={applyForm.motivation}
                        onChange={(e) => { setApplyForm((p) => ({ ...p, motivation: e.target.value })); setApplyError("") }}
                        onBlur={() => setApplyTouched((p) => ({ ...p, motivation: true }))} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".2rem" }}>
                        {motivationErr
                          ? <span style={{ fontSize: ".72rem", color: "oklch(0.5 0.22 25)" }}>{motivationErr}</span>
                          : <span />}
                        <span style={{ fontSize: ".7rem", color: applyForm.motivation.trim().length >= 20 ? "oklch(0.45 0.18 145)" : "var(--muted-foreground)" }}>
                          {applyForm.motivation.trim().length} / 20 min
                        </span>
                      </div>
                    </div>

                    {/* Contribution */}
                    <div className="cb-field">
                      <label className="cb-lbl">What can you contribute? <span style={{ fontWeight: 400, opacity: .6, textTransform: "none" }}>(optional)</span></label>
                      <textarea className="cb-inp cb-ta" rows={2}
                        placeholder="Skills, time, ideas…"
                        value={applyForm.contribution}
                        onChange={(e) => setApplyForm((p) => ({ ...p, contribution: e.target.value }))} />
                    </div>

                    {/* Experience */}
                    <div className="cb-field">
                      <label className="cb-lbl">Relevant experience <span style={{ fontWeight: 400, opacity: .6, textTransform: "none" }}>(optional)</span></label>
                      <textarea className="cb-inp cb-ta" rows={2}
                        placeholder="Previous club memberships, competitions…"
                        value={applyForm.experience}
                        onChange={(e) => setApplyForm((p) => ({ ...p, experience: e.target.value }))} />
                    </div>

                    {/* Available days */}
                    <div className="cb-field">
                      <label className="cb-lbl">Available days <span style={{ fontWeight: 400, opacity: .6, textTransform: "none" }}>(optional)</span></label>
                      <input type="text" className="cb-inp" placeholder="e.g. Monday, Wednesday, Friday"
                        value={applyForm.availableDays}
                        onChange={(e) => setApplyForm((p) => ({ ...p, availableDays: e.target.value.replace(/[^a-zA-Z\s,]/g, "") }))} />
                    </div>

                    {/* Actions */}
                    <div className="cb-form-actions">
                      <button className="cb-submit-btn" onClick={submitApplication} disabled={applying}>
                        {applying ? (
                          <>
                            <svg className="cb-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                            </svg>
                            Submitting…
                          </>
                        ) : "Submit Application →"}
                      </button>
                      <button className="cb-cancel-btn" onClick={() => setApplyClub(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── View / Edit / Delete Application Modal ── */}
        {(viewApp || viewLoading) && (() => {
          const catMeta  = viewApp ? (CAT_META[viewApp.club.category] ?? CAT_META.OTHER) : CAT_META.OTHER
          const heroGrad = `linear-gradient(135deg, ${catMeta.hero}, oklch(0.38 0.18 265))`
          return (
            <div className="cb-backdrop" onClick={closeViewApp}>
              <div className="cb-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
                <div className="cb-modal-top" style={{ background: heroGrad }} />

                <div className="cb-modal-header">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: ".85rem", flex: 1, minWidth: 0 }}>
                    <div className="cb-modal-logo" style={{ background: heroGrad }}>
                      {catMeta.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="cb-modal-name">{editMode ? "Edit Application" : "My Application"}</div>
                      {viewApp && (
                        <div style={{ fontSize: ".78rem", color: "var(--muted-foreground)", marginTop: ".2rem" }}>
                          {viewApp.club.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="cb-modal-close" onClick={closeViewApp}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <div className="cb-modal-body">
                  {viewLoading ? (
                    <div className="cb-view-loading">
                      <div className="cb-view-skel" style={{ height: "1.5rem", width: "40%" }} />
                      <div className="cb-view-skel" style={{ height: "4rem" }} />
                      <div className="cb-view-skel" style={{ height: "3rem" }} />
                      <div className="cb-view-skel" style={{ height: "3rem" }} />
                    </div>
                  ) : viewApp ? editMode ? (

                    // ── Edit form ─────────────────────────────────────────────
                    <div className="cb-form">
                      {editError && (
                        <div className="cb-apply-err">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          {editError}
                        </div>
                      )}

                      <div className="cb-form-grid3">
                        <div className="cb-field">
                          <label className="cb-lbl">Year</label>
                          <select className="cb-inp cb-sel" value={editForm.currentYear}
                            onChange={(e) => setEditForm((p) => ({ ...p, currentYear: e.target.value }))}>
                            <option value="">—</option>
                            {[1,2,3,4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                          </select>
                        </div>
                        <div className="cb-field">
                          <label className="cb-lbl">Semester</label>
                          <select className="cb-inp cb-sel" value={editForm.currentSemester}
                            onChange={(e) => setEditForm((p) => ({ ...p, currentSemester: e.target.value }))}>
                            <option value="">—</option>
                            {[1,2].map((s) => <option key={s} value={s}>Sem {s}</option>)}
                          </select>
                        </div>
                        <div className="cb-field">
                          <label className="cb-lbl">GPA</label>
                          <input className="cb-inp" type="number" step=".01" min="0" max="4"
                            placeholder="3.50" value={editForm.gpa}
                            onChange={(e) => setEditForm((p) => ({ ...p, gpa: e.target.value }))} />
                        </div>
                      </div>

                      <div className="cb-field">
                        <label className="cb-lbl">Why do you want to join? <span className="cb-lbl-req">*</span></label>
                        <textarea className="cb-inp cb-ta" rows={4}
                          placeholder="Share your motivation…"
                          value={editForm.motivation}
                          onChange={(e) => setEditForm((p) => ({ ...p, motivation: e.target.value }))} />
                      </div>

                      <div className="cb-field">
                        <label className="cb-lbl">What can you contribute? <span style={{ fontWeight: 400, opacity: .6, textTransform: "none" }}>(optional)</span></label>
                        <textarea className="cb-inp cb-ta" rows={2}
                          placeholder="Skills, time, ideas…"
                          value={editForm.contribution}
                          onChange={(e) => setEditForm((p) => ({ ...p, contribution: e.target.value }))} />
                      </div>

                      <div className="cb-field">
                        <label className="cb-lbl">Relevant experience <span style={{ fontWeight: 400, opacity: .6, textTransform: "none" }}>(optional)</span></label>
                        <textarea className="cb-inp cb-ta" rows={2}
                          placeholder="Previous club memberships, competitions…"
                          value={editForm.experience}
                          onChange={(e) => setEditForm((p) => ({ ...p, experience: e.target.value }))} />
                      </div>

                      <div className="cb-field">
                        <label className="cb-lbl">Available days <span style={{ fontWeight: 400, opacity: .6, textTransform: "none" }}>(optional)</span></label>
                        <input type="text" className="cb-inp" placeholder="e.g. Monday, Wednesday, Friday"
                          value={editForm.availableDays}
                          onChange={(e) => setEditForm((p) => ({ ...p, availableDays: e.target.value.replace(/[^a-zA-Z\s,]/g, "") }))} />
                      </div>

                      <div className="cb-form-actions">
                        <button className="cb-submit-btn" onClick={saveEdit} disabled={saving}>
                          {saving ? (
                            <>
                              <svg className="cb-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                              </svg>
                              Saving…
                            </>
                          ) : "Save Changes →"}
                        </button>
                        <button className="cb-cancel-btn" onClick={() => { setEditMode(false); setEditError("") }}>Cancel</button>
                      </div>
                    </div>

                  ) : (

                    // ── Read-only view ────────────────────────────────────────
                    <>
                      {/* Status + date */}
                      <div style={{ display: "flex", gap: ".65rem", alignItems: "center", flexWrap: "wrap" }}>
                        <span className="cb-badge"
                          style={{ background: APP_META[viewApp.status]?.bg, color: APP_META[viewApp.status]?.fg, padding: ".28rem .75rem" }}>
                          {APP_META[viewApp.status]?.label ?? viewApp.status}
                        </span>
                        <span style={{ fontSize: ".75rem", color: "var(--muted-foreground)" }}>
                          Submitted {new Date(viewApp.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>

                      {/* Academic info */}
                      <div className="cb-modal-grid3">
                        <div className="cb-field-view">
                          <div className="cb-field-view-label">Year</div>
                          <div className={viewApp.currentYear ? "cb-field-view-value" : "cb-field-view-empty"}>
                            {viewApp.currentYear ? `Year ${viewApp.currentYear}` : "Not provided"}
                          </div>
                        </div>
                        <div className="cb-field-view">
                          <div className="cb-field-view-label">Semester</div>
                          <div className={viewApp.currentSemester ? "cb-field-view-value" : "cb-field-view-empty"}>
                            {viewApp.currentSemester ? `Semester ${viewApp.currentSemester}` : "Not provided"}
                          </div>
                        </div>
                        <div className="cb-field-view">
                          <div className="cb-field-view-label">GPA</div>
                          <div className={viewApp.gpa ? "cb-field-view-value" : "cb-field-view-empty"}>
                            {viewApp.gpa ? Number(viewApp.gpa).toFixed(2) : "Not provided"}
                          </div>
                        </div>
                      </div>

                      {/* Motivation */}
                      <div className="cb-field-view">
                        <div className="cb-field-view-label">Why do you want to join?</div>
                        <div className="cb-field-view-value">{viewApp.motivation}</div>
                      </div>

                      {/* Contribution */}
                      {viewApp.contribution && (
                        <div className="cb-field-view">
                          <div className="cb-field-view-label">What can you contribute?</div>
                          <div className="cb-field-view-value">{viewApp.contribution}</div>
                        </div>
                      )}

                      {/* Experience */}
                      {viewApp.experience && (
                        <div className="cb-field-view">
                          <div className="cb-field-view-label">Relevant Experience</div>
                          <div className="cb-field-view-value">{viewApp.experience}</div>
                        </div>
                      )}

                      {/* Available days */}
                      {viewApp.availableDays && (
                        <div className="cb-field-view">
                          <div className="cb-field-view-label">Available Days</div>
                          <div className="cb-field-view-value">{viewApp.availableDays}</div>
                        </div>
                      )}

                      {/* Actions (PENDING only) */}
                      {viewApp.status === "PENDING" && (
                        deleteConfirm ? (
                          <div className="cb-confirm-box">
                            <div className="cb-confirm-title">Withdraw Application?</div>
                            <div className="cb-confirm-text">
                              This will permanently delete your application to <strong>{viewApp.club.name}</strong>. You can reapply later if the club is still open.
                            </div>
                            <div className="cb-confirm-btns">
                              <button className="cb-btn-confirm-del" onClick={withdrawApp} disabled={deleting}>
                                {deleting ? "Withdrawing…" : "Yes, Withdraw"}
                              </button>
                              <button className="cb-btn-confirm-cancel" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="cb-form-actions">
                            <button className="cb-btn-edit" onClick={() => { setEditMode(true); setEditError("") }}>
                              ✎ Edit Application
                            </button>
                            <button className="cb-btn-withdraw" onClick={() => setDeleteConfirm(true)}>
                              ✕ Withdraw
                            </button>
                          </div>
                        )
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })()}

      </div>

      {/* ── QR Scanner Modal ── */}
      {showScanner && (
        <QRScannerModal
          onClose={() => setShowScanner(false)}
          onSuccess={(result) => {
            setShowScanner(false)
            if (result.success && result.clubName && result.label) {
              setScanSuccess({ clubName: result.clubName, label: result.label })
              if (result.attendanceId && result.scannedAt) {
                setAttendanceRecord({
                  attendanceId: result.attendanceId,
                  clubName: result.clubName,
                  label: result.label,
                  scannedAt: result.scannedAt,
                  studentName: result.studentName || studentProfile.fullName || "-",
                  studentId: result.studentId || studentProfile.studentId || "-",
                  status: "COMPLETED",
                })
              }
              load() // refresh attendance counts
            }
          }}
        />
      )}

      {/* ── Attendance Record Modal ── */}
      {attendanceRecord && (
        <div className="cb-backdrop" onClick={() => setAttendanceRecord(null)}>
          <div className="cb-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="cb-modal-top" style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 145), oklch(0.45 0.2 150))" }} />

            <div className="cb-modal-header">
              <div style={{ display: "flex", alignItems: "flex-start", gap: ".85rem", flex: 1, minWidth: 0 }}>
                <div className="cb-modal-logo" style={{ background: "linear-gradient(135deg, oklch(0.55 0.2 145), oklch(0.45 0.2 150))" }}>✅</div>
                <div style={{ minWidth: 0 }}>
                  <div className="cb-modal-name">Attendance Completed</div>
                  <div style={{ fontSize: ".78rem", color: "var(--muted-foreground)", marginTop: ".2rem" }}>
                    Your attendance was successfully recorded.
                  </div>
                </div>
              </div>
              <button className="cb-modal-close" onClick={() => setAttendanceRecord(null)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="cb-modal-body">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".6rem", flexWrap: "wrap" }}>
                <span className="cb-att-status">✓ COMPLETED</span>
                <span style={{ fontSize: ".75rem", color: "var(--muted-foreground)" }}>
                  Ref #{attendanceRecord.attendanceId}
                </span>
              </div>

              <div className="cb-att-form-grid">
                <div className="cb-field">
                  <label className="cb-lbl">Student ID</label>
                  <div className="cb-att-readonly">{attendanceRecord.studentId}</div>
                </div>
                <div className="cb-field">
                  <label className="cb-lbl">Student Name</label>
                  <div className="cb-att-readonly">{attendanceRecord.studentName}</div>
                </div>
                <div className="cb-field">
                  <label className="cb-lbl">Club</label>
                  <div className="cb-att-readonly">{attendanceRecord.clubName}</div>
                </div>
                <div className="cb-field">
                  <label className="cb-lbl">Session</label>
                  <div className="cb-att-readonly">{attendanceRecord.label}</div>
                </div>
                <div className="cb-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="cb-lbl">Scanned Time</label>
                  <div className="cb-att-readonly">{new Date(attendanceRecord.scannedAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="cb-form-actions">
                <button className="cb-submit-btn" onClick={() => setAttendanceRecord(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create QR Modal ── */}
      {showQRFor && (
        <div className="cb-backdrop" onClick={() => { setShowQRFor(null); setQrData(null) }}>
          <div className="cb-qr-display-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cb-qr-display-header">
              <div className="cb-qr-display-title">🔲 Attendance QR — {showQRFor.club.name}</div>
              <button className="cb-modal-close" onClick={() => { setShowQRFor(null); setQrData(null) }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="cb-qr-display-body">
              {!qrData ? (
                <>
                  <div style={{ width: "100%" }}>
                    <label style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--muted-foreground)", display: "block", marginBottom: ".35rem" }}>Session Label</label>
                    <input
                      className="cb-qr-label-inp"
                      placeholder="e.g. Weekly Meeting, Practice Session"
                      value={qrLabel}
                      onChange={(e) => setQrLabel(e.target.value)}
                    />
                  </div>
                  {qrError && (
                    <div style={{ width: "100%", background: "oklch(0.97 0.05 25 / 0.5)", border: "1px solid oklch(0.88 0.1 25 / 0.4)", borderRadius: ".65rem", padding: ".65rem .9rem", fontSize: ".82rem", color: "oklch(0.5 0.22 25)" }}>
                      {qrError}
                    </div>
                  )}
                  <button className="cb-gen-btn" onClick={() => generateQR(showQRFor)} disabled={generatingQR}>
                    {generatingQR ? "Generating…" : "Generate QR Code →"}
                  </button>
                  <p style={{ fontSize: ".78rem", color: "var(--muted-foreground)", textAlign: "center" }}>
                    QR code is valid for 2 hours. Members scan it to mark their attendance.
                  </p>
                </>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrData.qrDataUrl} alt="Attendance QR" width={240} height={240} className="cb-qr-display-img" />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: ".9rem", color: "var(--foreground)" }}>{qrData.label}</div>
                    <div className="cb-qr-expire" style={{ marginTop: ".35rem" }}>
                      Expires {new Date(qrData.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <button
                    style={{ fontSize: ".8rem", color: "oklch(0.52 0.2 260)", background: "none", border: "none", cursor: "pointer" }}
                    onClick={() => { setQrData(null) }}
                  >
                    Generate new QR
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  )
}
