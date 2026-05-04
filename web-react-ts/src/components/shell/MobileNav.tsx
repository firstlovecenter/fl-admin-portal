import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from 'components/ui/sheet'
import { cn } from 'components/lib/utils'
import { primaryNav, secondaryNav, type NavItem } from './navigation-config'

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
      <Icon
        className={cn(
          'size-5 shrink-0',
        )}
      />
      {item.name}
    </NavLink>
  )
}

interface MobileNavProps {
  open: boolean
  onClose: () => void
  userName?: string
}

export const MobileNav = ({ open, onClose, userName }: MobileNavProps) => {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        className="w-72 p-0 bg-sidebar border-r border-sidebar-border"
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
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        <nav className="flex flex-col gap-0.5 px-3 py-4">
          {primaryNav.map((item) => (
            <MobileNavItem key={item.to} item={item} onClose={onClose} />
          ))}
          <div className="my-2 h-px bg-sidebar-border" />
          {secondaryNav.map((item) => (
            <MobileNavItem key={item.to} item={item} onClose={onClose} />
          ))}
        </nav>

        {userName && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border px-4 py-3">
            <p className="text-xs text-sidebar-foreground/60">Signed in as</p>
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
