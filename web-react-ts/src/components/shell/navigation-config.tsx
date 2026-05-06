import {
  Bot,
  Bus,
  ClipboardList,
  Home,
  type LucideIcon,
  Settings,
  TrendingUp,
  UserCheck,
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
    name: 'Trends',
    to: '/trends',
    icon: TrendingUp,
    accentClass: 'text-churches',
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
