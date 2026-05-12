import { useState, useContext } from 'react'
import { useNavigate } from 'react-router'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberWithChurches } from 'global-types'
import { cn } from 'components/lib/utils'
import {
  ChevronRight,
  ChevronDown,
  Crown,
  Banknote,
  Users,
  Wallet,
  ListChecks,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type RoleKind =
  | 'Leader'
  | 'Admin'
  | 'Arrivals Admin'
  | 'Arrivals Counter'
  | 'Arrivals Payer'
  | 'Teller'

type ChurchShape = {
  id: string
  name: string
  stream_name?: string
  __typename: string
}

export type RankEntry = {
  id: string
  name: string
  stream_name?: string
  __typename: string
  kind: RoleKind
  link: string
}

// ── Role descriptors ─────────────────────────────────────────────────────────
// Each descriptor maps a Member field returned by either query to the human-
// readable role kind it represents. `source: 'leader'` → DISPLAY_MEMBER_LEADERSHIP,
// `'admin'` → DISPLAY_MEMBER_ADMIN. Order here is the display order.

type RoleDescriptor = {
  field: string
  source: 'leader' | 'admin'
  kind: RoleKind
}

const ROLE_DESCRIPTORS: RoleDescriptor[] = [
  { field: 'leadsDenomination', source: 'leader', kind: 'Leader' },
  { field: 'leadsOversight', source: 'leader', kind: 'Leader' },
  { field: 'leadsCampus', source: 'leader', kind: 'Leader' },
  { field: 'leadsStream', source: 'leader', kind: 'Leader' },
  { field: 'leadsCouncil', source: 'leader', kind: 'Leader' },
  { field: 'leadsGovernorship', source: 'leader', kind: 'Leader' },
  { field: 'leadsBacenta', source: 'leader', kind: 'Leader' },

  { field: 'isAdminForDenomination', source: 'admin', kind: 'Admin' },
  { field: 'isAdminForOversight', source: 'admin', kind: 'Admin' },
  { field: 'isAdminForCampus', source: 'admin', kind: 'Admin' },
  { field: 'isAdminForStream', source: 'admin', kind: 'Admin' },
  { field: 'isAdminForCouncil', source: 'admin', kind: 'Admin' },
  { field: 'isAdminForGovernorship', source: 'admin', kind: 'Admin' },

  { field: 'isArrivalsAdminForCampus', source: 'leader', kind: 'Arrivals Admin' },
  { field: 'isArrivalsAdminForStream', source: 'leader', kind: 'Arrivals Admin' },
  { field: 'isArrivalsAdminForCouncil', source: 'leader', kind: 'Arrivals Admin' },
  { field: 'isArrivalsAdminForGovernorship', source: 'leader', kind: 'Arrivals Admin' },

  { field: 'isArrivalsCounterForStream', source: 'leader', kind: 'Arrivals Counter' },
  { field: 'isArrivalsPayerForCouncil', source: 'leader', kind: 'Arrivals Payer' },
  { field: 'isTellerForStream', source: 'leader', kind: 'Teller' },
]

// ── Church level → accent config ─────────────────────────────────────────────

type ChurchConfig = {
  accent: string   // Tailwind text-* class for the role label
  dot: string      // Tailwind bg-* class for the coloured indicator dot
  nav: string      // in-app navigation path
}

const CHURCH_CONFIG: Record<string, ChurchConfig> = {
  Bacenta:      { accent: 'text-members',    dot: 'bg-members',    nav: '/bacenta/displaydetails' },
  Governorship: { accent: 'text-arrivals',   dot: 'bg-arrivals',   nav: '/governorship/displaydetails' },
  Council:      { accent: 'text-churches',   dot: 'bg-churches',   nav: '/council/displaydetails' },
  Stream:       { accent: 'text-campaigns',  dot: 'bg-campaigns',  nav: '/stream/displaydetails' },
  Campus:       { accent: 'text-defaulters', dot: 'bg-defaulters', nav: '/campus/displaydetails' },
  Oversight:    { accent: 'text-banking',    dot: 'bg-banking',    nav: '/oversight/displaydetails' },
  Denomination: { accent: 'text-banking',    dot: 'bg-banking',    nav: '/denomination/displaydetails' },
}

const FALLBACK_CONFIG: ChurchConfig = {
  accent: 'text-muted-foreground',
  dot: 'bg-muted-foreground',
  nav: '/',
}

const VISIBLE_LIMIT = 3

// ── Public API ───────────────────────────────────────────────────────────────

export const getRank = (
  memberLeader: MemberWithChurches | undefined,
  memberAdmin: MemberWithChurches | undefined
): RankEntry[] => {
  if (!memberLeader && !memberAdmin) return []

  const entries: RankEntry[] = []
  const sources = {
    leader: memberLeader as unknown as Record<string, ChurchShape[] | undefined>,
    admin: memberAdmin as unknown as Record<string, ChurchShape[] | undefined>,
  }

  ROLE_DESCRIPTORS.forEach((desc) => {
    const churches = sources[desc.source]?.[desc.field]
    if (!churches?.length) return
    churches.forEach((church) => {
      entries.push({
        id: church.id,
        name: church.name,
        stream_name: church.stream_name,
        __typename: church.__typename,
        kind: desc.kind,
        link: '',
      })
    })
  })

  return entries
}

// ── Per-kind icon ────────────────────────────────────────────────────────────

const KIND_ICONS: Record<RoleKind, typeof Crown> = {
  Admin: Crown,
  Leader: ChevronRight,
  'Arrivals Admin': Users,
  'Arrivals Counter': ListChecks,
  'Arrivals Payer': Wallet,
  Teller: Banknote,
}

const KIND_ICON_TONE: Record<RoleKind, string> = {
  Admin: 'text-warning',
  Leader: 'text-muted-foreground',
  'Arrivals Admin': 'text-arrivals',
  'Arrivals Counter': 'text-arrivals',
  'Arrivals Payer': 'text-arrivals',
  Teller: 'text-banking',
}

// ── RoleButton ────────────────────────────────────────────────────────────────

const RoleButton = ({
  place,
  accent,
  dot,
  nav,
}: {
  place: RankEntry
  accent: string
  dot: string
  nav: string
}) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const Icon = KIND_ICONS[place.kind]
  const iconTone = KIND_ICON_TONE[place.kind]

  return (
    // NOTE: clickCard sets the church ID in context. Ancestor IDs for levels
    // above Bacenta may be stale — pre-existing limitation of the rank shape.
    <button
      type="button"
      onClick={() => {
        clickCard(place)
        navigate(nav)
      }}
      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left min-h-[44px]"
    >
      <span
        aria-hidden="true"
        className={cn('h-2 w-2 rounded-full shrink-0 mt-0.5', dot)}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-[10px] font-semibold uppercase tracking-wider leading-tight', accent)}>
          {place.__typename} {place.kind}
        </p>
        <p className="text-sm font-medium text-foreground truncate leading-snug">
          {place.name}
        </p>
      </div>
      <Icon aria-hidden="true" className={cn('h-3.5 w-3.5 shrink-0', iconTone)} />
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

const MemberRoleList = ({
  memberLeader,
  memberAdmin,
}: {
  memberLeader: MemberWithChurches | undefined
  memberAdmin: MemberWithChurches | undefined
}) => {
  const [expanded, setExpanded] = useState(false)

  const allRoles = getRank(memberLeader, memberAdmin)
  if (allRoles.length === 0) return null

  const visibleRoles = expanded ? allRoles : allRoles.slice(0, VISIBLE_LIMIT)
  const overflowCount = allRoles.length - VISIBLE_LIMIT
  const hasOverflow = allRoles.length > VISIBLE_LIMIT

  return (
    <div className="w-full flex flex-col gap-0.5">
      {visibleRoles.map((place) => {
        const { accent, dot, nav } =
          CHURCH_CONFIG[place.__typename] ?? FALLBACK_CONFIG
        return (
          <RoleButton
            key={`${place.id}-${place.__typename}-${place.kind}`}
            place={place}
            accent={accent}
            dot={dot}
            nav={nav}
          />
        )
      })}

      {hasOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left min-h-[44px]"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
          <span className="text-xs text-muted-foreground">
            {expanded ? 'Show less' : `${overflowCount} more role${overflowCount === 1 ? '' : 's'}`}
          </span>
        </button>
      )}
    </div>
  )
}

export default MemberRoleList
