"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback, useMemo } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────
type Application = {
  id: number; status: string; motivation: string; createdAt: string
  currentYear: number | null; currentSemester: number | null; gpa: number | null
  contribution: string | null; experience: string | null; availableDays: string | null
  user: { fullName: string; email: string; studentId: string; faculty: string }
  club: { name: string; category: string }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED", "WAITLISTED"] as const
const CAT_META: Record<string, { icon: string; bg: string; fg: string; color: string }> = {
  ACADEMIC:  { icon: "🎓", bg: "oklch(0.93 0.05 250)", fg: "oklch(0.42 0.2 250)",  color: "oklch(0.52 0.2 250)"  },
  SPORTS:    { icon: "⚽", bg: "oklch(0.93 0.06 145)", fg: "oklch(0.4 0.2 145)",   color: "oklch(0.5 0.2 145)"   },
  CULTURAL:  { icon: "🎭", bg: "oklch(0.93 0.06 295)", fg: "oklch(0.42 0.2 295)",  color: "oklch(0.5 0.2 295)"   },
  RELIGIOUS: { icon: "☪️", bg: "oklch(0.94 0.06 55)",  fg: "oklch(0.45 0.2 55)",   color: "oklch(0.52 0.18 55)"  },
  OTHER:     { icon: "✦",  bg: "oklch(0.94 0.02 260)", fg: "oklch(0.45 0.06 260)", color: "oklch(0.5 0.1 260)"   },
}
const APP_META: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  PENDING:    { label: "Pending",    bg: "oklch(0.95 0.06 80)",  fg: "oklch(0.48 0.2 80)",  dot: "oklch(0.6 0.2 80)"  },
  APPROVED:   { label: "Approved",   bg: "oklch(0.93 0.06 145)", fg: "oklch(0.38 0.2 145)", dot: "oklch(0.5 0.2 145)" },
  REJECTED:   { label: "Rejected",   bg: "oklch(0.95 0.05 25)",  fg: "oklch(0.5 0.22 25)",  dot: "oklch(0.6 0.22 25)" },
  WAITLISTED: { label: "Waitlisted", bg: "oklch(0.93 0.05 250)", fg: "oklch(0.42 0.2 250)", dot: "oklch(0.52 0.2 250)"},
}
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()
function initials(n: string) { return n.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() }
function relDate(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"})
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; }
.aa-root { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

/* Hero */
.aa-hero {
  border-radius:1.2rem; overflow:hidden; position:relative;
  background:linear-gradient(135deg,oklch(0.22 0.1 265) 0%,oklch(0.30 0.14 258) 55%,oklch(0.40 0.16 252) 100%);
  padding:1.6rem 2rem;
}
.aa-hero::before{content:'';position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size:28px 28px;}
.aa-hero-glow{position:absolute;top:-70px;right:-50px;width:260px;height:260px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,oklch(0.65 0.2 260 / .3) 0%,transparent 70%);}
.aa-hero-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;}
.aa-hero-tag{display:inline-flex;align-items:center;gap:.4rem;padding:.26rem .8rem;border-radius:999px;margin-bottom:.65rem;
  background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);
  font-size:.7rem;font-weight:700;letter-spacing:.07em;color:rgba(255,255,255,.85);text-transform:uppercase;}
.aa-hero-dot{width:6px;height:6px;border-radius:50%;background:oklch(0.75 0.2 55);animation:aaBlink 2s ease-in-out infinite;}
@keyframes aaBlink{0%,100%{opacity:1}50%{opacity:.35}}
.aa-hero-title{font-size:1.55rem;font-weight:900;color:#fff;letter-spacing:-.04em;margin:0 0 .25rem;}
.aa-hero-sub{font-size:.82rem;color:rgba(255,255,255,.6);}
.aa-hero-stats{display:flex;gap:.6rem;flex-wrap:wrap;}
.aa-hero-stat{display:flex;flex-direction:column;align-items:center;padding:.65rem 1.1rem;
  border-radius:.8rem;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);
  min-width:5rem;text-align:center;}
.aa-hero-stat-val{font-size:1.3rem;font-weight:900;color:#fff;line-height:1;}
.aa-hero-stat-lbl{font-size:.6rem;font-weight:700;color:rgba(255,255,255,.6);margin-top:.2rem;text-transform:uppercase;letter-spacing:.05em;}

/* Toolbar */
.aa-toolbar{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;}
.aa-search-wrap{flex:1;min-width:200px;position:relative;}
.aa-search-icon{position:absolute;left:.85rem;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--muted-foreground);}
.aa-search-icon svg{width:14px;height:14px;}
.aa-search{width:100%;padding:.62rem .85rem .62rem 2.4rem;border:1.5px solid var(--border);border-radius:.75rem;
  background:var(--background);color:var(--foreground);font-size:.875rem;outline:none;transition:border-color .2s,box-shadow .2s;}
.aa-search:focus{border-color:oklch(0.62 0.2 260);box-shadow:0 0 0 3px oklch(0.62 0.2 260 / .12);}
.aa-search::placeholder{color:var(--muted-foreground);}

/* Status tabs */
.aa-tabs{display:flex;gap:.35rem;flex-wrap:wrap;}
.aa-tab{padding:.42rem .9rem;border-radius:999px;font-size:.75rem;font-weight:700;
  border:1.5px solid var(--border);background:var(--background);color:var(--muted-foreground);
  cursor:pointer;transition:all .18s;}
.aa-tab:hover{border-color:oklch(0.62 0.2 260 / .45);color:var(--foreground);}
.aa-tab.active{background:linear-gradient(135deg,oklch(0.62 0.2 260),oklch(0.5 0.22 265));border-color:transparent;color:#fff;box-shadow:0 2px 10px oklch(0.6 0.2 260 / .3);}
.aa-tab-pending.active{background:linear-gradient(135deg,oklch(0.62 0.2 55),oklch(0.5 0.22 70));}
.aa-tab-approved.active{background:linear-gradient(135deg,oklch(0.5 0.2 145),oklch(0.42 0.22 150));}
.aa-tab-rejected.active{background:linear-gradient(135deg,oklch(0.55 0.22 25),oklch(0.45 0.22 30));}
.aa-tab-waitlisted.active{background:linear-gradient(135deg,oklch(0.5 0.2 250),oklch(0.42 0.22 255));}

/* Strip */
.aa-strip{display:flex;gap:.8rem;flex-wrap:wrap;}
.aa-chip{display:inline-flex;align-items:center;gap:.38rem;padding:.28rem .75rem;border-radius:999px;
  background:var(--muted);border:1px solid var(--border);font-size:.73rem;font-weight:600;color:var(--muted-foreground);}
.aa-chip-dot{width:5px;height:5px;border-radius:50%;background:currentColor;}
.aa-chip.pending{background:oklch(0.95 0.07 65 / .5);border-color:oklch(0.85 0.1 65);color:oklch(0.48 0.2 60);}
.aa-chip.approved{background:oklch(0.93 0.06 145 / .5);border-color:oklch(0.82 0.1 145);color:oklch(0.38 0.18 145);}
.aa-chip.rejected{background:oklch(0.95 0.05 25 / .5);border-color:oklch(0.88 0.1 25);color:oklch(0.5 0.22 25);}

/* List */
.aa-list{display:flex;flex-direction:column;gap:.75rem;}
.aa-skel{background:var(--muted);border-radius:1.1rem;animation:aaSkel 1.4s ease-in-out infinite;}
@keyframes aaSkel{0%,100%{opacity:1}50%{opacity:.4}}
.aa-empty{text-align:center;padding:4rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:.55rem;}
.aa-empty-icon{width:4.5rem;height:4.5rem;border-radius:1.2rem;background:var(--muted);display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:.3rem;}
.aa-empty-title{font-size:1rem;font-weight:700;color:var(--foreground);}
.aa-empty-sub{font-size:.875rem;color:var(--muted-foreground);}

/* App row card */
.aa-row{background:var(--card);border:1px solid var(--border);border-radius:1.1rem;
  padding:1.1rem 1.25rem;display:flex;align-items:flex-start;gap:1rem;
  transition:box-shadow .2s,border-color .2s;}
.aa-row:hover{box-shadow:0 4px 20px rgba(0,0,0,.07);border-color:oklch(0.84 0.008 260);}
.aa-row-left{position:relative;flex-shrink:0;}
.aa-avatar{width:2.75rem;height:2.75rem;border-radius:.8rem;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:900;color:#fff;}
.aa-cat-icon{position:absolute;bottom:-4px;right:-4px;width:1.15rem;height:1.15rem;border-radius:.3rem;display:flex;align-items:center;justify-content:center;font-size:.6rem;background:var(--card);border:1px solid var(--border);}
.aa-row-main{flex:1;min-width:0;}
.aa-row-top{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;flex-wrap:wrap;margin-bottom:.5rem;}
.aa-name{font-size:.9rem;font-weight:800;color:var(--foreground);}
.aa-meta{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;margin-top:.15rem;}
.aa-meta-txt{font-size:.73rem;color:var(--muted-foreground);}
.aa-meta-dot{width:3px;height:3px;border-radius:50%;background:var(--muted-foreground);flex-shrink:0;}
.aa-badge{display:inline-flex;align-items:center;gap:.22rem;padding:.18rem .55rem;border-radius:999px;font-size:.67rem;font-weight:700;}
.aa-st-dot{width:4px;height:4px;border-radius:50%;}
.aa-club-row{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.55rem;}
.aa-club-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .6rem;border-radius:999px;font-size:.72rem;font-weight:700;}
.aa-motivation{font-size:.8rem;color:var(--muted-foreground);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.aa-row-actions{display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;flex-shrink:0;}
.aa-date{font-size:.68rem;color:var(--muted-foreground);white-space:nowrap;}
.aa-review-btn{padding:.42rem .9rem;border-radius:.6rem;
  background:linear-gradient(135deg,oklch(0.62 0.2 260),oklch(0.5 0.22 265));color:#fff;
  font-size:.75rem;font-weight:800;border:none;cursor:pointer;white-space:nowrap;
  box-shadow:0 2px 8px oklch(0.58 0.2 260 / .3);transition:opacity .18s;}
.aa-review-btn:hover{opacity:.85;}

/* Modal */
.aa-backdrop{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;padding:1rem;animation:aaFadeIn .2s ease;}
@keyframes aaFadeIn{from{opacity:0}to{opacity:1}}
.aa-modal{background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:560px;
  box-shadow:0 24px 80px rgba(0,0,0,.22);max-height:92vh;overflow-y:auto;
  animation:aaSlideUp .28s cubic-bezier(.22,1,.36,1);}
@keyframes aaSlideUp{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
.aa-modal::-webkit-scrollbar{width:4px}.aa-modal::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
.aa-modal-top{height:4px;border-radius:1.25rem 1.25rem 0 0;flex-shrink:0;}
.aa-modal-hdr{padding:1.2rem 1.5rem 1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:1rem;}
.aa-modal-title{font-size:1rem;font-weight:900;color:var(--foreground);letter-spacing:-.02em;}
.aa-modal-close{width:1.9rem;height:1.9rem;border-radius:.5rem;background:var(--muted);border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;color:var(--muted-foreground);transition:background .15s,color .15s;}
.aa-modal-close:hover{background:var(--accent);color:var(--foreground);}
.aa-modal-close svg{width:13px;height:13px;}
.aa-modal-body{padding:1.35rem 1.5rem;display:flex;flex-direction:column;gap:1.1rem;}
.aa-detail-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;}
@media(max-width:480px){.aa-detail-grid{grid-template-columns:1fr 1fr;}}
.aa-detail-item{display:flex;flex-direction:column;gap:.28rem;}
.aa-detail-label{font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted-foreground);}
.aa-detail-value{font-size:.875rem;font-weight:600;color:var(--foreground);}
.aa-detail-empty{font-size:.8rem;color:var(--muted-foreground);font-style:italic;}
.aa-section-title{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted-foreground);margin-bottom:.45rem;}
.aa-body-text{font-size:.875rem;color:var(--foreground);line-height:1.7;}
.aa-action-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.65rem;}
@media(max-width:480px){.aa-action-grid{grid-template-columns:1fr 1fr;}}
.aa-action-card{display:flex;flex-direction:column;align-items:center;gap:.35rem;padding:.8rem .6rem;
  border-radius:.9rem;border:1.5px solid var(--border);background:var(--background);cursor:pointer;transition:all .18s;}
.aa-action-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.08);}
.aa-action-card.approve:hover{border-color:oklch(0.5 0.2 145);background:oklch(0.93 0.06 145 / .3);}
.aa-action-card.reject:hover{border-color:oklch(0.55 0.22 25);background:oklch(0.95 0.05 25 / .3);}
.aa-action-card.waitlist:hover{border-color:oklch(0.52 0.2 250);background:oklch(0.93 0.05 250 / .3);}
.aa-action-card.disabled{opacity:.45;cursor:not-allowed;transform:none!important;}
.aa-action-emoji{font-size:1.4rem;line-height:1;}
.aa-action-label{font-size:.75rem;font-weight:800;color:var(--foreground);}
.aa-action-sub{font-size:.65rem;color:var(--muted-foreground);text-align:center;}
.aa-fb-field{display:flex;flex-direction:column;gap:.32rem;}
.aa-fb-lbl{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted-foreground);}
.aa-fb-ta{width:100%;border:1.5px solid var(--border);background:var(--background);border-radius:.65rem;
  padding:.6rem .85rem;font-size:.875rem;color:var(--foreground);outline:none;resize:none;
  transition:border-color .2s,box-shadow .2s;}
.aa-fb-ta:focus{border-color:oklch(0.62 0.2 260);box-shadow:0 0 0 3px oklch(0.62 0.2 260 / .12);}
.aa-fb-ta::placeholder{color:var(--muted-foreground);}
.aa-saving-msg{text-align:center;font-size:.82rem;color:var(--muted-foreground);padding:.75rem 0;}
`

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminClubApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState("ALL")
  const [search, setSearch] = useState("")
  const [reviewApp, setReviewApp] = useState<Application | null>(null)
  const [feedback, setFeedback] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/club-applications")
    if (res.ok) setApps(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() =>
    apps
      .filter((a) => statusTab === "ALL" || a.status === statusTab)
      .filter((a) => !search || a.user.fullName.toLowerCase().includes(search.toLowerCase()) || a.club.name.toLowerCase().includes(search.toLowerCase())),
    [apps, statusTab, search]
  )

  async function review(newStatus: string) {
    if (!reviewApp) return
    setSaving(true)
    const res = await fetch(`/api/admin/club-applications/${reviewApp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, feedback }),
    })
    if (res.ok) {
      const updated: Application = await res.json()
      setApps((p) => p.map((a) => a.id === updated.id ? updated : a))
      setReviewApp(updated)
    }
    setSaving(false)
  }

  const counts = {
    PENDING:    apps.filter(a=>a.status==="PENDING").length,
    APPROVED:   apps.filter(a=>a.status==="APPROVED").length,
    REJECTED:   apps.filter(a=>a.status==="REJECTED").length,
    WAITLISTED: apps.filter(a=>a.status==="WAITLISTED").length,
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="aa-root">

        {/* Hero */}
        <div className="aa-hero">
          <div className="aa-hero-glow"/>
          <div className="aa-hero-inner">
            <div>
              <div className="aa-hero-tag"><span className="aa-hero-dot"/> Applications</div>
              <h1 className="aa-hero-title">Club Applications</h1>
              <p className="aa-hero-sub">Review, approve and manage club membership applications</p>
            </div>
            <div className="aa-hero-stats">
              {[
                {val:apps.length,lbl:"Total"},
                {val:counts.PENDING,lbl:"Pending"},
                {val:counts.APPROVED,lbl:"Approved"},
                {val:counts.REJECTED,lbl:"Rejected"},
              ].map((s)=>(
                <div key={s.lbl} className="aa-hero-stat">
                  <div className="aa-hero-stat-val">{s.val}</div>
                  <div className="aa-hero-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="aa-toolbar">
          <div className="aa-search-wrap">
            <span className="aa-search-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
            <input className="aa-search" placeholder="Search by student or club name…" value={search} onChange={(e)=>setSearch(e.target.value)}/>
          </div>
          <div className="aa-tabs">
            {STATUS_TABS.map((t)=>(
              <button key={t} className={`aa-tab aa-tab-${t.toLowerCase()}${statusTab===t?" active":""}`} onClick={()=>setStatusTab(t)}>
                {t==="ALL"?"All":cap(t)}{t!=="ALL"&&counts[t]>0?` (${counts[t]})`:""}
              </button>
            ))}
          </div>
        </div>

        {/* Strip */}
        <div className="aa-strip">
          <span className="aa-chip"><span className="aa-chip-dot"/>{filtered.length} application{filtered.length!==1?"s":""}</span>
          {counts.PENDING>0&&<span className="aa-chip pending"><span className="aa-chip-dot"/>{counts.PENDING} pending review</span>}
          {counts.APPROVED>0&&<span className="aa-chip approved"><span className="aa-chip-dot"/>{counts.APPROVED} approved</span>}
          {counts.REJECTED>0&&<span className="aa-chip rejected"><span className="aa-chip-dot"/>{counts.REJECTED} rejected</span>}
        </div>

        {/* List */}
        {loading ? (
          <div className="aa-list">{[...Array(5)].map((_,i)=><div key={i} className="aa-skel" style={{height:"6.5rem"}}/>)}</div>
        ) : filtered.length===0 ? (
          <div className="aa-empty">
            <div className="aa-empty-icon">📋</div>
            <div className="aa-empty-title">No applications found</div>
            <div className="aa-empty-sub">{search?"Try a different search.":"No applications in this category."}</div>
          </div>
        ) : (
          <div className="aa-list">
            {filtered.map((app)=>{
              const cat = CAT_META[app.club.category]??CAT_META.OTHER
              const st  = APP_META[app.status]??APP_META.PENDING
              return (
                <div key={app.id} className="aa-row">
                  <div className="aa-row-left">
                    <div className="aa-avatar" style={{background:`linear-gradient(135deg,${cat.color},oklch(0.38 0.18 265))`}}>{initials(app.user.fullName)}</div>
                    <div className="aa-cat-icon">{cat.icon}</div>
                  </div>
                  <div className="aa-row-main">
                    <div className="aa-row-top">
                      <div>
                        <div className="aa-name">{app.user.fullName}</div>
                        <div className="aa-meta">
                          <span className="aa-meta-txt">{app.user.studentId}</span>
                          <span className="aa-meta-dot"/>
                          <span className="aa-meta-txt">{app.user.faculty.replace("Faculty of ","")}</span>
                          {app.currentYear&&<><span className="aa-meta-dot"/><span className="aa-meta-txt">Year {app.currentYear}{app.currentSemester?` Sem ${app.currentSemester}`:""}</span></>}
                          {app.gpa&&<><span className="aa-meta-dot"/><span className="aa-meta-txt">GPA {Number(app.gpa).toFixed(2)}</span></>}
                        </div>
                      </div>
                      <span className="aa-badge" style={{background:st.bg,color:st.fg}}>
                        <span className="aa-st-dot" style={{background:st.dot}}/>{st.label}
                      </span>
                    </div>
                    <div className="aa-club-row">
                      <span className="aa-club-badge" style={{background:cat.bg,color:cat.fg}}>{cat.icon} {app.club.name}</span>
                    </div>
                    <p className="aa-motivation">{app.motivation}</p>
                  </div>
                  <div className="aa-row-actions">
                    <span className="aa-date">{relDate(app.createdAt)}</span>
                    <button className="aa-review-btn" onClick={()=>{setReviewApp(app);setFeedback("")}}>Review →</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Review Modal */}
        {reviewApp && (()=>{
          const cat = CAT_META[reviewApp.club.category]??CAT_META.OTHER
          const st  = APP_META[reviewApp.status]??APP_META.PENDING
          const heroGrad = `linear-gradient(135deg,${cat.color},oklch(0.38 0.18 265))`
          return (
            <div className="aa-backdrop" onClick={()=>setReviewApp(null)}>
              <div className="aa-modal" onClick={(e)=>e.stopPropagation()}>
                <div className="aa-modal-top" style={{background:heroGrad}}/>
                <div className="aa-modal-hdr">
                  <div style={{display:"flex",alignItems:"center",gap:".75rem",flex:1,minWidth:0}}>
                    <div style={{width:"2.2rem",height:"2.2rem",borderRadius:".65rem",background:heroGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>{cat.icon}</div>
                    <div style={{minWidth:0}}>
                      <div className="aa-modal-title">{reviewApp.user.fullName}</div>
                      <div style={{fontSize:".75rem",color:"var(--muted-foreground)",marginTop:".1rem"}}>{reviewApp.club.name}</div>
                    </div>
                  </div>
                  <span className="aa-badge" style={{background:st.bg,color:st.fg,flexShrink:0}}>
                    <span className="aa-st-dot" style={{background:st.dot}}/>{st.label}
                  </span>
                  <button className="aa-modal-close" onClick={()=>setReviewApp(null)}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div className="aa-modal-body">
                  {/* Academic info */}
                  <div className="aa-detail-grid">
                    {[
                      {label:"Student ID",value:reviewApp.user.studentId},
                      {label:"Faculty",value:reviewApp.user.faculty.replace("Faculty of ","")},
                      {label:"Email",value:reviewApp.user.email},
                      {label:"Year",value:reviewApp.currentYear?`Year ${reviewApp.currentYear}`:"—"},
                      {label:"Semester",value:reviewApp.currentSemester?`Sem ${reviewApp.currentSemester}`:"—"},
                      {label:"GPA",value:reviewApp.gpa?Number(reviewApp.gpa).toFixed(2):"—"},
                    ].map((item)=>(
                      <div key={item.label} className="aa-detail-item">
                        <div className="aa-detail-label">{item.label}</div>
                        <div className={item.value==="—"?"aa-detail-empty":"aa-detail-value"}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Motivation */}
                  <div>
                    <div className="aa-section-title">Motivation</div>
                    <p className="aa-body-text">{reviewApp.motivation}</p>
                  </div>
                  {reviewApp.contribution&&<div><div className="aa-section-title">Contribution</div><p className="aa-body-text">{reviewApp.contribution}</p></div>}
                  {reviewApp.experience&&<div><div className="aa-section-title">Experience</div><p className="aa-body-text">{reviewApp.experience}</p></div>}
                  {reviewApp.availableDays&&<div><div className="aa-section-title">Available Days</div><p className="aa-body-text">{reviewApp.availableDays}</p></div>}

                  {/* Feedback */}
                  <div className="aa-fb-field">
                    <label className="aa-fb-lbl">Feedback <span style={{fontWeight:400,opacity:.6,textTransform:"none"}}>(optional — sent to applicant)</span></label>
                    <textarea className="aa-fb-ta" rows={3} placeholder="Write feedback for the applicant…" value={feedback} onChange={(e)=>setFeedback(e.target.value)}/>
                  </div>

                  {/* Actions */}
                  {saving ? (
                    <div className="aa-saving-msg">Processing…</div>
                  ) : (
                    <div className="aa-action-grid">
                      {[
                        {key:"APPROVED",emoji:"✅",label:"Approve",sub:"Add as member",cls:"approve"},
                        {key:"REJECTED",emoji:"❌",label:"Reject",sub:"Decline application",cls:"reject"},
                        {key:"WAITLISTED",emoji:"⏳",label:"Waitlist",sub:"Keep for later",cls:"waitlist"},
                      ].map((a)=>(
                        <button key={a.key}
                          className={`aa-action-card ${a.cls}${reviewApp.status===a.key?" disabled":""}`}
                          onClick={()=>reviewApp.status!==a.key&&review(a.key)}
                          disabled={reviewApp.status===a.key}>
                          <div className="aa-action-emoji">{a.emoji}</div>
                          <div className="aa-action-label">{a.label}</div>
                          <div className="aa-action-sub">{reviewApp.status===a.key?"Current status":a.sub}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </>
  )
}
