import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import { useContext, useState } from 'react'
import { useNavigate } from 'react-router'
import PullToRefresh from 'components/base-component/PullToRefresh'
import {
  AlertOctagon,
  AlertTriangle,
  BusFront,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Megaphone,
  Users,
  UsersRound,
} from 'lucide-react'
import { cn } from 'components/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Button } from 'components/ui/button'
import { Card } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import {
  LiveRow,
  SectionLabel,
  StatusTile,
  useVisibilityAwarePolling,
} from '../components/live-feed'
import { STREAM_BY_COUNCIL_ARRIVALS } from './churchBySubchurchQueries'
import { HigherChurchWithArrivals } from '../arrivals-types'
import useSetUserChurch from 'hooks/useSetUserChurch'

const StreamByCouncil = () => {
  const { clickCard, streamId, arrivalDate } = useContext(ChurchContext)
  const navigate = useNavigate()
  const { setUserChurch } = useSetUserChurch()
  const today = new Date().toISOString().slice(0, 10)
  const effectiveDate = arrivalDate || today

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const {
    data,
    previousData,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery(STREAM_BY_COUNCIL_ARRIVALS, {
    variables: { id: streamId, arrivalDate: effectiveDate },
    fetchPolicy: 'cache-and-network',
  })

  useVisibilityAwarePolling({
    startPolling,
    stopPolling,
    refetch,
    interval: SHORT_POLL_INTERVAL,
  })

  const stream = data?.streams[0]

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper
        data={data}
        loading={loading}
        error={error}
        placeholder={!!previousData}
      >
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6">
            {/* Page heading */}
            <div className="mb-5 pr-14 md:pr-0">
              {loading && !stream ? (
                <Skeleton className="h-9 w-72" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {stream?.name}{' '}
                  <span className="text-arrivals">Arrivals by Council</span>
                </h1>
              )}
            </div>

            {/* Council list — 1 col on mobile, 2 col on lg */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
              {stream?.councils?.map((council: HigherChurchWithArrivals) => {
                const isExpanded = expandedIds.has(council.id)
                const initials = `${council.leader?.firstName?.[0] ?? ''}${council.leader?.lastName?.[0] ?? ''}`
                const leaderName =
                  council.leader?.nameWithTitle ||
                  [council.leader?.firstName, council.leader?.lastName]
                    .filter(Boolean)
                    .join(' ')

                return (
                  <div
                    key={council.id}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    {/* Collapse toggle — compact row */}
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${council.name} Council`}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      onClick={() => toggle(council.id)}
                    >
                      <Avatar className="size-9 shrink-0">
                        <AvatarImage
                          src={council.leader?.pictureUrl}
                          alt={leaderName}
                        />
                        <AvatarFallback className="bg-arrivals/10 text-xs font-semibold text-arrivals">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {council.name} Council
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {leaderName}
                        </p>
                      </div>

                      {/* At-a-glance: no-activity · on-way · arrived */}
                      <div className="flex shrink-0 items-center gap-2.5 text-xs font-bold tabular-nums">
                        <span className="text-defaulters" title="No Activity">
                          {council.bacentasNoActivityCount ?? 0}
                        </span>
                        <span className="text-arrivals" title="On The Way">
                          {council.bacentasOnTheWayCount ?? 0}
                        </span>
                        <span className="text-success" title="Have Arrived">
                          {council.bacentasHaveArrivedCount ?? 0}
                        </span>
                      </div>

                      <ChevronDown
                        className={cn(
                          'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Expandable detail */}
                    {isExpanded && (
                      <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
                        {/* Bacenta Status */}
                        <div className="space-y-2">
                          <SectionLabel>Bacenta Status</SectionLabel>
                          <div className="grid grid-cols-3 gap-2">
                            <StatusTile
                              label="Active"
                              value={council.activeBacentaCount}
                              icon={UsersRound}
                              tone="members"
                            />
                            <StatusTile
                              label="No Activity"
                              value={council.bacentasNoActivityCount}
                              icon={AlertOctagon}
                              tone="defaulters"
                            />
                            <StatusTile
                              label="Mobilising"
                              value={council.bacentasMobilisingCount}
                              icon={Megaphone}
                              tone="warning"
                            />
                            <StatusTile
                              label="On The Way"
                              value={council.bacentasOnTheWayCount}
                              icon={BusFront}
                              tone="arrivals"
                            />
                            <StatusTile
                              label="Didn't Bus"
                              value={council.bacentasBelow8Count}
                              icon={AlertTriangle}
                              tone="destructive"
                            />
                            <StatusTile
                              label="Have Arrived"
                              value={council.bacentasHaveArrivedCount}
                              icon={CheckCircle2}
                              tone="success"
                            />
                          </div>
                        </div>

                        {/* Live Arrivals */}
                        <div className="space-y-2">
                          <SectionLabel>Live Arrivals</SectionLabel>
                          <Card className="overflow-hidden">
                            <div className="divide-y divide-border">
                              <LiveRow
                                label="Members On The Way"
                                value={council.bussingMembersOnTheWayCount}
                                icon={UsersRound}
                                tone="warning"
                              />
                              <LiveRow
                                label="Members Arrived"
                                value={council.bussingMembersHaveArrivedCount}
                                icon={Users}
                                tone="success"
                              />
                              <LiveRow
                                label="Buses Arrived"
                                value={council.bussesThatArrivedCount}
                                icon={BusFront}
                                tone="success"
                              />
                            </div>
                          </Card>
                        </div>

                        {/* Navigate CTA */}
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              clickCard(council)
                              setUserChurch(council)
                              navigate('/arrivals/council')
                            }}
                          >
                            View Council
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Loading skeletons */}
              {!stream &&
                [1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
            </div>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StreamByCouncil
