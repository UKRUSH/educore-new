"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo, useRef } from "react"

// ── Types ────────────────────────────────────────────────────────────────────

type FileAsset = { fileName: string; fileSize: number; fileUrl: string; fileType: string }
type SuggestedResource = { id: number; title: string; sourceName: string; url: string; type: "ARTICLE" | "YOUTUBE" | "LINK" }
type MaterialSummary = { quickSummary: string; detailedNotes: string | null; keyTerms: string | null }
type Material = {
  id: number; title: string; courseCode: string; type: string
  description: string | null; isSummarized: boolean; createdAt: string
  fileAsset: FileAsset | null; summary: MaterialSummary | null
  suggestedResources: SuggestedResource[]
}
type FileEntry = {
  key: string; file: File; title: string
  status: "pending" | "uploading" | "done" | "error"; errorMsg?: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const TYPES = ["ALL", "PDF", "SLIDES", "NOTES"]

const TYPE_META: Record<string, { icon: string; bg: string; fg: string; glow: string }> = {
  PDF:    { icon: "📄", bg: "oklch(0.95 0.04 25)",  fg: "oklch(0.5 0.22 25)",  glow: "oklch(0.7 0.2 25 / 0.2)" },
  SLIDES: { icon: "📊", bg: "oklch(0.95 0.05 55)",  fg: "oklch(0.5 0.2 55)",   glow: "oklch(0.7 0.18 55 / 0.2)" },
  NOTES:  { icon: "📝", bg: "oklch(0.94 0.05 250)", fg: "oklch(0.5 0.2 250)",  glow: "oklch(0.6 0.2 250 / 0.2)" },
}

const RESOURCE_META: Record<string, { icon: string; bg: string; fg: string }> = {
  YOUTUBE: { icon: "▶", bg: "oklch(0.95 0.05 25)",  fg: "oklch(0.5 0.22 25)"  },
  ARTICLE: { icon: "📰", bg: "oklch(0.94 0.04 250)", fg: "oklch(0.48 0.2 250)" },
  LINK:    { icon: "🔗", bg: "oklch(0.94 0.05 145)", fg: "oklch(0.45 0.18 145)" },
}

const ACCEPT_TYPES = ".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.zip"
const MAX_SIZE = 20 * 1024 * 1024

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}
function fileTitle(f: File) { return f.name.replace(/\.[^.]+$/, "") }

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; }

/* ── Hero ── */
.mt-hero {
  border-radius: 1.25rem; overflow: hidden; margin-bottom: 1.75rem;
  background: linear-gradient(135deg,
    oklch(0.22 0.1 265) 0%,
    oklch(0.32 0.14 260) 55%,
    oklch(0.42 0.16 255) 100%);
  padding: 2rem 2rem 1.75rem; position: relative;
}
.mt-hero::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 32px 32px;
}
.mt-hero-glow {
  position: absolute; top: -60px; right: -60px;
  width: 260px; height: 260px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, oklch(0.65 0.2 260 / 0.3) 0%, transparent 70%);
}
.mt-hero-inner { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
.mt-hero-tag {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .28rem .8rem; border-radius: 999px; margin-bottom: .85rem;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
  font-size: .72rem; font-weight: 700; letter-spacing: .06em; color: rgba(255,255,255,.85); text-transform: uppercase;
}
.mt-hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: oklch(0.75 0.2 145); box-shadow: 0 0 6px oklch(0.75 0.2 145 / 0.8); }
.mt-hero-title { font-size: 1.65rem; font-weight: 900; color: #fff; letter-spacing: -.04em; margin: 0 0 .45rem; line-height: 1.15; }
.mt-hero-sub { font-size: .875rem; color: rgba(255,255,255,.65); line-height: 1.6; max-width: 480px; }
.mt-hero-actions { display: flex; gap: .65rem; align-items: center; flex-wrap: wrap; }

/* ── Buttons ── */
.mt-btn-primary {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .7rem 1.35rem; border-radius: .75rem;
  background: #fff; color: oklch(0.3 0.12 260);
  font-size: .875rem; font-weight: 800; border: none; cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,.25);
  transition: transform .18s, box-shadow .18s;
}
.mt-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(0,0,0,.3); }
.mt-btn-primary:active { transform: translateY(0); }
.mt-btn-primary svg { width: 15px; height: 15px; }

.mt-btn-ai {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .7rem 1.35rem; border-radius: .75rem;
  background: rgba(255,255,255,.12); color: rgba(255,255,255,.9);
  border: 1px solid rgba(255,255,255,.22); font-size: .875rem; font-weight: 700;
  cursor: pointer; transition: background .18s, transform .18s;
}
.mt-btn-ai:hover { background: rgba(255,255,255,.2); transform: translateY(-1px); }
.mt-btn-ai:disabled { opacity: .55; cursor: not-allowed; transform: none; }
.mt-btn-ai svg { width: 14px; height: 14px; }

/* ── Toolbar ── */
.mt-toolbar { display: flex; gap: .75rem; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; }
.mt-search-wrap { flex: 1; min-width: 200px; position: relative; }
.mt-search-icon { position: absolute; left: .85rem; top: 50%; transform: translateY(-50%); color: var(--muted-foreground); pointer-events: none; }
.mt-search-icon svg { width: 15px; height: 15px; }
.mt-search {
  width: 100%; padding: .65rem .85rem .65rem 2.5rem;
  border: 1.5px solid var(--border); border-radius: .75rem;
  background: var(--background); color: var(--foreground);
  font-size: .875rem; outline: none; transition: border-color .2s, box-shadow .2s;
}
.mt-search:focus { border-color: oklch(0.62 0.2 260); box-shadow: 0 0 0 3px oklch(0.62 0.2 260 / 0.12); }
.mt-search::placeholder { color: var(--muted-foreground); }

.mt-filter-group { display: flex; gap: .4rem; }
.mt-filter-btn {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .55rem .9rem; border-radius: .65rem;
  font-size: .78rem; font-weight: 700; border: 1.5px solid var(--border);
  background: var(--background); color: var(--muted-foreground);
  cursor: pointer; transition: all .18s;
}
.mt-filter-btn:hover { border-color: oklch(0.62 0.2 260 / 0.4); color: var(--foreground); }
.mt-filter-btn.active {
  background: linear-gradient(135deg, oklch(0.62 0.2 260), oklch(0.5 0.22 265));
  border-color: transparent; color: #fff;
  box-shadow: 0 2px 10px oklch(0.6 0.2 260 / 0.3);
}

/* ── Stats strip ── */
.mt-stats { display: flex; gap: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.mt-stat-chip {
  display: inline-flex; align-items: center; gap: .45rem;
  padding: .35rem .85rem; border-radius: 999px;
  background: var(--muted); border: 1px solid var(--border);
  font-size: .78rem; font-weight: 600; color: var(--muted-foreground);
}
.mt-stat-chip.ai { background: oklch(0.94 0.04 290 / 0.5); border-color: oklch(0.82 0.08 290); color: oklch(0.45 0.2 290); }
.mt-stat-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .6; }

/* ── Error banner ── */
.mt-error {
  background: oklch(0.97 0.05 25 / 0.6); border: 1px solid oklch(0.88 0.1 25 / 0.5);
  border-radius: .75rem; padding: .75rem 1rem;
  font-size: .82rem; color: oklch(0.5 0.22 25); margin-bottom: 1rem;
  display: flex; align-items: center; gap: .5rem;
}

/* ── Upload panel ── */
.mt-upload-panel {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1.25rem; overflow: hidden; margin-bottom: 1.5rem;
  box-shadow: 0 4px 24px rgba(0,0,0,.06);
  animation: mtSlideDown .25s cubic-bezier(.22,1,.36,1);
}
@keyframes mtSlideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: none; }
}
.mt-upload-header {
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(90deg, oklch(0.97 0.015 260), var(--card));
}
.mt-upload-title { font-size: 1rem; font-weight: 800; color: var(--foreground); display: flex; align-items: center; gap: .5rem; }
.mt-upload-title span { font-size: 1.1rem; }
.mt-upload-hint { font-size: .75rem; color: var(--muted-foreground); }
.mt-upload-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; }
.mt-upload-err {
  background: oklch(0.97 0.05 25 / 0.5); border: 1px solid oklch(0.88 0.1 25 / 0.4);
  border-radius: .65rem; padding: .65rem .9rem;
  font-size: .82rem; color: oklch(0.5 0.22 25);
}

.mt-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: .9rem; }
@media (max-width: 520px) { .mt-grid-2 { grid-template-columns: 1fr; } }

.mt-field { display: flex; flex-direction: column; gap: .35rem; }
.mt-lbl { font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--muted-foreground); }
.mt-lbl-req { color: oklch(0.55 0.22 25); }
.mt-inp {
  width: 100%; border: 1.5px solid var(--border); background: var(--background);
  border-radius: .65rem; padding: .6rem .85rem; font-size: .875rem;
  color: var(--foreground); outline: none; transition: border-color .2s, box-shadow .2s;
}
.mt-inp:focus { border-color: oklch(0.62 0.2 260); box-shadow: 0 0 0 3px oklch(0.62 0.2 260 / 0.12); }
.mt-inp::placeholder { color: var(--muted-foreground); }
.mt-inp:disabled { opacity: .6; }
.mt-sel { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .7rem center; background-size: 1rem; padding-right: 2.5rem; cursor: pointer; }
.mt-ta { resize: none; }

/* Drop zone */
.mt-dropzone {
  border: 2px dashed var(--border); border-radius: 1rem;
  padding: 2.25rem 1.5rem; text-align: center; cursor: pointer;
  transition: border-color .2s, background .2s; position: relative;
}
.mt-dropzone:hover, .mt-dropzone.over {
  border-color: oklch(0.62 0.2 260);
  background: oklch(0.62 0.2 260 / 0.04);
}
.mt-dropzone.disabled { pointer-events: none; opacity: .55; }
.mt-drop-icon {
  width: 3.5rem; height: 3.5rem; border-radius: 1rem; margin: 0 auto .85rem;
  background: oklch(0.94 0.04 260 / 0.6);
  display: flex; align-items: center; justify-content: center;
}
.mt-drop-icon svg { width: 22px; height: 22px; color: oklch(0.52 0.2 260); }
.mt-drop-title { font-size: .9rem; font-weight: 700; color: var(--foreground); margin-bottom: .3rem; }
.mt-drop-sub { font-size: .78rem; color: var(--muted-foreground); }

/* File entries list */
.mt-file-list { border: 1px solid var(--border); border-radius: .9rem; overflow: hidden; }
.mt-file-list-header {
  padding: .6rem 1rem; background: var(--muted);
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--border);
}
.mt-file-list-meta { font-size: .75rem; font-weight: 600; color: var(--muted-foreground); }
.mt-file-list-meta .ok  { color: oklch(0.45 0.18 145); }
.mt-file-list-meta .err { color: oklch(0.5 0.22 25); }
.mt-file-list-meta .uploading { color: oklch(0.52 0.2 260); }
.mt-clear-btn { font-size: .72rem; color: var(--muted-foreground); background: none; border: none; cursor: pointer; padding: .2rem .5rem; border-radius: .4rem; transition: color .15s, background .15s; }
.mt-clear-btn:hover { color: oklch(0.5 0.22 25); background: oklch(0.97 0.05 25 / 0.4); }
.mt-file-row {
  display: flex; align-items: center; gap: .85rem; padding: .75rem 1rem;
  border-top: 1px solid var(--border); transition: background .15s;
}
.mt-file-row.done     { background: oklch(0.96 0.04 145 / 0.4); }
.mt-file-row.error    { background: oklch(0.97 0.05 25 / 0.3); }
.mt-file-row.uploading{ background: oklch(0.96 0.04 260 / 0.3); }
.mt-file-status { width: 1.5rem; text-align: center; flex-shrink: 0; }
.mt-file-info { flex: 1; min-width: 0; }
.mt-file-title-inp {
  width: 100%; background: transparent; border: none; outline: none;
  font-size: .875rem; font-weight: 600; color: var(--foreground);
}
.mt-file-title-inp::placeholder { color: var(--muted-foreground); }
.mt-file-title-inp:disabled { opacity: .7; }
.mt-file-meta { font-size: .72rem; color: var(--muted-foreground); margin-top: .15rem; display: flex; gap: .4rem; align-items: center; flex-wrap: wrap; }
.mt-file-err-txt { color: oklch(0.5 0.22 25); }
.mt-file-remove { padding: .35rem; border-radius: .45rem; background: none; border: none; cursor: pointer; color: var(--muted-foreground); transition: color .15s, background .15s; }
.mt-file-remove:hover { color: oklch(0.5 0.22 25); background: oklch(0.97 0.05 25 / 0.4); }
.mt-file-remove svg { width: 13px; height: 13px; }

/* Upload actions */
.mt-upload-actions { display: flex; gap: .65rem; }
.mt-submit-btn {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .75rem 1.5rem; border-radius: .75rem;
  background: linear-gradient(135deg, oklch(0.62 0.2 260), oklch(0.5 0.22 265));
  color: #fff; font-size: .875rem; font-weight: 800; border: none; cursor: pointer;
  box-shadow: 0 3px 14px oklch(0.58 0.2 260 / 0.38);
  transition: opacity .2s, transform .15s;
}
.mt-submit-btn:hover { opacity: .9; transform: translateY(-1px); }
.mt-submit-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
.mt-cancel-btn {
  padding: .75rem 1.25rem; border-radius: .75rem;
  background: transparent; color: var(--muted-foreground);
  border: 1.5px solid var(--border); font-size: .875rem; font-weight: 600;
  cursor: pointer; transition: background .15s, color .15s;
}
.mt-cancel-btn:hover { background: var(--accent); color: var(--foreground); }
.mt-cancel-btn:disabled { opacity: .5; cursor: not-allowed; }

/* ── Skeleton ── */
.mt-skel { background: var(--muted); border-radius: .9rem; animation: mtSkel 1.4s ease-in-out infinite; }
@keyframes mtSkel { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

/* ── Empty state ── */
.mt-empty {
  text-align: center; padding: 4.5rem 1.5rem;
  display: flex; flex-direction: column; align-items: center; gap: .65rem;
}
.mt-empty-icon {
  width: 5rem; height: 5rem; border-radius: 1.35rem; margin-bottom: .5rem;
  background: var(--muted); display: flex; align-items: center; justify-content: center; font-size: 2.25rem;
}
.mt-empty-title { font-size: 1.05rem; font-weight: 700; color: var(--foreground); }
.mt-empty-sub { font-size: .875rem; color: var(--muted-foreground); }

/* ── Material card ── */
.mt-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1.15rem; overflow: hidden; margin-bottom: .9rem;
  transition: box-shadow .2s, border-color .2s;
}
.mt-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,.07); border-color: oklch(0.86 0.008 260); }

.mt-card-row {
  display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.25rem;
}
.mt-card-icon {
  width: 3rem; height: 3rem; border-radius: .85rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
}
.mt-card-body { flex: 1; min-width: 0; }
.mt-card-title-row { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; margin-bottom: .3rem; }
.mt-card-title { font-size: .925rem; font-weight: 800; color: var(--foreground); }
.mt-badge {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .2rem .6rem; border-radius: 999px;
  font-size: .68rem; font-weight: 700; letter-spacing: .02em;
}
.mt-badge-ai {
  background: oklch(0.93 0.05 290 / 0.6); color: oklch(0.42 0.2 290);
  border: 1px solid oklch(0.82 0.08 290 / 0.5);
}
.mt-card-meta { display: flex; align-items: center; gap: .6rem; font-size: .75rem; color: var(--muted-foreground); flex-wrap: wrap; }
.mt-meta-code {
  font-family: monospace; font-weight: 700;
  background: var(--muted); padding: .1rem .45rem; border-radius: .35rem;
  color: var(--foreground); font-size: .72rem;
}
.mt-meta-sep { opacity: .4; }

.mt-card-actions { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }
.mt-action-btn {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .45rem .75rem; border-radius: .6rem;
  font-size: .75rem; font-weight: 700; border: 1px solid transparent;
  cursor: pointer; transition: all .18s;
}
.mt-action-btn.summarize {
  background: oklch(0.93 0.05 290 / 0.5); color: oklch(0.42 0.2 290);
  border-color: oklch(0.82 0.08 290 / 0.4);
}
.mt-action-btn.summarize:hover { background: oklch(0.88 0.07 290 / 0.7); }
.mt-action-btn.summarize:disabled { opacity: .5; cursor: not-allowed; }
.mt-action-btn svg { width: 13px; height: 13px; }

.mt-icon-btn {
  width: 2.1rem; height: 2.1rem; border-radius: .6rem;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid var(--border);
  color: var(--muted-foreground); cursor: pointer; transition: all .18s;
}
.mt-icon-btn:hover { background: var(--accent); color: var(--foreground); border-color: oklch(0.85 0.006 260); }
.mt-icon-btn.danger:hover { background: oklch(0.97 0.05 25 / 0.5); color: oklch(0.5 0.22 25); border-color: oklch(0.88 0.1 25 / 0.4); }
.mt-icon-btn.active { background: oklch(0.94 0.04 260 / 0.5); color: oklch(0.52 0.2 260); border-color: oklch(0.82 0.08 260 / 0.4); }
.mt-icon-btn svg { width: 14px; height: 14px; transition: transform .25s; }
.mt-icon-btn .chevron.open { transform: rotate(180deg); }

/* ── Expanded panel ── */
.mt-expanded {
  border-top: 1px solid var(--border);
  background: linear-gradient(180deg, oklch(0.98 0.008 260), var(--card));
  padding: 1.5rem 1.25rem; display: flex; flex-direction: column; gap: 1.5rem;
}
.mt-exp-section-title {
  font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted-foreground); margin-bottom: .65rem; display: flex; align-items: center; gap: .4rem;
}
.mt-ai-box {
  border-radius: .9rem; padding: 1.1rem 1.25rem;
  background: oklch(0.94 0.04 290 / 0.4); border: 1px solid oklch(0.85 0.07 290 / 0.4);
}
.mt-ai-box-title {
  font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
  color: oklch(0.44 0.18 290); margin-bottom: .65rem; display: flex; align-items: center; gap: .4rem;
}
.mt-body-text { font-size: .875rem; color: var(--foreground); line-height: 1.7; }
.mt-notes-box {
  background: var(--background); border: 1px solid var(--border);
  border-radius: .75rem; padding: 1rem 1.1rem;
  font-size: .875rem; color: var(--foreground); line-height: 1.75;
  white-space: pre-line;
}
.mt-key-terms { display: flex; flex-wrap: wrap; gap: .5rem; }
.mt-key-term {
  font-size: .75rem; font-weight: 700; padding: .3rem .75rem; border-radius: 999px;
  background: oklch(0.94 0.04 260 / 0.5); color: oklch(0.42 0.2 260);
  border: 1px solid oklch(0.82 0.08 260 / 0.4);
}
.mt-resources-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
@media (max-width: 560px) { .mt-resources-grid { grid-template-columns: 1fr; } }
.mt-resource-card {
  display: flex; align-items: flex-start; gap: .75rem; padding: .8rem 1rem;
  border-radius: .8rem; border: 1px solid var(--border); background: var(--background);
  text-decoration: none; transition: border-color .18s, background .18s, transform .15s;
}
.mt-resource-card:hover { border-color: oklch(0.75 0.1 260); background: oklch(0.97 0.015 260); transform: translateY(-1px); }
.mt-resource-icon {
  width: 2rem; height: 2rem; border-radius: .5rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: .9rem;
}
.mt-resource-title { font-size: .82rem; font-weight: 700; color: var(--foreground); line-height: 1.3; }
.mt-resource-source { font-size: .7rem; color: var(--muted-foreground); margin-top: .2rem; }
.mt-resource-arrow { margin-left: auto; flex-shrink: 0; color: var(--muted-foreground); padding-top: .2rem; }
.mt-resource-arrow svg { width: 12px; height: 12px; }

/* Spin */
@keyframes spin { to { transform: rotate(360deg); } }
.mt-spin { animation: spin .8s linear infinite; }

/* Validation */
.mt-field-err { font-size: .75rem; color: oklch(0.5 0.22 25); display: flex; align-items: center; gap: .3rem; margin-top: .1rem; }
.mt-inp.invalid { border-color: oklch(0.6 0.22 25) !important; box-shadow: 0 0 0 3px oklch(0.6 0.22 25 / 0.1) !important; }
.mt-inp.valid   { border-color: oklch(0.55 0.18 145); }
`

// ── Component ────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  const [materials, setMaterials]   = useState<Material[]>([])
  const [loading, setLoading]       = useState(true)
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [search, setSearch]         = useState("")
  const [error, setError]           = useState("")

  const [showUpload, setShowUpload]     = useState(false)
  const [courseCode, setCourseCode]     = useState("")
  const [matType, setMatType]           = useState("NOTES")
  const [description, setDescription]  = useState("")
  const [fileEntries, setFileEntries]   = useState<FileEntry[]>([])
  const [uploading, setUploading]             = useState(false)
  const [uploadError, setUploadError]         = useState("")
  const [dragOver, setDragOver]               = useState(false)
  const [courseCodeTouched, setCourseCodeTouched] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [expanded, setExpanded]                 = useState<number | null>(null)
  const [summarizing, setSummarizing]           = useState<number | null>(null)
  const [summarizingAll, setSummarizingAll]     = useState(false)
  const [summarizeAllProgress, setSummarizeAllProgress] = useState({ done: 0, total: 0 })

  async function load() {
    setLoading(true)
    const res = await fetch("/api/materials")
    if (res.ok) setMaterials(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() =>
    materials
      .filter((m) => typeFilter === "ALL" || m.type === typeFilter)
      .filter((m) => {
        const q = search.toLowerCase()
        return !q || m.title.toLowerCase().includes(q) || m.courseCode.toLowerCase().includes(q)
      }),
    [materials, typeFilter, search]
  )

  // ── File picking ──────────────────────────────────────────────────────────
  function addFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles)
    setFileEntries((prev) => {
      const existing = new Set(prev.map((e) => e.file.name + e.file.size))
      const fresh = arr
        .filter((f) => !existing.has(f.name + f.size))
        .map((f) => ({ key: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`, file: f, title: fileTitle(f), status: "pending" as const }))
      return [...prev, ...fresh]
    })
  }
  function removeEntry(key: string) { setFileEntries((prev) => prev.filter((e) => e.key !== key)) }
  function updateTitle(key: string, title: string) { setFileEntries((prev) => prev.map((e) => e.key === key ? { ...e, title } : e)) }
  function handleDrop(ev: React.DragEvent) { ev.preventDefault(); setDragOver(false); addFiles(ev.dataTransfer.files) }

  function sanitizeCourseCode(raw: string) {
    const letters = raw.slice(0, 2).replace(/[^a-zA-Z]/g, "").toUpperCase()
    const digits  = raw.slice(letters.length === 2 ? 2 : letters.length, raw.length).replace(/[^0-9]/g, "")
    return (letters + digits).slice(0, 6)
  }
  const COURSE_CODE_RE = /^[A-Z]{2}\d{4}$/
  const courseCodeErr = courseCodeTouched
    ? !courseCode.trim()
      ? "Course code is required."
      : !COURSE_CODE_RE.test(courseCode)
      ? "Format must be 2 letters + 4 digits (e.g. CS2010)."
      : ""
    : ""

  // ── Upload ────────────────────────────────────────────────────────────────
  async function uploadAll() {
    setCourseCodeTouched(true)
    if (!courseCode.trim()) { setUploadError("Course code is required."); return }
    if (!COURSE_CODE_RE.test(courseCode)) { setUploadError("Course code must be 2 letters + 4 digits (e.g. CS2010)."); return }
    if (fileEntries.length === 0) { setUploadError("Add at least one file."); return }
    const oversized = fileEntries.find((e) => e.file.size > MAX_SIZE)
    if (oversized) { setUploadError(`"${oversized.file.name}" exceeds the 20 MB limit.`); return }
    setUploading(true); setUploadError(""); let anyError = false
    for (const entry of fileEntries) {
      if (entry.status === "done") continue
      setFileEntries((prev) => prev.map((e) => e.key === entry.key ? { ...e, status: "uploading" } : e))
      const fd = new FormData()
      fd.append("file", entry.file); fd.append("title", entry.title.trim() || fileTitle(entry.file))
      fd.append("courseCode", courseCode.trim()); fd.append("type", matType); fd.append("description", description.trim())
      const res = await fetch("/api/materials/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setFileEntries((prev) => prev.map((e) => e.key === entry.key ? { ...e, status: "error", errorMsg: data.error ?? "Upload failed." } : e))
        anyError = true
      } else {
        setFileEntries((prev) => prev.map((e) => e.key === entry.key ? { ...e, status: "done" } : e))
        setMaterials((prev) => [{ ...data, suggestedResources: data.suggestedResources ?? [] }, ...prev])
      }
    }
    setUploading(false); if (!anyError) closeUpload()
  }

  function closeUpload() {
    setShowUpload(false); setCourseCode(""); setMatType("NOTES")
    setDescription(""); setFileEntries([]); setUploadError(""); setCourseCodeTouched(false)
  }

  // ── Summarize ─────────────────────────────────────────────────────────────
  async function summarizeMaterial(id: number) {
    setSummarizing(id); setError("")
    const res = await fetch(`/api/materials/${id}/summarize`, { method: "POST" })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Summarization failed."); setSummarizing(null); return }
    setMaterials((prev) => prev.map((m) => m.id === id ? { ...m, isSummarized: true, summary: data.summary, suggestedResources: data.suggestedResources ?? [] } : m))
    setExpanded(id); setSummarizing(null)
  }

  async function summarizeAll() {
    const pending = materials.filter((m) => !m.isSummarized && m.fileAsset)
    if (pending.length === 0) return
    setSummarizingAll(true); setError(""); setSummarizeAllProgress({ done: 0, total: pending.length })
    for (let i = 0; i < pending.length; i++) {
      const mat = pending[i]; setSummarizing(mat.id)
      const res = await fetch(`/api/materials/${mat.id}/summarize`, { method: "POST" })
      const data = await res.json()
      if (res.ok) setMaterials((prev) => prev.map((m) => m.id === mat.id ? { ...m, isSummarized: true, summary: data.summary, suggestedResources: data.suggestedResources ?? [] } : m))
      setSummarizeAllProgress({ done: i + 1, total: pending.length })
    }
    setSummarizing(null); setSummarizingAll(false)
  }

  async function deleteMaterial(id: number) {
    if (!confirm("Delete this material?")) return
    const res = await fetch(`/api/materials/${id}`, { method: "DELETE" })
    if (res.ok) setMaterials((prev) => prev.filter((m) => m.id !== id))
    else setError("Failed to delete material.")
  }

  const pendingCount   = fileEntries.filter((e) => e.status === "pending").length
  const doneCount      = fileEntries.filter((e) => e.status === "done").length
  const errorCount     = fileEntries.filter((e) => e.status === "error").length
  const unsummarized   = materials.filter((m) => !m.isSummarized && m.fileAsset).length
  const summarizedCount= materials.filter((m) => m.isSummarized).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── Hero ── */}
        <div className="mt-hero">
          <div className="mt-hero-glow" />
          <div className="mt-hero-inner">
            <div>
              <div className="mt-hero-tag"><span className="mt-hero-tag-dot" /> Study Materials</div>
              <h1 className="mt-hero-title">Your Study Library</h1>
              <p className="mt-hero-sub">
                Upload PDFs, slides and notes — then let AI summarise content and suggest related resources.
              </p>
            </div>
            <div className="mt-hero-actions" style={{ paddingTop: "1.5rem" }}>
              {unsummarized > 0 && (
                <button className="mt-btn-ai" onClick={summarizeAll} disabled={summarizingAll || !!summarizing}>
                  {summarizingAll ? (
                    <>
                      <svg className="mt-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                      {summarizeAllProgress.done}/{summarizeAllProgress.total}…
                    </>
                  ) : <>✨ Summarise All ({unsummarized})</>}
                </button>
              )}
              {!showUpload && (
                <button className="mt-btn-primary" onClick={() => { setShowUpload(true); setUploadError("") }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5M12 7.5L7.5 12M12 7.5V19.5"/>
                  </svg>
                  Upload Material
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="mt-toolbar">
          <div className="mt-search-wrap">
            <span className="mt-search-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              className="mt-search"
              placeholder="Search by title or course code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mt-filter-group">
            {TYPES.map((t) => (
              <button
                key={t}
                className={`mt-filter-btn${typeFilter === t ? " active" : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === "ALL" ? "All" : <>{TYPE_META[t]?.icon} {t}</>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="mt-stats">
          <span className="mt-stat-chip">
            <span className="mt-stat-dot" />
            {filtered.length} material{filtered.length !== 1 ? "s" : ""}
          </span>
          {summarizedCount > 0 && (
            <span className="mt-stat-chip ai">
              ✨ {summarizedCount} AI summarised
            </span>
          )}
          {unsummarized > 0 && (
            <span className="mt-stat-chip">
              <span className="mt-stat-dot" />
              {unsummarized} pending summary
            </span>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mt-error">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* ── Upload panel ── */}
        {showUpload && (
          <div className="mt-upload-panel">
            <div className="mt-upload-header">
              <div className="mt-upload-title"><span>📤</span> Upload Materials</div>
              <span className="mt-upload-hint">You can upload multiple files at once</span>
            </div>
            <div className="mt-upload-body">
              {uploadError && <div className="mt-upload-err">{uploadError}</div>}

              <div className="mt-grid-2">
                <div className="mt-field">
                  <label className="mt-lbl">Course Code <span className="mt-lbl-req">*</span></label>
                  <input
                    className={`mt-inp${courseCodeErr ? " invalid" : courseCodeTouched && courseCode.trim() ? " valid" : ""}`}
                    placeholder="e.g. CS2010"
                    value={courseCode}
                    onChange={(e) => { setCourseCode(sanitizeCourseCode(e.target.value)); setUploadError("") }}
                    maxLength={6}
                    onBlur={() => setCourseCodeTouched(true)}
                    disabled={uploading}
                  />
                  {courseCodeErr && (
                    <span className="mt-field-err">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {courseCodeErr}
                    </span>
                  )}
                </div>
                <div className="mt-field">
                  <label className="mt-lbl">Type</label>
                  <select className="mt-inp mt-sel" value={matType}
                    onChange={(e) => setMatType(e.target.value)} disabled={uploading}>
                    <option value="NOTES">📝 Notes</option>
                    <option value="PDF">📄 PDF</option>
                    <option value="SLIDES">📊 Slides</option>
                  </select>
                </div>
              </div>

              <div className="mt-field">
                <label className="mt-lbl">Description <span style={{ fontWeight: 400, opacity: .65 }}>(optional)</span></label>
                <textarea className="mt-inp mt-ta" rows={2} placeholder="Brief description…"
                  value={description} onChange={(e) => setDescription(e.target.value)} disabled={uploading} />
              </div>

              {/* Drop zone */}
              <div
                className={`mt-dropzone${dragOver ? " over" : ""}${uploading ? " disabled" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mt-drop-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5M12 7.5L7.5 12M12 7.5V19.5"/>
                  </svg>
                </div>
                <div className="mt-drop-title">{dragOver ? "Drop files here" : "Click or drag files here"}</div>
                <div className="mt-drop-sub">PDF, PPT, DOC, TXT, images — max 20 MB each</div>
                <input ref={fileInputRef} type="file" accept={ACCEPT_TYPES} multiple
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }}
                  disabled={uploading} />
              </div>

              {/* File list */}
              {fileEntries.length > 0 && (
                <div className="mt-file-list">
                  <div className="mt-file-list-header">
                    <span className="mt-file-list-meta">
                      {fileEntries.length} file{fileEntries.length !== 1 ? "s" : ""}
                      {uploading && <span className="uploading"> · uploading {doneCount}/{fileEntries.length}…</span>}
                      {!uploading && doneCount > 0 && errorCount === 0 && <span className="ok"> · all uploaded ✓</span>}
                      {!uploading && errorCount > 0 && <span className="err"> · {errorCount} failed</span>}
                    </span>
                    {!uploading && (
                      <button className="mt-clear-btn" onClick={() => setFileEntries([])}>Clear all</button>
                    )}
                  </div>
                  {fileEntries.map((entry) => (
                    <div key={entry.key} className={`mt-file-row ${entry.status}`}>
                      <span className="mt-file-status">
                        {entry.status === "done"      && <span style={{ color: "oklch(0.45 0.18 145)", fontWeight: 800 }}>✓</span>}
                        {entry.status === "error"     && <span style={{ color: "oklch(0.5 0.22 25)", fontWeight: 800 }}>✕</span>}
                        {entry.status === "uploading" && (
                          <svg className="mt-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="oklch(0.52 0.2 260)" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                          </svg>
                        )}
                        {entry.status === "pending"   && <span style={{ color: "var(--muted-foreground)" }}>📄</span>}
                      </span>
                      <div className="mt-file-info">
                        <input
                          className="mt-file-title-inp"
                          value={entry.title}
                          onChange={(e) => updateTitle(entry.key, e.target.value)}
                          disabled={uploading || entry.status === "done"}
                          placeholder="Title…"
                        />
                        <div className="mt-file-meta">
                          <span>{entry.file.name}</span>
                          <span>·</span>
                          <span>{formatBytes(entry.file.size)}</span>
                          {entry.status === "error" && entry.errorMsg && (
                            <span className="mt-file-err-txt">· {entry.errorMsg}</span>
                          )}
                        </div>
                      </div>
                      {!uploading && entry.status !== "done" && (
                        <button className="mt-file-remove" onClick={() => removeEntry(entry.key)}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-upload-actions">
                <button className="mt-submit-btn" onClick={uploadAll}
                  disabled={uploading || fileEntries.length === 0}>
                  {uploading ? (
                    <>
                      <svg className="mt-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                      Uploading {doneCount + fileEntries.filter(e => e.status === "uploading").length}/{fileEntries.length}…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5M12 7.5L7.5 12M12 7.5V19.5"/>
                      </svg>
                      Upload {fileEntries.filter(e => e.status !== "done").length > 0
                        ? `${fileEntries.filter(e => e.status !== "done").length} file${fileEntries.filter(e => e.status !== "done").length !== 1 ? "s" : ""}`
                        : ""}
                    </>
                  )}
                </button>
                <button className="mt-cancel-btn" onClick={closeUpload} disabled={uploading}>
                  {doneCount > 0 && !uploading ? "Done" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Material list ── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mt-skel" style={{ height: "4.5rem" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-empty">
            <div className="mt-empty-icon">📚</div>
            <div className="mt-empty-title">
              {search || typeFilter !== "ALL" ? "No materials match your search." : "No materials yet."}
            </div>
            <div className="mt-empty-sub">
              {!search && typeFilter === "ALL"
                ? "Upload your first lecture note or PDF to get started."
                : "Try a different search or filter."}
            </div>
          </div>
        ) : (
          <div>
            {filtered.map((mat) => {
              const meta = TYPE_META[mat.type]
              const isExpanded = expanded === mat.id
              const isSumm = summarizing === mat.id
              const hasDetails = mat.description || mat.summary

              return (
                <div key={mat.id} className="mt-card">
                  <div className="mt-card-row">
                    {/* Icon */}
                    <div className="mt-card-icon" style={{ background: meta?.bg ?? "var(--muted)" }}>
                      {meta?.icon ?? "📄"}
                    </div>

                    {/* Body */}
                    <div className="mt-card-body">
                      <div className="mt-card-title-row">
                        <span className="mt-card-title">{mat.title}</span>
                        <span className="mt-badge" style={{ background: meta?.bg, color: meta?.fg }}>
                          {meta?.icon} {mat.type}
                        </span>
                        {mat.isSummarized && (
                          <span className="mt-badge mt-badge-ai">✨ AI Summary</span>
                        )}
                      </div>
                      <div className="mt-card-meta">
                        <span className="mt-meta-code">{mat.courseCode}</span>
                        {mat.fileAsset && (
                          <>
                            <span className="mt-meta-sep">·</span>
                            <span>{mat.fileAsset.fileName}</span>
                            <span className="mt-meta-sep">·</span>
                            <span>{formatBytes(mat.fileAsset.fileSize)}</span>
                          </>
                        )}
                        <span className="mt-meta-sep">·</span>
                        <span>{new Date(mat.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-card-actions">
                      {!mat.isSummarized && mat.fileAsset && (
                        <button className="mt-action-btn summarize" onClick={() => summarizeMaterial(mat.id)} disabled={isSumm || summarizingAll}>
                          {isSumm ? (
                            <>
                              <svg className="mt-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
                                <circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                              </svg>
                              Summarising…
                            </>
                          ) : <>✨ Summarise</>}
                        </button>
                      )}

                      {mat.fileAsset && (
                        <a href={mat.fileAsset.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="mt-icon-btn" title="Download">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                          </svg>
                        </a>
                      )}

                      {hasDetails && (
                        <button
                          className={`mt-icon-btn${isExpanded ? " active" : ""}`}
                          onClick={() => setExpanded(isExpanded ? null : mat.id)}
                          title="Details"
                        >
                          <svg className={`chevron${isExpanded ? " open" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                          </svg>
                        </button>
                      )}

                      <button className="mt-icon-btn danger" onClick={() => deleteMaterial(mat.id)} title="Delete">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded ── */}
                  {isExpanded && (
                    <div className="mt-expanded">
                      {mat.description && (
                        <div>
                          <div className="mt-exp-section-title">📋 Description</div>
                          <p className="mt-body-text">{mat.description}</p>
                        </div>
                      )}

                      {mat.summary && (
                        <>
                          <div className="mt-ai-box">
                            <div className="mt-ai-box-title">✨ AI Quick Summary</div>
                            <p className="mt-body-text">{mat.summary.quickSummary}</p>
                          </div>

                          {mat.summary.detailedNotes && (
                            <div>
                              <div className="mt-exp-section-title">📖 Detailed Notes</div>
                              <div className="mt-notes-box">{mat.summary.detailedNotes}</div>
                            </div>
                          )}

                          {mat.summary.keyTerms && (
                            <div>
                              <div className="mt-exp-section-title">🔑 Key Terms</div>
                              <div className="mt-key-terms">
                                {mat.summary.keyTerms.split(",").map((term, i) => (
                                  <span key={i} className="mt-key-term">{term.trim()}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {mat.suggestedResources.length > 0 && (
                        <div>
                          <div className="mt-exp-section-title">🔗 Suggested Resources</div>
                          <div className="mt-resources-grid">
                            {mat.suggestedResources.map((res) => {
                              const rm = RESOURCE_META[res.type]
                              return (
                                <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className="mt-resource-card">
                                  <div className="mt-resource-icon" style={{ background: rm?.bg }}>{rm?.icon}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="mt-resource-title">{res.title}</div>
                                    <div className="mt-resource-source">{res.sourceName}</div>
                                  </div>
                                  <div className="mt-resource-arrow">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                                    </svg>
                                  </div>
                                </a>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
