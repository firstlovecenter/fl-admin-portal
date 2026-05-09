import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Compass,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import MemberDisplayCard from 'components/card/MemberDisplayCard'

import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'

import { ChurchContext } from 'contexts/ChurchContext'

import {
  GOVERNORSHIP_BACENTAS_BELOW_8,
  COUNCIL_BACENTAS_BELOW_8,
  CAMPUS_BACENTAS_BELOW_8,
  STREAM_BACENTAS_BELOW_8,
} from '../bussingStatusQueries'
import { SectionLabel } from '../components/live-feed'
import BacentaArrivalsCard from './BacentaArrivalsCard'
import { useArrivalsScopedQuery } from './useArrivalsScopedQuery'

const QUERIES_BY_LEVEL = {
  Governorship: GOVERNORSHIP_BACENTAS_BELOW_8,
  Council: COUNCIL_BACENTAS_BELOW_8,
  Stream: STREAM_BACENTAS_BELOW_8,
  Campus: CAMPUS_BACENTAS_BELOW_8,
}

const RowSkeleton = () => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
    <Skeleton className="size-12 shrink-0 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="size-9 shrink-0 rounded-md" />
  </div>
)

const CardSkeleton = () => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
    <Skeleton className="size-16 rounded-full" />
    <div className="flex w-full flex-col items-center gap-1.5">
      <Skeleton className="h-3.5 w-28 rounded" />
      <Skeleton className="h-3 w-20 rounded" />
    </div>
    <Skeleton className="h-9 w-full rounded-md" />
  </div>
)

const ListSkeleton = () => (
  <>
    <div className="md:hidden space-y-3">
      {[0, 1, 2].map((i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
    <div className="hidden md:grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </>
)

const BacentasBelow8 = () => {
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const {
    church,
    churchName,
    loading,
    error,
    refetch,
    isScopeSupported,
    hasScope,
  } = useArrivalsScopedQuery({ queriesByLevel: QUERIES_BY_LEVEL })

  const bacentas = church?.bacentasBelow8 ?? []
  const count = bacentas.length
  const isEmpty = !!church && !loading && count === 0

  const onBacentaClick = (bacenta: (typeof bacentas)[number]) => {
    clickCard(bacenta)
    clickCard(bacenta.bussingThisWeek)
    navigate('/bacenta/bussing-details')
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 mb-4 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <header className="mb-6 space-y-2 lg:mb-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-defaulters">
                <AlertTriangle className="size-3.5" />
                <span>Bacenta Status</span>
              </div>
              {loading && !church ? (
                <Skeleton className="h-9 w-72" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {church?.name ?? churchName ?? ''}{' '}
                  <span className="text-defaulters">Didn&apos;t Bus</span>
                </h1>
              )}
              <p className="text-sm text-muted-foreground">
                Bacentas that didn&apos;t bus this week.
              </p>
            </header>

            {!isScopeSupported && (
              <Card className="mb-6 border-warning/40 bg-warning/5">
                <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                  <Compass className="size-8 text-warning" />
                  <p className="text-base font-semibold text-foreground">
                    {hasScope ? 'Pick a higher church' : 'Pick a church in focus'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasScope
                      ? 'Bacenta status is tracked at the Governorship, Council, Stream, or Campus level.'
                      : 'Choose a church from the Church in Focus selector to view bacenta status.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {isScopeSupported && (
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start">
                <section className="space-y-3 lg:order-1">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Bacentas</SectionLabel>
                    {!loading && church && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {count} total
                      </span>
                    )}
                  </div>

                  {loading && !church && <ListSkeleton />}

                  {isEmpty && (
                    <Card className="border-success/40 bg-success/5">
                      <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                        <CheckCircle2 className="size-8 text-success" />
                        <p className="text-base font-semibold text-foreground">
                          Every bacenta bussed
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Nobody to flag — strong week.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {!isEmpty && bacentas.length > 0 && (
                    <>
                      <div className="md:hidden space-y-3">
                        {bacentas.map((bacenta, i) => (
                          <MemberDisplayCard
                            key={bacenta.id ?? `mobile-${i}`}
                            member={bacenta}
                            leader={bacenta.leader}
                            contact
                            onClick={() => onBacentaClick(bacenta)}
                          >
                            <span className="text-xs font-semibold text-defaulters">
                              Attendance:{' '}
                              {bacenta.bussingThisWeek?.attendance ?? 0}
                            </span>
                          </MemberDisplayCard>
                        ))}
                      </div>
                      <div className="hidden md:grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        {bacentas.map((bacenta, i) => (
                          <BacentaArrivalsCard
                            key={bacenta.id ?? `grid-${i}`}
                            bacenta={bacenta}
                            onClick={() => onBacentaClick(bacenta)}
                          >
                            <span className="text-xs font-semibold text-defaulters tabular-nums">
                              Attendance:{' '}
                              {bacenta.bussingThisWeek?.attendance ?? 0}
                            </span>
                          </BacentaArrivalsCard>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                <aside className="space-y-3 lg:sticky lg:top-6 lg:order-2">
                  <SectionLabel>Summary</SectionLabel>
                  <Card>
                    <CardContent className="space-y-4 p-5">
                      <div>
                        {loading && !church ? (
                          <Skeleton className="h-10 w-16" />
                        ) : (
                          <p className="text-4xl font-bold tabular-nums tracking-tight text-defaulters">
                            {count}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-muted-foreground">
                          {count === 1 ? 'bacenta' : 'bacentas'} below threshold
                        </p>
                      </div>

                      {church && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-defaulters/30 bg-defaulters/10 text-defaulters"
                          >
                            {church?.__typename}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {church?.name}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        These bacentas either skipped bussing this week or
                        bussed below the minimum attendance.
                      </p>
                    </CardContent>
                  </Card>
                </aside>
              </div>
            )}
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BacentasBelow8
