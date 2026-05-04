import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { HelpCircle, LogOut } from 'lucide-react'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import { primaryNav, secondaryNav, type NavItem } from './navigation-config'
import { ThemeToggle } from './ThemeToggle'

const SIDEBAR_COLLAPSED_W = 60
const SIDEBAR_EXPANDED_W = 240
const TRANSITION = { duration: 0.2, ease: 'easeInOut' } as const

const DesktopNavItem = ({ item, open }: { item: NavItem; open: boolean }) => {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'size-5 shrink-0 transition-colors',
              isActive && item.accentClass ? item.accentClass : ''
            )}
          />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.12 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {item.name}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  )
}

export const Sidebar = ({ userName }: { userName?: string }) => {
  const [open, setOpen] = useState(false)

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
    : ''

  return (
    <motion.nav
      className="hidden md:flex md:flex-col h-full shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar"
      animate={{ width: open ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W }}
      transition={TRANSITION}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-3.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <span className="text-xs font-bold">FL</span>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.12 }}
              className="overflow-hidden"
            >
              <p className="whitespace-nowrap text-sm font-semibold leading-tight text-sidebar-foreground">
                First Love
              </p>
              <p className="whitespace-nowrap text-xs text-sidebar-foreground/60">
                Servants Portal
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Primary nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {primaryNav.map((item) => (
          <DesktopNavItem key={item.to} item={item} open={open} />
        ))}

        <div className="my-2 h-px bg-sidebar-border" />

        {secondaryNav.map((item) => (
          <DesktopNavItem key={item.to} item={item} open={open} />
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-sidebar-border px-2 py-3">
        {userName && (
          <div className="mb-2 flex items-center gap-2 overflow-hidden px-0.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-sidebar-foreground">
              {initials}
            </div>
            <AnimatePresence>
              {open && (
                <motion.p
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.12 }}
                  className="overflow-hidden whitespace-nowrap text-sm font-medium text-sidebar-foreground"
                >
                  {userName}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className={cn('flex items-center gap-0.5', !open && 'flex-col')}>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Help"
            title="Help"
            className="size-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <HelpCircle className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            className="size-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </motion.nav>
  )
}

// keep a dummy export so any stale imports of SidebarRail don't blow up
export const _UNUSED = null
