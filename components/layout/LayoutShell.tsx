"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import AiBotWidget from "@/components/AiBotWidget"

export default function LayoutShell({
  role, name, photoUrl, isDeanList, children,
}: {
  role: string
  name: string
  photoUrl: string | null
  isDeanList: boolean
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on navigation
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [sidebarOpen])

  return (
    <>
      <style>{`
        .layout-root {
          display: flex;
          height: 100vh;
          background: var(--background);
          overflow: hidden;
        }
        .layout-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
          min-width: 0;
        }
        .layout-main {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }
        /* Mobile backdrop */
        .sb-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 40;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
          animation: sbFadeIn .2s ease;
        }
        @keyframes sbFadeIn { from { opacity: 0 } to { opacity: 1 } }
        .sb-backdrop.open { display: block; }

        @media (max-width: 768px) {
          .layout-main { padding: 1rem; }
        }
      `}</style>

      <div className="layout-root">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="sb-backdrop open" onClick={() => setSidebarOpen(false)} />
        )}

        <Sidebar
          role={role}
          name={name}
          photoUrl={photoUrl}
          isDeanList={isDeanList}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        <div className="layout-body">
          <Topbar
            name={name}
            photoUrl={photoUrl}
            onMenuToggle={() => setSidebarOpen((p) => !p)}
          />
          <main className="layout-main">{children}</main>
        </div>
      </div>

      {/* AI Chatbot — floating on all protected pages */}
      <AiBotWidget />
    </>
  )
}
