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
import { CAMPUS_BY_STREAM_ARRIVALS } from './churchBySubchurchQueries'
import { HigherChurchWithArrivals } from '../arrivals-types'
import useSetUserChurch from 'hooks/useSetUserChurch'

const CampusByStream = () => {
  const { clickCard, campusId, arrivalDate } = useContext(ChurchContext)
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
  } = useQuery(CAMPUS_BY_STREAM_ARRIVALS, {
    variables: { id: campusId, arrivalDate: effectiveDate },
    fetchPolicy: 'cache-and-network',
  })

  useVisibilityAwarePolling({
    startPolling,
    stopPolling,
    refetch,
    interval: SHORT_POLL_INTERVAL,
  })

  const campus = data?.campuses[0]

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
              {loading && !campus ? (
                <Skeleton className="h-9 w-72" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {campus?.name}{' '}
                  <span className="text-arrivals">Arrivals by Stream</span>
                </h1>
              )}
            </div>

            {/* Stream list — 1 col on mobile, 2 col on lg */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
              {campus?.streams?.map((stream: HigherChurchWithArrivals) => {
                const isExpanded = expandedIds.has(stream.id)
                const initials = `${stream.leader?.firstName?.[0] ?? ''}${stream.leader?.lastName?.[0] ?? ''}`
                const leaderName =
                  stream.leader?.nameWithTitle ||
                  [stream.leader?.firstName, stream.leader?.lastName]
                    .filter(Boolean)
                    .join(' ')

                return (
                  <div
                    key={stream.id}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    {/* Collapse toggle — compact row */}
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${stream.name} Stream`}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      onClick={() => toggle(stream.id)}
                    >
                      <Avatar className="size-9 shrink-0">
                        <AvatarImage
                          src={stream.leader?.pictureUrl}
                          alt={leaderName}
                        />
                        <AvatarFallback className="bg-arrivals/10 text-xs font-semibold text-arrivals">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {stream.name} Stream
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {leaderName}
                        </p>
                      </div>

                      {/* At-a-glance: no-activity · on-way · arrived */}
                      <div className="flex shrink-0 items-center gap-2.5 text-xs font-bold tabular-nums">
                        <span className="text-defaulters" title="No Activity">
                          {stream.bacentasNoActivityCount ?? 0}
                        </span>
                        <span className="text-arrivals" title="On The Way">
                          {stream.bacentasOnTheWayCount ?? 0}
                        </span>
                        <span className="text-success" title="Have Arrived">
                          {stream.bacentasHaveArrivedCount ?? 0}
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
                              value={stream.activeBacentaCount}
                              icon={UsersRound}
                              tone="members"
                            />
                            <StatusTile
                              label="No Activity"
                              value={stream.bacentasNoActivityCount}
                              icon={AlertOctagon}
                              tone="defaulters"
                            />
                            <StatusTile
                              label="Mobilising"
                              value={stream.bacentasMobilisingCount}
                              icon={Megaphone}
                              tone="warning"
                            />
                            <StatusTile
                              label="On The Way"
                              value={stream.bacentasOnTheWayCount}
                              icon={BusFront}
                              tone="arrivals"
                            />
                            <StatusTile
                              label="Didn't Bus"
                              value={stream.bacentasBelow8Count}
                              icon={AlertTriangle}
                              tone="destructive"
                            />
                            <StatusTile
                              label="Have Arrived"
                              value={stream.bacentasHaveArrivedCount}
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
                                value={stream.bussingMembersOnTheWayCount}
                                icon={UsersRound}
                                tone="warning"
                              />
                              <LiveRow
                                label="Members Arrived"
                                value={stream.bussingMembersHaveArrivedCount}
                                icon={Users}
                                tone="success"
                              />
                              <LiveRow
                                label="Buses Arrived"
                                value={stream.bussesThatArrivedCount}
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
                              clickCard(stream)
                              setUserChurch(stream)
                              navigate('/arrivals/stream')
                            }}
                          >
                            View Stream
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Loading skeletons */}
              {!campus &&
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

export default CampusByStream
