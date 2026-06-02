import { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronDown, LogOut, Moon, Search, Sun } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from 'components/ui/sheet'
import { cn } from 'components/lib/utils'
import SynagoLogo from 'components/SynagoLogo'
import { primaryNav, secondaryNav, type NavItem } from './navigation-config'
import { useAuth as useAuthContext } from 'contexts/AuthContext'
import useAuth from 'auth/useAuth'
import { MemberContext } from 'contexts/MemberContext'
import { hasOnlyRolesFrom } from 'permission-utils'
import { useTheme } from './ThemeProvider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'
import { ChurchRoleScopePicker } from './ChurchRoleScopePicker'
import { ChurchScopeNavItem } from './ChurchScopeNavItem'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
}

const MobileNavItem = ({
  item,
  onClose,
}: {
  item: NavItem
  onClose: () => void
}) => {
  const Icon = item.icon
  return (
    <motion.div variants={itemVariants}>
      <NavLink
        to={item.to}
        end={item.to === '/'}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors',
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
                'size-4 shrink-0',
                isActive && item.accentClass ? item.accentClass : ''
              )}
            />
            {item.name}
          </>
        )}
      </NavLink>
    </motion.div>
  )
}

interface MobileNavProps {
  open: boolean
  onClose: () => void
  userName?: string
  userImageUrl?: string
  onOpenSearch?: () => void
}

export const MobileNav = ({
  open,
  onClose,
  userName,
  userImageUrl,
  onOpenSearch,
}: MobileNavProps) => {
  const { logout } = useAuthContext()
  const { isAuthorised } = useAuth()
  const { currentUser } = useContext(MemberContext)
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === 'dark'
  const accountName = userName?.trim() || 'Account'
  const initials = accountName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
  const userRoles = currentUser?.roles

  // Filter upstream rather than wrapping each item in <RoleView>: hidden
  // <RoleView> children would still occupy slots in the staggerChildren
  // index below, leaving visible gaps.
  const visibilityFor = (item: NavItem) => {
    if (item.hideForRoles && hasOnlyRolesFrom(userRoles, item.hideForRoles))
      return false
    if (item.roles && !isAuthorised(item.roles)) return false
    if (item.additionalRoles && !isAuthorised(item.additionalRoles))
      return false
    return true
  }
  const visiblePrimary = primaryNav.filter(visibilityFor)
  const visibleSecondary = secondaryNav.filter(visibilityFor)

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="flex w-72 flex-col border-r border-sidebar-border bg-sidebar p-0"
      >
        <SheetHeader className="flex h-14 flex-row items-center gap-3 border-b border-sidebar-border px-4 space-y-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <SynagoLogo className="h-4 w-4" />
          </div>
          <SheetTitle className="text-sm font-semibold text-sidebar-foreground leading-tight">
            Synago
            <span className="block text-xs font-normal text-sidebar-foreground/60">
              FLC Servants Portal
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Stagger relies on Radix Sheet unmounting content when closed.
            If forceMount is ever added to SheetPortal/SheetContent, add
            key={String(open)} here to guarantee remount on each open. */}
        <motion.nav
          className="flex flex-1 flex-col gap-px overflow-y-auto px-2 py-2"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {onOpenSearch && (
            <motion.button
              type="button"
              variants={itemVariants}
              onClick={() => {
                onClose()
                onOpenSearch()
              }}
              aria-label="Open search"
              className="mb-1.5 flex h-9 items-center gap-2.5 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
            >
              <Search className="size-4 shrink-0" />
              Search
            </motion.button>
          )}

          {visiblePrimary.map((item) => (
            <MobileNavItem key={item.to} item={item} onClose={onClose} />
          ))}
          <motion.div
            variants={itemVariants}
            className="my-1.5 h-px bg-sidebar-border"
          />
          <motion.div variants={itemVariants}>
            <ChurchRoleScopePicker />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ChurchScopeNavItem variant="mobile" onNavigate={onClose} />
          </motion.div>
          {visibleSecondary.map((item) => (
            <MobileNavItem key={item.to} item={item} onClose={onClose} />
          ))}
        </motion.nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left hover:bg-sidebar-accent/70"
                aria-label="Open profile menu"
              >
                <Avatar className="size-8 shrink-0 border border-sidebar-border/60">
                  {userImageUrl ? (
                    <AvatarImage src={userImageUrl} alt={accountName} />
                  ) : null}
                  <AvatarFallback className="bg-sidebar-accent text-xs font-semibold text-sidebar-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs text-sidebar-foreground/60">
                    Signed in as
                  </p>
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {accountName}
                  </p>
                </div>
                <ChevronDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
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
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  logout()
                  onClose()
                }}
              >
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SheetContent>
    </Sheet>
  )
}
