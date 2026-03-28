"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const FACULTIES = [
  "Faculty of Computer Science & Information Technology",
  "Faculty of Engineering",
  "Faculty of Medicine",
  "Faculty of Law",
  "Faculty of Business & Economics",
  "Faculty of Arts & Social Sciences",
  "Faculty of Science",
  "Faculty of Education",
  "Faculty of Architecture & Built Environment",
  "Faculty of Pharmacy",
]

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { overflow: hidden; cursor: none; }

#rc-cursor {
  position: fixed; width: 10px; height: 10px; border-radius: 50%;
  background: oklch(0.6231 0.1880 259.8145); pointer-events: none; z-index: 9999;
  transform: translate(-50%,-50%); mix-blend-mode: screen;
}

.rc-root {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: flex-start;
  font-family: var(--font-geist-sans, system-ui, sans-serif);
  overflow: hidden;
}

/* full-screen background */
.rc-bg {
  position: absolute; inset: 0;
  background: linear-gradient(140deg,
    oklch(0.16 0.12 268) 0%,
    oklch(0.20 0.16 264) 40%,
    oklch(0.13 0.10 260) 100%);
  z-index: 0;
}
.rc-grid {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background-image:
    linear-gradient(oklch(0.6231 0.1880 259.8145 / .055) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0.6231 0.1880 259.8145 / .055) 1px, transparent 1px);
  background-size: 52px 52px;
}
.rc-orb-1 {
  position: absolute; width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.6231 0.1880 259.8145 / .13) 0%, transparent 65%);
  top: -200px; left: -100px; z-index: 2; pointer-events: none;
}
.rc-orb-2 {
  position: absolute; width: 450px; height: 450px; border-radius: 50%;
  background: radial-gradient(circle, oklch(0.4882 0.2172 264.3763 / .11) 0%, transparent 65%);
  bottom: -100px; right: 38%; z-index: 2; pointer-events: none;
}
#rc-canvas {
  position: absolute; inset: 0; z-index: 3;
  width: 100%; height: 100%; pointer-events: none;
}

/* girl image — black bg uses mix-blend-mode: screen (black = transparent) */
.rc-girl {
  position: absolute;
  right: -7%; bottom: -2vh;
  height: 130vh; width: auto;
  max-width: 72%;
  object-fit: contain; object-position: bottom right;
  z-index: 15; pointer-events: none;
  mix-blend-mode: screen;
  filter: drop-shadow(-20px 0 50px oklch(0.6231 0.1880 259.8145 / .25)) brightness(1.15) contrast(1.05);
}
.rc-girl-glow {
  position: absolute; right: 0; bottom: 0; z-index: 3;
  width: 58%; height: 100%;
  background: radial-gradient(ellipse 60% 70% at 80% 80%,
    oklch(0.55 0.20 260 / .1) 0%, transparent 65%);
  pointer-events: none;
}

/* logo */
.rc-logo {
  position: absolute; top: 1.75rem; left: 2rem; z-index: 20;
  display: flex; align-items: center; gap: .7rem; text-decoration: none;
}
.rc-logo-box {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  background: #fff; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 10px rgba(0,0,0,.25); overflow: hidden;
}
.rc-logo-box img { width: 40px; height: 40px; object-fit: contain; }
.rc-logo-name {
  font-size: 1.05rem; font-weight: 900; letter-spacing: -.04em; color: #fff; line-height: 1;
}
.rc-logo-name em { font-style: normal; opacity: .7; font-weight: 600; }
.rc-live {
  position: absolute; top: 2.1rem; right: 2.5rem; z-index: 20;
  display: flex; align-items: center; gap: .4rem;
  background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px; padding: .28rem .85rem;
  font-size: .68rem; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: rgba(255,255,255,.7);
}
.rc-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4ade80; box-shadow: 0 0 8px #4ade80cc;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }

/* floating card — scrollable for many fields */
.rc-card {
  position: relative; z-index: 10;
  margin-left: 13vw; margin-right: auto;
  width: 100%; max-width: 520px;
  max-height: 90vh; overflow-y: auto;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 1.5rem;
  padding: 2rem 2.25rem 1.75rem;
  backdrop-filter: blur(28px) saturate(160%);
  box-shadow: 0 32px 80px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.06) inset;
  animation: cardIn .8s cubic-bezier(.16,1,.3,1) both;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent;
}
.rc-card::-webkit-scrollbar { width: 4px; }
.rc-card::-webkit-scrollbar-track { background: transparent; }
.rc-card::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 999px; }
@keyframes cardIn {
  from { opacity:0; transform:translateY(28px) scale(.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}

.rc-back {
  display: inline-flex; align-items: center; gap: .35rem;
  font-size: .75rem; color: rgba(255,255,255,.45); text-decoration: none;
  margin-bottom: 1.25rem; transition: color .2s;
}
.rc-back:hover { color: rgba(255,255,255,.8); }

.rc-eyebrow { display: flex; align-items: center; gap: .5rem; margin-bottom: .75rem; }
.rc-ey-line { width: 22px; height: 1.5px; background: oklch(0.6231 0.1880 259.8145); border-radius: 999px; }
.rc-ey-text { font-size: .65rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: oklch(0.6231 0.1880 259.8145); }

.rc-title { font-size: 1.7rem; font-weight: 900; letter-spacing: -.05em; color: #fff; line-height: 1.05; margin-bottom: .3rem; }
.rc-sub { font-size: .83rem; color: rgba(255,255,255,.5); margin-bottom: 1.25rem; }

.rc-error {
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

.rc-form { display: flex; flex-direction: column; gap: .85rem; }
.rc-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }

.rc-field { display: flex; flex-direction: column; gap: .38rem; }
.rc-label { font-size: .7rem; font-weight: 700; color: rgba(255,255,255,.55); letter-spacing: .07em; text-transform: uppercase; }
.rc-input-wrap { position: relative; }
.rc-ico {
  position: absolute; left: .9rem; top: 50%; transform: translateY(-50%);
  color: oklch(0.55 0.18 264); pointer-events: none; display: flex; transition: color .2s;
}
.rc-input-wrap:focus-within .rc-ico { color: oklch(0.4882 0.2172 264.3763); }
.rc-input {
  width: 100%; padding: .78rem 1rem .78rem 2.55rem;
  border-radius: .75rem; border: 1.5px solid rgba(255,255,255,.22);
  background: rgba(255,255,255,.92); color: #111;
  font-size: .87rem; font-family: inherit; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.rc-input.no-ico { padding-left: 1rem; }
.rc-input::placeholder { color: #aaa; }
.rc-input option { background: #1a1f36; color: #fff; }
.rc-input:focus {
  border-color: oklch(0.6231 0.1880 259.8145);
  box-shadow: 0 0 0 3px oklch(0.6231 0.1880 259.8145 / .2);
  background: #fff;
}
.rc-eye {
  position: absolute; right: .85rem; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,.3); padding: .2rem; display: flex; transition: color .2s;
}
.rc-eye:hover { color: oklch(0.6231 0.1880 259.8145); }

.rc-strength { height: 2.5px; background: rgba(255,255,255,.1); border-radius: 999px; overflow: hidden; }
.rc-strength-bar { height: 100%; border-radius: 999px; transition: width .35s, background .35s; }

.rc-field-err {
  display: flex; align-items: center; gap: .3rem;
  font-size: .7rem; color: oklch(0.72 0.18 20); margin-top: .1rem;
  animation: shake .35s cubic-bezier(.36,.07,.19,.97);
}
.rc-input.invalid {
  border-color: oklch(0.55 0.2 18) !important;
  box-shadow: 0 0 0 3px oklch(0.55 0.2 18 / .15) !important;
}
.rc-input.valid {
  border-color: oklch(0.52 0.18 145) !important;
}

/* submit */
.rc-btn {
  width: 100%; padding: .875rem; border: none; border-radius: .875rem;
  cursor: pointer; font-size: .92rem; font-weight: 800; color: white;
  font-family: inherit; position: relative; overflow: hidden;
  background: linear-gradient(135deg,
    oklch(0.6231 0.1880 259.8145) 0%,
    oklch(0.4882 0.2172 264.3763) 100%);
  box-shadow: 0 4px 24px oklch(0.6231 0.1880 259.8145 / .4);
  transition: transform .15s, box-shadow .15s;
}
.rc-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
  transform: translateX(-100%); transition: transform .5s;
}
.rc-btn:hover::before { transform: translateX(100%); }
.rc-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px oklch(0.6231 0.1880 259.8145 / .5); }
.rc-btn:active { transform: translateY(0); }
.rc-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; }
.rc-btn-inner { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:.45rem; }

.rc-footer { text-align:center; margin-top:1.1rem; font-size:.8rem; color:rgba(255,255,255,.4); }
.rc-footer a { color:oklch(0.6231 0.1880 259.8145); font-weight:700; text-decoration:none; }
.rc-footer a:hover { color:oklch(0.78 0.15 260); text-decoration:underline; }

@keyframes spin { to { transform:rotate(360deg); } }
.rc-spin { animation:spin .75s linear infinite; }

@media (max-width: 820px) {
  .rc-girl { display: none; }
  .rc-girl-glow { display: none; }
  .rc-card { margin: 0 auto; max-height: none; }
  body { overflow: auto; }
  .rc-root { position: relative; min-height: 100vh; padding: 5rem 1.5rem 2rem; justify-content: center; }
  .rc-row2 { grid-template-columns: 1fr; }
}
`

const CY = new Date().getFullYear()

function ErrMsg({ msg }: { msg: string }) {
  return (
    <span className="rc-field-err">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/>
      </svg>
      {msg}
    </span>
  )
}

function vFullName(v: string)   { if (!v.trim()) return "Full name is required."; if (v.trim().length < 2) return "Name must be at least 2 characters."; return "" }
function vStudentId(v: string)  { if (!v.trim()) return "Student ID is required."; if (v.trim().length < 3) return "Enter a valid student ID."; return "" }
function vEmail(v: string)      { if (!v.trim()) return "Email is required."; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address."; return "" }
function vPassword(v: string)   { if (!v) return "Password is required."; if (v.length < 8) return "Password must be at least 8 characters."; return "" }
function vConfirm(v: string, pw: string) { if (!v) return "Please confirm your password."; if (v !== pw) return "Passwords do not match."; return "" }
function vFaculty(v: string)    { if (!v) return "Please select your faculty."; return "" }
function vDegree(v: string)     { if (!v.trim()) return "Degree program is required."; return "" }
function vYear(v: string)       { const n = Number(v); if (!v) return "Intake year is required."; if (isNaN(n) || n < 1990 || n > CY) return `Year must be between 1990 and ${CY}.`; return "" }

export default function RegisterPage() {
  const router = useRouter()

  // Field values
  const [fullName, setFullName]   = useState("")
  const [studentId, setStudentId] = useState("")
  const [email, setEmail]         = useState("")
  const [pw, setPw]               = useState("")
  const [cpw, setCpw]             = useState("")
  const [faculty, setFaculty]     = useState("")
  const [degree, setDegree]       = useState("")
  const [intakeYear, setIntakeYear] = useState("")

  // Touched flags — show error only after blur or submit attempt
  const [touched, setTouched] = useState({
    fullName: false, studentId: false, email: false,
    pw: false, cpw: false, faculty: false, degree: false, intakeYear: false,
  })

  const touch = (f: keyof typeof touched) => setTouched(t => ({ ...t, [f]: true }))

  // Computed errors (only shown when touched)
  const errs = {
    fullName:   touched.fullName   ? vFullName(fullName)        : "",
    studentId:  touched.studentId  ? vStudentId(studentId)      : "",
    email:      touched.email      ? vEmail(email)              : "",
    pw:         touched.pw         ? vPassword(pw)              : "",
    cpw:        touched.cpw        ? vConfirm(cpw, pw)          : "",
    faculty:    touched.faculty    ? vFaculty(faculty)          : "",
    degree:     touched.degree     ? vDegree(degree)            : "",
    intakeYear: touched.intakeYear ? vYear(intakeYear)          : "",
  }

  const [showPw, setShowPw]   = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [error, setError]     = useState("")
  const [pending, setPending] = useState(false)
  const [cursor, setCursor]   = useState({ x: -100, y: -100 })
  const ringRef  = useRef({ x: -100, y: -100 })
  const animRef  = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const strength = pw.length === 0 ? 0 : pw.length < 5 ? 20 : pw.length < 8 ? 48 : pw.length < 12 ? 74 : 100
  const strengthColor = strength < 30 ? "oklch(0.6 0.22 18)" : strength < 65 ? "oklch(0.72 0.17 65)" : "oklch(0.65 0.22 145)"

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
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [cursor])

  /* particle canvas */
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Touch all fields to reveal any hidden errors
    setTouched({ fullName: true, studentId: true, email: true, pw: true, cpw: true, faculty: true, degree: true, intakeYear: true })
    const hasError =
      vFullName(fullName) || vStudentId(studentId) || vEmail(email) ||
      vPassword(pw) || vConfirm(cpw, pw) || vFaculty(faculty) ||
      vDegree(degree) || vYear(intakeYear)
    if (hasError) return
    setError(""); setPending(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, studentId, password: pw, faculty, degree, intakeYear: Number(intakeYear) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Registration failed. Please try again."); return }
      router.push("/profile/setup")
    } catch { setError("Something went wrong. Please try again.") }
    finally { setPending(false) }
  }

  return (
    <div className="rc-root">
      <style>{CSS}</style>
      <div id="rc-cursor" style={{ left: cursor.x, top: cursor.y }} />

      {/* Background */}
      <div className="rc-bg" />
      <div className="rc-grid" />
      <div className="rc-orb-1" />
      <div className="rc-orb-2" />
      <canvas ref={canvasRef} id="rc-canvas" />

      {/* Girl image */}
      <div className="rc-girl-glow" />
      <img src="/reggirl.png" alt="" className="rc-girl" />

      {/* Logo */}
      <a href="/" className="rc-logo">
        <div className="rc-logo-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon.png" alt="EduCore" />
        </div>
        <span className="rc-logo-name">Edu<em>Core</em></span>
      </a>
      <div className="rc-live">
        <span className="rc-live-dot" />
        Live Platform
      </div>

      {/* ── Card ── */}
      <div className="rc-card">

        <a href="/" className="rc-back">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to home
        </a>

        <div className="rc-eyebrow">
          <span className="rc-ey-line" />
          <span className="rc-ey-text">Student Portal</span>
        </div>
        <h1 className="rc-title">Create account ✨</h1>
        <p className="rc-sub">Join thousands of students on EduCore</p>

        {error && (
          <div className="rc-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/>
            </svg>
            {error}
          </div>
        )}

        <form className="rc-form" onSubmit={handleSubmit} noValidate>

          {/* Full Name + Student ID */}
          <div className="rc-row2">
            <div className="rc-field">
              <label className="rc-label">Full Name</label>
              <div className="rc-input-wrap">
                <span className="rc-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                <input
                  className={`rc-input${errs.fullName ? " invalid" : touched.fullName && !errs.fullName ? " valid" : ""}`}
                  type="text" placeholder="Ahmad bin Abdullah" autoComplete="name"
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setError("") }}
                  onBlur={() => touch("fullName")}
                />
              </div>
              {errs.fullName && <ErrMsg msg={errs.fullName} />}
            </div>
            <div className="rc-field">
              <label className="rc-label">Student ID</label>
              <div className="rc-input-wrap">
                <span className="rc-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L6 7h12z"/></svg></span>
                <input
                  className={`rc-input${errs.studentId ? " invalid" : touched.studentId && !errs.studentId ? " valid" : ""}`}
                  type="text" placeholder="S12345678"
                  value={studentId}
                  onChange={e => { setStudentId(e.target.value); setError("") }}
                  onBlur={() => touch("studentId")}
                />
              </div>
              {errs.studentId && <ErrMsg msg={errs.studentId} />}
            </div>
          </div>

          {/* Email */}
          <div className="rc-field">
            <label className="rc-label">University Email</label>
            <div className="rc-input-wrap">
              <span className="rc-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
              <input
                className={`rc-input${errs.email ? " invalid" : touched.email && !errs.email ? " valid" : ""}`}
                type="email" placeholder="student@university.edu.my" autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError("") }}
                onBlur={() => touch("email")}
              />
            </div>
            {errs.email && <ErrMsg msg={errs.email} />}
          </div>

          {/* Password + Confirm */}
          <div className="rc-row2">
            <div className="rc-field">
              <label className="rc-label">Password</label>
              <div className="rc-input-wrap">
                <span className="rc-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input
                  className={`rc-input${errs.pw ? " invalid" : touched.pw && !errs.pw ? " valid" : ""}`}
                  type={showPw ? "text" : "password"} placeholder="Min. 8 chars" autoComplete="new-password"
                  value={pw}
                  onChange={e => { setPw(e.target.value); setError("") }}
                  onBlur={() => touch("pw")}
                />
                <button type="button" className="rc-eye" onClick={() => setShowPw(v => !v)}>
                  {showPw
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {pw.length > 0 && <div className="rc-strength"><div className="rc-strength-bar" style={{ width: strength + "%", background: strengthColor }} /></div>}
              {errs.pw && <ErrMsg msg={errs.pw} />}
            </div>
            <div className="rc-field">
              <label className="rc-label">Confirm Password</label>
              <div className="rc-input-wrap">
                <span className="rc-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
                <input
                  className={`rc-input${errs.cpw ? " invalid" : touched.cpw && !errs.cpw ? " valid" : ""}`}
                  type={showCpw ? "text" : "password"} placeholder="Re-enter password" autoComplete="new-password"
                  value={cpw}
                  onChange={e => { setCpw(e.target.value); setError("") }}
                  onBlur={() => touch("cpw")}
                />
                <button type="button" className="rc-eye" onClick={() => setShowCpw(v => !v)}>
                  {showCpw
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errs.cpw && <ErrMsg msg={errs.cpw} />}
            </div>
          </div>

          {/* Faculty */}
          <div className="rc-field">
            <label className="rc-label">Faculty</label>
            <div className="rc-input-wrap">
              <span className="rc-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg></span>
              <select
                className={`rc-input${errs.faculty ? " invalid" : touched.faculty && !errs.faculty ? " valid" : ""}`}
                style={{ appearance: "none" }}
                value={faculty}
                onChange={e => { setFaculty(e.target.value); setError("") }}
                onBlur={() => touch("faculty")}
              >
                <option value="" disabled>Select your faculty</option>
                {FACULTIES.map(f => <option key={f} value={f} style={{ background: "#1a1f36", color: "#fff" }}>{f}</option>)}
              </select>
            </div>
            {errs.faculty && <ErrMsg msg={errs.faculty} />}
          </div>

          {/* Degree + Intake Year */}
          <div className="rc-row2">
            <div className="rc-field">
              <label className="rc-label">Degree Program</label>
              <div className="rc-input-wrap">
                <input
                  className={`rc-input no-ico${errs.degree ? " invalid" : touched.degree && !errs.degree ? " valid" : ""}`}
                  type="text" placeholder="e.g. B.Sc. Computer Science"
                  value={degree}
                  onChange={e => { setDegree(e.target.value); setError("") }}
                  onBlur={() => touch("degree")}
                />
              </div>
              {errs.degree && <ErrMsg msg={errs.degree} />}
            </div>
            <div className="rc-field">
              <label className="rc-label">Intake Year</label>
              <div className="rc-input-wrap">
                <input
                  className={`rc-input no-ico${errs.intakeYear ? " invalid" : touched.intakeYear && !errs.intakeYear ? " valid" : ""}`}
                  type="number" placeholder="e.g. 2022" min={1990} max={CY}
                  value={intakeYear}
                  onChange={e => { setIntakeYear(e.target.value); setError("") }}
                  onBlur={() => touch("intakeYear")}
                />
              </div>
              {errs.intakeYear && <ErrMsg msg={errs.intakeYear} />}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="rc-btn" disabled={pending}>
            <span className="rc-btn-inner">
              {pending
                ? <><svg className="rc-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Creating account…</>
                : "Create account →"
              }
            </span>
          </button>

        </form>

        <p className="rc-footer">
          Already have an account?{" "}
          <Link href="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
