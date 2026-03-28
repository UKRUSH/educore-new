"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback, useMemo } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────
type Student = {
  id: number; fullName: string; studentId: string
  faculty: string; degree: string; intakeYear: number; photoUrl: string | null
  bestGpa: number
  latestSem: { gpa: number | null; semesterNum: number; academicYear: string } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(n: string) { return n.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() }
function gpaColor(gpa: number) {
  if (gpa >= 3.9) return { fg: "oklch(0.42 0.22 150)", bg: "oklch(0.93 0.07 145)", border: "oklch(0.82 0.12 145)" }
  if (gpa >= 3.7) return { fg: "oklch(0.45 0.2 260)",  bg: "oklch(0.93 0.05 258)", border: "oklch(0.82 0.1 258)"  }
  return             { fg: "oklch(0.48 0.18 55)",  bg: "oklch(0.95 0.07 60)",  border: "oklch(0.85 0.1 60)"   }
}
function gpaLabel(gpa: number) {
  if (gpa >= 3.9) return "Distinction"
  if (gpa >= 3.7) return "High Honours"
  return "Honours"
}


// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;}
.dl-root{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem;}

/* Hero */
.dl-hero{border-radius:1.25rem;overflow:hidden;position:relative;
  background:linear-gradient(135deg,oklch(0.28 0.12 55) 0%,oklch(0.38 0.18 50) 40%,oklch(0.32 0.15 260) 100%);
  padding:1.75rem 2rem;}
.dl-hero::before{content:'';position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);
  background-size:28px 28px;}
.dl-hero-glow-a{position:absolute;top:-80px;right:-60px;width:300px;height:300px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,oklch(0.75 0.22 60 / .35) 0%,transparent 70%);}
.dl-hero-glow-b{position:absolute;bottom:-60px;left:-40px;width:220px;height:220px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,oklch(0.5 0.2 260 / .25) 0%,transparent 70%);}
.dl-hero-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;}
.dl-hero-tag{display:inline-flex;align-items:center;gap:.4rem;padding:.26rem .8rem;border-radius:999px;margin-bottom:.7rem;
  background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);
  font-size:.7rem;font-weight:700;letter-spacing:.07em;color:rgba(255,255,255,.9);text-transform:uppercase;}
.dl-hero-star{font-size:.75rem;animation:dlSpin 4s linear infinite;}
@keyframes dlSpin{to{transform:rotate(360deg)}}
.dl-hero-title{font-size:1.6rem;font-weight:900;color:#fff;letter-spacing:-.04em;margin:0 0 .3rem;line-height:1.15;}
.dl-hero-sub{font-size:.85rem;color:rgba(255,255,255,.65);}
.dl-hero-stats{display:flex;gap:.6rem;flex-wrap:wrap;}
.dl-hero-stat{display:flex;flex-direction:column;align-items:center;padding:.7rem 1.1rem;
  border-radius:.85rem;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);
  min-width:5.5rem;text-align:center;backdrop-filter:blur(8px);}
.dl-hero-stat-val{font-size:1.35rem;font-weight:900;color:#fff;line-height:1;}
.dl-hero-stat-lbl{font-size:.6rem;font-weight:700;color:rgba(255,255,255,.65);margin-top:.22rem;text-transform:uppercase;letter-spacing:.05em;}

/* Toolbar */
.dl-toolbar{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;}
.dl-search-wrap{flex:1;min-width:200px;position:relative;}
.dl-search-icon{position:absolute;left:.85rem;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--muted-foreground);}
.dl-search-icon svg{width:14px;height:14px;}
.dl-search{width:100%;padding:.62rem .85rem .62rem 2.4rem;border:1.5px solid var(--border);border-radius:.75rem;
  background:var(--background);color:var(--foreground);font-size:.875rem;outline:none;transition:border-color .2s,box-shadow .2s;}
.dl-search:focus{border-color:oklch(0.62 0.2 55);box-shadow:0 0 0 3px oklch(0.62 0.2 55 / .12);}
.dl-search::placeholder{color:var(--muted-foreground);}
.dl-thresholds{display:flex;gap:.35rem;flex-wrap:wrap;}
.dl-thresh-btn{padding:.42rem .9rem;border-radius:999px;font-size:.75rem;font-weight:700;
  border:1.5px solid var(--border);background:var(--background);color:var(--muted-foreground);
  cursor:pointer;transition:all .18s;}
.dl-thresh-btn:hover{border-color:oklch(0.62 0.2 55 / .5);color:var(--foreground);}
.dl-thresh-btn.active{background:linear-gradient(135deg,oklch(0.58 0.22 55),oklch(0.68 0.2 65));border-color:transparent;color:#fff;box-shadow:0 2px 10px oklch(0.6 0.2 55 / .35);}

/* Stats strip */
.dl-strip{display:flex;gap:.8rem;flex-wrap:wrap;}
.dl-chip{display:inline-flex;align-items:center;gap:.38rem;padding:.28rem .75rem;border-radius:999px;
  background:var(--muted);border:1px solid var(--border);font-size:.73rem;font-weight:600;color:var(--muted-foreground);}
.dl-chip-dot{width:5px;height:5px;border-radius:50%;background:currentColor;}
.dl-chip.gold{background:oklch(0.95 0.07 60 / .5);border-color:oklch(0.85 0.1 60);color:oklch(0.48 0.2 55);}
.dl-chip.blue{background:oklch(0.93 0.05 258 / .5);border-color:oklch(0.82 0.1 258);color:oklch(0.42 0.18 260);}
.dl-chip.green{background:oklch(0.93 0.06 145 / .5);border-color:oklch(0.82 0.1 145);color:oklch(0.38 0.18 145);}

/* Grid */
.dl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;}
@media(max-width:900px){.dl-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.dl-grid{grid-template-columns:1fr;}}
.dl-skel{background:var(--muted);border-radius:1rem;animation:dlSkel 1.4s ease-in-out infinite;}
@keyframes dlSkel{0%,100%{opacity:1}50%{opacity:.4}}
.dl-empty{text-align:center;padding:4rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:.55rem;}
.dl-empty-icon{width:4.5rem;height:4.5rem;border-radius:1.2rem;background:var(--muted);display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:.3rem;}
.dl-empty-title{font-size:1rem;font-weight:700;color:var(--foreground);}
.dl-empty-sub{font-size:.875rem;color:var(--muted-foreground);}

/* Card */
.dl-card{
  background:var(--card);border:1px solid var(--border);border-radius:1rem;
  padding:1.1rem 1.2rem;display:flex;flex-direction:column;gap:.85rem;
  transition:box-shadow .18s,transform .18s;
}
.dl-card:hover{box-shadow:0 6px 22px rgba(0,0,0,.07);transform:translateY(-2px);}
.dl-card-top{display:flex;align-items:center;gap:.85rem;}
.dl-avatar{width:2.75rem;height:2.75rem;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,oklch(0.52 0.2 260),oklch(0.42 0.22 265));
  display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:900;color:#fff;overflow:hidden;}
.dl-avatar img{width:100%;height:100%;object-fit:cover;}
.dl-info{flex:1;min-width:0;}
.dl-name{font-size:.88rem;font-weight:800;color:var(--foreground);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dl-id{font-size:.69rem;color:var(--muted-foreground);font-weight:600;font-family:monospace;margin-top:.1rem;}
.dl-faculty{font-size:.7rem;color:var(--muted-foreground);margin-top:.12rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dl-divider{height:1px;background:var(--border);}
.dl-card-foot{display:flex;align-items:center;justify-content:space-between;gap:.5rem;}
.dl-gpa-block{display:flex;align-items:baseline;gap:.3rem;}
.dl-gpa-val{font-size:1.4rem;font-weight:900;letter-spacing:-.03em;line-height:1;}
.dl-gpa-max{font-size:.72rem;color:var(--muted-foreground);font-weight:600;}
.dl-honour-pill{display:inline-flex;align-items:center;gap:.28rem;padding:.22rem .65rem;
  border-radius:999px;font-size:.68rem;font-weight:700;border:1px solid;}
.dl-sem-info{font-size:.69rem;color:var(--muted-foreground);margin-top:.25rem;}
`

// ── Component ─────────────────────────────────────────────────────────────────
const THRESHOLDS = [
  { val: 3.5, label: "3.5+ GPA" },
  { val: 3.7, label: "3.7+ GPA" },
  { val: 3.9, label: "3.9+ GPA" },
]

export default function AdminDeanListPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading]   = useState(true)
  const [threshold, setThreshold] = useState(3.5)
  const [search, setSearch]     = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/dean-list?threshold=${threshold}`)
    if (res.ok) setStudents(await res.json())
    setLoading(false)
  }, [threshold])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() =>
    !search ? students : students.filter((s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.faculty.toLowerCase().includes(search.toLowerCase())
    ),
    [students, search]
  )

  const avgGpa  = students.length ? (students.reduce((s,u)=>s+u.bestGpa,0)/students.length).toFixed(2) : "—"
  const dist    = students.filter(s=>s.bestGpa>=3.9).length
  const honours = students.filter(s=>s.bestGpa>=3.7&&s.bestGpa<3.9).length

  return (
    <>
      <style>{CSS}</style>
      <div className="dl-root">

        {/* Hero */}
        <div className="dl-hero">
          <div className="dl-hero-glow-a"/>
          <div className="dl-hero-glow-b"/>
          <div className="dl-hero-inner">
            <div>
              <div className="dl-hero-tag">
                <span className="dl-hero-star">★</span> Academic Excellence
              </div>
              <h1 className="dl-hero-title">Dean&apos;s List</h1>
              <p className="dl-hero-sub">High-achieving students recognised for outstanding academic performance</p>
            </div>
            <div className="dl-hero-stats">
              {[
                {val: students.length, lbl: "Students"},
                {val: dist,            lbl: "Distinction"},
                {val: honours,         lbl: "High Honours"},
                {val: avgGpa,          lbl: "Avg GPA"},
              ].map((s)=>(
                <div key={s.lbl} className="dl-hero-stat">
                  <div className="dl-hero-stat-val">{s.val}</div>
                  <div className="dl-hero-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="dl-toolbar">
          <div className="dl-search-wrap">
            <span className="dl-search-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
            <input className="dl-search" placeholder="Search by name, student ID or faculty…" value={search} onChange={(e)=>setSearch(e.target.value)}/>
          </div>
          <div className="dl-thresholds">
            {THRESHOLDS.map((t)=>(
              <button key={t.val} className={`dl-thresh-btn${threshold===t.val?" active":""}`} onClick={()=>setThreshold(t.val)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="dl-strip">
          <span className="dl-chip"><span className="dl-chip-dot"/>{filtered.length} student{filtered.length!==1?"s":""} on dean&apos;s list</span>
          {dist>0&&<span className="dl-chip green"><span className="dl-chip-dot"/>🥇 {dist} Distinction (3.9+)</span>}
          {honours>0&&<span className="dl-chip blue"><span className="dl-chip-dot"/>🏅 {honours} High Honours (3.7+)</span>}
          {students.length-dist-honours>0&&<span className="dl-chip gold"><span className="dl-chip-dot"/>⭐ {students.length-dist-honours} Honours (3.5+)</span>}
        </div>

        {/* List */}
        {loading ? (
          <div className="dl-grid">{[...Array(6)].map((_,i)=><div key={i} className="dl-skel" style={{height:"8rem"}}/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="dl-empty">
            <div className="dl-empty-icon">★</div>
            <div className="dl-empty-title">No students found</div>
            <div className="dl-empty-sub">{search ? "Try a different search." : "No students meet this GPA threshold."}</div>
          </div>
        ) : (
          <div className="dl-grid">
            {filtered.map((s) => {
              const gc = gpaColor(s.bestGpa)
              return (
                <div key={s.id} className="dl-card">
                  {/* Top row: avatar + info */}
                  <div className="dl-card-top">
                    <div className="dl-avatar" style={{background:`linear-gradient(135deg,${gc.fg},oklch(0.38 0.18 265))`}}>
                      {s.photoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={s.photoUrl} alt={s.fullName}/>
                        : initials(s.fullName)
                      }
                    </div>
                    <div className="dl-info">
                      <div className="dl-name">{s.fullName}</div>
                      <div className="dl-id">{s.studentId}</div>
                      <div className="dl-faculty">{s.faculty.replace("Faculty of ","")}</div>
                    </div>
                  </div>

                  <div className="dl-divider"/>

                  {/* Bottom row: GPA + honour + semester */}
                  <div>
                    <div className="dl-card-foot">
                      <div className="dl-gpa-block">
                        <span className="dl-gpa-val" style={{color: gc.fg}}>{s.bestGpa.toFixed(2)}</span>
                        <span className="dl-gpa-max">/ 4.00</span>
                      </div>
                      <span className="dl-honour-pill" style={{background: gc.bg, color: gc.fg, borderColor: gc.border}}>
                        {s.bestGpa>=3.9?"🥇":s.bestGpa>=3.7?"🏅":"⭐"} {gpaLabel(s.bestGpa)}
                      </span>
                    </div>
                    {s.latestSem && (
                      <div className="dl-sem-info">
                        Sem {s.latestSem.semesterNum} · {s.latestSem.academicYear} · Intake {s.intakeYear}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </>
  )
}
