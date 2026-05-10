import {
  Bot,
  Bus,
  ClipboardList,
  Download,
  Home,
  type LucideIcon,
  Map,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react'
import { Role } from 'global-types'
import { permitAdmin, permitMe } from 'permission-utils'

export interface NavItem {
  name: string
  to: string
  icon: LucideIcon
  /** Tailwind classes for icon accent color in the active state */
  accentClass?: string
  /** When set, the item is only rendered if the user's roles intersect this list (or the list contains 'all'). */
  roles?: Role[]
}

/** Primary nav (sidebar + bottom nav top slots) */
export const primaryNav: NavItem[] = [
  { name: 'Home', to: '/', icon: Home },
  {
    name: 'Members',
    to: '/directory/members',
    icon: UserCheck,
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

/** Secondary nav — Church in Focus section items (sidebar + mobile drawer) */
export const secondaryNav: NavItem[] = [
  {
    name: 'Reports',
    to: '/reports',
    icon: Download,
    accentClass: 'text-banking',
  },
  {
    name: 'Trends',
    to: '/trends',
    icon: TrendingUp,
    accentClass: 'text-churches',
  },
  {
    name: 'Maps',
    to: '/maps',
    icon: Map,
    accentClass: 'text-maps',
    roles: permitMe('Bacenta'),
  },
  {
    name: 'Shepherding Control',
    to: '/shepherding-control',
    icon: ShieldCheck,
    roles: permitAdmin('Bacenta'),
  },
  {
    name: 'AI Assistant',
    to: '/ai-assistant',
    icon: Bot,
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: Settings,
  },
]
