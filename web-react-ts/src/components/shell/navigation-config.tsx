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
import {
  permitArrivalsHelpers,
  permitMe,
  permitShepherdingControl,
} from 'permission-utils'

export interface NavItem {
  name: string
  to: string
  icon: LucideIcon
  /** Tailwind classes for icon accent color in the active state */
  accentClass?: string
  /** When set, the item is only rendered if the user's roles intersect this list (or the list contains 'all'). */
  roles?: Role[]
  /**
   * When set, the user must ALSO have at least one of these roles in addition
   * to satisfying `roles`. Used to express AND across two independent role
   * dimensions (e.g. Accounts requires `fishers` AND a Council/Campus-level
   * role).
   */
  additionalRoles?: Role[]
  /**
   * Hide this item when the user's only operational role intersects this list.
   * Used to keep single-purpose roles (e.g. Stream Arrivals Counter) on a
   * focused chrome — unrelated surfaces add noise rather than utility.
   */
  hideForRoles?: Role[]
}

/** Primary nav (sidebar + bottom nav top slots) */
export const primaryNav: NavItem[] = [
  { name: 'Home', to: '/', icon: Home },
  {
    name: 'Members',
    to: '/directory/members',
    icon: UserCheck,
    accentClass: 'text-members',
    hideForRoles: permitArrivalsHelpers('Stream'),
  },
  {
    name: 'Services',
    to: '/services',
    icon: ClipboardList,
    accentClass: 'text-churches',
    hideForRoles: permitArrivalsHelpers('Stream'),
  },
  {
    name: 'Arrivals',
    to: '/arrivals',
    icon: Bus,
    accentClass: 'text-arrivals',
    roles: [
      ...permitMe('Bacenta').filter(
        (role) =>
          role !== 'leaderDenomination' &&
          role !== 'adminDenomination' &&
          role !== 'leaderOversight' &&
          role !== 'adminOversight'
      ),
      ...permitArrivalsHelpers('Stream'),
    ],
  },
  {
    name: 'Accounts',
    to: '/accounts',
    icon: Wallet,
    accentClass: 'text-banking',
    roles: ['fishers'],
    additionalRoles: [
      'leaderCouncil',
      'adminCouncil',
      'leaderCampus',
      'adminCampus',
    ],
    hideForRoles: permitArrivalsHelpers('Stream'),
  },
]

/** Secondary nav — Church in Focus section items (sidebar + mobile drawer) */
export const secondaryNav: NavItem[] = [
  {
    name: 'Reports',
    to: '/reports',
    icon: Download,
    accentClass: 'text-banking',
    hideForRoles: permitArrivalsHelpers('Stream'),
  },
  {
    name: 'Trends',
    to: '/trends',
    icon: TrendingUp,
    accentClass: 'text-churches',
    hideForRoles: permitArrivalsHelpers('Stream'),
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
    roles: permitShepherdingControl(),
  },
  {
    name: 'AI Assistant',
    to: '/ai-assistant',
    icon: Bot,
    hideForRoles: permitArrivalsHelpers('Stream'),
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: Settings,
  },
]
