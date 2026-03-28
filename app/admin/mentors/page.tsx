"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback, useMemo } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────
type Mentor = {
  id: number; gpa: number; subjects: string; bio: string
  preferredDays: string | null; contactPreference: string
  isActive: boolean; sessionsCount: number; rating: number
  createdAt: string
  user: { fullName: string; email: string; faculty: string; photoUrl: string | null }
  _count: { sessions: number }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(n: string) { return n.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() }
function relDate(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  if (diff < 86400*7) return `${Math.floor(diff/86400)}d ago`
  return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;}
.am-root{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem;}

/* Hero */
.am-hero{border-radius:1.2rem;overflow:hidden;position:relative;
  background:linear-gradient(135deg,oklch(0.22 0.1 265) 0%,oklch(0.30 0.14 258) 55%,oklch(0.40 0.16 252) 100%);
  padding:1.6rem 2rem;}
.am-hero::before{content:'';position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size:28px 28px;}
.am-hero-glow{position:absolute;top:-70px;right:-50px;width:260px;height:260px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,oklch(0.65 0.2 260 / .3) 0%,transparent 70%);}
.am-hero-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;}
.am-hero-tag{display:inline-flex;align-items:center;gap:.4rem;padding:.26rem .8rem;border-radius:999px;margin-bottom:.65rem;
  background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);
  font-size:.7rem;font-weight:700;letter-spacing:.07em;color:rgba(255,255,255,.85);text-transform:uppercase;}
.am-hero-dot{width:6px;height:6px;border-radius:50%;background:oklch(0.75 0.2 295);animation:amBlink 2s ease-in-out infinite;}
@keyframes amBlink{0%,100%{opacity:1}50%{opacity:.35}}
.am-hero-title{font-size:1.55rem;font-weight:900;color:#fff;letter-spacing:-.04em;margin:0 0 .25rem;}
.am-hero-sub{font-size:.82rem;color:rgba(255,255,255,.6);}
.am-hero-stats{display:flex;gap:.6rem;flex-wrap:wrap;}
.am-hero-stat{display:flex;flex-direction:column;align-items:center;padding:.65rem 1.1rem;
  border-radius:.8rem;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);
  min-width:5rem;text-align:center;}
.am-hero-stat-val{font-size:1.3rem;font-weight:900;color:#fff;line-height:1;}
.am-hero-stat-lbl{font-size:.6rem;font-weight:700;color:rgba(255,255,255,.6);margin-top:.2rem;text-transform:uppercase;letter-spacing:.05em;}

/* Toolbar */
.am-toolbar{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;}
.am-search-wrap{flex:1;min-width:200px;position:relative;}
.am-search-icon{position:absolute;left:.85rem;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--muted-foreground);}
.am-search-icon svg{width:14px;height:14px;}
.am-search{width:100%;padding:.62rem .85rem .62rem 2.4rem;border:1.5px solid var(--border);border-radius:.75rem;
  background:var(--background);color:var(--foreground);font-size:.875rem;outline:none;transition:border-color .2s,box-shadow .2s;}
.am-search:focus{border-color:oklch(0.62 0.2 260);box-shadow:0 0 0 3px oklch(0.62 0.2 260 / .12);}
.am-search::placeholder{color:var(--muted-foreground);}
.am-filter-btns{display:flex;gap:.35rem;}
.am-filter-btn{padding:.42rem .9rem;border-radius:999px;font-size:.75rem;font-weight:700;
  border:1.5px solid var(--border);background:var(--background);color:var(--muted-foreground);
  cursor:pointer;transition:all .18s;}
.am-filter-btn:hover{border-color:oklch(0.62 0.2 260 / .45);color:var(--foreground);}
.am-filter-btn.active{background:linear-gradient(135deg,oklch(0.62 0.2 260),oklch(0.5 0.22 265));border-color:transparent;color:#fff;box-shadow:0 2px 10px oklch(0.6 0.2 260 / .3);}

/* Strip */
.am-strip{display:flex;gap:.8rem;flex-wrap:wrap;}
.am-chip{display:inline-flex;align-items:center;gap:.38rem;padding:.28rem .75rem;border-radius:999px;
  background:var(--muted);border:1px solid var(--border);font-size:.73rem;font-weight:600;color:var(--muted-foreground);}
.am-chip-dot{width:5px;height:5px;border-radius:50%;background:currentColor;}
.am-chip.active{background:oklch(0.93 0.06 145 / .5);border-color:oklch(0.82 0.1 145);color:oklch(0.38 0.18 145);}
.am-chip.inactive{background:oklch(0.95 0.05 25 / .5);border-color:oklch(0.88 0.1 25);color:oklch(0.5 0.22 25);}

/* Grid */
.am-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.1rem;}
@media(max-width:900px){.am-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.am-grid{grid-template-columns:1fr;}}
.am-skel{background:var(--muted);border-radius:1.1rem;animation:amSkel 1.4s ease-in-out infinite;}
@keyframes amSkel{0%,100%{opacity:1}50%{opacity:.4}}
.am-empty{text-align:center;padding:4rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:.55rem;}
.am-empty-icon{width:4.5rem;height:4.5rem;border-radius:1.2rem;background:var(--muted);display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:.3rem;}
.am-empty-title{font-size:1rem;font-weight:700;color:var(--foreground);}
.am-empty-sub{font-size:.875rem;color:var(--muted-foreground);}

/* Card */
.am-card{background:var(--card);border:1px solid var(--border);border-radius:1.1rem;overflow:hidden;
  display:flex;flex-direction:column;transition:box-shadow .2s,border-color .2s,transform .2s;}
.am-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.08);border-color:oklch(0.84 0.008 260);transform:translateY(-2px);}
.am-card-top{height:4px;}
.am-card-body{padding:1.15rem 1.2rem;flex:1;display:flex;flex-direction:column;gap:.85rem;}
.am-card-hdr{display:flex;align-items:flex-start;gap:.85rem;}
.am-avatar{width:2.75rem;height:2.75rem;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,oklch(0.52 0.2 260),oklch(0.42 0.22 265));
  display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:900;color:#fff;overflow:hidden;}
.am-avatar img{width:100%;height:100%;object-fit:cover;}
.am-name{font-size:.9rem;font-weight:800;color:var(--foreground);line-height:1.3;margin-bottom:.3rem;}
.am-status-badge{display:inline-flex;align-items:center;gap:.25rem;padding:.18rem .55rem;border-radius:999px;font-size:.67rem;font-weight:700;}
.am-status-dot{width:4px;height:4px;border-radius:50%;}
.am-faculty{font-size:.73rem;color:var(--muted-foreground);margin-top:.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;}
.am-stats-row{display:flex;gap:.65rem;flex-wrap:wrap;}
.am-stat-pill{display:flex;flex-direction:column;align-items:center;padding:.45rem .75rem;border-radius:.65rem;
  background:var(--background);border:1px solid var(--border);min-width:3.5rem;text-align:center;}
.am-stat-pill-val{font-size:.9rem;font-weight:900;color:var(--foreground);line-height:1;}
.am-stat-pill-lbl{font-size:.6rem;font-weight:700;color:var(--muted-foreground);margin-top:.15rem;text-transform:uppercase;letter-spacing:.04em;}
.am-subjects{font-size:.78rem;color:var(--muted-foreground);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.am-subjects-title{font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted-foreground);margin-bottom:.25rem;}
.am-card-footer{padding:.75rem 1.2rem;border-top:1px solid var(--border);display:flex;gap:.5rem;}
.am-toggle-btn{flex:1;padding:.42rem;border-radius:.6rem;font-size:.75rem;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .18s;}
.am-toggle-active{background:oklch(0.93 0.06 145 / .4);border-color:oklch(0.82 0.1 145);color:oklch(0.38 0.18 145);}
.am-toggle-active:hover{background:oklch(0.88 0.08 145 / .5);}
.am-toggle-inactive{background:oklch(0.95 0.05 25 / .3);border-color:oklch(0.88 0.1 25 / .5);color:oklch(0.5 0.22 25);}
.am-toggle-inactive:hover{background:oklch(0.91 0.08 25 / .4);}
.am-del-btn{padding:.42rem .8rem;border-radius:.6rem;background:oklch(0.97 0.05 25 / .5);border:1.5px solid oklch(0.88 0.1 25 / .4);
  font-size:.75rem;font-weight:700;color:oklch(0.5 0.22 25);cursor:pointer;transition:all .15s;}
.am-del-btn:hover{background:oklch(0.93 0.08 25 / .5);}

/* Modal */
.am-backdrop{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;padding:1rem;animation:amFadeIn .2s ease;}
@keyframes amFadeIn{from{opacity:0}to{opacity:1}}
.am-modal{background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:400px;
  box-shadow:0 24px 80px rgba(0,0,0,.22);animation:amSlideUp .28s cubic-bezier(.22,1,.36,1);}
@keyframes amSlideUp{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
.am-modal-hdr{padding:1.2rem 1.5rem 1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:1rem;}
.am-modal-title{font-size:1rem;font-weight:900;color:var(--foreground);}
.am-modal-close{width:1.9rem;height:1.9rem;border-radius:.5rem;background:var(--muted);border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;color:var(--muted-foreground);transition:background .15s,color .15s;}
.am-modal-close:hover{background:var(--accent);color:var(--foreground);}
.am-modal-close svg{width:13px;height:13px;}
.am-modal-body{padding:1.35rem 1.5rem;display:flex;flex-direction:column;gap:1rem;}
.am-confirm-text{font-size:.875rem;color:var(--muted-foreground);line-height:1.6;}
.am-confirm-text strong{color:var(--foreground);}
.am-form-actions{display:flex;gap:.65rem;}
.am-submit-btn-del{flex:1;padding:.8rem;border-radius:.8rem;background:oklch(0.55 0.22 25);color:#fff;
  font-size:.9rem;font-weight:800;border:none;cursor:pointer;transition:opacity .2s;}
.am-submit-btn-del:hover{opacity:.85;}
.am-submit-btn-del:disabled{opacity:.5;cursor:not-allowed;}
.am-cancel-btn{padding:.8rem 1.2rem;border-radius:.8rem;background:transparent;border:1.5px solid var(--border);
  color:var(--muted-foreground);font-size:.875rem;font-weight:600;cursor:pointer;transition:background .15s,color .15s;}
.am-cancel-btn:hover{background:var(--accent);color:var(--foreground);}

/* Rating stars */
.am-stars{display:flex;gap:2px;}
.am-star{font-size:.8rem;}
`

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("ALL")
  const [deleteMentor, setDeleteMentor] = useState<Mentor | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/mentors")
    if (res.ok) setMentors(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() =>
    mentors
      .filter((m) => filter === "ALL" || (filter === "ACTIVE" ? m.isActive : !m.isActive))
      .filter((m) => !search || m.user.fullName.toLowerCase().includes(search.toLowerCase()) || m.user.faculty.toLowerCase().includes(search.toLowerCase())),
    [mentors, filter, search]
  )

  async function toggleActive(mentor: Mentor) {
    setToggling(mentor.id)
    const res = await fetch(`/api/admin/mentors/${mentor.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !mentor.isActive }),
    })
    if (res.ok) {
      const updated: Mentor = await res.json()
      setMentors((p) => p.map((m) => m.id === updated.id ? updated : m))
    }
    setToggling(null)
  }

  async function handleDelete() {
    if (!deleteMentor) return
    setDeleting(true)
    const res = await fetch(`/api/admin/mentors/${deleteMentor.id}`, { method: "DELETE" })
    if (res.ok) { setMentors((p) => p.filter((m) => m.id !== deleteMentor.id)); setDeleteMentor(null) }
    setDeleting(false)
  }

  function stars(rating: number) {
    return Array.from({length:5},(_,i)=>(
      <span key={i} className="am-star" style={{opacity:i<Math.round(rating)?1:.25}}>★</span>
    ))
  }

  const active = mentors.filter(m=>m.isActive).length

  return (
    <>
      <style>{CSS}</style>
      <div className="am-root">

        {/* Hero */}
        <div className="am-hero">
          <div className="am-hero-glow"/>
          <div className="am-hero-inner">
            <div>
              <div className="am-hero-tag"><span className="am-hero-dot"/> Peer Support</div>
              <h1 className="am-hero-title">Mentor Management</h1>
              <p className="am-hero-sub">Activate, deactivate and manage peer mentor profiles</p>
            </div>
            <div className="am-hero-stats">
              {[
                {val:mentors.length,lbl:"Total"},
                {val:active,lbl:"Active"},
                {val:mentors.length-active,lbl:"Inactive"},
                {val:mentors.reduce((s,m)=>s+m._count.sessions,0),lbl:"Sessions"},
              ].map((s)=>(
                <div key={s.lbl} className="am-hero-stat">
                  <div className="am-hero-stat-val">{s.val}</div>
                  <div className="am-hero-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="am-toolbar">
          <div className="am-search-wrap">
            <span className="am-search-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
            <input className="am-search" placeholder="Search by name or faculty…" value={search} onChange={(e)=>setSearch(e.target.value)}/>
          </div>
          <div className="am-filter-btns">
            {["ALL","ACTIVE","INACTIVE"].map((f)=>(
              <button key={f} className={`am-filter-btn${filter===f?" active":""}`} onClick={()=>setFilter(f)}>
                {f==="ALL"?"All":f==="ACTIVE"?"Active":"Inactive"}
              </button>
            ))}
          </div>
        </div>

        {/* Strip */}
        <div className="am-strip">
          <span className="am-chip"><span className="am-chip-dot"/>{filtered.length} mentor{filtered.length!==1?"s":""}</span>
          {active>0&&<span className="am-chip active"><span className="am-chip-dot"/>{active} active</span>}
          {mentors.length-active>0&&<span className="am-chip inactive"><span className="am-chip-dot"/>{mentors.length-active} inactive</span>}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="am-grid">{[...Array(6)].map((_,i)=><div key={i} className="am-skel" style={{height:"16rem"}}/>)}</div>
        ) : filtered.length===0 ? (
          <div className="am-empty">
            <div className="am-empty-icon">🎓</div>
            <div className="am-empty-title">No mentors found</div>
            <div className="am-empty-sub">{search?"Try a different search.":"No mentors registered yet."}</div>
          </div>
        ) : (
          <div className="am-grid">
            {filtered.map((mentor)=>{
              const isActive = mentor.isActive
              const accentBar = isActive
                ? "linear-gradient(90deg,oklch(0.5 0.2 145),oklch(0.6 0.18 155))"
                : "linear-gradient(90deg,oklch(0.55 0.04 260),oklch(0.65 0.03 260))"
              return (
                <div key={mentor.id} className="am-card">
                  <div className="am-card-top" style={{background:accentBar}}/>
                  <div className="am-card-body">
                    <div className="am-card-hdr">
                      <div className="am-avatar">
                        {mentor.user.photoUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={mentor.user.photoUrl} alt={mentor.user.fullName}/>
                          : initials(mentor.user.fullName)
                        }
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="am-name">{mentor.user.fullName}</div>
                        <span className="am-status-badge" style={{
                          background: isActive?"oklch(0.93 0.06 145)":"oklch(0.94 0.02 260)",
                          color: isActive?"oklch(0.38 0.2 145)":"oklch(0.5 0.06 260)",
                        }}>
                          <span className="am-status-dot" style={{background:isActive?"oklch(0.5 0.2 145)":"oklch(0.65 0.04 260)"}}/>
                          {isActive?"Active":"Inactive"}
                        </span>
                        <div className="am-faculty">{mentor.user.faculty.replace("Faculty of ","")}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="am-stats-row">
                      <div className="am-stat-pill">
                        <div className="am-stat-pill-val">{Number(mentor.gpa).toFixed(2)}</div>
                        <div className="am-stat-pill-lbl">GPA</div>
                      </div>
                      <div className="am-stat-pill">
                        <div className="am-stat-pill-val">{mentor._count.sessions}</div>
                        <div className="am-stat-pill-lbl">Sessions</div>
                      </div>
                      <div className="am-stat-pill">
                        <div className="am-stat-pill-val">{mentor.sessionsCount}</div>
                        <div className="am-stat-pill-lbl">Completed</div>
                      </div>
                      {mentor.rating > 0 && (
                        <div className="am-stat-pill" style={{minWidth:"auto",paddingLeft:".65rem",paddingRight:".65rem"}}>
                          <div className="am-stars">{stars(mentor.rating)}</div>
                          <div className="am-stat-pill-lbl">{Number(mentor.rating).toFixed(1)}</div>
                        </div>
                      )}
                    </div>

                    {/* Subjects */}
                    <div>
                      <div className="am-subjects-title">Subjects</div>
                      <div className="am-subjects">{mentor.subjects}</div>
                    </div>

                    {/* Contact */}
                    <div style={{fontSize:".72rem",color:"var(--muted-foreground)",display:"flex",alignItems:"center",gap:".35rem"}}>
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      {mentor.user.email}
                    </div>
                  </div>

                  <div className="am-card-footer">
                    <button
                      className={`am-toggle-btn ${isActive?"am-toggle-active":"am-toggle-inactive"}`}
                      onClick={()=>toggleActive(mentor)}
                      disabled={toggling===mentor.id}>
                      {toggling===mentor.id?"…":isActive?"⏸ Deactivate":"▶ Activate"}
                    </button>
                    <button className="am-del-btn" onClick={()=>setDeleteMentor(mentor)}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Delete confirm */}
        {deleteMentor && (
          <div className="am-backdrop" onClick={()=>setDeleteMentor(null)}>
            <div className="am-modal" onClick={(e)=>e.stopPropagation()}>
              <div className="am-modal-hdr">
                <span className="am-modal-title">Remove Mentor</span>
                <button className="am-modal-close" onClick={()=>setDeleteMentor(null)}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="am-modal-body">
                <p className="am-confirm-text">
                  Remove <strong>{deleteMentor.user.fullName}</strong> as a mentor? Their profile and all associated sessions will be deleted. This cannot be undone.
                </p>
                <div className="am-form-actions">
                  <button className="am-submit-btn-del" onClick={handleDelete} disabled={deleting}>
                    {deleting?"Removing…":"Yes, Remove"}
                  </button>
                  <button className="am-cancel-btn" onClick={()=>setDeleteMentor(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
