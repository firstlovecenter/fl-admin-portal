import { useQuery } from '@apollo/client'
import { useContext, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertOctagon,
  AlertTriangle,
  BusFront,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Megaphone,
  Users,
  UsersRound,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Card } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import { SHORT_POLL_INTERVAL, getFirstLetterInEveryWord } from 'global-utils'
import useSetUserChurch from 'hooks/useSetUserChurch'

import {
  LiveDot,
  LiveRow,
  POLL_SECONDS,
  SectionLabel,
  StatusTile,
  useUpdatedAt,
  useVisibilityAwarePolling,
  type StatusTone,
} from '../components/live-feed'
import { COUNCIL_BY_GOVERNORSHIP_ARRIVALS } from './churchBySubchurchQueries'
import { HigherChurchWithArrivals } from '../arrivals-types'

type StatusKey =
  | 'no-activity'
  | 'mobilising'
  | 'on-the-way'
  | 'didnt-bus'
  | 'arrived'

type StatusTileSpec = {
  key: StatusKey
  label: string
  icon: React.ComponentType<{ className?: string }>
  tone: StatusTone
  read: (g: HigherChurchWithArrivals) => number | undefined
}

const statusTiles: StatusTileSpec[] = [
  {
    key: 'no-activity',
    label: 'No Activity',
    icon: AlertOctagon,
    tone: 'defaulters',
    read: (g) => g.bacentasNoActivityCount,
  },
  {
    key: 'mobilising',
    label: 'Mobilising',
    icon: Megaphone,
    tone: 'warning',
    read: (g) => g.bacentasMobilisingCount,
  },
  {
    key: 'on-the-way',
    label: 'On The Way',
    icon: BusFront,
    tone: 'arrivals',
    read: (g) => g.bacentasOnTheWayCount,
  },
  {
    key: 'didnt-bus',
    label: "Didn't Bus",
    icon: AlertTriangle,
    tone: 'destructive',
    read: (g) => g.bacentasBelow8Count,
  },
  {
    key: 'arrived',
    label: 'Have Arrived',
    icon: CheckCircle2,
    tone: 'success',
    read: (g) => g.bacentasHaveArrivedCount,
  },
]

const sumBy = (
  list: HigherChurchWithArrivals[],
  pick: (g: HigherChurchWithArrivals) => number | undefined
) => list.reduce((total, g) => total + (pick(g) ?? 0), 0)

const CouncilByGovernorship = () => {
  const { clickCard, councilId, arrivalDate } = useContext(ChurchContext)
  const navigate = useNavigate()
  const { setUserChurch } = useSetUserChurch()
  const today = new Date().toISOString().slice(0, 10)
  const effectiveDate = arrivalDate || today

  const {
    data,
    previousData,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery(COUNCIL_BY_GOVERNORSHIP_ARRIVALS, {
    variables: { id: councilId, arrivalDate: effectiveDate },
    fetchPolicy: 'cache-and-network',
  })

  useVisibilityAwarePolling({
    startPolling,
    stopPolling,
    refetch,
    interval: SHORT_POLL_INTERVAL,
  })

  const council = data?.councils?.[0]
  const updatedLabel = useUpdatedAt(data)
  const governorships: HigherChurchWithArrivals[] = useMemo(
    () => council?.governorships ?? [],
    [council]
  )

  const totals = useMemo(
    () => ({
      onTheWay: sumBy(governorships, (g) => g.bussingMembersOnTheWayCount),
      arrived: sumBy(governorships, (g) => g.bussingMembersHaveArrivedCount),
      buses: sumBy(governorships, (g) => g.bussesThatArrivedCount),
    }),
    [governorships]
  )

  const drillIn = (governorship: HigherChurchWithArrivals) => {
    clickCard(governorship)
    setUserChurch(governorship)
    navigate('/arrivals/governorship')
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper
        data={data}
        loading={loading}
        error={error}
        placeholder={!!previousData}
      >
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            {/* ── Page header ── */}
            <div className="mb-6 space-y-1.5 lg:mb-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <LiveDot />
                <span>Governorships</span>
              </div>
              {loading && !council ? (
                <Skeleton className="h-9 w-72" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {council?.name}{' '}
                  <span className="text-arrivals">Arrivals</span>
                </h1>
              )}
              <p className="text-sm text-muted-foreground">
                Tap a governorship to drill in · refreshes every {POLL_SECONDS}s
              </p>
            </div>

            {/* ── 2-column grid ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
              {/* LEFT — governorship cards */}
              <div className="space-y-4">
                {!loading && governorships.length === 0 && (
                  <Card className="p-6 text-center text-sm text-muted-foreground">
                    No governorships found under this council.
                  </Card>
                )}

                {governorships.map((governorship) => (
                  <GovernorshipCard
                    key={governorship.id}
                    governorship={governorship}
                    onDrillIn={() => drillIn(governorship)}
                  />
                ))}

                {(loading || !data) &&
                  governorships.length === 0 &&
                  [0, 1, 2].map((i) => <GovernorshipCardSkeleton key={i} />)}
              </div>

              {/* RIGHT (desktop) / TOP (mobile) — council-wide live totals */}
              <aside className="order-first space-y-6 lg:order-none lg:sticky lg:top-6">
                <div className="space-y-3">
                  <SectionLabel>Council Live Totals</SectionLabel>
                  <Card className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <LiveDot />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Realtime
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        Updated {updatedLabel}
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      <LiveRow
                        label="Members On The Way"
                        value={totals.onTheWay}
                        icon={UsersRound}
                        tone="warning"
                        loading={loading && !council}
                      />
                      <LiveRow
                        label="Members Arrived"
                        value={totals.arrived}
                        icon={Users}
                        tone="success"
                        loading={loading && !council}
                      />
                      <LiveRow
                        label="Buses Arrived"
                        value={totals.buses}
                        icon={BusFront}
                        tone="success"
                        loading={loading && !council}
                      />
                    </div>
                  </Card>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

type GovernorshipCardProps = {
  governorship: HigherChurchWithArrivals
  onDrillIn: () => void
}

const GovernorshipCard = ({
  governorship,
  onDrillIn,
}: GovernorshipCardProps) => {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev
      // When expanding on mobile, scroll the card into view so the freshly
      // revealed body isn't pushed below the fold. `nearest` keeps it stable
      // when the card is already visible.
      if (next) {
        requestAnimationFrame(() => {
          cardRef.current?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          })
        })
      }
      return next
    })
  }

  const leader = governorship.leader
  const initials = leader
    ? `${leader.firstName?.[0] ?? ''}${leader.lastName?.[0] ?? ''}`
    : ''
  const leaderName = leader
    ? leader.nameWithTitle ||
      `${leader.firstName ?? ''} ${getFirstLetterInEveryWord(
        leader.middleName
      )} ${leader.lastName ?? ''}`.trim()
    : null

  const headerInner = (
    <>
      {leader && (
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={leader.pictureUrl} alt="" />
          <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-base font-semibold text-foreground">
          {governorship.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {leaderName ?? 'No leader assigned'}
        </p>
      </div>
    </>
  )

  return (
    <Card ref={cardRef} className="overflow-hidden">
      {/* Mobile header — taps toggle expand/collapse */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="group flex w-full items-center gap-3 border-b border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${
          governorship.name
        } details`}
      >
        {headerInner}
        {expanded ? (
          <ChevronUp className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Desktop header — taps drill into the governorship page */}
      <button
        type="button"
        onClick={onDrillIn}
        className="group hidden w-full items-center gap-3 border-b border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:flex"
        aria-label={`Open ${governorship.name} governorship`}
      >
        {headerInner}
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Mobile summary row — visible only when collapsed */}
      {!expanded && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-sm lg:hidden">
          <SummaryStat
            icon={UsersRound}
            tone="warning"
            value={governorship.bussingMembersOnTheWayCount}
            label="on way"
          />
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <SummaryStat
            icon={Users}
            tone="success"
            value={governorship.bussingMembersHaveArrivedCount}
            label="arrived"
          />
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <SummaryStat
            icon={BusFront}
            tone="success"
            value={governorship.bussesThatArrivedCount}
            label="buses"
          />
        </div>
      )}

      {/* Body — always visible on desktop, only when expanded on mobile */}
      <div className={expanded ? '' : 'hidden lg:block'}>
        {/* Bacenta status tiles */}
        <div className="space-y-3 p-4">
          <SectionLabel>Bacentas</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {statusTiles.map((tile) => (
              <StatusTile
                key={tile.key}
                label={tile.label}
                value={tile.read(governorship)}
                icon={tile.icon}
                tone={tile.tone}
              />
            ))}
          </div>
        </div>

        {/* Members + buses live rows */}
        <div className="border-t border-border">
          <div className="px-4 pt-3">
            <SectionLabel>Members &amp; Buses</SectionLabel>
          </div>
          <div className="divide-y divide-border">
            <LiveRow
              label="Members On The Way"
              value={governorship.bussingMembersOnTheWayCount}
              icon={UsersRound}
              tone="warning"
            />
            <LiveRow
              label="Members Arrived"
              value={governorship.bussingMembersHaveArrivedCount}
              icon={Users}
              tone="success"
            />
            <LiveRow
              label="Buses Arrived"
              value={governorship.bussesThatArrivedCount}
              icon={BusFront}
              tone="success"
            />
          </div>
        </div>
      </div>

      {/* Mobile drill-in CTA — visible only when expanded */}
      {expanded && (
        <button
          type="button"
          onClick={onDrillIn}
          className="flex w-full items-center justify-between border-t border-border bg-muted/40 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
          aria-label={`Open ${governorship.name} governorship page`}
        >
          <span>Open Governorship</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      )}
    </Card>
  )
}

type SummaryStatProps = {
  icon: React.ComponentType<{ className?: string }>
  tone: 'warning' | 'success'
  value?: number
  label: string
}

const summaryToneClasses: Record<SummaryStatProps['tone'], string> = {
  warning: 'text-warning',
  success: 'text-success',
}

const SummaryStat = ({
  icon: Icon,
  tone,
  value,
  label,
}: SummaryStatProps) => (
  <div className="flex items-center gap-1.5">
    <Icon className={`size-4 ${summaryToneClasses[tone]}`} />
    <span className="font-semibold tabular-nums text-foreground">
      {value ?? '—'}
    </span>
    <span className="text-muted-foreground">{label}</span>
  </div>
)

const GovernorshipCardSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="size-5 rounded" />
    </div>
    <div className="space-y-3 p-4">
      <Skeleton className="h-3 w-16" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
    <div className="border-t border-border">
      <div className="px-4 pt-3">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-7 w-10" />
          </div>
        ))}
      </div>
    </div>
  </Card>
)

export default CouncilByGovernorship
