import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Filter,
  ListChecks,
  Search,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'

import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { Skeleton } from 'components/ui/skeleton'

import { cn } from 'components/lib/utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { SHORT_POLL_INTERVAL } from 'global-utils'

import { BacentaWithArrivals } from '../arrivals-types'
import {
  GOVERNORSHIP_BACENTAS_TO_COUNT,
  COUNCIL_BACENTAS_TO_COUNT,
  CAMPUS_BACENTAS_TO_COUNT,
  STREAM_BACENTAS_TO_COUNT,
} from '../bussingStatusQueries'
import { SectionLabel } from '../components/live-feed'
import VehicleButton from '../components/VehicleButton'
import { useArrivalsScopedQuery } from './useArrivalsScopedQuery'

const QUERIES_BY_LEVEL = {
  Governorship: GOVERNORSHIP_BACENTAS_TO_COUNT,
  Council: COUNCIL_BACENTAS_TO_COUNT,
  Stream: STREAM_BACENTAS_TO_COUNT,
  Campus: CAMPUS_BACENTAS_TO_COUNT,
}

const ListSkeleton = () => (
  <div className="space-y-3">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="rounded-lg border border-border bg-card p-3 space-y-3"
      >
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-12 w-full" />
      </div>
    ))}
  </div>
)

const StateBacentasToCount = () => {
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
  } = useArrivalsScopedQuery({
    queriesByLevel: QUERIES_BY_LEVEL,
    pollInterval: SHORT_POLL_INTERVAL,
  })

  const [search, setSearch] = useState('')
  const [seeBusses, setSeeBusses] = useState(true)
  const [seeCars, setSeeCars] = useState(true)

  const allBacentas: BacentaWithArrivals[] = church?.bacentasNotCounted ?? []
  const trimmedSearch = search.trim()

  const filteredBacentas = useMemo(() => {
    const term = trimmedSearch.toLowerCase()
    if (!term) return allBacentas
    return allBacentas.filter((bacenta) => {
      if (bacenta.name?.toLowerCase().includes(term)) return true
      if (bacenta.leader?.fullName?.toLowerCase().includes(term)) return true
      return false
    })
  }, [allBacentas, trimmedSearch])

  const bacentasWithVisibleRecords = useMemo(
    () =>
      filteredBacentas
        .map((bacenta) => ({
          bacenta,
          records: (bacenta.bussingThisWeek?.vehicleRecords ?? []).filter(
            (record) => {
              if (record.arrivalTime) return false
              if (
                !seeBusses &&
                (record.vehicle === 'Sprinter' || record.vehicle === 'Urvan')
              )
                return false
              if (!seeCars && record.vehicle === 'Car') return false
              return true
            }
          ),
        }))
        .filter(({ records }) => records.length > 0),
    [filteredBacentas, seeBusses, seeCars]
  )

  const visibleVehicleCount = bacentasWithVisibleRecords.reduce(
    (sum, { records }) => sum + records.length,
    0
  )

  const baseEmpty = !!church && !loading && allBacentas.length === 0
  const searchEmpty =
    !!church && !loading && !!trimmedSearch && filteredBacentas.length === 0
  const filtersEmpty =
    !!church &&
    !loading &&
    !baseEmpty &&
    !searchEmpty &&
    bacentasWithVisibleRecords.length === 0

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
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-arrivals">
                <ListChecks className="size-3.5" />
                <span>Arrivals Counter</span>
              </div>
              {loading && !church ? (
                <Skeleton className="h-9 w-72" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {church?.name ?? churchName ?? ''}{' '}
                  <span className="text-arrivals">To Count</span>
                </h1>
              )}
              <p className="text-sm text-muted-foreground">
                Vehicles awaiting confirmation at the centre.
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
                      ? 'Counting is tracked at the Governorship, Council, Stream, or Campus level.'
                      : 'Choose a church from the Church in Focus selector to start counting.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {isScopeSupported && (
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start">
                <section className="space-y-4 lg:order-1">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search bacentas or leaders"
                        className="h-11 pl-9"
                        aria-label="Search bacentas"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={seeBusses ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSeeBusses((v) => !v)}
                        className={cn('min-h-11', !seeBusses && 'opacity-60')}
                      >
                        Sprinter & Urvan
                      </Button>
                      <Button
                        type="button"
                        variant={seeCars ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSeeCars((v) => !v)}
                        className={cn('min-h-11', !seeCars && 'opacity-60')}
                      >
                        Car & Uber
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <SectionLabel>Vehicles</SectionLabel>
                    {!loading && church && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {visibleVehicleCount} pending
                      </span>
                    )}
                  </div>

                  {loading && !church && <ListSkeleton />}

                  {baseEmpty && (
                    <Card className="border-success/40 bg-success/5">
                      <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                        <CheckCircle2 className="size-8 text-success" />
                        <p className="text-base font-semibold text-foreground">
                          Nothing to count
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Every vehicle has been confirmed.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {searchEmpty && (
                    <Card>
                      <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                        <Search className="size-8 text-muted-foreground" />
                        <p className="text-base font-semibold text-foreground">
                          No matches
                        </p>
                        <p className="text-sm text-muted-foreground">
                          No bacentas or leaders match your search.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {filtersEmpty && (
                    <Card>
                      <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                        <Filter className="size-8 text-muted-foreground" />
                        <p className="text-base font-semibold text-foreground">
                          All vehicles hidden
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Toggle Sprinter &amp; Urvan or Car &amp; Uber back on
                          to see pending vehicles.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {bacentasWithVisibleRecords.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      {bacentasWithVisibleRecords.map(({ bacenta, records }) => (
                        <Card
                          key={bacenta.id}
                          onClickCapture={() => {
                            clickCard(bacenta)
                            if (bacenta.bussingThisWeek)
                              clickCard(bacenta.bussingThisWeek)
                          }}
                        >
                          <CardContent className="space-y-3 p-4">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {bacenta.name} Bacenta
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {bacenta.leader?.nameWithTitle ??
                                  bacenta.leader?.fullName ??
                                  ''}
                              </p>
                            </div>
                            <div className="space-y-2">
                              {records.map((record) => (
                                <VehicleButton
                                  key={record.id}
                                  record={record}
                                />
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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
                          <p className="text-4xl font-bold tabular-nums tracking-tight text-arrivals">
                            {visibleVehicleCount}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-muted-foreground">
                          {visibleVehicleCount === 1 ? 'vehicle' : 'vehicles'}{' '}
                          pending
                        </p>
                      </div>

                      {church && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-arrivals/30 bg-arrivals/10 text-arrivals"
                          >
                            {church?.__typename}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {church?.name}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Vehicles disappear from this list once you confirm
                        their arrival time.
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

export default StateBacentasToCount
