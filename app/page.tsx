"use client";

import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   EduCore — Advanced Landing Page
   Aesthetic: Dark, editorial, premium tech
   Fonts: Cabinet Grotesk (display) + Instrument Sans (body)
───────────────────────────────────────────── */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Sora:wght@300;400;600;700;800&display=swap');
@import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #ffffff;
  --bg-card:   oklch(0.985 0.004 258);
  --bg-subtle: oklch(0.965 0.007 258);
  --fg:        oklch(0.16 0 0);
  --fg-muted:  oklch(0.46 0.015 258);
  --primary:   oklch(0.6231 0.1880 259.8145);
  --primary-2: oklch(0.5461 0.2152 262.8809);
  --primary-3: oklch(0.4882 0.2172 264.3763);
  --primary-4: oklch(0.4244 0.1809 265.6377);
  --accent:    oklch(0.4244 0.1809 265.6377);
  --border:    oklch(0.88 0.006 260);
  --border-s:  oklch(0.92 0.004 260);
  --radius:    0.75rem;
  --font-display: 'Cabinet Grotesk', 'Sora', sans-serif;
  --font-body:    'Instrument Sans', 'Sora', sans-serif;
}

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  overflow-x: hidden;
  cursor: none;
}

/* ── Custom cursor ── */
#cursor {
  position: fixed; width: 12px; height: 12px; border-radius: 50%;
  background: var(--primary); pointer-events: none; z-index: 9999;
  transform: translate(-50%,-50%);
  transition: width .2s, height .2s, opacity .2s;
  mix-blend-mode: multiply;
}
#cursor-ring {
  position: fixed; width: 36px; height: 36px; border-radius: 50%;
  border: 1.5px solid oklch(0.6231 0.1880 259.8145 / 0.4);
  pointer-events: none; z-index: 9998;
  transform: translate(-50%,-50%);
  transition: transform .12s ease-out, width .2s, height .2s, border-color .2s;
  display: none;
}
html.dark #cursor-ring { display: block; }
body:has(a:hover) #cursor { width:20px; height:20px; opacity:.7; }
body:has(button:hover) #cursor { width:20px; height:20px; opacity:.7; }

/* ── Noise overlay ── */
.noise::after {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 9000;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  opacity: .5;
}

/* ── Navbar ── */
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  padding: 1.25rem 3rem;
  display: flex; align-items: center; justify-content: space-between;
  transition: background .4s, border-color .4s, backdrop-filter .4s;
}
.navbar.scrolled {
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(24px) saturate(160%);
  border-bottom: 1px solid var(--border-s);
}
.nav-logo {
  font-family: var(--font-display); font-size: 1.35rem; font-weight: 800;
  color: var(--fg); letter-spacing: -0.03em; display: flex; align-items: center; gap: .3rem;
  text-decoration: none;
}
.logo-glyph {
  width: 26px; height: 26px; border-radius: 7px;
  background: linear-gradient(135deg, var(--primary), var(--primary-4));
  display: flex; align-items: center; justify-content: center;
  font-size: .75rem; color: white; font-weight: 800;
}
.nav-links {
  display: flex; gap: 2.5rem; list-style: none;
  position: absolute; left: 50%; transform: translateX(-50%);
}
.nav-links a {
  text-decoration: none; color: var(--fg-muted); font-size: .875rem;
  font-weight: 500; letter-spacing: .01em;
  transition: color .2s; position: relative; padding-bottom: .1rem;
}
.nav-links a::after {
  content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
  height: 1px; background: var(--primary);
  transform: scaleX(0); transform-origin: left; transition: transform .25s;
}
.nav-links a:hover { color: var(--fg); }
.nav-links a:hover::after { transform: scaleX(1); }
.nav-actions { display: flex; gap: .6rem; align-items: center; }

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .6rem 1.25rem; border-radius: .5rem; font-size: .875rem;
  font-weight: 600; cursor: pointer; transition: all .25s;
  text-decoration: none; border: none; font-family: var(--font-body);
  letter-spacing: .01em;
}
.btn-outline {
  background: transparent; color: var(--fg-muted);
  border: 1px solid var(--border);
}
.btn-outline:hover { border-color: var(--primary); color: var(--fg); }
.btn-filled {
  background: var(--primary); color: white;
  box-shadow: 0 0 0 0 oklch(0.6231 0.1880 259.8145 / 0);
}
.btn-filled:hover {
  background: var(--primary-2);
  box-shadow: 0 0 32px oklch(0.6231 0.1880 259.8145 / 0.4);
  transform: translateY(-1px);
}
.btn-lg { padding: .875rem 1.875rem; font-size: 1rem; border-radius: .6rem; }
.btn-ghost-white {
  background: oklch(0 0 0 / .04); color: var(--fg); border: 1px solid var(--border);
}
.btn-ghost-white:hover { background: oklch(0 0 0 / .08); }

/* ── Hero ── */
.hero {
  min-height: 100vh; display: flex; align-items: center;
  justify-content: center; position: relative; overflow: hidden;
  padding: 11rem 5rem 8rem;
}

/* Canvas behind hero */
#hero-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: auto; z-index: 0;
}

.hero-glow-1 {
  position: absolute; width: 700px; height: 700px; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.6231 0.1880 259.8145 / 0.12) 0%, transparent 65%);
  top: -200px; left: -200px; pointer-events: none;
  animation: driftA 14s ease-in-out infinite alternate;
}
.hero-glow-2 {
  position: absolute; width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.4882 0.2172 264.3763 / 0.1) 0%, transparent 65%);
  bottom: -100px; right: -100px; pointer-events: none;
  animation: driftB 10s ease-in-out infinite alternate;
}
@keyframes driftA {
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(60px,40px) scale(1.1); }
}
@keyframes driftB {
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(-40px,-30px) scale(1.08); }
}

/* Horizontal rule decoration */
.hero-eyebrow {
  display: flex; align-items: center; gap: .75rem; margin-bottom: 1.75rem;
  animation: revealUp .7s cubic-bezier(.16,1,.3,1) both;
}
.eyebrow-line {
  width: 32px; height: 1px; background: var(--primary);
}
.eyebrow-text {
  font-size: .72rem; font-weight: 600; letter-spacing: .15em;
  text-transform: uppercase; color: var(--primary);
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(3.2rem, 7vw, 5.5rem);
  font-weight: 800; line-height: 1.02; letter-spacing: -0.04em;
  color: var(--fg); margin-bottom: 1.5rem;
  animation: revealUp .8s cubic-bezier(.16,1,.3,1) .1s both;
}
.hero-title .line-accent {
  background: linear-gradient(90deg, var(--primary), var(--primary-3));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-title .line-dim { color: var(--fg-muted); }

.hero-sub {
  font-size: 1.05rem; color: var(--fg-muted); line-height: 1.75;
  max-width: 660px; margin-bottom: 2.5rem;
  animation: revealUp .8s cubic-bezier(.16,1,.3,1) .2s both;
}
.hero-cta {
  display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 4rem;
  animation: revealUp .8s cubic-bezier(.16,1,.3,1) .3s both;
}

/* Social proof */
.social-proof {
  display: flex; align-items: center; gap: 1rem;
  animation: revealUp .8s cubic-bezier(.16,1,.3,1) .4s both;
  border-top: 1px solid var(--border-s); padding-top: 1.5rem;
}
.av-stack { display: flex; }
.av {
  width: 30px; height: 30px; border-radius: 50%;
  border: 2px solid var(--bg); display: flex; align-items: center;
  justify-content: center; font-size: .62rem; font-weight: 700; color: white;
}
.av:not(:first-child) { margin-left: -9px; }
.sp-text { font-size: .8rem; color: var(--fg-muted); line-height: 1.4; }
.sp-text strong { color: var(--fg); }

/* ── Dashboard preview floating card ── */
.hero-visual {
  position: relative; flex-shrink: 0;
  animation: floatCard 1s cubic-bezier(.16,1,.3,1) .5s both;
}
@keyframes floatCard {
  from { opacity: 0; transform: translateY(40px) rotate(1deg); }
  to   { opacity: 1; transform: translateY(0) rotate(0deg); }
}
.dashboard-card {
  width: 420px; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: 0 32px 80px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0.6231 0.1880 259.8145 / 0.08);
}
.dash-topbar {
  padding: .875rem 1.25rem; border-bottom: 1px solid var(--border-s);
  display: flex; align-items: center; gap: .75rem;
  background: var(--bg-subtle);
}
.dash-dots { display: flex; gap: .4rem; }
.dash-dot {
  width: 10px; height: 10px; border-radius: 50%;
}
.dash-tab-row {
  display: flex; gap: .25rem; flex: 1; justify-content: center;
}
.dash-tab {
  font-size: .7rem; padding: .25rem .625rem; border-radius: .3rem;
  color: var(--fg-muted); cursor: pointer; transition: all .2s;
}
.dash-tab.active {
  background: oklch(0.6231 0.1880 259.8145 / 0.15);
  color: var(--primary);
}
.dash-body { padding: 1.25rem; display: flex; flex-direction: column; gap: .875rem; }

/* mini widgets inside dashboard preview */
.mini-score-row { display: flex; gap: .75rem; }
.score-chip {
  flex: 1; background: var(--bg-subtle); border: 1px solid var(--border-s);
  border-radius: .625rem; padding: .75rem; text-align: center;
}
.score-chip-val {
  font-family: var(--font-display); font-size: 1.4rem; font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--primary-3));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.score-chip-lbl { font-size: .65rem; color: var(--fg-muted); margin-top: .15rem; }
.mini-chart-bars {
  display: flex; align-items: flex-end; gap: .35rem; height: 70px;
  background: var(--bg-subtle); border: 1px solid var(--border-s);
  border-radius: .625rem; padding: .75rem .875rem;
}
.bar {
  flex: 1; border-radius: .25rem .25rem 0 0;
  background: oklch(0.6231 0.1880 259.8145 / 0.25);
  position: relative; transition: height .6s;
}
.bar.hi { background: linear-gradient(180deg, var(--primary), var(--primary-3)); }
.bar-lbl { font-size: .55rem; color: var(--fg-muted); text-align: center; margin-top: .25rem; }

.mini-list { display: flex; flex-direction: column; gap: .5rem; }
.mini-list-item {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--bg-subtle); border: 1px solid var(--border-s);
  border-radius: .5rem; padding: .6rem .875rem;
}
.mli-left { display: flex; align-items: center; gap: .5rem; }
.mli-icon {
  width: 26px; height: 26px; border-radius: .375rem;
  background: oklch(0.6231 0.1880 259.8145 / 0.15);
  display: flex; align-items: center; justify-content: center;
  font-size: .75rem;
}
.mli-name { font-size: .75rem; font-weight: 600; color: var(--fg); }
.mli-sub { font-size: .62rem; color: var(--fg-muted); }
.mli-badge {
  font-size: .6rem; padding: .2rem .5rem; border-radius: 999px; font-weight: 600;
}
.badge-open { background: oklch(0.92 0.08 145); color: oklch(0.36 0.14 145); }
.badge-pend { background: oklch(0.95 0.07 75);  color: oklch(0.42 0.12 75); }

/* ── Section base ── */
.section { max-width: 1200px; margin: 0 auto; padding: 6rem 3rem; }
.section-eyebrow {
  display: flex; align-items: center; gap: .6rem; margin-bottom: 1rem;
}
.ey-num {
  font-size: .65rem; font-weight: 700; color: var(--primary);
  border: 1px solid oklch(0.6231 0.1880 259.8145 / .3);
  padding: .15rem .45rem; border-radius: .25rem; letter-spacing: .05em;
}
.ey-label { font-size: .72rem; text-transform: uppercase; letter-spacing: .12em; color: var(--fg-muted); font-weight: 600; }
.section-h {
  font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 800; line-height: 1.08; letter-spacing: -.03em;
  color: var(--fg); margin-bottom: 1rem;
}
.section-p {
  font-size: .975rem; color: var(--fg-muted); line-height: 1.75; max-width: 500px;
}

/* ── Stats strip ── */
.stats-strip {
  border-top: 1px solid var(--border-s); border-bottom: 1px solid var(--border-s);
  background: var(--bg-subtle);
}
.stats-inner {
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(4,1fr);
}
.stat-cell {
  padding: 2.25rem 2rem; border-right: 1px solid var(--border-s);
  transition: background .2s;
}
.stat-cell:last-child { border-right: none; }
.stat-cell:hover { background: oklch(0.6231 0.1880 259.8145 / .04); }
.stat-val {
  font-family: var(--font-display); font-size: 2.5rem; font-weight: 800;
  letter-spacing: -.04em; line-height: 1;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; margin-bottom: .35rem;
}
.stat-lbl { font-size: .8rem; color: var(--fg-muted); font-weight: 500; }

/* ── Bento grid — features ── */
.bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(220px, auto);
  gap: 1px; background: var(--border-s);
  border: 1px solid var(--border-s); border-radius: 1.25rem;
  overflow: hidden; margin-top: 3.5rem;
}
.bento-cell {
  background: var(--bg-card); padding: 2rem;
  position: relative; overflow: hidden;
  transition: background .3s;
}
.bento-cell:hover { background: oklch(0.96 0.008 258); }
.bento-cell::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, var(--primary) 0%, transparent 70%);
  opacity: 0; transition: opacity .35s;
  pointer-events: none;
}
.bento-cell:hover::before { opacity: .04; }
.bc-1 { grid-column: span 7; grid-row: span 1; }
.bc-2 { grid-column: span 5; grid-row: span 1; }
.bc-3 { grid-column: span 4; grid-row: span 1; }
.bc-4 { grid-column: span 4; grid-row: span 1; }
.bc-5 { grid-column: span 4; grid-row: span 1; }

.bento-icon {
  width: 44px; height: 44px; border-radius: .625rem;
  background: oklch(0.6231 0.1880 259.8145 / .12);
  border: 1px solid oklch(0.6231 0.1880 259.8145 / .2);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; margin-bottom: 1.25rem;
}
.bento-label { font-size: .65rem; text-transform: uppercase; letter-spacing: .12em; color: var(--primary); font-weight: 700; margin-bottom: .4rem; }
.bento-title {
  font-family: var(--font-display); font-size: 1.25rem; font-weight: 700;
  color: var(--fg); line-height: 1.2; margin-bottom: .6rem; letter-spacing: -.02em;
}
.bento-desc { font-size: .83rem; color: var(--fg-muted); line-height: 1.65; }

/* mini inline widget for bento cells */
.mini-gpa-bars { display: flex; gap: .3rem; align-items: flex-end; margin-top: 1.25rem; height: 48px; }
.mgb { border-radius: .2rem .2rem 0 0; flex: 1; background: oklch(0.6231 0.1880 259.8145 / 0.18); }
.mgb.peak { background: linear-gradient(180deg, var(--primary), var(--primary-4)); }
.keyword-cloud { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: 1rem; }
.kw {
  padding: .25rem .625rem; border-radius: 999px; font-size: .7rem; font-weight: 600;
  background: oklch(0.6231 0.1880 259.8145 / .1);
  border: 1px solid oklch(0.6231 0.1880 259.8145 / .2);
  color: var(--accent);
}
.mentor-row {
  display: flex; gap: .6rem; margin-top: .875rem;
}
.mentor-pill {
  display: flex; align-items: center; gap: .45rem; padding: .4rem .7rem;
  background: var(--bg-subtle); border: 1px solid var(--border-s); border-radius: 999px;
}
.mentor-av {
  width: 20px; height: 20px; border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-4));
  display: flex; align-items: center; justify-content: center;
  font-size: .55rem; color: white; font-weight: 800;
}
.mentor-name { font-size: .7rem; font-weight: 600; color: var(--fg); }
.mentor-star { font-size: .62rem; color: #f59e0b; }

/* ── Process section ── */
.process-grid {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; margin-top: 3.5rem;
}
.process-card {
  border: 1px solid var(--border-s); border-radius: 1rem;
  padding: 2rem; position: relative; overflow: hidden;
  background: var(--bg-card);
  transition: border-color .3s, transform .3s;
}
.process-card:hover { border-color: oklch(0.6231 0.1880 259.8145 / .4); transform: translateY(-4px); }
.process-num {
  position: absolute; top: 1.5rem; right: 1.5rem;
  font-family: var(--font-display); font-size: 4rem; font-weight: 800;
  color: oklch(0.88 0 0); line-height: 1; letter-spacing: -.05em;
}
.process-icon { font-size: 1.75rem; margin-bottom: 1.25rem; }
.process-title {
  font-family: var(--font-display); font-size: 1.1rem; font-weight: 700;
  color: var(--fg); margin-bottom: .5rem; letter-spacing: -.02em;
}
.process-desc { font-size: .83rem; color: var(--fg-muted); line-height: 1.65; }

/* ── Testimonials ── */
.testimonials-track { display: flex; gap: 1.25rem; margin-top: 3rem; overflow-x: auto; padding-bottom: .5rem; }
.testimonials-track::-webkit-scrollbar { display: none; }
.testi-card {
  flex-shrink: 0; width: 340px;
  border: 1px solid var(--border-s); border-radius: 1rem;
  padding: 1.75rem; background: var(--bg-card);
}
.testi-stars { color: #f59e0b; font-size: .85rem; margin-bottom: 1rem; letter-spacing: .1em; }
.testi-quote {
  font-size: .9rem; color: var(--fg-muted); line-height: 1.75;
  margin-bottom: 1.25rem; font-style: italic;
}
.testi-author { display: flex; align-items: center; gap: .7rem; }
.testi-av {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; font-weight: 800; color: white;
  background: linear-gradient(135deg, var(--primary), var(--primary-4));
}
.testi-name { font-size: .85rem; font-weight: 700; color: var(--fg); }
.testi-role { font-size: .75rem; color: var(--fg-muted); }

/* ── CTA section ── */
.cta-section {
  position: relative; overflow: hidden;
  background: linear-gradient(145deg, oklch(0.4882 0.2172 264.3763) 0%, oklch(0.4244 0.1809 265.6377) 100%);
  border-top: 1px solid var(--border-s); border-bottom: 1px solid var(--border-s);
}
.cta-grid-bg {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(oklch(0.6231 0.1880 259.8145 / .06) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0.6231 0.1880 259.8145 / .06) 1px, transparent 1px);
  background-size: 50px 50px;
}
.cta-inner {
  max-width: 1200px; margin: 0 auto; padding: 7rem 3rem;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  position: relative;
}
.cta-h {
  font-family: var(--font-display); font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 800; letter-spacing: -.04em; line-height: 1.06;
  color: #ffffff; margin-bottom: 1.25rem;
}
.cta-sub { font-size: 1rem; color: rgba(255,255,255,0.75); margin-bottom: 2.5rem; max-width: 440px; line-height: 1.7; }
.cta-section .ey-num { color: #fff; border-color: rgba(255,255,255,0.35); }
.cta-section .ey-label { color: rgba(255,255,255,0.65); }
.cta-btns { display: flex; gap: .75rem; flex-wrap: wrap; justify-content: center; }

/* ── Footer ── */
.footer {
  background: var(--bg-subtle); border-top: 1px solid var(--border-s);
  padding: 4rem 3rem 2rem;
}
.footer-inner { max-width: 1200px; margin: 0 auto; }
.footer-top {
  display: grid; grid-template-columns: 2.5fr 1fr 1fr 1fr;
  gap: 3rem; margin-bottom: 3rem;
}
.footer-brand { }
.footer-brand-name {
  font-family: var(--font-display); font-size: 1.2rem; font-weight: 800;
  color: var(--fg); letter-spacing: -.03em; margin-bottom: .5rem; display: flex; align-items: center; gap: .4rem;
}
.footer-brand-desc { font-size: .82rem; color: var(--fg-muted); line-height: 1.65; max-width: 240px; margin-bottom: 1.25rem; }
.footer-socials { display: flex; gap: .5rem; }
.social-btn {
  width: 32px; height: 32px; border-radius: .375rem;
  background: var(--bg-card); border: 1px solid var(--border-s);
  display: flex; align-items: center; justify-content: center; font-size: .8rem;
  color: var(--fg-muted); cursor: pointer; transition: all .2s;
  text-decoration: none;
}
.social-btn:hover { border-color: var(--primary); color: var(--primary); }
.footer-col-title {
  font-size: .72rem; text-transform: uppercase; letter-spacing: .1em;
  color: var(--fg-muted); font-weight: 700; margin-bottom: 1rem;
}
.footer-links { list-style: none; display: flex; flex-direction: column; gap: .6rem; }
.footer-links a {
  text-decoration: none; color: oklch(0.5510 0.0234 264.3637);
  font-size: .83rem; transition: color .2s;
}
.footer-links a:hover { color: var(--fg); }
.footer-bottom {
  border-top: 1px solid var(--border-s); padding-top: 1.5rem;
  display: flex; justify-content: space-between; align-items: center;
  font-size: .78rem; color: var(--fg-muted);
}

/* ── Horizontal marquee ── */
.marquee-wrap { overflow: hidden; border-top: 1px solid var(--border-s); border-bottom: 1px solid var(--border-s); padding: .875rem 0; background: var(--bg-subtle); }
.marquee-track {
  display: flex; gap: 0; white-space: nowrap;
  animation: marquee 28s linear infinite;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.marquee-item {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: 0 2rem; font-size: .78rem; color: var(--fg-muted); font-weight: 500;
}
.marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--primary); flex-shrink: 0; }

/* ── Animations ── */
@keyframes revealUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
.reveal.visible { opacity: 1; transform: translateY(0); }
.reveal-d1 { transition-delay: .1s; }
.reveal-d2 { transition-delay: .2s; }
.reveal-d3 { transition-delay: .3s; }
.reveal-d4 { transition-delay: .4s; }

/* ── Glow borders on hover ── */
.glow-border {
  position: relative;
}
.glow-border::after {
  content: ''; position: absolute; inset: -1px; border-radius: inherit;
  background: linear-gradient(135deg, var(--primary), transparent, var(--primary-4));
  z-index: -1; opacity: 0; transition: opacity .35s;
}
.glow-border:hover::after { opacity: 1; }

@media (max-width: 900px) {
  .nav-links { display: none; }
  .hero { flex-direction: column; padding: 10rem 2rem 6rem; }
  .dashboard-card { width: 100%; max-width: 420px; }
  .stats-inner { grid-template-columns: repeat(2,1fr); }
  .bento { grid-template-columns: 1fr; }
  .bc-1,.bc-2,.bc-3,.bc-4,.bc-5 { grid-column: span 1; }
  .process-grid { grid-template-columns: 1fr; }
  .footer-top { grid-template-columns: 1fr 1fr; gap: 2rem; }
  .section { padding: 4rem 1.5rem; }
  .navbar { padding: 1.1rem 1.5rem; }
}

/* ── Dark theme overrides ── */
html.dark {
  --bg:        #000000;
  --bg-card:   oklch(0.14 0 0);
  --bg-subtle: oklch(0.12 0 0);
  --fg:        oklch(0.9219 0 0);
  --fg-muted:  oklch(0.7155 0 0);
  --accent:    oklch(0.8823 0.0571 254.1284);
  --border:    oklch(0.26 0 0);
  --border-s:  oklch(0.20 0 0);
}
html.dark body { background: #000000; color: oklch(0.9219 0 0); }
html.dark .navbar.scrolled { background: rgba(0,0,0,0.88); }
html.dark .btn-ghost-white {
  background: oklch(1 0 0 / .08); color: var(--fg); border: 1px solid oklch(1 0 0 / .12);
}
html.dark .btn-ghost-white:hover { background: oklch(1 0 0 / .14); }
html.dark .bento-cell:hover { background: oklch(0.14 0 0); }
html.dark .bento-cell:hover::before { opacity: .04; }
html.dark .cta-section {
  background: linear-gradient(145deg, oklch(0.4244 0.1809 265.6377) 0%, oklch(0.08 0 0) 60%);
}
html.dark .process-num { color: oklch(0.26 0 0); }
html.dark .badge-open { background: oklch(0.35 0.12 145); color: oklch(0.75 0.18 145); }
html.dark .badge-pend { background: oklch(0.35 0.1 75);  color: oklch(0.78 0.15 75); }
html.dark #cursor { mix-blend-mode: screen; }

/* ── Theme toggle button ── */
.theme-toggle {
  width: 36px; height: 36px; border-radius: .5rem;
  border: 1px solid var(--border); background: var(--bg-subtle);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .25s; color: var(--fg-muted);
  flex-shrink: 0;
}
.theme-toggle:hover { border-color: var(--primary); color: var(--primary); background: oklch(0.6231 0.1880 259.8145 / .08); }

/* ── About Us ── */
.about-section {
  padding: 7rem 3rem; background: var(--bg); position: relative; overflow: hidden;
}
.about-inner {
  max-width: 1200px; margin: 0 auto; display: grid;
  grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center;
}
.about-visual {
  position: relative;
}
.about-img-wrap {
  border-radius: 2rem; overflow: hidden; position: relative;
  box-shadow: 0 24px 64px rgba(0,0,0,0.12);
}
.about-img-wrap img { width: 100%; height: 420px; object-fit: cover; display: block; }
.about-img-badge {
  position: absolute; bottom: 1.5rem; left: 1.5rem;
  background: var(--bg); border: 1px solid var(--border-s);
  border-radius: 1rem; padding: .75rem 1.25rem;
  display: flex; align-items: center; gap: .75rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(12px);
}
.about-badge-icon {
  width: 40px; height: 40px; border-radius: .75rem;
  background: linear-gradient(135deg, oklch(0.6231 0.1880 259.8145), oklch(0.4882 0.2172 264.3763));
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;
}
.about-badge-text { font-size: .8rem; color: var(--fg-muted); line-height: 1.4; }
.about-badge-text strong { display: block; font-size: 1rem; color: var(--fg); font-weight: 700; }
.about-content { display: flex; flex-direction: column; gap: 1.5rem; }
.about-body { font-size: 1.05rem; color: var(--fg-muted); line-height: 1.8; }
.about-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-top: .5rem; }
.about-stat {
  padding: 1.25rem; border-radius: 1rem;
  background: var(--bg-subtle); border: 1px solid var(--border-s); text-align: center;
}
.about-stat-num { font-size: 1.6rem; font-weight: 800; color: var(--primary); letter-spacing: -.03em; }
.about-stat-label { font-size: .75rem; color: var(--fg-muted); margin-top: .2rem; text-transform: uppercase; letter-spacing: .06em; }
@media(max-width:768px) {
  .about-inner { grid-template-columns: 1fr; gap: 3rem; }
  .about-stats { grid-template-columns: repeat(3,1fr); }
}

/* ── Contact Us ── */
.contact-section {
  padding: 7rem 3rem; background: var(--bg-subtle); position: relative; overflow: hidden;
}
.contact-inner {
  max-width: 1200px; margin: 0 auto; display: grid;
  grid-template-columns: 1fr 1.2fr; gap: 5rem; align-items: start;
}
.contact-info { display: flex; flex-direction: column; gap: 2rem; }
.contact-info-body { font-size: 1.05rem; color: var(--fg-muted); line-height: 1.8; }
.contact-cards { display: flex; flex-direction: column; gap: 1rem; }
.contact-card {
  display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.25rem;
  border-radius: 1rem; background: var(--bg); border: 1px solid var(--border-s);
  transition: border-color .2s, box-shadow .2s;
}
.contact-card:hover { border-color: var(--primary); box-shadow: 0 4px 20px oklch(0.6231 0.1880 259.8145 / .12); }
.contact-card-icon {
  width: 42px; height: 42px; border-radius: .75rem; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.6231 0.1880 259.8145 / .15), oklch(0.4882 0.2172 264.3763 / .15));
  display: flex; align-items: center; justify-content: center; color: var(--primary);
}
.contact-card-body { flex: 1; }
.contact-card-label { font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; color: var(--fg-muted); font-weight: 600; }
.contact-card-value { font-size: .95rem; font-weight: 600; color: var(--fg); margin-top: .15rem; }
.contact-form {
  background: var(--bg); border: 1px solid var(--border-s);
  border-radius: 1.5rem; padding: 2.5rem; display: flex; flex-direction: column; gap: 1.25rem;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: .45rem; }
.form-group label { font-size: .8rem; font-weight: 600; color: var(--fg-muted); letter-spacing: .04em; }
.form-group input, .form-group select, .form-group textarea {
  padding: .75rem 1rem; border-radius: .75rem;
  border: 1px solid var(--border); background: var(--bg-subtle);
  color: var(--fg); font-size: .9rem; font-family: inherit;
  transition: border-color .2s, box-shadow .2s; outline: none; resize: none;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  border-color: var(--primary); box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .12);
}
.form-group input::placeholder, .form-group textarea::placeholder { color: var(--fg-muted); opacity: .6; }
.form-submit {
  padding: .85rem 2rem; border-radius: .85rem; border: none; cursor: pointer;
  font-size: .95rem; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, oklch(0.6231 0.1880 259.8145), oklch(0.4882 0.2172 264.3763));
  box-shadow: 0 4px 20px oklch(0.6231 0.1880 259.8145 / .35);
  transition: transform .15s, box-shadow .15s; align-self: flex-start;
}
.form-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 28px oklch(0.6231 0.1880 259.8145 / .45); }
.form-submit:active { transform: translateY(0); }
@media(max-width:768px) {
  .contact-inner { grid-template-columns: 1fr; gap: 3rem; }
  .form-row { grid-template-columns: 1fr; }
}
`;

/* ─── Bar heights for mini chart ─── */
const BARS = [
  {h:"55%"}, {h:"42%"}, {h:"68%"}, {h:"75%",hi:true},
  {h:"62%"}, {h:"88%",hi:true}, {h:"71%"}, {h:"95%",hi:true},
];

const MARQUEE_ITEMS = [
  "Profile Tracker","Smart Summaries","Club Applications","Peer Mentoring",
  "GPA Analytics","Dean's List Mentors","Community Chat","Session Booking",
  "Profile Tracker","Smart Summaries","Club Applications","Peer Mentoring",
  "GPA Analytics","Dean's List Mentors","Community Chat","Session Booking",
];

export default function EduCoreLandingV2() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  /* sync dark class to <html> so body + CSS vars respond */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [ring, setRing] = useState({ x: -100, y: -100 });
  const ringRef = useRef({ x: -100, y: -100 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  /* cursor follow */
  useEffect(() => {
    const move = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      ringRef.current.x = lerp(ringRef.current.x, cursor.x, 0.1);
      ringRef.current.y = lerp(ringRef.current.y, cursor.y, 0.1);
      setRing({ ...ringRef.current });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [cursor]);

  /* scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* scroll reveal */
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* particle canvas – HiDPI/Retina, full-hero mouse tracking */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hero = canvas.parentElement!;
    const ctx = canvas.getContext("2d")!;

    let dpr = 1;
    let w = 0, h = 0;
    const mouse = { x: -9999, y: -9999 };

    const setSize = () => {
      dpr = window.devicePixelRatio || 1;
      const cssW = hero.offsetWidth;
      const cssH = hero.offsetHeight;
      canvas.width  = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width  = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = cssW; h = cssH;
    };
    setSize();
    window.addEventListener("resize", setSize);

    /* Track mouse over the whole hero section */
    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);

    const N = 110;
    const LINK  = 130;
    const REPEL = 90;
    const FORCE = 0.018;

    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .4,
      vy: (Math.random() - .5) * .4,
      r: Math.random() * 1.6 + .5,
    }));

    let rafId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      pts.forEach(p => {
        /* repel from mouse */
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < REPEL && md > 0) {
          const f = FORCE * (1 - md / REPEL);
          p.vx += (mdx / md) * f;
          p.vy += (mdy / md) * f;
          /* clamp speed after repel so it doesn't fly off */
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 2.5) { p.vx = (p.vx / speed) * 2.5; p.vy = (p.vy / speed) * 2.5; }
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0)  { p.x = 0;  p.vx =  Math.abs(p.vx); }
        if (p.x > w)  { p.x = w;  p.vx = -Math.abs(p.vx); }
        if (p.y < 0)  { p.y = 0;  p.vy =  Math.abs(p.vy); }
        if (p.y > h)  { p.y = h;  p.vy = -Math.abs(p.vy); }

        /* glow halo */
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, "rgba(99,130,255,0.40)");
        g.addColorStop(1, "rgba(99,130,255,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        /* crisp dot */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99,130,255,0.8)";
        ctx.fill();
      });

      /* connecting lines */
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(99,130,255,${(1 - d / LINK) * 0.22})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", setSize);
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="noise" style={{ minHeight: "100vh" }}>
      <style>{CSS}</style>

      {/* Custom cursor */}
      <div id="cursor" style={{ left: cursor.x, top: cursor.y }} />
      <div id="cursor-ring" style={{ left: ring.x, top: ring.y }} />

      {/* ── NAVBAR ── */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <a href="/" className="nav-logo">
          <img src="/logo2.png" alt="EduCore" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
        </a>
        <ul className="nav-links">
          {["Features", "How it works", "About us", "Contact"].map(l => (
            <li key={l}><a href={`#${l.toLowerCase().replace(/ /g,"-")}`}>{l}</a></li>
          ))}
        </ul>
        <div className="nav-actions">
          <button className="theme-toggle" onClick={() => setDark(d => !d)} aria-label="Toggle theme">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <a href="/login" className="btn btn-outline">Sign in</a>
          <a href="/register" className="btn btn-filled">Get started →</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" style={{ flexDirection: "row", justifyContent: "space-between", gap: "3rem" }}>
        <canvas ref={canvasRef} id="hero-canvas" />
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />

        {/* Left */}
        <div style={{ flex: 1, maxWidth: 1020, position: "relative", zIndex: 1 }}>
          <div className="hero-eyebrow">
            <div className="eyebrow-line" />
            <div className="eyebrow-text">Student Support System</div>
          </div>
          <h1 className="hero-title">
            Your entire<br />
            <span className="line-accent">university life,</span><br />
            <span className="line-dim">one platform.</span>
          </h1>
          <p className="hero-sub">
            EduCore unifies your academic progress, study tools, clubs, and peer mentoring 
            into one intelligent dashboard — built for university excellence.
          </p>
          <div className="hero-cta">
            <a href="/register" className="btn btn-filled btn-lg">
              Start for free →
            </a>
            <a href="#features" className="btn btn-ghost-white btn-lg">
              See features
            </a>
          </div>
          <div className="social-proof">
            <div className="av-stack">
              {[
                "oklch(0.55 0.19 260)","oklch(0.49 0.21 264)",
                "oklch(0.42 0.18 266)","oklch(0.62 0.19 258)"
              ].map((c, i) => (
                <div key={i} className="av" style={{ background: c, zIndex: 4-i }}>
                  {["AK","SR","ML","JP"][i]}
                </div>
              ))}
            </div>
            <div className="sp-text">
              Trusted by <strong>4,200+</strong> students<br />
              across 12 universities
            </div>
          </div>
        </div>

        {/* Right — hero image */}
        <div style={{
          flex: "0 0 auto",
          width: "clamp(450px, 65%, 1020px)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}>
          {/* Glow behind image */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, oklch(0.6231 0.1880 259.8145 / 0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }} />
          <img
            src="/hero-image.png"
            alt="EduCore Dashboard"
            style={{
              position: "relative",
              width: "130%",
              height: "auto",
              borderRadius: "1.5rem",
              boxShadow: "0 32px 80px oklch(0.6231 0.1880 259.8145 / 0.22), 0 8px 24px rgba(0,0,0,0.12)",
              animation: "revealUp 1s cubic-bezier(.16,1,.3,1) .4s both",
            }}
          />
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, i) => (
            <span key={i} className="marquee-item">
              <span className="marquee-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="stats-strip">
        <div className="stats-inner">
          {[
            { val:"4,200+", lbl:"Students Supported" },
            { val:"320+",   lbl:"Study Materials Uploaded" },
            { val:"80+",    lbl:"Clubs & Societies" },
            { val:"98%",    lbl:"Student Satisfaction" },
          ].map(s => (
            <div key={s.lbl} className="stat-cell">
              <div className="stat-val">{s.val}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES (BENTO) ── */}
      <section className="section" id="features">
        <div className="section-eyebrow reveal">
          <div className="ey-num">01</div>
          <div className="ey-label">Platform Features</div>
        </div>
        <h2 className="section-h reveal reveal-d1">Four modules.<br />Infinite potential.</h2>
        <p className="section-p reveal reveal-d2">Every tool a university student needs to track, learn, connect, and grow — seamlessly integrated.</p>

        <div className="bento reveal reveal-d3" id="features">
          {/* Big left cell — Progress */}
          <div className="bento-cell bc-1 glow-border">
            <div className="bento-icon">📊</div>
            <div className="bento-label">Module 01</div>
            <div className="bento-title">4-Year Progress<br />Tracker</div>
            <div className="bento-desc">Visualize your full academic journey — GPA trends, sports scores, and society participation in a unified dashboard.</div>
            <div className="mini-gpa-bars">
              {[35,55,42,68,75,62,88,95].map((h,i) => (
                <div key={i} className={`mgb${h>70?" peak":""}`} style={{ height:`${h}%` }} />
              ))}
            </div>
          </div>

          {/* Right cell — Materials */}
          <div className="bento-cell bc-2 glow-border">
            <div className="bento-icon">📚</div>
            <div className="bento-label">Module 02</div>
            <div className="bento-title">Smart Study<br />Materials</div>
            <div className="bento-desc">Upload PDFs and slides. Get AI-powered summaries, key term extraction, and curated resource suggestions instantly.</div>
            <div className="keyword-cloud">
              {["Arrays","Hash Maps","Recursion","Big O","Trees","Queues","Graphs"].map(k => (
                <span key={k} className="kw">{k}</span>
              ))}
            </div>
          </div>

          {/* Clubs */}
          <div className="bento-cell bc-3 glow-border">
            <div className="bento-icon">🏆</div>
            <div className="bento-label">Module 03</div>
            <div className="bento-title">Clubs &<br />Societies</div>
            <div className="bento-desc">Discover, apply, and track memberships. Built-in application workflow with admin approvals and real-time status updates.</div>
          </div>

          {/* Mentors */}
          <div className="bento-cell bc-4 glow-border">
            <div className="bento-icon">🎓</div>
            <div className="bento-label">Module 04</div>
            <div className="bento-title">Peer Mentor<br />Sessions</div>
            <div className="bento-desc">Book sessions with Dean's List mentors. Get personalized help in your weakest subjects from top-performing peers.</div>
            <div className="mentor-row">
              {[["AK","Aisha K.","4.9★"],["RM","Rohan M.","4.7★"]].map(([av,n,r]) => (
                <div key={n} className="mentor-pill">
                  <div className="mentor-av">{av}</div>
                  <div>
                    <div className="mentor-name">{n}</div>
                    <div className="mentor-star">{r}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community */}
          <div className="bento-cell bc-5 glow-border">
            <div className="bento-icon">💬</div>
            <div className="bento-label">Community</div>
            <div className="bento-title">Live Chat<br />Rooms</div>
            <div className="bento-desc">Subject-based chat rooms with real-time messaging, file sharing, and an active community of fellow students.</div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section style={{ background:"var(--bg-subtle)", borderTop:"1px solid var(--border-s)", borderBottom:"1px solid var(--border-s)" }} id="how-it-works">
        <div className="section">
          <div className="section-eyebrow reveal">
            <div className="ey-num">02</div>
            <div className="ey-label">Simple Onboarding</div>
          </div>
          <h2 className="section-h reveal reveal-d1">Up and running<br />in minutes.</h2>
          <div className="process-grid">
            {[
              { n:"01", icon:"✍️", title:"Create your account", desc:"Register with your university email and student ID. Takes under 60 seconds." },
              { n:"02", icon:"🎯", title:"Build your profile", desc:"Add semesters, grades, clubs, and sports to unlock personalized AI-powered insights and suggestions." },
              { n:"03", icon:"🚀", title:"Start achieving more", desc:"Upload materials, book mentor sessions, apply to clubs, and track your entire 4-year journey in one place." },
            ].map((s, i) => (
              <div key={s.n} className={`process-card glow-border reveal reveal-d${i+1}`}>
                <div className="process-num">{s.n}</div>
                <div className="process-icon">{s.icon}</div>
                <div className="process-title">{s.title}</div>
                <div className="process-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section" id="mentors">
        <div className="section-eyebrow reveal">
          <div className="ey-num">03</div>
          <div className="ey-label">Student Reviews</div>
        </div>
        <h2 className="section-h reveal reveal-d1">Loved by students<br />across campus.</h2>
        <div className="testimonials-track">
          {[
            { q:"EduCore completely transformed how I manage my studies. The AI summaries alone save me 3+ hours every week before exams.", n:"Kavya Ramesh", r:"2nd Year · Computer Science", av:"KR", c:"oklch(0.55 0.19 260)" },
            { q:"My GPA went from 2.8 to 3.6 in one semester after using the mentor booking system. Best decision I made this year.", n:"Marcus Lim", r:"3rd Year · Engineering", av:"ML", c:"oklch(0.49 0.21 264)" },
            { q:"The club application workflow is seamless. I got into both the Drama Society and Computer Society without any hassle.", n:"Priya Sharma", r:"1st Year · Business IT", av:"PS", c:"oklch(0.42 0.18 266)" },
            { q:"The community chat rooms are my go-to before every exam. It's like having a study group available 24/7.", n:"Jordan Park", r:"3rd Year · Data Science", av:"JP", c:"oklch(0.62 0.19 258)" },
          ].map((t, i) => (
            <div key={i} className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <div className="testi-quote">"{t.q}"</div>
              <div className="testi-author">
                <div className="testi-av" style={{ background: t.c }}>{t.av}</div>
                <div>
                  <div className="testi-name">{t.n}</div>
                  <div className="testi-role">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT US ── */}
      <section id="about-us" className="about-section">
        <div className="about-inner">
          {/* Visual */}
          <div className="about-visual reveal">
            <div className="about-img-wrap">
              <img src="/hero-image.png" alt="EduCore team and students" />
            </div>
            <div className="about-img-badge">
              <div className="about-badge-icon">🎓</div>
              <div className="about-badge-text">
                <strong>Est. 2023</strong>
                Built for students, by educators
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="about-content">
            <div className="section-eyebrow reveal" style={{ justifyContent:"flex-start" }}>
              <div className="ey-num">05</div>
              <div className="ey-label">About Us</div>
            </div>
            <h2 className="section-h reveal reveal-d1">
              Empowering the next<br />
              <span style={{ color: "var(--primary)" }}>generation of students</span>
            </h2>
            <p className="about-body reveal reveal-d2">
              EduCore was born from a simple frustration — university life is complex, but the tools students use shouldn't be. We built a unified platform that brings academics, clubs, mentoring, and AI-powered study tools together so students can focus on what matters: learning and growing.
            </p>
            <p className="about-body reveal reveal-d2" style={{ marginTop: "-.5rem" }}>
              Our team of educators, engineers, and former students works tirelessly to make every campus experience smarter, more connected, and more rewarding.
            </p>
            <div className="about-stats reveal reveal-d3">
              <div className="about-stat">
                <div className="about-stat-num">4.2K+</div>
                <div className="about-stat-label">Students</div>
              </div>
              <div className="about-stat">
                <div className="about-stat-num">12</div>
                <div className="about-stat-label">Universities</div>
              </div>
              <div className="about-stat">
                <div className="about-stat-num">98%</div>
                <div className="about-stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT US ── */}
      <section id="contact" className="contact-section">
        <div className="contact-inner">
          {/* Info */}
          <div className="contact-info">
            <div className="section-eyebrow reveal" style={{ justifyContent:"flex-start" }}>
              <div className="ey-num">06</div>
              <div className="ey-label">Contact</div>
            </div>
            <h2 className="section-h reveal reveal-d1">
              Get in touch<br />
              <span style={{ color: "var(--primary)" }}>we'd love to hear</span> from you
            </h2>
            <p className="contact-info-body reveal reveal-d2">
              Have a question, feedback, or want to bring EduCore to your university? Reach out — our team responds within 24 hours.
            </p>
            <div className="contact-cards reveal reveal-d3">
              <div className="contact-card">
                <div className="contact-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="contact-card-body">
                  <div className="contact-card-label">Email</div>
                  <div className="contact-card-value">info@educore.com</div>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div className="contact-card-body">
                  <div className="contact-card-label">Location</div>
                  <div className="contact-card-value">221 B , baker street , London</div>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/>
                  </svg>
                </div>
                <div className="contact-card-body">
                  <div className="contact-card-label">Support Hours</div>
                  <div className="contact-card-value">Mon–Fri,   9am–6pm </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form reveal reveal-d2">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" placeholder="Ahmad" />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" placeholder="Razif" />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@university.edu.my" />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <select>
                <option value="">Select a topic</option>
                <option>General Inquiry</option>
                <option>University Partnership</option>
                <option>Technical Support</option>
                <option>Feedback</option>
              </select>
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea rows={5} placeholder="Tell us how we can help..." />
            </div>
            <button className="form-submit">Send Message →</button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="cta-section">
        <div className="cta-grid-bg" />
        <div className="cta-inner">
          <div className="section-eyebrow reveal" style={{ justifyContent:"center" }}>
            <div className="ey-num">04</div>
            <div className="ey-label">Join EduCore</div>
          </div>
          <h2 className="cta-h reveal reveal-d1">
            Your academic success<br />starts here.
          </h2>
          <p className="cta-sub reveal reveal-d2">
            Join thousands of university students already using EduCore to take control of their academic journey.
          </p>
          <div className="cta-btns reveal reveal-d3">
            <a href="/register" className="btn btn-filled btn-lg">Create free account →</a>
            <a href="/login" className="btn btn-ghost-white btn-lg">Sign in</a>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-brand-name">
                <img src="/logo2.png" alt="EduCore" style={{ height: "28px", width: "auto", objectFit: "contain" }} />
              </div>
              <div className="footer-brand-desc">
                The complete student support system. Track, learn, connect, and grow throughout your university journey.
              </div>
              <div className="footer-socials">
                {["𝕏", "in", "📧", "gh"].map(s => (
                  <a key={s} href="#" className="social-btn">{s}</a>
                ))}
              </div>
            </div>
            {[
              { title:"Platform", links:["Dashboard","Study Materials","Clubs & Societies","Mentor Sessions","Community Chat"] },
              { title:"Account", links:["Register","Sign In","Profile Setup","Settings","Admin Panel"] },
              { title:"Company", links:["About Us","Contact","Privacy Policy","Terms of Service","Cookie Policy"] },
            ].map(col => (
              <div key={col.title}>
                <div className="footer-col-title">{col.title}</div>
                <ul className="footer-links">
                  {col.links.map(l => <li key={l}><a href="#">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span>© 2025 EduCore. All rights reserved.</span>
            <span style={{ display:"flex", alignItems:"center", gap:".4rem" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"oklch(0.55 0.18 145)", display:"inline-block" }} />
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}