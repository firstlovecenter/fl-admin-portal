import { useState, type ReactNode } from 'react'
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { BackButton } from './BackButton'

interface AppShellProps {
  children: ReactNode
  title?: string
  subtitle?: string
  userName?: string
  userImageUrl?: string
}

/**
 * Responsive shell:
 * - Desktop (md+): Aceternity-style sidebar (open by default, manual toggle) + main content area
 * - Mobile (<md): floating PanelLeft toggle → Sheet drawer
 *
 * SidebarProvider / SidebarInset removed — they were adding CSS variable offsets
 * that caused layout jank. Simple `flex h-screen` is the ground truth now.
 */
export const AppShell = ({
  children,
  userName,
  userImageUrl,
}: AppShellProps) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden shrink-0 md:block">
        <Sidebar userName={userName} userImageUrl={userImageUrl} />
      </div>

      {/* Content column */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* PWA back button — only renders in standalone mode */}
        <BackButton className="absolute left-3 top-3 z-20 md:hidden" />

        {/* Floating mobile sidebar toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-full border border-sidebar-border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </button>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile sheet nav */}
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        userName={userName}
        userImageUrl={userImageUrl}
      />
    </div>
  )
}
