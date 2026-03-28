"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { overflow: hidden; cursor: none; }

/* ── Custom cursor ── */
#lc-cursor {
  position: fixed; width: 10px; height: 10px; border-radius: 50%;
  background: oklch(0.6231 0.1880 259.8145); pointer-events: none; z-index: 9999;
  transform: translate(-50%,-50%); mix-blend-mode: screen;
  transition: width .15s, height .15s;
}
#lc-ring { display: none; }

/* ── Root: full viewport ── */
.lc-root {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: flex-start;
  font-family: var(--font-geist-sans, system-ui, sans-serif);
  overflow: hidden;
}

/* ── Full-screen background ── */
.lc-bg {
  position: absolute; inset: 0;
  background: linear-gradient(140deg,
    oklch(0.16 0.12 268) 0%,
    oklch(0.20 0.16 264) 40%,
    oklch(0.13 0.10 260) 100%);
  z-index: 0;
}
.lc-grid {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background-image:
    linear-gradient(oklch(0.6231 0.1880 259.8145 / .055) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0.6231 0.1880 259.8145 / .055) 1px, transparent 1px);
  background-size: 52px 52px;
}
.lc-orb-1 {
  position: absolute; width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.6231 0.1880 259.8145 / .14) 0%, transparent 65%);
  top: -200px; left: -100px; z-index: 2; pointer-events: none;
}
.lc-orb-2 {
  position: absolute; width: 450px; height: 450px; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.4882 0.2172 264.3763 / .12) 0%, transparent 65%);
  bottom: -100px; right: 38%; z-index: 2; pointer-events: none;
}
#lc-canvas {
  position: absolute; inset: 0; z-index: 3;
  width: 100%; height: 100%; pointer-events: none;
}

/* ── Girl image: right side, full height ── */
.lc-girl {
  position: absolute;
  right: -6%; bottom: 4vh;
  height: 118vh; width: auto;
  max-width: 62%;
  object-fit: contain; object-position: bottom right;
  z-index: 4; pointer-events: none;
  mask-image: linear-gradient(to right, transparent 0%, black 10%, black 100%),
              linear-gradient(to top, transparent 0%, black 5%, black 100%);
  mask-composite: intersect;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 100%),
                      linear-gradient(to top, transparent 0%, black 5%, black 100%);
  -webkit-mask-composite: destination-in;
  filter: drop-shadow(-40px 0 80px oklch(0.6231 0.1880 259.8145 / .2));
}

/* right-side glow behind girl */
.lc-girl-glow {
  position: absolute; right: 0; bottom: 0; z-index: 3;
  width: 62%; height: 100%;
  background: radial-gradient(ellipse 60% 70% at 80% 80%,
    oklch(0.55 0.20 260 / .12) 0%, transparent 65%);
  pointer-events: none;
}

/* ── Logo (top-left) ── */
.lc-logo {
  position: absolute; top: 2rem; left: 2.5rem; z-index: 20;
  display: flex; align-items: center; gap: .5rem; text-decoration: none;
}
.lc-logo-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: linear-gradient(135deg, oklch(0.6231 0.1880 259.8145), oklch(0.4882 0.2172 264.3763));
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; font-weight: 800; color: white;
  box-shadow: 0 4px 16px oklch(0.6231 0.1880 259.8145 / .4);
}
.lc-logo-name {
  font-size: 1.15rem; font-weight: 800; color: white;
  letter-spacing: -.03em;
}
.lc-live {
  position: absolute; top: 2.1rem; right: 2.5rem; z-index: 20;
  display: flex; align-items: center; gap: .4rem;
  background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px; padding: .28rem .85rem;
  font-size: .68rem; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: rgba(255,255,255,.7);
}
.lc-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4ade80; box-shadow: 0 0 8px #4ade80cc;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }

/* ── Floating login card ── */
.lc-card {
  position: relative; z-index: 10;
  margin-left: 13vw;
  margin-right: auto;
  width: 100%; max-width: 520px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 1.5rem;
  padding: 2.25rem 2.25rem 2rem;
  backdrop-filter: blur(28px) saturate(160%);
  box-shadow: 0 32px 80px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.06) inset;
  animation: cardIn .8s cubic-bezier(.16,1,.3,1) both;
}
@keyframes cardIn {
  from { opacity:0; transform: translateY(28px) scale(.97); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}

/* eyebrow */
.lc-eyebrow {
  display: flex; align-items: center; gap: .5rem; margin-bottom: .85rem;
}
.lc-ey-line { width: 22px; height: 1.5px; background: oklch(0.6231 0.1880 259.8145); border-radius: 999px; }
.lc-ey-text {
  font-size: .65rem; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: oklch(0.6231 0.1880 259.8145);
}
.lc-title {
  font-size: 1.85rem; font-weight: 900; letter-spacing: -.05em;
  color: #fff; line-height: 1.05; margin-bottom: .35rem;
}
.lc-sub { font-size: .85rem; color: rgba(255,255,255,.5); margin-bottom: 1.5rem; }

/* back link */
.lc-back {
  display: inline-flex; align-items: center; gap: .35rem;
  font-size: .75rem; color: rgba(255,255,255,.45); text-decoration: none;
  margin-bottom: 1.5rem; transition: color .2s;
}
.lc-back:hover { color: rgba(255,255,255,.8); }

/* error */
.lc-error {
  display: flex; align-items: flex-start; gap: .55rem;
  padding: .8rem .9rem; border-radius: .75rem;
  background: oklch(0.22 0.06 15); border: 1px solid oklch(0.5 0.18 15 / .4);
  font-size: .82rem; color: oklch(0.78 0.18 20);
  margin-bottom: 1rem; line-height: 1.5;
  animation: shake .4s cubic-bezier(.36,.07,.19,.97);
}
@keyframes shake {
  0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)}
  40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)}
}

/* form */
.lc-form { display: flex; flex-direction: column; gap: .9rem; }
.lc-field { display: flex; flex-direction: column; gap: .4rem; }
.lc-label {
  font-size: .72rem; font-weight: 700; color: rgba(255,255,255,.55);
  letter-spacing: .07em; text-transform: uppercase;
}
.lc-input-wrap { position: relative; }
.lc-ico {
  position: absolute; left: .9rem; top: 50%; transform: translateY(-50%);
  color: rgba(255,255,255,.3); pointer-events: none; display: flex;
  transition: color .2s;
}
.lc-input-wrap:focus-within .lc-ico { color: oklch(0.6231 0.1880 259.8145); }
.lc-input {
  width: 100%; padding: .8rem 1rem .8rem 2.55rem;
  border-radius: .75rem; border: 1.5px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.07); color: #fff;
  font-size: .88rem; font-family: inherit; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.lc-input::placeholder { color: rgba(255,255,255,.25); }
.lc-input:focus {
  border-color: oklch(0.6231 0.1880 259.8145);
  box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .15);
  background: rgba(255,255,255,.1);
}
.lc-eye {
  position: absolute; right: .85rem; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,.3); padding: .2rem; display: flex;
  transition: color .2s;
}
.lc-eye:hover { color: oklch(0.6231 0.1880 259.8145); }

/* strength */
.lc-strack { height: 2.5px; background: rgba(255,255,255,.1); border-radius: 999px; overflow: hidden; }
.lc-sfill  { height: 100%; border-radius: 999px; transition: width .35s, background .35s; }

.lc-row { display: flex; align-items: center; justify-content: space-between; }
.lc-check {
  display: flex; align-items: center; gap: .45rem; cursor: pointer;
  font-size: .8rem; color: rgba(255,255,255,.5); user-select: none; transition: color .2s;
}
.lc-check:hover { color: rgba(255,255,255,.8); }
.lc-check input { width: 14px; height: 14px; accent-color: oklch(0.6231 0.1880 259.8145); }
.lc-link {
  font-size: .8rem; color: oklch(0.6231 0.1880 259.8145);
  text-decoration: none; font-weight: 600; transition: color .2s;
}
.lc-link:hover { color: oklch(0.78 0.15 260); text-decoration: underline; }

/* submit */
.lc-btn {
  width: 100%; padding: .875rem; border: none; border-radius: .875rem;
  cursor: pointer; font-size: .92rem; font-weight: 800; color: white;
  font-family: inherit; position: relative; overflow: hidden;
  background: linear-gradient(135deg,
    oklch(0.6231 0.1880 259.8145) 0%,
    oklch(0.4882 0.2172 264.3763) 100%);
  box-shadow: 0 4px 24px oklch(0.6231 0.1880 259.8145 / .4);
  transition: transform .15s, box-shadow .15s;
}
.lc-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
  transform: translateX(-100%); transition: transform .5s;
}
.lc-btn:hover::before { transform: translateX(100%); }
.lc-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px oklch(0.6231 0.1880 259.8145 / .5); }
.lc-btn:active { transform: translateY(0); }
.lc-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; }
.lc-btn-inner { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:.45rem; }

.lc-or { display:flex; align-items:center; gap:.65rem; font-size:.72rem; color:rgba(255,255,255,.2); }
.lc-or::before,.lc-or::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.1); }

.lc-socials { display:grid; grid-template-columns:1fr 1fr; gap:.65rem; }
.lc-social-btn {
  display:flex; align-items:center; justify-content:center; gap:.45rem;
  padding:.72rem .5rem; border-radius:.75rem;
  border:1.5px solid rgba(255,255,255,.1); background:rgba(255,255,255,.05);
  font-size:.8rem; font-weight:600; color:rgba(255,255,255,.6); cursor:pointer;
  font-family:inherit; transition:border-color .2s, background .2s, color .2s;
}
.lc-social-btn:hover {
  border-color:oklch(0.6231 0.1880 259.8145 / .6);
  background:oklch(0.6231 0.1880 259.8145 / .1);
  color:#fff;
}

.lc-footer { text-align:center; margin-top:1.2rem; font-size:.8rem; color:rgba(255,255,255,.4); }
.lc-footer a { color:oklch(0.6231 0.1880 259.8145); font-weight:700; text-decoration:none; }
.lc-footer a:hover { color:oklch(0.78 0.15 260); text-decoration:underline; }

@keyframes spin { to { transform:rotate(360deg); } }
.lc-spin { animation:spin .75s linear infinite; }

/* stats strip – bottom of screen */
.lc-stats-bar {
  position: absolute; bottom: 1.75rem; left: 50%; transform: translateX(-50%); z-index: 20;
  display: flex; gap: 1rem;
}
.lc-stat {
  padding: .6rem 1rem; border-radius: .75rem;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
  backdrop-filter: blur(12px); text-align: center;
}
.lc-stat-val { font-size: 1rem; font-weight: 800; color: #fff; letter-spacing: -.03em; }
.lc-stat-lbl { font-size: .6rem; color: rgba(255,255,255,.45); text-transform: uppercase; letter-spacing: .08em; margin-top: .1rem; }

@media (max-width: 820px) {
  .lc-girl { display: none; }
  .lc-girl-glow { display: none; }
  .lc-card { margin: 0 auto; }
  .lc-stats-bar { display: none; }
  body { overflow: auto; }
  .lc-root { position: relative; min-height: 100vh; padding: 5rem 1.5rem 2rem; justify-content: center; }
}
`

export default function LoginPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [cursor, setCursor] = useState({ x: -100, y: -100 })
  const [ring, setRing] = useState({ x: -100, y: -100 })
  const ringRef = useRef({ x: -100, y: -100 })
  const animRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const strength = pw.length === 0 ? 0 : pw.length < 5 ? 20 : pw.length < 8 ? 48 : pw.length < 12 ? 74 : 100
  const strengthColor = strength < 30 ? "oklch(0.6 0.22 18)" : strength < 65 ? "oklch(0.72 0.17 65)" : "oklch(0.65 0.22 145)"

  /* cursor */
  useEffect(() => {
    const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [])
  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      ringRef.current.x = lerp(ringRef.current.x, cursor.x, 0.1)
      ringRef.current.y = lerp(ringRef.current.y, cursor.y, 0.1)
      setRing({ ...ringRef.current })
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [cursor])

  /* particle canvas – full screen, HiDPI */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    let dpr = 1, w = 0, h = 0
    const setSize = () => {
      dpr = window.devicePixelRatio || 1
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + "px"; canvas.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()
    window.addEventListener("resize", setSize)
    const N = 80
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .38, vy: (Math.random() - .5) * .38,
      r: Math.random() * 1.5 + .4,
    }))
    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) }
        if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx) }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) }
        if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy) }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5)
        g.addColorStop(0, "rgba(120,160,255,.2)")
        g.addColorStop(1, "rgba(120,160,255,0)")
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(160,200,255,.65)"; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(100,150,255,${(1 - d / 120) * .16})`
            ctx.lineWidth = .7; ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", setSize) }
  }, [])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(""); setPending(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw, rememberMe: remember }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Invalid email or password."); return }
      router.push(data.role === "ADMIN" ? "/admin" : data.role === "LECTURER" ? "/lecturer" : "/dashboard")
    } catch { setError("Something went wrong. Please try again.") }
    finally { setPending(false) }
  }

  return (
    <div className="lc-root">
      <style>{CSS}</style>

      {/* Custom cursor */}
      <div id="lc-cursor" style={{ left: cursor.x, top: cursor.y }} />
      <div id="lc-ring"   style={{ left: ring.x,   top: ring.y   }} />

      {/* Full-screen background layers */}
      <div className="lc-bg" />
      <div className="lc-grid" />
      <div className="lc-orb-1" />
      <div className="lc-orb-2" />
      <canvas ref={canvasRef} id="lc-canvas" />

      {/* Girl image full-height on right */}
      <div className="lc-girl-glow" />
      <img src="/logingirl.png" alt="" className="lc-girl" />

      {/* Logo */}
      <a href="/" className="lc-logo">
        <img src="/logo2.png" alt="EduCore" style={{ height: "36px", width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
      </a>

      {/* Live badge */}
      <div className="lc-live">
        <span className="lc-live-dot" />
        Live Platform
      </div>

      {/* ── Floating login card ── */}
      <div className="lc-card">

        <a href="/" className="lc-back">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to home
        </a>

        <div className="lc-eyebrow">
          <span className="lc-ey-line" />
          <span className="lc-ey-text">Student Portal</span>
        </div>
        <h1 className="lc-title">Welcome back 👋</h1>
        <p className="lc-sub">Sign in to your EduCore account</p>

        {error && (
          <div className="lc-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/>
            </svg>
            {error}
          </div>
        )}

        <form className="lc-form" onSubmit={submit} noValidate>

          {/* Email */}
          <div className="lc-field">
            <label className="lc-label">Email address</label>
            <div className="lc-input-wrap">
              <span className="lc-ico">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input className="lc-input" type="email" name="email"
                placeholder="you@university.edu.my"
                autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          {/* Password */}
          <div className="lc-field">
            <label className="lc-label">Password</label>
            <div className="lc-input-wrap">
              <span className="lc-ico">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input className="lc-input"
                type={showPw ? "text" : "password"} name="password"
                placeholder="••••••••"
                autoComplete="current-password" required minLength={6}
                value={pw} onChange={e => setPw(e.target.value)} />
              <button type="button" className="lc-eye" onClick={() => setShowPw(v => !v)}>
                {showPw
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {pw.length > 0 && (
              <div className="lc-strack">
                <div className="lc-sfill" style={{ width: strength + "%", background: strengthColor }} />
              </div>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="lc-row">
            <label className="lc-check">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <Link href="/forgot-password" className="lc-link">Forgot password?</Link>
          </div>

          {/* Submit */}
          <button type="submit" className="lc-btn" disabled={pending}>
            <span className="lc-btn-inner">
              {pending
                ? <><svg className="lc-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Signing in…</>
                : "Sign in →"
              }
            </span>
          </button>

          <div className="lc-or">or continue with</div>

          <div className="lc-socials">
            <button type="button" className="lc-social-btn">
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button type="button" className="lc-social-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

        </form>

        <p className="lc-footer">
          Don&apos;t have an account?{" "}
          <Link href="/register">Create one free →</Link>
        </p>
      </div>

      {/* Stats bar bottom-left */}
      <div className="lc-stats-bar">
        {[["4.2K+","Students"],["12","Universities"],["98%","Satisfaction"]].map(([v,l]) => (
          <div key={l} className="lc-stat">
            <div className="lc-stat-val">{v}</div>
            <div className="lc-stat-lbl">{l}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
