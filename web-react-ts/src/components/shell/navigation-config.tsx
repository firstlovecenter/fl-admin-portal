import {
  Bus,
  ClipboardList,
  Home,
  type LucideIcon,
  Map,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'

export interface NavItem {
  name: string
  to: string
  icon: LucideIcon
  /** Tailwind classes for icon accent color in the active state */
  accentClass?: string
}

/** Primary nav (sidebar + bottom nav top slots) */
export const primaryNav: NavItem[] = [
  { name: 'Home', to: '/', icon: Home },
  {
    name: 'Directory',
    to: '/directory',
    icon: Users,
    accentClass: 'text-members',
  },
  {
    name: 'Services',
    to: '/services',
    icon: ClipboardList,
    accentClass: 'text-churches',
  },
  {
    name: 'Arrivals',
    to: '/arrivals',
    icon: Bus,
    accentClass: 'text-arrivals',
  },
  {
    name: 'Accounts',
    to: '/accounts',
    icon: Wallet,
    accentClass: 'text-banking',
  },
]

/** Secondary nav (sidebar + mobile drawer only — not bottom bar) */
export const secondaryNav: NavItem[] = [
  {
    name: 'Members',
    to: '/directory/members',
    icon: UserCheck,
    accentClass: 'text-members',
  },
  { name: 'Maps', to: '/maps', icon: Map, accentClass: 'text-maps' },
]
