import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { CornerSlideTable } from './CornerSlideTable'
import { useRealtime } from '@/hooks/useRealtime'

/**
 * AppLayout — Root layout shell for RAILBLOCK AI
 *
 * Structure:
 * ┌──────────┬────────────────────────────┐
 * │          │  Header                    │
 * │ Sidebar  ├────────────────────────────┤
 * │ (Drawer  │  <Outlet /> (page content) │
 * │ on mob)  │  <CornerSlideTable />      │
 * └──────────┴────────────────────────────┘
 */
export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const wsUrl = import.meta.env.VITE_WS_URL || ''
  useRealtime(wsUrl)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar navigation (supports desktop pinned and mobile/tablet slide-over drawer) */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <div className="bg-red-600 text-white text-center text-[10px] font-bold py-0.5 uppercase tracking-widest z-50">
          [ RAILBLOCK AI - SIH 2026 DEMO MODE - ALL DATA IS SIMULATED / SYNTHETIC ]
        </div>
        <Header onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 relative">
          <Outlet />
        </main>
      </div>

      {/* Corner Slide In/Out Operational Table */}
      <CornerSlideTable />
    </div>
  )
}
