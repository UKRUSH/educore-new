"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUserPhoto } from "@/contexts/UserPhotoContext"

type UserData = {
  id: number
  fullName: string
  email: string
  studentId: string
  faculty: string
  degree: string
  intakeYear: number
  photoUrl: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: string | null
  role: string
}

const STEPS = [
  { num: 1, label: "Welcome",  icon: "👋" },
  { num: 2, label: "Photo",    icon: "📸" },
  { num: 3, label: "Details",  icon: "📋" },
  { num: 4, label: "Done",     icon: "🎉" },
]

const GENDERS = ["Male", "Female", "Prefer not to say"]

const CSS = `
*, *::before, *::after { box-sizing: border-box; }

.su-page {
  min-height: 100%;
  display: flex; flex-direction: column; align-items: center;
  justify-content: flex-start; padding: 1.5rem 1rem 4rem;
  background: var(--background);
}

/* ── Progress stepper ── */
.su-stepper {
  display: flex; align-items: flex-start; width: 100%; max-width: 540px;
  margin-bottom: 2rem;
}
.su-step { display: flex; flex-direction: column; align-items: center; gap: .35rem; flex: 1; }
.su-step-circle {
  width: 2.5rem; height: 2.5rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .85rem; font-weight: 800; transition: all .3s;
  border: 2px solid transparent; flex-shrink: 0;
}
.su-step-circle.done {
  background: linear-gradient(135deg, oklch(0.55 0.2 250), oklch(0.48 0.22 265));
  color: #fff; border-color: oklch(0.55 0.2 250);
  box-shadow: 0 2px 10px oklch(0.55 0.2 250 / 0.35);
}
.su-step-circle.active {
  background: linear-gradient(135deg, oklch(0.6 0.2 250), oklch(0.52 0.22 265));
  color: #fff; border-color: oklch(0.6 0.2 250);
  box-shadow: 0 2px 20px oklch(0.6 0.2 250 / 0.5);
  animation: suPulse 2s ease-in-out infinite;
}
.su-step-circle.pending { background: var(--card); color: var(--muted-foreground); border-color: var(--border); }
@keyframes suPulse {
  0%,100% { box-shadow: 0 2px 16px oklch(0.6 0.2 250 / 0.45); }
  50%      { box-shadow: 0 2px 28px oklch(0.6 0.2 250 / 0.7); }
}
.su-step-label { font-size: .68rem; font-weight: 600; color: var(--muted-foreground); white-space: nowrap; }
.su-step-label.active { color: oklch(0.55 0.2 250); font-weight: 700; }
.su-step-label.done   { color: oklch(0.48 0.18 145); }
.su-connector { flex: 1; height: 2px; margin: 1.25rem .15rem 0; border-radius: 1px; transition: background .4s; }
.su-connector.done { background: linear-gradient(90deg, oklch(0.55 0.2 250), oklch(0.48 0.22 265)); }
.su-connector.pending { background: var(--border); }

/* ── Card ── */
.su-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 1.25rem; width: 100%; max-width: 540px;
  box-shadow: 0 8px 40px rgba(0,0,0,.08);
  overflow: hidden; animation: suSlideIn .3s cubic-bezier(.22,1,.36,1);
}
@keyframes suSlideIn {
  from { opacity: 0; transform: translateY(14px) scale(.98); }
  to   { opacity: 1; transform: none; }
}
.su-banner {
  height: 5px;
  background: linear-gradient(90deg, oklch(0.62 0.22 240), oklch(0.56 0.24 265), oklch(0.5 0.2 295));
}
.su-body { padding: 2rem 2rem 1.75rem; }

/* ── Step 1: Welcome ── */
.su-w-icon {
  width: 5.5rem; height: 5.5rem; border-radius: 1.35rem; margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, oklch(0.88 0.08 250), oklch(0.82 0.12 265));
  display: flex; align-items: center; justify-content: center; font-size: 2.5rem;
  box-shadow: 0 6px 24px oklch(0.62 0.2 250 / 0.2);
}
.su-w-title { font-size: 1.5rem; font-weight: 800; color: var(--foreground); text-align: center; margin: 0 0 .5rem; }
.su-w-sub   { font-size: .875rem; color: var(--muted-foreground); text-align: center; line-height: 1.6; margin: 0 0 1.75rem; }

.su-user-chip {
  display: flex; align-items: center; gap: 1rem;
  background: oklch(0.97 0.02 250 / 0.5); border: 1px solid oklch(0.88 0.06 250);
  border-radius: 1rem; padding: .9rem 1.1rem; margin-bottom: 1.5rem;
}
.su-chip-avatar {
  width: 3rem; height: 3rem; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, oklch(0.62 0.2 250), oklch(0.54 0.22 270));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; font-weight: 800; color: #fff; overflow: hidden;
}
.su-chip-avatar img { width: 100%; height: 100%; object-fit: cover; }
.su-chip-name { font-weight: 700; color: var(--foreground); font-size: .95rem; }
.su-chip-sub  { font-size: .75rem; color: var(--muted-foreground); margin-top: .1rem; }

.su-checklist { display: flex; flex-direction: column; gap: .1rem; margin-bottom: 1.75rem; }
.su-check-item {
  display: flex; align-items: center; gap: .75rem;
  padding: .75rem .9rem; border-radius: .75rem;
  transition: background .15s;
}
.su-check-item:hover { background: var(--accent); }
.su-check-bubble {
  width: 2.25rem; height: 2.25rem; border-radius: .6rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 1rem;
}
.su-check-title { font-size: .875rem; font-weight: 700; color: var(--foreground); }
.su-check-sub   { font-size: .75rem; color: var(--muted-foreground); margin-top: .1rem; }

/* ── Step 2: Photo ── */
.su-ph-area { display: flex; flex-direction: column; align-items: center; margin-bottom: 1.5rem; }
.su-ph-ring {
  width: 10rem; height: 10rem; border-radius: 50%;
  border: 3px dashed var(--border); background: var(--muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative; overflow: hidden;
  transition: border-color .2s, box-shadow .2s; margin-bottom: 1rem;
  user-select: none; -webkit-user-select: none;
}
.su-ph-ring:hover  { border-color: oklch(0.6 0.2 250); box-shadow: 0 0 0 5px oklch(0.6 0.2 250 / 0.12); }
.su-ph-ring:focus  { outline: 2px solid oklch(0.6 0.2 250); outline-offset: 3px; }
.su-ph-ring img    { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.su-ph-inner       { display: flex; flex-direction: column; align-items: center; gap: .5rem; }
.su-ph-ic          { font-size: 2.25rem; }
.su-ph-txt         { font-size: .78rem; color: var(--muted-foreground); font-weight: 600; }
.su-ph-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .2s; color: #fff; font-size: .8rem; font-weight: 700;
}
.su-ph-ring:hover .su-ph-overlay { opacity: 1; }
.su-ph-hint { font-size: .75rem; color: var(--muted-foreground); }

.su-status { text-align: center; font-size: .8rem; font-weight: 600; padding: .55rem .9rem; border-radius: .6rem; margin-top: .75rem; width: 100%; }
.su-status.ok  { color: oklch(0.42 0.2 145); background: oklch(0.94 0.07 145 / 0.5); }
.su-status.err { color: oklch(0.5 0.22 25); background: oklch(0.95 0.06 25 / 0.5); }
.su-status.uploading { color: oklch(0.5 0.18 250); background: oklch(0.95 0.04 250 / 0.5); }

/* ── Step 3: Details ── */
.su-section-title {
  font-size: 1.25rem; font-weight: 800; color: var(--foreground); margin: 0 0 .35rem;
}
.su-section-sub { font-size: .875rem; color: var(--muted-foreground); margin: 0 0 1.5rem; }
.su-form { display: flex; flex-direction: column; gap: .95rem; }
.su-row  { display: grid; grid-template-columns: repeat(2,1fr); gap: .85rem; }
.su-field { display: flex; flex-direction: column; gap: .4rem; }
.su-lbl  { font-size: .74rem; font-weight: 700; color: var(--muted-foreground); letter-spacing: .02em; }
.su-lbl-req { color: oklch(0.55 0.22 25); }
.su-inp {
  width: 100%; border: 1.5px solid var(--border); background: var(--background);
  border-radius: .65rem; padding: .65rem .85rem; font-size: .875rem;
  color: var(--foreground); outline: none; transition: border-color .2s, box-shadow .2s;
}
.su-inp:focus { border-color: oklch(0.62 0.2 250); box-shadow: 0 0 0 3px oklch(0.62 0.2 250 / 0.15); }
.su-sel {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right .65rem center; background-size: 1rem; padding-right: 2.5rem;
}
.su-locked {
  background: oklch(0.97 0.015 250 / 0.5); border: 1px solid oklch(0.9 0.04 250);
  border-radius: .85rem; padding: .95rem 1.1rem; margin-top: .35rem;
}
.su-locked-head {
  display: flex; align-items: center; gap: .4rem;
  font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
  color: var(--muted-foreground); margin-bottom: .7rem;
}
.su-locked-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: .3rem; }
.su-locked-item { padding: .4rem 0; }
.su-locked-key { font-size: .7rem; color: var(--muted-foreground); }
.su-locked-val { font-size: .82rem; font-weight: 600; color: var(--foreground); margin-top: .1rem; word-break: break-word; }

/* ── Step 4: Done ── */
.su-done-ring {
  width: 6.5rem; height: 6.5rem; border-radius: 50%; margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, oklch(0.52 0.22 145), oklch(0.44 0.24 155));
  display: flex; align-items: center; justify-content: center; font-size: 2.75rem;
  box-shadow: 0 6px 28px oklch(0.52 0.22 145 / 0.38);
  animation: suBounce .55s cubic-bezier(.36,.07,.19,.97);
}
@keyframes suBounce {
  0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}
.su-done-title { font-size: 1.5rem; font-weight: 800; text-align: center; color: var(--foreground); margin: 0 0 .4rem; }
.su-done-sub { font-size: .875rem; color: var(--muted-foreground); text-align: center; line-height: 1.55; margin: 0 0 1.75rem; }
.su-summary {
  background: var(--muted); border: 1px solid var(--border);
  border-radius: .9rem; padding: .9rem 1.1rem; margin-bottom: 1.5rem;
}
.su-sum-row { display: flex; align-items: center; gap: .75rem; padding: .45rem 0; }
.su-sum-row + .su-sum-row { border-top: 1px solid var(--border); }
.su-sum-ic  { font-size: 1rem; width: 1.5rem; text-align: center; flex-shrink: 0; }
.su-sum-key { font-size: .78rem; color: var(--muted-foreground); flex: 1; }
.su-sum-val { font-size: .82rem; font-weight: 700; color: var(--foreground); text-align: right; max-width: 55%; word-break: break-word; }

.su-next-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted-foreground); margin-bottom: .65rem; }
.su-next-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: .65rem; }
.su-next-card {
  display: flex; flex-direction: column; gap: .35rem;
  padding: .9rem 1rem; border-radius: .85rem;
  border: 1px solid var(--border); text-decoration: none;
  transition: border-color .2s, box-shadow .2s, transform .15s;
}
.su-next-card:hover { border-color: oklch(0.65 0.18 250 / 0.4); box-shadow: 0 3px 14px oklch(0.6 0.15 250 / 0.1); transform: translateY(-2px); }
.su-next-icon { font-size: 1.35rem; margin-bottom: .1rem; }
.su-next-title { font-size: .82rem; font-weight: 700; color: var(--foreground); }
.su-next-sub   { font-size: .72rem; color: var(--muted-foreground); line-height: 1.4; }

/* ── Buttons ── */
.su-btn-row { display: flex; gap: .65rem; margin-top: 1.5rem; }
.su-btn-primary {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: .45rem;
  background: linear-gradient(135deg, oklch(0.62 0.2 250), oklch(0.54 0.22 265));
  color: #fff; border: none; border-radius: .8rem;
  padding: .85rem 1.5rem; font-size: .9rem; font-weight: 700;
  cursor: pointer; transition: opacity .2s, transform .15s;
  box-shadow: 0 3px 14px oklch(0.58 0.2 250 / 0.38);
}
.su-btn-primary:hover   { opacity: .9; transform: translateY(-1px); }
.su-btn-primary:active  { transform: translateY(0); }
.su-btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
.su-btn-ghost {
  display: flex; align-items: center; justify-content: center; gap: .35rem;
  background: transparent; color: var(--muted-foreground);
  border: 1.5px solid var(--border); border-radius: .8rem;
  padding: .85rem 1.25rem; font-size: .875rem; font-weight: 600;
  cursor: pointer; transition: background .15s, color .15s; min-width: 5.5rem;
}
.su-btn-ghost:hover { background: var(--accent); color: var(--foreground); }

/* ── Error ── */
.su-err {
  background: oklch(0.97 0.05 25 / 0.5); border: 1px solid oklch(0.85 0.1 25);
  border-radius: .65rem; padding: .75rem 1rem; font-size: .82rem;
  color: oklch(0.5 0.22 25); margin-top: .85rem;
}
.su-field-err {
  display: flex; align-items: center; gap: .3rem;
  font-size: .72rem; color: oklch(0.5 0.22 25); margin-top: .15rem;
}
.su-inp.invalid {
  border-color: oklch(0.6 0.2 25) !important;
  box-shadow: 0 0 0 3px oklch(0.6 0.2 25 / .12) !important;
}
.su-inp.valid {
  border-color: oklch(0.52 0.18 145) !important;
}

/* ── Skeleton ── */
.su-skel { background: var(--muted); border-radius: .75rem; animation: suSkel 1.4s ease-in-out infinite; }
@keyframes suSkel { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

@media (max-width: 580px) {
  .su-row { grid-template-columns: 1fr; }
  .su-locked-grid { grid-template-columns: 1fr; }
  .su-next-grid { grid-template-columns: 1fr; }
  .su-btn-row { flex-direction: column; }
}
`

export default function ProfileSetupPage() {
  const router = useRouter()
  const { setPhotoUrl: setContextPhotoUrl } = useUserPhoto()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoMsg, setPhotoMsg] = useState<{ kind: "ok" | "err" | "uploading"; text: string } | null>(null)

  // Details
  const [form, setForm] = useState({ fullName: "", phone: "", dateOfBirth: "", gender: "" })
  const [detailTouched, setDetailTouched] = useState({ phone: false, dateOfBirth: false })
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState("")

  const TODAY = new Date().toISOString().split("T")[0]

  function validatePhone(v: string) {
    if (!v.trim()) return "" // optional field
    if (v.length !== 10) return "Phone number must be exactly 10 digits."
    if (!/^0[1-9]\d{8}$/.test(v)) return "Enter a valid Sri Lanka number (e.g. 0712345678)."
    return ""
  }

  function validateDOB(v: string) {
    if (!v) return "" // optional
    if (v > TODAY) return "Date of birth cannot be in the future."
    const dob = new Date(v)
    const minAge = new Date()
    minAge.setFullYear(minAge.getFullYear() - 15)
    if (dob > minAge) return "You must be at least 15 years old."
    const maxAge = new Date()
    maxAge.setFullYear(maxAge.getFullYear() - 100)
    if (dob < maxAge) return "Please enter a valid date of birth."
    return ""
  }

  const phoneErr = detailTouched.phone       ? validatePhone(form.phone)       : ""
  const dobErr   = detailTouched.dateOfBirth ? validateDOB(form.dateOfBirth)   : ""

  useEffect(() => {
    fetch("/api/profile/me")
      .then((r) => r.json())
      .then((d: UserData) => {
        setUser(d)
        setPhotoPreview(d.photoUrl ?? null)
        setForm({
          fullName:    d.fullName ?? "",
          phone:       d.phone ?? "",
          dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split("T")[0] : "",
          gender:      d.gender ?? "",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const initials = user?.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "?"

  // Open file picker. Reset value AFTER click so the same file can be
  // re-selected next time — resetting BEFORE click breaks the browser's
  // user-gesture chain on some browsers (Chrome/Safari).
  function triggerFilePicker() {
    if (!fileRef.current) return
    fileRef.current.click()
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local blob preview instantly
    const blobUrl = URL.createObjectURL(file)
    setPhotoPreview(blobUrl)
    setPhotoUploading(true)
    setPhotoMsg({ kind: "uploading", text: "Uploading your photo…" })

    // Reset input value NOW (after we've read the file) so the picker
    // can fire onChange again even if the user picks the same file next time
    if (fileRef.current) fileRef.current.value = ""

    const fd = new FormData()
    fd.append("photo", file)
    try {
      const res = await fetch("/api/profile/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setPhotoMsg({ kind: "err", text: data.error ?? "Upload failed." })
        return
      }
      // Swap blob URL for the permanent server URL
      setPhotoPreview(data.photoUrl)
      setPhotoMsg({ kind: "ok", text: "Photo updated! ✓" })
      setUser((u) => u ? { ...u, photoUrl: data.photoUrl } : u)
      // Update shared context so Topbar re-renders with new photo immediately
      setContextPhotoUrl(data.photoUrl)
      router.refresh()
    } catch {
      setPhotoMsg({ kind: "err", text: "Upload failed. Please try again." })
    } finally {
      setPhotoUploading(false)
    }
  }

  async function saveDetails() {
    if (!form.fullName.trim()) { setSaveErr("Full name is required."); return }
    // Touch both fields to reveal any hidden errors
    setDetailTouched({ phone: true, dateOfBirth: true })
    if (validatePhone(form.phone) || validateDOB(form.dateOfBirth)) return
    setSaving(true); setSaveErr("")
    try {
      const res = await fetch("/api/profile/me", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone || null,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveErr(data.error ?? "Failed to save."); return }
      setUser((u) => u ? { ...u, ...data } : u)
      setStep(4)
    } catch { setSaveErr("Something went wrong. Please try again.") }
    finally { setSaving(false) }
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="su-page">
        <style>{CSS}</style>
        <div style={{ width: "100%", maxWidth: 540 }}>
          <div className="su-skel" style={{ height: "2.5rem", marginBottom: "2rem", borderRadius: 9999 }} />
          <div className="su-skel" style={{ height: "460px" }} />
        </div>
      </div>
    )
  }

  return (
    <div className="su-page">
      <style>{CSS}</style>

      {/* ── Stepper ── */}
      <div className="su-stepper">
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: "contents" }}>
            <div className="su-step">
              <div className={`su-step-circle ${step > s.num ? "done" : step === s.num ? "active" : "pending"}`}>
                {step > s.num
                  ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  : s.icon}
              </div>
              <span className={`su-step-label ${step > s.num ? "done" : step === s.num ? "active" : ""}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`su-connector ${step > s.num ? "done" : "pending"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* STEP 1 – Welcome                            */}
      {/* ════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="su-card">
          <div className="su-banner" />
          <div className="su-body">
            <div className="su-w-icon">🎓</div>
            <h1 className="su-w-title">Welcome to EduCore!</h1>
            <p className="su-w-sub">
              Complete your student profile in 3 quick steps. It takes less than 2 minutes.
            </p>

            {/* User chip */}
            <div className="su-user-chip">
              <div className="su-chip-avatar">
                {user?.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.photoUrl} alt="" />
                  : initials}
              </div>
              <div>
                <div className="su-chip-name">{user?.fullName}</div>
                <div className="su-chip-sub">{user?.studentId} · {user?.faculty}</div>
              </div>
            </div>

            {/* Steps checklist */}
            <div className="su-checklist">
              {[
                { icon: "📸", bg: "oklch(0.9 0.06 250)", title: "Upload a profile photo", sub: "Help people recognise you" },
                { icon: "📋", bg: "oklch(0.9 0.06 295)", title: "Fill in personal details", sub: "Phone, birthday & gender" },
                { icon: "🎉", bg: "oklch(0.9 0.06 145)", title: "Profile complete!",       sub: "Start exploring EduCore" },
              ].map((item) => (
                <div key={item.title} className="su-check-item">
                  <div className="su-check-bubble" style={{ background: item.bg }}>{item.icon}</div>
                  <div>
                    <div className="su-check-title">{item.title}</div>
                    <div className="su-check-sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="su-btn-row" style={{ marginTop: 0 }}>
              <button className="su-btn-primary" onClick={() => setStep(2)}>
                Get Started
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* STEP 2 – Photo                              */}
      {/* ════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="su-card">
          <div className="su-banner" />
          <div className="su-body">
            <h2 className="su-section-title">Profile Photo</h2>
            <p className="su-section-sub">
              Upload a clear photo so classmates and lecturers can recognise you.
            </p>

            <div className="su-ph-area">
              {/* Use div + onClick instead of label/htmlFor so clicking on the
                  image itself reliably opens the picker every time */}
              <div className="su-ph-ring" onClick={triggerFilePicker} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && triggerFilePicker()}>
                {photoPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Preview" />
                    <div className="su-ph-overlay">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ marginRight: ".3rem" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      Change Photo
                    </div>
                  </>
                ) : (
                  <div className="su-ph-inner">
                    <span className="su-ph-ic">📷</span>
                    <span className="su-ph-txt">Click to upload</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={uploadPhoto} />
              <p className="su-ph-hint">JPG, PNG or WebP · max 5 MB</p>

              {/* Explicit change button — always visible when photo exists */}
              {photoPreview && (
                <button
                  type="button"
                  onClick={triggerFilePicker}
                  disabled={photoUploading}
                  style={{
                    display: "flex", alignItems: "center", gap: ".4rem",
                    background: "transparent", border: "1.5px solid var(--border)",
                    borderRadius: ".6rem", padding: ".45rem 1rem",
                    fontSize: ".78rem", fontWeight: 600, color: "var(--muted-foreground)",
                    cursor: "pointer", marginTop: ".35rem", transition: "all .15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.62 0.2 250)"; (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.55 0.2 250)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)" }}
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Change Photo
                </button>
              )}

              {photoMsg && (
                <div className={`su-status ${photoMsg.kind}`}>
                  {photoMsg.kind === "uploading" && (
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="animate-spin" style={{ display: "inline", marginRight: ".35rem" }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: .25 }} />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" style={{ opacity: .75 }} />
                    </svg>
                  )}
                  {photoMsg.kind === "ok"  && "✓ "}
                  {photoMsg.kind === "err" && "✗ "}
                  {photoMsg.text}
                </div>
              )}
            </div>

            <div className="su-btn-row">
              <button className="su-btn-ghost" onClick={() => setStep(1)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
              <button className="su-btn-primary" onClick={() => setStep(3)} disabled={photoUploading}>
                {photoPreview ? "Continue" : "Skip for now"}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* STEP 3 – Details                            */}
      {/* ════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="su-card">
          <div className="su-banner" />
          <div className="su-body">
            <h2 className="su-section-title">Personal Details</h2>
            <p className="su-section-sub">
              Complete your profile. You can always update this later in Settings.
            </p>

            <div className="su-form">
              <div className="su-field">
                <label className="su-lbl">Full Name <span className="su-lbl-req">*</span></label>
                <input className="su-inp" placeholder="Your full name"
                  value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
              </div>

              <div className="su-row">
                <div className="su-field">
                  <label className="su-lbl">Phone Number</label>
                  <input
                    className={`su-inp${phoneErr ? " invalid" : detailTouched.phone && form.phone && !phoneErr ? " valid" : ""}`}
                    placeholder="0712345678"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                      setForm((p) => ({ ...p, phone: digits }))
                    }}
                    onBlur={() => setDetailTouched((t) => ({ ...t, phone: true }))}
                  />
                  {phoneErr && (
                    <span className="su-field-err">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/>
                      </svg>
                      {phoneErr}
                    </span>
                  )}
                </div>
                <div className="su-field">
                  <label className="su-lbl">Gender</label>
                  <select className="su-inp su-sel" value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}>
                    <option value="">Select…</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="su-field">
                <label className="su-lbl">Date of Birth</label>
                <input
                  className={`su-inp${dobErr ? " invalid" : detailTouched.dateOfBirth && form.dateOfBirth && !dobErr ? " valid" : ""}`}
                  type="date"
                  value={form.dateOfBirth}
                  max={TODAY}
                  min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 100); return d.toISOString().split("T")[0] })()}
                  onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  onBlur={() => setDetailTouched((t) => ({ ...t, dateOfBirth: true }))}
                />
                {dobErr && (
                  <span className="su-field-err">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/>
                    </svg>
                    {dobErr}
                  </span>
                )}
              </div>

              {/* Read-only academic info */}
              <div className="su-locked">
                <div className="su-locked-head">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Academic info (set at registration)
                </div>
                <div className="su-locked-grid">
                  {[
                    { k: "Student ID",  v: user?.studentId },
                    { k: "Email",       v: user?.email },
                    { k: "Faculty",     v: user?.faculty },
                    { k: "Degree",      v: user?.degree },
                    { k: "Intake Year", v: user?.intakeYear },
                    { k: "Role",        v: user?.role },
                  ].map((r) => (
                    <div key={r.k} className="su-locked-item">
                      <div className="su-locked-key">{r.k}</div>
                      <div className="su-locked-val">{r.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {saveErr && <div className="su-err">{saveErr}</div>}

            <div className="su-btn-row">
              <button className="su-btn-ghost" onClick={() => setStep(2)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
              <button className="su-btn-primary" onClick={saveDetails} disabled={saving || !form.fullName.trim()}>
                {saving ? "Saving…" : "Save & Finish"}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* STEP 4 – Done                               */}
      {/* ════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="su-card">
          <div className="su-banner" />
          <div className="su-body">
            <div className="su-done-ring">🎉</div>
            <h2 className="su-done-title">Profile Complete!</h2>
            <p className="su-done-sub">
              Your EduCore student profile is all set. Here&apos;s a quick summary.
            </p>

            {/* Summary */}
            <div className="su-summary">
              {[
                { ic: "👤", k: "Name",         v: user?.fullName },
                { ic: "🎓", k: "Student ID",   v: user?.studentId },
                { ic: "🏫", k: "Faculty",       v: user?.faculty },
                { ic: "📱", k: "Phone",         v: user?.phone || "—" },
                { ic: "⚧",  k: "Gender",        v: user?.gender || "—" },
                { ic: "📸", k: "Photo",         v: user?.photoUrl ? "Uploaded ✓" : "Not uploaded" },
              ].map((r) => (
                <div key={r.k} className="su-sum-row">
                  <span className="su-sum-ic">{r.ic}</span>
                  <span className="su-sum-key">{r.k}</span>
                  <span className="su-sum-val">{r.v}</span>
                </div>
              ))}
            </div>

            {/* What's next */}
            <p className="su-next-label">What&apos;s next?</p>
            <div className="su-next-grid">
              {[
                { href: "/profile/academics", icon: "📚", bg: "oklch(0.92 0.06 250)", title: "Add Academics",   sub: "Semester GPA & subjects" },
                { href: "/profile/clubs",     icon: "👥", bg: "oklch(0.93 0.05 295)", title: "Join Clubs",      sub: "Build society score" },
                { href: "/profile/sports",    icon: "🏆", bg: "oklch(0.93 0.06 145)", title: "Log Sports",      sub: "Trophies & certificates" },
                { href: "/dashboard",         icon: "🏠", bg: "oklch(0.93 0.03 220)", title: "Go to Dashboard", sub: "Explore all features" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="su-next-card" style={{ background: link.bg }}>
                  <span className="su-next-icon">{link.icon}</span>
                  <div className="su-next-title">{link.title}</div>
                  <div className="su-next-sub">{link.sub}</div>
                </Link>
              ))}
            </div>

            <div className="su-btn-row">
              <Link href="/profile" style={{ textDecoration: "none", flex: 1 }}>
                <button className="su-btn-primary" style={{ width: "100%" }}>
                  View My Profile
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
