export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [user, semesters, clubCount, sportCount, sessionCount, recentMaterials, pendingApps] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { fullName: true, faculty: true, degree: true, intakeYear: true, photoUrl: true },
      }),
      prisma.semester.findMany({
        where: { userId: session.userId },
        orderBy: { semesterNum: "desc" },
        take: 1,
        select: { gpa: true, semesterNum: true },
      }),
      prisma.studentClub.count({ where: { userId: session.userId, isActive: true } }),
      prisma.sportAchievement.count({ where: { userId: session.userId } }),
      prisma.sessionApplication.count({ where: { userId: session.userId, status: "APPROVED" } }),
      prisma.studyMaterial.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, title: true, courseCode: true, type: true, isSummarized: true, createdAt: true },
      }),
      prisma.clubApplication.findMany({
        where: { userId: session.userId, status: "PENDING" },
        take: 3,
        include: { club: { select: { name: true } } },
      }),
    ])

  if (!user) redirect("/login")

  const latestGpa = semesters[0]?.gpa ?? null
  const initials = user.fullName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const greetEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙"

  const TYPE_COLOR: Record<string, { bg: string; text: string; border: string; label: string }> = {
    PDF:        { bg: "oklch(0.95 0.03 25)",   text: "oklch(0.50 0.18 25)",   border: "oklch(0.85 0.06 25)",   label: "PDF"  },
    SLIDE:      { bg: "oklch(0.94 0.04 264)",  text: "oklch(0.45 0.18 264)",  border: "oklch(0.82 0.08 264)",  label: "PPT"  },
    NOTE:       { bg: "oklch(0.94 0.04 145)",  text: "oklch(0.40 0.18 145)",  border: "oklch(0.82 0.08 145)",  label: "NOTE" },
    ASSIGNMENT: { bg: "oklch(0.94 0.04 65)",   text: "oklch(0.50 0.18 65)",   border: "oklch(0.82 0.08 65)",   label: "ASGN" },
  }

  const stats = [
    {
      label: "Current GPA", value: latestGpa !== null ? latestGpa.toFixed(2) : "—",
      sub: semesters[0] ? `Semester ${semesters[0].semesterNum}` : "No records yet",
      icon: "📊", from: "oklch(0.4882 0.2172 264.3763)", to: "oklch(0.6231 0.1880 259.8145)",
      progress: latestGpa ? (latestGpa / 4) * 100 : 0,
      href: "/profile/academics",
    },
    {
      label: "Clubs Joined", value: String(clubCount),
      sub: "Active memberships",
      icon: "🎯", from: "oklch(0.40 0.18 150)", to: "oklch(0.55 0.20 145)",
      progress: Math.min(clubCount * 20, 100),
      href: "/clubs",
    },
    {
      label: "Sport Awards", value: String(sportCount),
      sub: "Total achievements",
      icon: "🏆", from: "oklch(0.55 0.20 55)", to: "oklch(0.72 0.18 65)",
      progress: Math.min(sportCount * 25, 100),
      href: "/profile/sports",
    },
    {
      label: "Sessions", value: String(sessionCount),
      sub: "Sessions attended",
      icon: "🤝", from: "oklch(0.45 0.20 300)", to: "oklch(0.62 0.20 320)",
      progress: Math.min(sessionCount * 10, 100),
      href: "/support/mentors",
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ════════════════════════════════
          WELCOME HERO
      ════════════════════════════════ */}
      <div style={{
        position: "relative", overflow: "hidden", borderRadius: "1.5rem",
        background: "linear-gradient(135deg, oklch(0.2046 0.10 268) 0%, oklch(0.3244 0.1809 265.6377) 40%, oklch(0.4882 0.2172 264.3763) 100%)",
        padding: "2rem 2.5rem",
        boxShadow: "0 20px 60px oklch(0.3244 0.1809 265.6377 / .35)",
      }}>
        {/* grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
        }} />
        {/* top-right glow */}
        <div style={{
          position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, oklch(0.6231 0.1880 259.8145 / .3) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* bottom-left glow */}
        <div style={{
          position: "absolute", bottom: -80, left: -40, width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, oklch(0.45 0.22 280 / .25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* decorative circles */}
        <div style={{
          position: "absolute", top: "50%", right: 180, transform: "translateY(-50%)",
          width: 120, height: 120, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,.07)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "50%", right: 140, transform: "translateY(-50%)",
          width: 200, height: 200, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,.04)", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: 76, height: 76, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
            background: "linear-gradient(135deg, oklch(0.6231 0.1880 259.8145), oklch(0.4882 0.2172 264.3763))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", fontWeight: 900, color: "#fff",
            border: "3px solid rgba(255,255,255,.3)",
            boxShadow: "0 8px 28px rgba(0,0,0,.3), 0 0 0 6px rgba(255,255,255,.06)",
          }}>
            {user.photoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.photoUrl} alt={user.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".25rem" }}>
              <span style={{ fontSize: ".72rem", fontWeight: 700, color: "rgba(255,255,255,.6)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                {greeting}
              </span>
              <span style={{ fontSize: "1rem" }}>{greetEmoji}</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.35rem,2.8vw,1.9rem)", fontWeight: 900, color: "#fff", letterSpacing: "-.04em", lineHeight: 1.1, marginBottom: ".4rem" }}>
              {user.fullName}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
              <span style={{
                fontSize: ".72rem", fontWeight: 600, color: "rgba(255,255,255,.9)",
                background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
                borderRadius: "999px", padding: ".2rem .65rem", backdropFilter: "blur(8px)",
              }}>{user.faculty}</span>
              <span style={{ color: "rgba(255,255,255,.3)", fontSize: ".8rem" }}>·</span>
              <span style={{ fontSize: ".72rem", color: "rgba(255,255,255,.65)" }}>{user.degree}</span>
              <span style={{ color: "rgba(255,255,255,.3)", fontSize: ".8rem" }}>·</span>
              <span style={{ fontSize: ".72rem", color: "rgba(255,255,255,.65)" }}>Intake {user.intakeYear}</span>
            </div>
          </div>

          {/* Right — GPA + actions */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".75rem", flexShrink: 0 }}>
            {latestGpa !== null && (
              <div style={{
                background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)",
                borderRadius: "1rem", padding: ".75rem 1.25rem", textAlign: "center",
                backdropFilter: "blur(16px)",
                boxShadow: "0 4px 20px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.15)",
              }}>
                <div style={{ fontSize: ".58rem", fontWeight: 700, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".2rem" }}>Latest GPA</div>
                <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#fff", letterSpacing: "-.05em", lineHeight: 1 }}>{latestGpa.toFixed(2)}</div>
                <div style={{ fontSize: ".58rem", color: "rgba(255,255,255,.45)", marginTop: ".15rem" }}>/ 4.00 · Sem {semesters[0]?.semesterNum}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: ".5rem" }}>
              <Link href="/profile" style={{
                display: "inline-flex", alignItems: "center", gap: ".4rem",
                fontSize: ".78rem", fontWeight: 700, color: "#fff",
                background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)",
                borderRadius: "999px", padding: ".38rem 1rem", textDecoration: "none",
                backdropFilter: "blur(8px)",
              }}>
                My Profile →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          STAT CARDS
      ════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        {stats.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--card,#fff)",
              border: "1px solid var(--border,#e5e7eb)",
              borderRadius: "1.1rem",
              padding: "1.25rem 1.25rem 1rem",
              position: "relative", overflow: "hidden",
              transition: "all .2s",
              cursor: "pointer",
            }}
              className="hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* top gradient bar */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${s.from}, ${s.to})`,
              }} />
              {/* background glow */}
              <div style={{
                position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%",
                background: `radial-gradient(circle, ${s.to} 0%, transparent 70%)`,
                opacity: .08, pointerEvents: "none",
              }} />

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: ".6rem" }}>
                <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--muted-foreground,#888)", textTransform: "uppercase", letterSpacing: ".07em" }}>{s.label}</p>
                <div style={{
                  width: 36, height: 36, borderRadius: ".7rem", flexShrink: 0,
                  background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", boxShadow: `0 4px 12px ${s.from}40`,
                }}>{s.icon}</div>
              </div>

              <p style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-.05em", color: "var(--foreground,#090909)", lineHeight: 1, marginBottom: ".3rem" }}>{s.value}</p>
              <p style={{ fontSize: ".7rem", color: "var(--muted-foreground,#999)", marginBottom: ".75rem" }}>{s.sub}</p>

              {/* progress bar */}
              <div style={{ height: 4, background: "var(--border,#f0f0f0)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "2px",
                  background: `linear-gradient(90deg, ${s.from}, ${s.to})`,
                  width: `${s.progress}%`, transition: "width .6s ease",
                }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ════════════════════════════════
          MAIN GRID
      ════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>

        {/* ── Recent Materials (span 2) ── */}
        <div style={{
          gridColumn: "span 2",
          background: "var(--card,#fff)",
          border: "1px solid var(--border,#e5e7eb)",
          borderRadius: "1.1rem", overflow: "hidden",
        }}>
          {/* header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1.1rem 1.4rem",
            borderBottom: "1px solid var(--border,#e5e7eb)",
            background: "var(--background,#fafafa)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".65rem" }}>
              <div style={{
                width: 34, height: 34, borderRadius: ".65rem",
                background: "linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145))",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".9rem",
                boxShadow: "0 4px 10px oklch(0.4882 0.2172 264.3763 / .3)",
              }}>📚</div>
              <div>
                <h2 style={{ fontSize: ".92rem", fontWeight: 800, color: "var(--foreground,#090909)", margin: 0 }}>Recent Materials</h2>
                <p style={{ fontSize: ".7rem", color: "var(--muted-foreground,#999)", margin: 0 }}>Your latest uploaded documents</p>
              </div>
            </div>
            <Link href="/materials" style={{
              display: "inline-flex", alignItems: "center", gap: ".3rem",
              fontSize: ".75rem", fontWeight: 700, color: "oklch(0.4882 0.2172 264.3763)",
              textDecoration: "none", padding: ".35rem .8rem", borderRadius: "999px",
              background: "oklch(0.4882 0.2172 264.3763 / .08)",
              border: "1px solid oklch(0.4882 0.2172 264.3763 / .18)",
            }}>
              View all →
            </Link>
          </div>

          <div style={{ padding: "1rem 1.4rem", display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {recentMaterials.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", margin: "0 auto .875rem",
                  background: "oklch(0.4882 0.2172 264.3763 / .07)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem",
                }}>📂</div>
                <p style={{ fontSize: ".88rem", fontWeight: 600, color: "var(--foreground,#090909)", marginBottom: ".3rem" }}>No materials yet</p>
                <p style={{ fontSize: ".78rem", color: "var(--muted-foreground,#999)", marginBottom: ".875rem" }}>Upload your first study material to get started</p>
                <Link href="/materials/upload" style={{
                  display: "inline-flex", alignItems: "center", gap: ".4rem",
                  fontSize: ".8rem", fontWeight: 700, color: "#fff",
                  background: "linear-gradient(135deg, oklch(0.4882 0.2172 264.3763), oklch(0.6231 0.1880 259.8145))",
                  borderRadius: "999px", padding: ".45rem 1.1rem", textDecoration: "none",
                  boxShadow: "0 4px 12px oklch(0.4882 0.2172 264.3763 / .3)",
                }}>Upload material</Link>
              </div>
            ) : (
              recentMaterials.map((m) => {
                const tc = TYPE_COLOR[m.type] ?? TYPE_COLOR.PDF
                const date = new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                return (
                  <Link key={m.id} href={`/materials/${m.id}`} style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: ".875rem 1rem", borderRadius: ".85rem",
                    border: "1px solid var(--border,#e5e7eb)",
                    background: "var(--background,#fafafa)",
                    textDecoration: "none", transition: "all .18s",
                  }}
                    className="hover:border-blue-200 hover:shadow-md hover:-translate-y-px"
                  >
                    {/* type badge icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: ".75rem", flexShrink: 0,
                      background: tc.bg, border: `1px solid ${tc.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".58rem", fontWeight: 900, color: tc.text, letterSpacing: ".04em",
                    }}>
                      {tc.label}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: ".875rem", fontWeight: 700, color: "var(--foreground,#090909)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: ".15rem" }}>{m.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                        <span style={{ fontSize: ".7rem", color: "var(--muted-foreground,#999)", fontWeight: 500 }}>{m.courseCode}</span>
                        <span style={{ fontSize: ".65rem", color: "var(--muted-foreground,#ccc)" }}>·</span>
                        <span style={{ fontSize: ".7rem", color: "var(--muted-foreground,#bbb)" }}>{date}</span>
                      </div>
                    </div>
                    {m.isSummarized && (
                      <span style={{
                        fontSize: ".65rem", fontWeight: 800, padding: ".22rem .65rem", borderRadius: "999px",
                        background: "oklch(0.55 0.20 145 / .1)", color: "oklch(0.40 0.18 145)",
                        border: "1px solid oklch(0.55 0.20 145 / .25)", whiteSpace: "nowrap",
                      }}>✨ AI Summary</span>
                    )}
                    <div style={{
                      width: 28, height: 28, borderRadius: ".45rem", flexShrink: 0,
                      background: "oklch(0.4882 0.2172 264.3763 / .07)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "oklch(0.4882 0.2172 264.3763)" }}>
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Club Applications */}
          <div style={{
            background: "var(--card,#fff)",
            border: "1px solid var(--border,#e5e7eb)",
            borderRadius: "1.1rem", overflow: "hidden", flex: 1,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: ".9rem 1.2rem",
              borderBottom: "1px solid var(--border,#e5e7eb)",
              background: "var(--background,#fafafa)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".55rem" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: ".55rem",
                  background: "linear-gradient(135deg, oklch(0.40 0.18 150), oklch(0.55 0.20 145))",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem",
                  boxShadow: "0 3px 8px oklch(0.40 0.18 150 / .3)",
                }}>🎯</div>
                <h2 style={{ fontSize: ".85rem", fontWeight: 800, color: "var(--foreground,#090909)", margin: 0 }}>Applications</h2>
              </div>
              {pendingApps.length > 0 && (
                <span style={{
                  fontSize: ".6rem", fontWeight: 800, padding: ".18rem .5rem", borderRadius: "999px",
                  background: "oklch(0.72 0.17 65 / .12)", color: "oklch(0.50 0.20 60)",
                  border: "1px solid oklch(0.72 0.17 65 / .25)",
                }}>{pendingApps.length} pending</span>
              )}
            </div>

            <div style={{ padding: ".85rem 1.2rem", display: "flex", flexDirection: "column", gap: ".45rem" }}>
              {pendingApps.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: ".35rem" }}>✅</div>
                  <p style={{ fontSize: ".78rem", color: "var(--muted-foreground,#999)", fontWeight: 500 }}>No pending applications</p>
                </div>
              ) : (
                pendingApps.map((app) => (
                  <div key={app.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: ".6rem .8rem", borderRadius: ".65rem",
                    background: "var(--background,#fafafa)", border: "1px solid var(--border,#e5e7eb)",
                    gap: ".5rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".55rem", minWidth: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: ".45rem", flexShrink: 0,
                        background: "oklch(0.55 0.20 145 / .1)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem",
                      }}>🏅</div>
                      <span style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--foreground,#090909)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {app.club.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: ".6rem", fontWeight: 800, padding: ".18rem .5rem", borderRadius: "999px",
                      background: "oklch(0.72 0.17 65 / .1)", color: "oklch(0.50 0.20 60)",
                      border: "1px solid oklch(0.72 0.17 65 / .25)", whiteSpace: "nowrap", flexShrink: 0,
                    }}>⏳ Pending</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: "var(--card,#fff)",
            border: "1px solid var(--border,#e5e7eb)",
            borderRadius: "1.1rem", overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: ".55rem",
              padding: ".9rem 1.2rem",
              borderBottom: "1px solid var(--border,#e5e7eb)",
              background: "var(--background,#fafafa)",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: ".55rem",
                background: "linear-gradient(135deg, oklch(0.45 0.20 300), oklch(0.62 0.20 320))",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem",
                boxShadow: "0 3px 8px oklch(0.45 0.20 300 / .3)",
              }}>⚡</div>
              <h2 style={{ fontSize: ".85rem", fontWeight: 800, color: "var(--foreground,#090909)", margin: 0 }}>Quick Actions</h2>
            </div>

            <div style={{ padding: ".75rem 1rem", display: "flex", flexDirection: "column", gap: ".4rem" }}>
              {[
                { href: "/materials/upload", label: "Upload Material",  icon: "📤", from: "oklch(0.4882 0.2172 264.3763)", to: "oklch(0.6231 0.1880 259.8145)" },
                { href: "/support/sessions", label: "Browse Sessions",  icon: "🤝", from: "oklch(0.40 0.18 150)",          to: "oklch(0.55 0.20 145)"          },
                { href: "/clubs",            label: "Explore Clubs",    icon: "🎯", from: "oklch(0.55 0.20 55)",           to: "oklch(0.72 0.18 65)"           },
                { href: "/profile/academics",label: "Update Academics", icon: "📊", from: "oklch(0.45 0.20 300)",          to: "oklch(0.62 0.20 320)"          },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{
                  display: "flex", alignItems: "center", gap: ".7rem",
                  padding: ".6rem .75rem", borderRadius: ".75rem",
                  border: "1px solid transparent",
                  background: "transparent",
                  textDecoration: "none", transition: "all .18s",
                }}
                  className="hover:bg-gray-50 hover:border-gray-200"
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: ".6rem", flexShrink: 0,
                    background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: ".85rem", boxShadow: `0 3px 8px ${a.from}40`,
                  }}>{a.icon}</div>
                  <span style={{ flex: 1, fontSize: ".82rem", fontWeight: 600, color: "var(--foreground,#090909)" }}>{a.label}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted-foreground,#ccc)", flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
