"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback, useMemo } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────
type Club = {
  id: number; name: string; category: string; status: string
  description: string; requirements: string | null
  capacity: number; email: string | null; social: string | null
  createdAt: string
  _count: { members: number; applications: number }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["ACADEMIC", "SPORTS", "CULTURAL", "RELIGIOUS", "OTHER"]
const STATUSES   = ["OPEN", "FULL", "CLOSED"]

const CAT_META: Record<string, { icon: string; bg: string; fg: string; bar: string }> = {
  ACADEMIC:  { icon: "🎓", bg: "oklch(0.93 0.05 250)", fg: "oklch(0.42 0.2 250)",  bar: "oklch(0.52 0.2 250)"  },
  SPORTS:    { icon: "⚽", bg: "oklch(0.93 0.06 145)", fg: "oklch(0.4 0.2 145)",   bar: "oklch(0.5 0.2 145)"   },
  CULTURAL:  { icon: "🎭", bg: "oklch(0.93 0.06 295)", fg: "oklch(0.42 0.2 295)",  bar: "oklch(0.5 0.2 295)"   },
  RELIGIOUS: { icon: "☪️", bg: "oklch(0.94 0.06 55)",  fg: "oklch(0.45 0.2 55)",   bar: "oklch(0.52 0.18 55)"  },
  OTHER:     { icon: "✦",  bg: "oklch(0.94 0.02 260)", fg: "oklch(0.45 0.06 260)", bar: "oklch(0.5 0.1 260)"   },
}
const ST_META: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  OPEN:   { label: "Open",   bg: "oklch(0.93 0.06 145)", fg: "oklch(0.38 0.2 145)",  dot: "oklch(0.5 0.2 145)"  },
  FULL:   { label: "Full",   bg: "oklch(0.94 0.06 55)",  fg: "oklch(0.45 0.2 55)",   dot: "oklch(0.6 0.18 55)"  },
  CLOSED: { label: "Closed", bg: "oklch(0.95 0.05 25)",  fg: "oklch(0.5 0.22 25)",   dot: "oklch(0.6 0.22 25)"  },
}
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

const EMPTY_FORM = { name: "", category: "ACADEMIC", description: "", requirements: "", capacity: "30", status: "OPEN", email: "", social: "" }

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; }
.ac-root { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

/* Hero */
.ac-hero {
  border-radius: 1.2rem; overflow: hidden; position: relative;
  background: linear-gradient(135deg, oklch(0.22 0.1 265) 0%, oklch(0.30 0.14 258) 55%, oklch(0.40 0.16 252) 100%);
  padding: 1.6rem 2rem;
}
.ac-hero::before { content:''; position:absolute; inset:0; pointer-events:none;
  background-image: linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size:28px 28px; }
.ac-hero-glow { position:absolute; top:-70px; right:-50px; width:260px; height:260px; border-radius:50%; pointer-events:none;
  background:radial-gradient(circle,oklch(0.65 0.2 260 / .3) 0%,transparent 70%); }
.ac-hero-inner { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:1.5rem; flex-wrap:wrap; }
.ac-hero-tag { display:inline-flex; align-items:center; gap:.4rem; padding:.26rem .8rem; border-radius:999px; margin-bottom:.65rem;
  background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2);
  font-size:.7rem; font-weight:700; letter-spacing:.07em; color:rgba(255,255,255,.85); text-transform:uppercase; }
.ac-hero-dot { width:6px; height:6px; border-radius:50%; background:oklch(0.75 0.2 145); animation:acBlink 2s ease-in-out infinite; }
@keyframes acBlink { 0%,100%{opacity:1}50%{opacity:.35} }
.ac-hero-title { font-size:1.55rem; font-weight:900; color:#fff; letter-spacing:-.04em; margin:0 0 .25rem; }
.ac-hero-sub { font-size:.82rem; color:rgba(255,255,255,.6); }
.ac-hero-stats { display:flex; gap:.6rem; flex-wrap:wrap; }
.ac-hero-stat { display:flex; flex-direction:column; align-items:center; padding:.65rem 1.1rem;
  border-radius:.8rem; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15);
  min-width:5rem; text-align:center; }
.ac-hero-stat-val { font-size:1.3rem; font-weight:900; color:#fff; line-height:1; }
.ac-hero-stat-lbl { font-size:.6rem; font-weight:700; color:rgba(255,255,255,.6); margin-top:.2rem; text-transform:uppercase; letter-spacing:.05em; }

/* Toolbar */
.ac-toolbar { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
.ac-search-wrap { flex:1; min-width:200px; position:relative; }
.ac-search-icon { position:absolute; left:.85rem; top:50%; transform:translateY(-50%); pointer-events:none; color:var(--muted-foreground); }
.ac-search-icon svg { width:14px; height:14px; }
.ac-search { width:100%; padding:.62rem .85rem .62rem 2.4rem; border:1.5px solid var(--border); border-radius:.75rem;
  background:var(--background); color:var(--foreground); font-size:.875rem; outline:none; transition:border-color .2s,box-shadow .2s; }
.ac-search:focus { border-color:oklch(0.62 0.2 260); box-shadow:0 0 0 3px oklch(0.62 0.2 260 / .12); }
.ac-search::placeholder { color:var(--muted-foreground); }
.ac-filter-btns { display:flex; gap:.35rem; flex-wrap:wrap; }
.ac-filter-btn { padding:.45rem .9rem; border-radius:999px; font-size:.75rem; font-weight:700;
  border:1.5px solid var(--border); background:var(--background); color:var(--muted-foreground);
  cursor:pointer; transition:all .18s; }
.ac-filter-btn:hover { border-color:oklch(0.62 0.2 260 / .45); color:var(--foreground); }
.ac-filter-btn.active { background:linear-gradient(135deg,oklch(0.62 0.2 260),oklch(0.5 0.22 265)); border-color:transparent; color:#fff; box-shadow:0 2px 10px oklch(0.6 0.2 260 / .3); }
.ac-add-btn { display:flex; align-items:center; gap:.45rem; padding:.62rem 1.25rem; border-radius:.75rem;
  background:linear-gradient(135deg,oklch(0.62 0.2 260),oklch(0.5 0.22 265)); color:#fff;
  font-size:.85rem; font-weight:800; border:none; cursor:pointer; white-space:nowrap;
  box-shadow:0 2px 12px oklch(0.58 0.2 260 / .35); transition:opacity .18s,transform .15s; flex-shrink:0; }
.ac-add-btn:hover { opacity:.9; transform:translateY(-1px); }
.ac-add-btn svg { width:15px; height:15px; }

/* Stats strip */
.ac-strip { display:flex; gap:.8rem; flex-wrap:wrap; }
.ac-chip { display:inline-flex; align-items:center; gap:.38rem; padding:.28rem .75rem; border-radius:999px;
  background:var(--muted); border:1px solid var(--border); font-size:.73rem; font-weight:600; color:var(--muted-foreground); }
.ac-chip-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
.ac-chip.open { background:oklch(0.93 0.06 145 / .5); border-color:oklch(0.82 0.1 145); color:oklch(0.38 0.18 145); }
.ac-chip.pending { background:oklch(0.95 0.07 65 / .5); border-color:oklch(0.85 0.1 65); color:oklch(0.48 0.2 60); }

/* Grid */
.ac-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.1rem; }
@media(max-width:900px){.ac-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.ac-grid{grid-template-columns:1fr;}}
.ac-skel { background:var(--muted); border-radius:1.1rem; animation:acSkel 1.4s ease-in-out infinite; }
@keyframes acSkel{0%,100%{opacity:1}50%{opacity:.4}}
.ac-empty { text-align:center; padding:4rem 1.5rem; display:flex; flex-direction:column; align-items:center; gap:.55rem; }
.ac-empty-icon { width:4.5rem; height:4.5rem; border-radius:1.2rem; background:var(--muted); display:flex; align-items:center; justify-content:center; font-size:2rem; margin-bottom:.3rem; }
.ac-empty-title { font-size:1rem; font-weight:700; color:var(--foreground); }
.ac-empty-sub { font-size:.875rem; color:var(--muted-foreground); }

/* Card */
.ac-card { background:var(--card); border:1px solid var(--border); border-radius:1.1rem; overflow:hidden; display:flex; flex-direction:column; transition:box-shadow .2s,border-color .2s,transform .2s; }
.ac-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.08); border-color:oklch(0.84 0.008 260); transform:translateY(-2px); }
.ac-card-top { height:4px; }
.ac-card-body { padding:1.1rem 1.2rem; flex:1; display:flex; flex-direction:column; gap:.8rem; }
.ac-card-hdr { display:flex; align-items:flex-start; gap:.8rem; }
.ac-card-icon { width:2.75rem; height:2.75rem; border-radius:.75rem; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:900; color:#fff; }
.ac-card-name { font-size:.9rem; font-weight:800; color:var(--foreground); line-height:1.3; margin-bottom:.35rem; }
.ac-badges { display:flex; gap:.3rem; flex-wrap:wrap; }
.ac-badge { display:inline-flex; align-items:center; gap:.22rem; padding:.15rem .5rem; border-radius:999px; font-size:.65rem; font-weight:700; }
.ac-st-dot { width:4px; height:4px; border-radius:50%; }
.ac-desc { font-size:.78rem; color:var(--muted-foreground); line-height:1.6; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.ac-card-meta { display:flex; gap:.65rem; flex-wrap:wrap; }
.ac-meta-item { font-size:.72rem; color:var(--muted-foreground); display:flex; align-items:center; gap:.3rem; font-weight:600; }
.ac-meta-item svg { width:11px; height:11px; flex-shrink:0; }
.ac-card-footer { padding:.75rem 1.2rem; border-top:1px solid var(--border); display:flex; gap:.5rem; }
.ac-edit-btn { flex:1; padding:.42rem; border-radius:.6rem; background:var(--background); border:1.5px solid var(--border);
  font-size:.75rem; font-weight:700; color:var(--foreground); cursor:pointer; transition:all .15s; }
.ac-edit-btn:hover { border-color:oklch(0.62 0.2 260 / .5); background:oklch(0.62 0.2 260 / .05); }
.ac-del-btn { padding:.42rem .8rem; border-radius:.6rem; background:oklch(0.97 0.05 25 / .5); border:1.5px solid oklch(0.88 0.1 25 / .4);
  font-size:.75rem; font-weight:700; color:oklch(0.5 0.22 25); cursor:pointer; transition:all .15s; }
.ac-del-btn:hover { background:oklch(0.93 0.08 25 / .5); }

/* Modal */
.ac-backdrop { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,.55); backdrop-filter:blur(4px);
  display:flex; align-items:center; justify-content:center; padding:1rem; animation:acFadeIn .2s ease; }
@keyframes acFadeIn{from{opacity:0}to{opacity:1}}
.ac-modal { background:var(--card); border:1px solid var(--border); border-radius:1.25rem; width:100%; max-width:540px;
  box-shadow:0 24px 80px rgba(0,0,0,.22); max-height:92vh; overflow-y:auto; animation:acSlideUp .28s cubic-bezier(.22,1,.36,1); }
@keyframes acSlideUp{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
.ac-modal::-webkit-scrollbar{width:4px}.ac-modal::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
.ac-modal-hdr { padding:1.2rem 1.5rem 1rem; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:1rem; }
.ac-modal-title { font-size:1rem; font-weight:900; color:var(--foreground); letter-spacing:-.02em; }
.ac-modal-close { width:1.9rem; height:1.9rem; border-radius:.5rem; background:var(--muted); border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center; color:var(--muted-foreground); transition:background .15s,color .15s; }
.ac-modal-close:hover { background:var(--accent); color:var(--foreground); }
.ac-modal-close svg { width:13px; height:13px; }
.ac-modal-body { padding:1.35rem 1.5rem; display:flex; flex-direction:column; gap:1rem; }
.ac-form-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; }
@media(max-width:480px){.ac-form-grid2{grid-template-columns:1fr;}}
.ac-field { display:flex; flex-direction:column; gap:.3rem; }
.ac-lbl { font-size:.68rem; font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:var(--muted-foreground); }
.ac-req { color:oklch(0.55 0.22 25); }
.ac-inp { width:100%; border:1.5px solid var(--border); background:var(--background); border-radius:.65rem;
  padding:.6rem .85rem; font-size:.875rem; color:var(--foreground); outline:none; transition:border-color .2s,box-shadow .2s; }
.ac-inp:focus { border-color:oklch(0.62 0.2 260); box-shadow:0 0 0 3px oklch(0.62 0.2 260 / .12); }
.ac-inp::placeholder { color:var(--muted-foreground); }
.ac-sel { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right .65rem center; background-size:1rem; padding-right:2.5rem; cursor:pointer; }
.ac-ta { resize:vertical; min-height:80px; }
.ac-err { background:oklch(0.97 0.05 25 / .5); border:1px solid oklch(0.88 0.1 25 / .4); border-radius:.65rem;
  padding:.6rem .9rem; font-size:.82rem; color:oklch(0.5 0.22 25); display:flex; align-items:center; gap:.4rem; }
.ac-form-actions { display:flex; gap:.65rem; padding-top:.25rem; }
.ac-submit-btn { flex:1; padding:.8rem; border-radius:.8rem;
  background:linear-gradient(135deg,oklch(0.62 0.2 260),oklch(0.5 0.22 265)); color:#fff;
  font-size:.9rem; font-weight:800; border:none; cursor:pointer;
  box-shadow:0 3px 14px oklch(0.58 0.2 260 / .35); transition:opacity .2s;
  display:flex; align-items:center; justify-content:center; gap:.5rem; }
.ac-submit-btn:hover{opacity:.9}.ac-submit-btn:disabled{opacity:.5;cursor:not-allowed;}
.ac-cancel-btn { padding:.8rem 1.2rem; border-radius:.8rem; background:transparent; border:1.5px solid var(--border);
  color:var(--muted-foreground); font-size:.875rem; font-weight:600; cursor:pointer; transition:background .15s,color .15s; }
.ac-cancel-btn:hover { background:var(--accent); color:var(--foreground); }
.ac-confirm-text { font-size:.875rem; color:var(--muted-foreground); line-height:1.6; }
.ac-confirm-text strong { color:var(--foreground); }
@keyframes acSpin{to{transform:rotate(360deg)}}.ac-spin{animation:acSpin .8s linear infinite;}
`

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")

  const [showAdd, setShowAdd]   = useState(false)
  const [editClub, setEditClub] = useState<Club | null>(null)
  const [deleteClub, setDeleteClub] = useState<Club | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErr, setFormErr]   = useState("")
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/clubs")
    if (res.ok) setClubs(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() =>
    clubs
      .filter((c) => filterStatus === "ALL" || c.status === filterStatus)
      .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase())),
    [clubs, filterStatus, search]
  )

  function openAdd() { setForm(EMPTY_FORM); setFormErr(""); setShowAdd(true) }
  function openEdit(club: Club) {
    setForm({ name: club.name, category: club.category, description: club.description,
      requirements: club.requirements ?? "", capacity: String(club.capacity),
      status: club.status, email: club.email ?? "", social: club.social ?? "" })
    setFormErr(""); setEditClub(club)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.description.trim() || !form.capacity)
      { setFormErr("Name, description and capacity are required."); return }
    setSaving(true); setFormErr("")
    const url  = editClub ? `/api/admin/clubs/${editClub.id}` : "/api/admin/clubs"
    const method = editClub ? "PUT" : "POST"
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, capacity: Number(form.capacity) }) })
    const data = await res.json()
    if (!res.ok) { setFormErr(data.error ?? "Failed to save."); setSaving(false); return }
    if (editClub) setClubs((p) => p.map((c) => c.id === data.id ? data : c))
    else          { setClubs((p) => [data, ...p]) }
    setShowAdd(false); setEditClub(null); setSaving(false)
  }

  async function handleDelete() {
    if (!deleteClub) return
    setDeleting(true)
    const res = await fetch(`/api/admin/clubs/${deleteClub.id}`, { method: "DELETE" })
    if (res.ok) { setClubs((p) => p.filter((c) => c.id !== deleteClub.id)); setDeleteClub(null) }
    setDeleting(false)
  }

  const totalPending = clubs.reduce((s, c) => s + c._count.applications, 0)

  return (
    <>
      <style>{CSS}</style>
      <div className="ac-root">

        {/* Hero */}
        <div className="ac-hero">
          <div className="ac-hero-glow" />
          <div className="ac-hero-inner">
            <div>
              <div className="ac-hero-tag"><span className="ac-hero-dot" /> Club Management</div>
              <h1 className="ac-hero-title">Clubs & Societies</h1>
              <p className="ac-hero-sub">Create, edit and manage all student clubs</p>
            </div>
            <div className="ac-hero-stats">
              {[
                { val: clubs.length, lbl: "Total" },
                { val: clubs.filter(c=>c.status==="OPEN").length, lbl: "Open" },
                { val: clubs.filter(c=>c.status==="FULL").length, lbl: "Full" },
                { val: totalPending, lbl: "Pending Apps" },
              ].map((s) => (
                <div key={s.lbl} className="ac-hero-stat">
                  <div className="ac-hero-stat-val">{s.val}</div>
                  <div className="ac-hero-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ac-toolbar">
          <div className="ac-search-wrap">
            <span className="ac-search-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
            <input className="ac-search" placeholder="Search clubs…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="ac-filter-btns">
            {["ALL", ...STATUSES].map((s) => (
              <button key={s} className={`ac-filter-btn${filterStatus===s?" active":""}`} onClick={() => setFilterStatus(s)}>
                {s === "ALL" ? "All" : cap(s)}
              </button>
            ))}
          </div>
          <button className="ac-add-btn" onClick={openAdd}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Club
          </button>
        </div>

        {/* Stats strip */}
        <div className="ac-strip">
          <span className="ac-chip"><span className="ac-chip-dot" />{filtered.length} club{filtered.length!==1?"s":""}</span>
          {clubs.filter(c=>c.status==="OPEN").length > 0 && <span className="ac-chip open"><span className="ac-chip-dot" />{clubs.filter(c=>c.status==="OPEN").length} open</span>}
          {totalPending > 0 && <span className="ac-chip pending"><span className="ac-chip-dot" />{totalPending} pending applications</span>}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="ac-grid">{[...Array(6)].map((_,i)=><div key={i} className="ac-skel" style={{height:"15rem"}}/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="ac-empty">
            <div className="ac-empty-icon">🏛️</div>
            <div className="ac-empty-title">No clubs found</div>
            <div className="ac-empty-sub">{search ? "Try a different search term." : "Add your first club."}</div>
          </div>
        ) : (
          <div className="ac-grid">
            {filtered.map((club) => {
              const cat = CAT_META[club.category] ?? CAT_META.OTHER
              const st  = ST_META[club.status]   ?? ST_META.CLOSED
              const bar = `linear-gradient(135deg,${cat.bar},oklch(0.38 0.18 265))`
              const pct = Math.min((club._count.members / club.capacity) * 100, 100)
              const capColor = pct>=90?"oklch(0.55 0.22 25)":pct>=70?"oklch(0.6 0.2 55)":"oklch(0.5 0.2 145)"
              return (
                <div key={club.id} className="ac-card">
                  <div className="ac-card-top" style={{background:bar}}/>
                  <div className="ac-card-body">
                    <div className="ac-card-hdr">
                      <div className="ac-card-icon" style={{background:bar}}>{cat.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="ac-card-name">{club.name}</div>
                        <div className="ac-badges">
                          <span className="ac-badge" style={{background:cat.bg,color:cat.fg}}>{cat.icon} {cap(club.category)}</span>
                          <span className="ac-badge" style={{background:st.bg,color:st.fg}}>
                            <span className="ac-st-dot" style={{background:st.dot}}/>{st.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="ac-desc">{club.description}</p>
                    {/* Capacity bar */}
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:".3rem"}}>
                        <span style={{fontSize:".7rem",color:"var(--muted-foreground)",fontWeight:600}}>Members</span>
                        <span style={{fontSize:".7rem",fontWeight:700,color:"var(--foreground)"}}>{club._count.members}/{club.capacity}</span>
                      </div>
                      <div style={{height:"5px",borderRadius:"999px",background:"var(--muted)",overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:"999px",width:`${pct}%`,background:capColor,transition:"width .5s"}}/>
                      </div>
                    </div>
                    <div className="ac-card-meta">
                      {club._count.applications > 0 && (
                        <span className="ac-meta-item" style={{color:"oklch(0.48 0.2 60)"}}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          {club._count.applications} pending
                        </span>
                      )}
                      {club.email && (
                        <span className="ac-meta-item">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                          {club.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ac-card-footer">
                    <button className="ac-edit-btn" onClick={() => openEdit(club)}>✎ Edit</button>
                    <button className="ac-del-btn" onClick={() => setDeleteClub(club)}>✕ Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add / Edit Modal */}
        {(showAdd || editClub) && (
          <div className="ac-backdrop" onClick={() => { setShowAdd(false); setEditClub(null) }}>
            <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ac-modal-hdr">
                <span className="ac-modal-title">{editClub ? `Edit — ${editClub.name}` : "Add New Club"}</span>
                <button className="ac-modal-close" onClick={() => { setShowAdd(false); setEditClub(null) }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="ac-modal-body">
                {formErr && <div className="ac-err"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{formErr}</div>}

                <div className="ac-field">
                  <label className="ac-lbl">Club Name <span className="ac-req">*</span></label>
                  <input className="ac-inp" placeholder="e.g. Computer Science Society" value={form.name} onChange={(e) => setForm(p=>({...p,name:e.target.value}))}/>
                </div>

                <div className="ac-form-grid2">
                  <div className="ac-field">
                    <label className="ac-lbl">Category <span className="ac-req">*</span></label>
                    <select className="ac-inp ac-sel" value={form.category} onChange={(e) => setForm(p=>({...p,category:e.target.value}))}>
                      {CATEGORIES.map(c=><option key={c} value={c}>{CAT_META[c].icon} {cap(c)}</option>)}
                    </select>
                  </div>
                  <div className="ac-field">
                    <label className="ac-lbl">Status</label>
                    <select className="ac-inp ac-sel" value={form.status} onChange={(e) => setForm(p=>({...p,status:e.target.value}))}>
                      {STATUSES.map(s=><option key={s} value={s}>{cap(s)}</option>)}
                    </select>
                  </div>
                  <div className="ac-field">
                    <label className="ac-lbl">Capacity <span className="ac-req">*</span></label>
                    <input className="ac-inp" type="number" min="1" placeholder="30" value={form.capacity} onChange={(e) => setForm(p=>({...p,capacity:e.target.value}))}/>
                  </div>
                  <div className="ac-field">
                    <label className="ac-lbl">Contact Email</label>
                    <input className="ac-inp" type="email" placeholder="club@university.edu" value={form.email} onChange={(e) => setForm(p=>({...p,email:e.target.value}))}/>
                  </div>
                </div>

                <div className="ac-field">
                  <label className="ac-lbl">Description <span className="ac-req">*</span></label>
                  <textarea className="ac-inp ac-ta" rows={3} placeholder="Describe the club…" value={form.description} onChange={(e) => setForm(p=>({...p,description:e.target.value}))}/>
                </div>
                <div className="ac-field">
                  <label className="ac-lbl">Requirements <span style={{fontWeight:400,opacity:.6,textTransform:"none"}}>(optional)</span></label>
                  <textarea className="ac-inp ac-ta" rows={2} placeholder="Membership requirements…" value={form.requirements} onChange={(e) => setForm(p=>({...p,requirements:e.target.value}))}/>
                </div>
                <div className="ac-field">
                  <label className="ac-lbl">Social / Website <span style={{fontWeight:400,opacity:.6,textTransform:"none"}}>(optional)</span></label>
                  <input className="ac-inp" placeholder="https://…" value={form.social} onChange={(e) => setForm(p=>({...p,social:e.target.value}))}/>
                </div>

                <div className="ac-form-actions">
                  <button className="ac-submit-btn" onClick={handleSave} disabled={saving}>
                    {saving ? <><svg className="ac-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>Saving…</> : editClub ? "Save Changes →" : "Create Club →"}
                  </button>
                  <button className="ac-cancel-btn" onClick={() => { setShowAdd(false); setEditClub(null) }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteClub && (
          <div className="ac-backdrop" onClick={() => setDeleteClub(null)}>
            <div className="ac-modal" style={{maxWidth:420}} onClick={(e) => e.stopPropagation()}>
              <div className="ac-modal-hdr">
                <span className="ac-modal-title">Delete Club</span>
                <button className="ac-modal-close" onClick={() => setDeleteClub(null)}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
              <div className="ac-modal-body">
                <p className="ac-confirm-text">Are you sure you want to delete <strong>{deleteClub.name}</strong>? This will also remove all applications and memberships. This cannot be undone.</p>
                <div className="ac-form-actions">
                  <button style={{flex:1,padding:".8rem",borderRadius:".8rem",background:"oklch(0.55 0.22 25)",color:"#fff",fontSize:".9rem",fontWeight:800,border:"none",cursor:"pointer",opacity:deleting?.5:1}} onClick={handleDelete} disabled={deleting}>
                    {deleting?"Deleting…":"Yes, Delete"}
                  </button>
                  <button className="ac-cancel-btn" onClick={() => setDeleteClub(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
