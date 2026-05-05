import { useContext, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Building2,
  ChevronDown,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from 'lucide-react'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import { primaryNav, secondaryNav, type NavItem } from './navigation-config'
import { useAuth } from 'contexts/AuthContext'
import { useTheme } from './ThemeProvider'
import { ChurchRoleScopePicker } from './ChurchRoleScopePicker'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { ChurchContext } from 'contexts/ChurchContext'

const SIDEBAR_COLLAPSED_W = 60
const SIDEBAR_EXPANDED_W = 240
const SIDEBAR_TOGGLE_GUTTER_W = 28
const TRANSITION = { duration: 0.2, ease: 'easeInOut' } as const

const formatChurchType = (t: string) => t.replace(/([a-z])([A-Z])/g, '$1 $2')

// Only church types that have a /displaydetails route registered in directoryRoutes.ts
const DISPLAYDETAILS_CHURCH_TYPES = new Set([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'Denomination',
  'Hub',
  'HubCouncil',
  'Ministry',
  'CreativeArts',
])

const ChurchScopeNavItem = ({ open }: { open: boolean }) => {
  const { selectedScope } = useChurchRoleScope()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clickCard } = useContext(ChurchContext) as any
  const navigate = useNavigate()

  if (!selectedScope || !DISPLAYDETAILS_CHURCH_TYPES.has(selectedScope.churchType))
    return null

  const typeLabel = formatChurchType(selectedScope.churchType)

  const handleClick = () => {
    clickCard({
      id: selectedScope.churchId,
      name: selectedScope.churchName,
      __typename: selectedScope.churchType,
    })
    navigate(`/${selectedScope.churchType.toLowerCase()}/displaydetails`)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`View ${selectedScope.churchName} ${typeLabel} details`}
        title={`${selectedScope.churchName} ${typeLabel}`}
        className={cn(
          'flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors',
          'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground active:scale-[0.98]'
        )}
      >
        <Building2 className="size-5 shrink-0 text-churches" />
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.12 }}
              className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden"
            >
              <span className="truncate whitespace-nowrap font-medium">
                {selectedScope.churchName}
              </span>
              <span className="shrink-0 whitespace-nowrap rounded bg-sidebar-accent px-1 py-px text-[10px] text-sidebar-foreground/55">
                {typeLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </>
  )
}

const DesktopNavItem = ({ item, open }: { item: NavItem; open: boolean }) => {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      aria-label={item.name}
      title={item.name}
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

export const Sidebar = ({
  userName,
  userImageUrl,
}: {
  userName?: string
  userImageUrl?: string
}) => {
  const [open, setOpen] = useState(true)
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === 'dark'
  const accountName = userName?.trim() || 'Account'

  const initials = accountName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')

  return (
    <motion.div
      className="relative hidden h-full shrink-0 md:block"
      animate={{
        width:
          (open ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W) +
          SIDEBAR_TOGGLE_GUTTER_W,
      }}
      transition={TRANSITION}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-controls="desktop-sidebar-nav"
        aria-expanded={open}
        title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        onClick={() => setOpen((v) => !v)}
        className="absolute right-0 top-2 z-30 size-11 rounded-full border border-sidebar-border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground"
      >
        {open ? (
          <PanelLeftClose className="size-4" />
        ) : (
          <PanelLeftOpen className="size-4" />
        )}
      </Button>

      <motion.nav
        id="desktop-sidebar-nav"
        className="absolute inset-y-0 left-0 hidden border-r border-sidebar-border bg-sidebar md:flex md:flex-col overflow-y-hidden overflow-x-visible"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: open ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W }}
        transition={{
          width: TRANSITION,
          x: { duration: 0.35, ease: 'easeOut' },
          opacity: { duration: 0.35, ease: 'easeOut' as const },
        }}
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

          {open && <ChurchRoleScopePicker />}

          <ChurchScopeNavItem open={open} />

          {secondaryNav.map((item) => (
            <DesktopNavItem key={item.to} item={item} open={open} />
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border px-2 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mb-2 flex w-full items-center gap-2 overflow-hidden rounded-md px-1.5 py-1 text-left hover:bg-sidebar-accent/70"
                aria-label="Open profile menu"
              >
                <Avatar className="size-7 shrink-0 border border-sidebar-border/60">
                  {userImageUrl ? (
                    <AvatarImage src={userImageUrl} alt={accountName} />
                  ) : null}
                  <AvatarFallback className="bg-sidebar-accent text-[11px] font-semibold text-sidebar-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {open && (
                    <motion.p
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.12 }}
                      className="overflow-hidden whitespace-nowrap text-sm font-medium text-sidebar-foreground"
                    >
                      {accountName}
                    </motion.p>
                  )}
                </AnimatePresence>
                {open && (
                  <ChevronDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/60" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align={open ? 'start' : 'end'}
              className="w-56"
            >
              <DropdownMenuLabel className="truncate">
                {accountName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={toggleTheme}>
                {isDarkMode ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                {isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={logout}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.nav>
    </motion.div>
  )
}

// keep a dummy export so any stale imports of SidebarRail don't blow up
export const _UNUSED = null
