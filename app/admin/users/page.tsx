"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

type User = {
  id: number
  fullName: string
  email: string
  studentId: string
  faculty: string
  degree: string
  intakeYear: number
  role: "STUDENT" | "LECTURER" | "ADMIN"
  createdAt: string
}

const ROLE_TABS = ["ALL", "STUDENT", "LECTURER", "ADMIN"] as const
type RoleTab = (typeof ROLE_TABS)[number]

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  ADMIN:    { bg: "oklch(0.94 0.06 25)",  color: "oklch(0.48 0.22 25)"  },
  LECTURER: { bg: "oklch(0.93 0.05 295)", color: "oklch(0.42 0.2 295)"  },
  STUDENT:  { bg: "oklch(0.92 0.05 250)", color: "oklch(0.42 0.2 250)"  },
}

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
  "Administration",
]

const EMPTY_FORM = {
  fullName: "",
  email: "",
  studentId: "",
  password: "",
  faculty: "",
  degree: "",
  intakeYear: String(new Date().getFullYear()),
  role: "STUDENT" as "STUDENT" | "LECTURER" | "ADMIN",
}

const INPUT = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"

// ── CSS ────────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; }

.au-root { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

/* hero */
.au-hero { border-radius: 1.25rem; padding: 1.5rem 1.75rem; background: linear-gradient(135deg, oklch(0.22 0.1 265), oklch(0.30 0.14 258)); color: #fff; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; position: relative; overflow: hidden; }
.au-hero::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 80% 50%, oklch(0.6231 0.1880 259.8145 / .2) 0%, transparent 60%); pointer-events: none; }
.au-hero-text { position: relative; }
.au-hero-title { font-size: 1.3rem; font-weight: 900; letter-spacing: -.025em; }
.au-hero-sub { font-size: .8rem; opacity: .7; margin-top: .25rem; }
.au-hero-stats { display: flex; gap: .75rem; position: relative; flex-wrap: wrap; }
.au-hero-stat { background: oklch(1 0 0 / .12); border: 1px solid oklch(1 0 0 / .18); border-radius: .75rem; padding: .45rem .9rem; text-align: center; min-width: 64px; }
.au-hero-stat-val { font-size: 1.1rem; font-weight: 900; }
.au-hero-stat-lbl { font-size: .6rem; font-weight: 600; opacity: .65; text-transform: uppercase; letter-spacing: .05em; margin-top: .05rem; }

/* filters bar */
.au-filters { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
.au-tabs { display: flex; background: var(--muted); border-radius: .75rem; padding: .25rem; gap: .2rem; }
.au-tab { padding: .38rem .85rem; border-radius: .55rem; font-size: .78rem; font-weight: 600; cursor: pointer; border: none; background: none; color: var(--muted-foreground); transition: all .15s; white-space: nowrap; }
.au-tab.active { background: var(--card); color: var(--foreground); box-shadow: 0 1px 4px oklch(0 0 0 / .08); }
.au-search { position: relative; flex: 1; max-width: 300px; }
.au-search-icon { position: absolute; left: .75rem; top: 50%; transform: translateY(-50%); color: var(--muted-foreground); }
.au-search input { width: 100%; padding: .45rem .85rem .45rem 2.25rem; border: 1px solid var(--border); border-radius: .75rem; background: var(--background); font-size: .82rem; color: var(--foreground); outline: none; transition: border-color .15s, box-shadow .15s; }
.au-search input:focus { border-color: oklch(0.4882 0.2172 264.3763 / .5); box-shadow: 0 0 0 3px oklch(0.4882 0.2172 264.3763 / .1); }
.au-add-btn { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem 1rem; border-radius: .75rem; font-size: .82rem; font-weight: 700; background: oklch(0.4882 0.2172 264.3763); color: #fff; border: none; cursor: pointer; margin-left: auto; transition: opacity .15s; white-space: nowrap; }
.au-add-btn:hover { opacity: .88; }

/* table */
.au-table-wrap { border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; background: var(--card); }
.au-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
.au-table th { text-align: left; padding: .75rem 1rem; background: var(--muted, #f4f4f5); color: var(--muted-foreground); font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
.au-table td { padding: .8rem 1rem; border-top: 1px solid var(--border); vertical-align: middle; }
.au-table tbody tr:hover td { background: oklch(0.4882 0.2172 264.3763 / .03); }
.au-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145)); display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 900; color: #fff; }
.au-name-cell { display: flex; align-items: center; gap: .65rem; }
.au-name { font-weight: 700; color: var(--foreground); }
.au-email { font-size: .78rem; color: var(--muted-foreground); margin-top: .08rem; }
.au-id { font-family: monospace; font-size: .76rem; color: var(--muted-foreground); }
.au-faculty { font-size: .78rem; color: var(--muted-foreground); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.au-role-badge { font-size: .72rem; font-weight: 700; padding: .18rem .6rem; border-radius: .4rem; white-space: nowrap; }
.au-actions { display: flex; align-items: center; gap: .5rem; justify-content: flex-end; }
.au-btn-academic { display: inline-flex; align-items: center; gap: .3rem; padding: .3rem .65rem; border-radius: .5rem; font-size: .74rem; font-weight: 700; background: oklch(0.92 0.05 250); color: oklch(0.42 0.2 250); border: 1px solid oklch(0.82 0.09 250); text-decoration: none; transition: background .15s; }
.au-btn-academic:hover { background: oklch(0.87 0.08 250); }
.au-btn-delete { display: inline-flex; align-items: center; padding: .3rem .65rem; border-radius: .5rem; font-size: .74rem; font-weight: 700; background: oklch(0.93 0.07 25); color: oklch(0.48 0.22 25); border: 1px solid oklch(0.85 0.1 25); cursor: pointer; transition: background .15s; }
.au-btn-delete:hover { background: oklch(0.88 0.1 25); }
.au-footer { padding: .65rem 1rem; border-top: 1px solid var(--border); font-size: .75rem; color: var(--muted-foreground); }
.au-empty-row td { text-align: center; padding: 3rem; color: var(--muted-foreground); font-size: .88rem; }

/* skeleton */
.au-skel { background: var(--muted); border-radius: .4rem; animation: au-pulse 1.5s ease-in-out infinite; }
@keyframes au-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
`

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<RoleTab>("ALL")
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState("")
  const [formPending, setFormPending] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeTab !== "ALL") params.set("role", activeTab)
    if (search) params.set("search", search)
    const res = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [activeTab, search])

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300)
    return () => clearTimeout(t)
  }, [fetchUsers])

  function openModal() { setForm(EMPTY_FORM); setFormError(""); setShowModal(true) }
  function closeModal() { setShowModal(false); setFormError("") }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    setFormPending(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, intakeYear: Number(form.intakeYear) }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error ?? "Failed to create user."); return }
      closeModal()
      fetchUsers()
    } catch {
      setFormError("Something went wrong.")
    } finally {
      setFormPending(false)
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    if (res.ok) { setDeleteId(null); fetchUsers() }
  }

  const counts = {
    total:    users.length,
    students: users.filter(u => u.role === "STUDENT").length,
    lecturers:users.filter(u => u.role === "LECTURER").length,
    admins:   users.filter(u => u.role === "ADMIN").length,
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="au-root">

        {/* Hero */}
        <div className="au-hero">
          <div className="au-hero-text">
            <div className="au-hero-title">User Management</div>
            <div className="au-hero-sub">Manage students, lecturers, and admins</div>
          </div>
          <div className="au-hero-stats">
            {[
              { val: counts.total,     lbl: "Total"     },
              { val: counts.students,  lbl: "Students"  },
              { val: counts.lecturers, lbl: "Lecturers" },
              { val: counts.admins,    lbl: "Admins"    },
            ].map(s => (
              <div className="au-hero-stat" key={s.lbl}>
                <div className="au-hero-stat-val">{s.val}</div>
                <div className="au-hero-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="au-filters">
          <div className="au-tabs">
            {ROLE_TABS.map(tab => (
              <button key={tab} className={`au-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}>
                {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="au-search">
            <span className="au-search-icon">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, ID…" />
          </div>
          <button className="au-add-btn" onClick={openModal}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Add User
          </button>
        </div>

        {/* Table */}
        <div className="au-table-wrap">
          <table className="au-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Student / Staff ID</th>
                <th>Faculty</th>
                <th style={{ textAlign: "center" }}>Intake</th>
                <th style={{ textAlign: "center" }}>Role</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td><div className="au-name-cell"><div className="au-skel" style={{ width: 34, height: 34, borderRadius: "50%" }}/><div><div className="au-skel" style={{ width: 120, height: 13 }}/><div className="au-skel" style={{ width: 160, height: 11, marginTop: 5 }}/></div></div></td>
                    <td><div className="au-skel" style={{ width: 90, height: 12 }}/></td>
                    <td><div className="au-skel" style={{ width: 160, height: 12 }}/></td>
                    <td style={{ textAlign: "center" }}><div className="au-skel" style={{ width: 40, height: 12, margin: "0 auto" }}/></td>
                    <td style={{ textAlign: "center" }}><div className="au-skel" style={{ width: 60, height: 20, borderRadius: ".4rem", margin: "0 auto" }}/></td>
                    <td/>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr className="au-empty-row"><td colSpan={6}>No users found.</td></tr>
              ) : (
                users.map(u => {
                  const badge = ROLE_BADGE[u.role]
                  const ini = u.fullName.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase()
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="au-name-cell">
                          <div className="au-avatar">{ini}</div>
                          <div>
                            <div className="au-name">{u.fullName}</div>
                            <div className="au-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="au-id">{u.studentId}</span></td>
                      <td><span className="au-faculty">{u.faculty}</span></td>
                      <td style={{ textAlign: "center", color: "var(--muted-foreground)", fontSize: ".82rem" }}>{u.intakeYear}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="au-role-badge" style={{ background: badge.bg, color: badge.color }}>
                          {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <div className="au-actions">
                          {u.role === "STUDENT" && (
                            <Link href={`/admin/users/${u.id}/academic`} className="au-btn-academic">
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"/>
                              </svg>
                              Academic
                            </Link>
                          )}
                          <button className="au-btn-delete" onClick={() => setDeleteId(u.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          {!loading && users.length > 0 && (
            <div className="au-footer">{users.length} user{users.length !== 1 ? "s" : ""} found</div>
          )}
        </div>

        {/* ── Add User Modal ── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Add New User</h2>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-4">
                {formError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                  <div className="flex gap-2">
                    {(["STUDENT", "LECTURER", "ADMIN"] as const).map(r => (
                      <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${form.role === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent/50"}`}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" required className="col-span-2">
                    <input type="text" required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Full name" className={INPUT} />
                  </Field>
                  <Field label="Email" required className="col-span-2">
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder={form.role === "STUDENT" ? "student@university.edu.my" : "staff@university.edu.my"} className={INPUT} />
                  </Field>
                  <Field label={form.role === "STUDENT" ? "Student ID" : "Staff ID"} required>
                    <input type="text" required value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                      placeholder={form.role === "STUDENT" ? "S20220001" : "L10000001"} className={INPUT} />
                  </Field>
                  <Field label="Intake / Start Year" required>
                    <input type="number" required min={1990} max={new Date().getFullYear()} value={form.intakeYear}
                      onChange={e => setForm(f => ({ ...f, intakeYear: e.target.value }))} className={INPUT} />
                  </Field>
                  <Field label="Faculty" required className="col-span-2">
                    <select required value={form.faculty} onChange={e => setForm(f => ({ ...f, faculty: e.target.value }))} className={INPUT}>
                      <option value="" disabled>Select faculty</option>
                      {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="Degree / Position" required className="col-span-2">
                    <input type="text" required value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))}
                      placeholder={form.role === "STUDENT" ? "Bachelor of Computer Science" : form.role === "LECTURER" ? "Senior Lecturer / Ph.D." : "System Administrator"}
                      className={INPUT} />
                  </Field>
                  <Field label="Password" required className="col-span-2">
                    <input type="password" required minLength={6} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" className={INPUT} />
                  </Field>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent/50 transition">Cancel</button>
                  <button type="submit" disabled={formPending}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition">
                    {formPending ? "Adding…" : `Add ${form.role.charAt(0) + form.role.slice(1).toLowerCase()}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Delete Confirm ── */}
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Delete User</h2>
              <p className="text-sm text-muted-foreground">Are you sure? This will permanently remove the user and all their data.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent/50 transition">Cancel</button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition">Delete</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

function Field({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  )
}
