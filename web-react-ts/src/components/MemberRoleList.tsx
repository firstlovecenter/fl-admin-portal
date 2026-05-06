import { useState, useContext } from 'react'
import { useNavigate } from 'react-router'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberWithChurches } from 'global-types'
import { cn } from 'components/lib/utils'
import { ChevronRight, ChevronDown, Crown } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type ChurchShape = {
  id: string
  name: string
  stream_name?: string
  bacenta?: unknown
  hub?: unknown
  governorship?: unknown
  __typename: string
}

type RankEntry = {
  name: string
  stream_name?: string
  bacenta?: unknown
  hub?: unknown
  governorship?: unknown
  id: string
  admin?: boolean
  link: string
  __typename: string
}
type Rank = Record<string, RankEntry[]>

// ── Church level → accent config ─────────────────────────────────────────────

type ChurchConfig = {
  accent: string   // Tailwind text-* class for the role label
  dot: string      // Tailwind bg-* class for the coloured indicator dot
  nav: string      // in-app navigation path
}

// Fellowship omitted — not in roleTypes, so getRank never produces it here.
const CHURCH_CONFIG: Record<string, ChurchConfig> = {
  Bacenta:      { accent: 'text-members',    dot: 'bg-members',    nav: '/bacenta/displaydetails' },
  Governorship: { accent: 'text-arrivals',   dot: 'bg-arrivals',   nav: '/governorship/displaydetails' },
  Council:      { accent: 'text-churches',   dot: 'bg-churches',   nav: '/council/displaydetails' },
  Stream:       { accent: 'text-campaigns',  dot: 'bg-campaigns',  nav: '/stream/displaydetails' },
  Campus:       { accent: 'text-defaulters', dot: 'bg-defaulters', nav: '/campus/displaydetails' },
  Oversight:    { accent: 'text-banking',    dot: 'bg-banking',    nav: '/oversight/displaydetails' },
  CreativeArts: { accent: 'text-campaigns',  dot: 'bg-campaigns',  nav: '/creativearts/displaydetails' },
  Ministry:     { accent: 'text-maps',       dot: 'bg-maps',       nav: '/ministry/displaydetails' },
  Hub:          { accent: 'text-maps',       dot: 'bg-maps',       nav: '/hub/displaydetails' },
  HubCouncil:   { accent: 'text-maps',       dot: 'bg-maps',       nav: '/hubcouncil/displaydetails' },
}

const FALLBACK_CONFIG: ChurchConfig = {
  accent: 'text-muted-foreground',
  dot: 'bg-muted-foreground',
  nav: '/',
}

const VISIBLE_LIMIT = 3

// ── Rank utilities (logic unchanged) ─────────────────────────────────────────

const roleTypes = [
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
]

const adminTypes = [
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
]

// role must be the PascalCase role name, e.g. 'Governorship', not its lowercased form,
// so that member property lookups like `isAdminForCreativeArts` resolve correctly.
const updateRank = (
  member: MemberWithChurches,
  role: string,
  rank: Rank
): Rank => {
  const m = member as unknown as Record<string, any[]>

  m[`isAdminFor${role}`]?.map((church: ChurchShape) => {
    rank[`${church.__typename.toLowerCase()}Admin`].push({
      name: church.name,
      stream_name: church.stream_name,
      bacenta: church.bacenta,
      hub: church.hub,
      governorship: church.governorship,
      id: church.id,
      admin: true,
      link: '',
      __typename: church.__typename,
    })
    return null
  })

  m[`leads${role}`]?.map((church: ChurchShape) => {
    rank[`${church.__typename.toLowerCase()}Leader`].push({
      name: church.name,
      stream_name: church.stream_name,
      bacenta: church.bacenta,
      hub: church.hub,
      governorship: church.governorship,
      id: church.id,
      link: '',
      __typename: church.__typename,
    })
    return null
  })

  return rank
}

export const getRank = (
  memberLeader: MemberWithChurches,
  memberAdmin: MemberWithChurches
): Rank => {
  if (!memberLeader || !memberAdmin) return {}

  let rank: Rank = roleTypes.reduce((acc, role) => {
    acc[`${role.toLowerCase()}Leader`] = []
    acc[`${role.toLowerCase()}Admin`] = []
    return acc
  }, {} as Rank)

  const leader = memberLeader as unknown as Record<string, any[]>
  const admin = memberAdmin as unknown as Record<string, any[]>

  roleTypes.forEach((role) => {
    if (leader[`leads${role}`]?.[0]) {
      rank = updateRank(memberLeader, role, rank)
    }
    if (adminTypes.includes(role) && admin[`isAdminFor${role}`]?.[0]) {
      rank = updateRank(memberAdmin, role, rank)
    }
  })

  return rank
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
  const servant = place.admin ? 'Admin' : 'Leader'

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
          {place.__typename} {servant}
        </p>
        <p className="text-sm font-medium text-foreground truncate leading-snug">
          {place.name}
        </p>
      </div>
      {place.admin ? (
        <Crown aria-hidden="true" className="h-3.5 w-3.5 text-warning shrink-0" />
      ) : (
        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

const MemberRoleList = ({
  memberLeader,
  memberAdmin,
}: {
  memberLeader: MemberWithChurches
  memberAdmin: MemberWithChurches
}) => {
  const [expanded, setExpanded] = useState(false)

  if (!memberLeader || !memberAdmin) return null

  const rank = getRank(memberLeader, memberAdmin)
  const allRoles = Object.values(rank).flat()

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
            key={`${place.id}-${place.__typename}-${place.admin ? 'Admin' : 'Leader'}`}
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
