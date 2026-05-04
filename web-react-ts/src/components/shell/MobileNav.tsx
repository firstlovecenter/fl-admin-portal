import { NavLink } from 'react-router-dom'
import { ChevronDown, LogOut, Moon, Sun } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from 'components/ui/sheet'
import { cn } from 'components/lib/utils'
import { primaryNav, secondaryNav, type NavItem } from './navigation-config'
import { useAuth } from 'contexts/AuthContext'
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
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'

const MobileNavItem = ({
  item,
  onClose,
}: {
  item: NavItem
  onClose: () => void
}) => {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
        )
      }
    >
      <Icon className={cn('size-5 shrink-0')} />
      {item.name}
    </NavLink>
  )
}

interface MobileNavProps {
  open: boolean
  onClose: () => void
  userName?: string
  userImageUrl?: string
}

export const MobileNav = ({
  open,
  onClose,
  userName,
  userImageUrl,
}: MobileNavProps) => {
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
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="flex w-72 flex-col border-r border-sidebar-border bg-sidebar p-0"
      >
        <SheetHeader className="flex h-14 flex-row items-center gap-3 border-b border-sidebar-border px-4 space-y-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <span className="text-xs font-bold">FL</span>
          </div>
          <SheetTitle className="text-sm font-semibold text-sidebar-foreground leading-tight">
            First Love
            <span className="block text-xs font-normal text-sidebar-foreground/60">
              Servants Portal
            </span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4 pb-4">
          {primaryNav.map((item) => (
            <MobileNavItem key={item.to} item={item} onClose={onClose} />
          ))}
          <div className="my-2 h-px bg-sidebar-border" />
          {secondaryNav.map((item) => (
            <MobileNavItem key={item.to} item={item} onClose={onClose} />
          ))}

          <div className="my-2 h-px bg-sidebar-border" />
          <ChurchRoleScopePicker />
        </nav>

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
                  <p className="text-xs text-sidebar-foreground/60">Signed in as</p>
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {accountName}
                  </p>
                </div>
                <ChevronDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="truncate">{accountName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={toggleTheme}>
                {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
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
