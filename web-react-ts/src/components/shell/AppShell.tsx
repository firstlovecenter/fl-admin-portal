import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
  title?: string
  subtitle?: string
  userName?: string
}

/**
 * Responsive shell:
 * - Desktop (md+): Aceternity-style hover sidebar (icon → full-width) + main content area
 * - Mobile (<md): hamburger → Sheet drawer + fixed bottom nav
 *
 * SidebarProvider / SidebarInset removed — they were adding CSS variable offsets
 * that caused layout jank. Simple `flex h-screen` is the ground truth now.
 */
export const AppShell = ({ children, userName }: AppShellProps) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hover to expand */}
      <Sidebar userName={userName} />

      {/* Content column */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-12 shrink-0 items-center border-b border-border bg-background px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile sheet nav */}
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        userName={userName}
      />

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
