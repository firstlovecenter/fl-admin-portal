import { useContext, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  CheckCircle2,
  Compass,
  Filter,
  ListChecks,
  Search,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from 'components/ui/accordion'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Input } from 'components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select'
import { Skeleton } from 'components/ui/skeleton'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'

import { cn } from 'components/lib/utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { formatChurchLevel } from 'lib/scope-display'
import { SHORT_POLL_INTERVAL } from 'global-utils'

import { BacentaWithArrivals, VehicleRecord } from '../arrivals-types'
import {
  GOVERNORSHIP_BACENTAS_TO_COUNT,
  COUNCIL_BACENTAS_TO_COUNT,
  CAMPUS_BACENTAS_TO_COUNT,
  STREAM_BACENTAS_TO_COUNT,
} from '../bussingStatusQueries'
import { SectionLabel } from '../components/live-feed'
import VehicleButton from '../components/VehicleButton'
import { useArrivalsScopedQuery } from './useArrivalsScopedQuery'

type BacentaWithRecords = {
  bacenta: BacentaWithArrivals
  records: VehicleRecord[]
}

type GovernorshipGroup = {
  id: string
  name: string
  items: BacentaWithRecords[]
}

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
  const { clickCard } = useContext(ChurchContext)
  const { roleChurchOptions, selectedScopeKey, setSelectedScopeKey } =
    useChurchRoleScope()
  const {
    church,
    churchType,
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

  // Counters often work the bussing centre for several streams in one shift —
  // filter to arrivals-counter scopes so they can hop between streams without
  // opening the sidebar. Other roles on this account (leader, admin, etc.)
  // belong in the global sidebar picker, not this in-page shortcut.
  const counterScopes = useMemo(
    () =>
      roleChurchOptions.filter((option) =>
        option.authRole.startsWith('arrivalsCounter')
      ),
    [roleChurchOptions]
  )
  const canSwitchScope = counterScopes.length > 1
  const counterScopeSelected = counterScopes.some(
    (option) => option.key === selectedScopeKey
  )

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

  const groupByGovernorship = churchType === 'Council'

  const renderBacentaWithRecords = ({ bacenta, records }: BacentaWithRecords) => (
    // onClickCapture seeds bacenta + bussing context before
    // VehicleButton's click navigates to /bacenta/vehicle-details.
    <Card
      key={bacenta.id}
      onClickCapture={() => {
        clickCard(bacenta)
        if (bacenta.bussingThisWeek) clickCard(bacenta.bussingThisWeek)
      }}
    >
      <CardContent className="space-y-2.5 p-3 lg:space-y-3 lg:p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {bacenta.name} Bacenta
          </p>
          <p className="text-[11px] text-muted-foreground lg:text-xs">
            {bacenta.leader?.nameWithTitle ?? bacenta.leader?.fullName ?? ''}
          </p>
        </div>
        <div className="space-y-2">
          {records.map((record) => (
            <VehicleButton key={record.id} record={record} />
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const governorshipGroups = useMemo<GovernorshipGroup[]>(() => {
    if (!groupByGovernorship) return []
    const map = new Map<string, GovernorshipGroup>()
    bacentasWithVisibleRecords.forEach((item) => {
      const id = item.bacenta.governorship?.id ?? '__unassigned'
      const name = item.bacenta.governorship?.name ?? 'Unassigned'
      const existing = map.get(id)
      if (existing) {
        existing.items.push(item)
      } else {
        map.set(id, { id, name, items: [item] })
      }
    })
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [bacentasWithVisibleRecords, groupByGovernorship])

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
          <StickyPageHeader innerClassName="space-y-1.5 lg:space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-arrivals lg:text-xs lg:tracking-[0.18em]">
              <ListChecks className="size-3.5" />
              <span>Arrivals Counter</span>
            </div>
            {loading && !church ? (
              <Skeleton className="h-7 w-56 lg:h-9 lg:w-72" />
            ) : (
              <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-3xl">
                {church?.name ?? churchName ?? ''}{' '}
                <span className="text-arrivals">To Count</span>
              </h1>
            )}
            <p className="text-xs text-muted-foreground lg:text-sm">
              Vehicles awaiting confirmation at the centre.
            </p>
            {canSwitchScope && (
              <div className="pt-2 lg:pt-3">
                <Select
                  value={counterScopeSelected ? selectedScopeKey : ''}
                  onValueChange={setSelectedScopeKey}
                >
                  <SelectTrigger
                    className="h-11 w-full max-w-sm border-arrivals/30 bg-arrivals/10 text-arrivals data-placeholder:text-arrivals/70 [&_svg]:text-arrivals"
                    aria-label="Switch arrivals counter stream"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <ArrowLeftRight className="size-4 shrink-0" />
                      <SelectValue placeholder="Switch stream" />
                    </span>
                  </SelectTrigger>
                  <SelectContent align="start" className="max-h-80">
                    {counterScopes.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.churchName} ·{' '}
                        {formatChurchLevel(option.churchType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </StickyPageHeader>
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            {!isScopeSupported && (
              <Card className="mb-4 border-warning/40 bg-warning/5 lg:mb-6">
                <CardContent className="flex flex-col items-center gap-2 p-6 text-center lg:p-8">
                  <Compass className="size-7 text-warning lg:size-8" />
                  <p className="text-sm font-semibold text-foreground lg:text-base">
                    {hasScope ? 'Pick a higher church' : 'Pick a church in focus'}
                  </p>
                  <p className="text-xs text-muted-foreground lg:text-sm">
                    {hasScope
                      ? 'Counting is tracked at the Governorship, Council, Stream, or Campus level.'
                      : 'Choose a church from the Church in Focus selector to start counting.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {isScopeSupported && (
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-6">
                <aside className="space-y-2 lg:order-2 lg:sticky lg:top-6 lg:space-y-3">
                  <SectionLabel>Summary</SectionLabel>
                  <Card>
                    <CardContent className="space-y-3 p-4 lg:space-y-4 lg:p-5">
                      <div>
                        {loading && !church ? (
                          <Skeleton className="h-9 w-14 lg:h-10 lg:w-16" />
                        ) : (
                          <p className="text-3xl font-bold tabular-nums tracking-tight text-arrivals lg:text-4xl">
                            {visibleVehicleCount}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground lg:mt-1 lg:text-sm">
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

                      <p className="text-[11px] text-muted-foreground lg:text-xs">
                        Vehicles disappear from this list once you confirm
                        their arrival time.
                      </p>
                    </CardContent>
                  </Card>
                </aside>

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
                        variant="ghost"
                        size="sm"
                        aria-pressed={seeBusses}
                        onClick={() => setSeeBusses((v) => !v)}
                        className={cn(
                          'min-h-9 rounded-full border px-4 text-sm transition-colors',
                          seeBusses
                            ? 'border-transparent bg-arrivals text-white hover:bg-arrivals/90 hover:text-white'
                            : 'border-arrivals/30 bg-arrivals/10 text-arrivals hover:bg-arrivals/15 hover:text-arrivals'
                        )}
                      >
                        Sprinter & Urvan
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-pressed={seeCars}
                        onClick={() => setSeeCars((v) => !v)}
                        className={cn(
                          'min-h-9 rounded-full border px-4 text-sm transition-colors',
                          seeCars
                            ? 'border-transparent bg-arrivals text-white hover:bg-arrivals/90 hover:text-white'
                            : 'border-arrivals/30 bg-arrivals/10 text-arrivals hover:bg-arrivals/15 hover:text-arrivals'
                        )}
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
                      <CardContent className="flex flex-col items-center gap-2 p-6 text-center lg:p-8">
                        <CheckCircle2 className="size-7 text-success lg:size-8" />
                        <p className="text-sm font-semibold text-foreground lg:text-base">
                          Nothing to count
                        </p>
                        <p className="text-xs text-muted-foreground lg:text-sm">
                          Every vehicle has been confirmed.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {searchEmpty && (
                    <Card>
                      <CardContent className="flex flex-col items-center gap-2 p-6 text-center lg:p-8">
                        <Search className="size-7 text-muted-foreground lg:size-8" />
                        <p className="text-sm font-semibold text-foreground lg:text-base">
                          No matches
                        </p>
                        <p className="text-xs text-muted-foreground lg:text-sm">
                          No bacentas or leaders match your search.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {filtersEmpty && (
                    <Card>
                      <CardContent className="flex flex-col items-center gap-2 p-6 text-center lg:p-8">
                        <Filter className="size-7 text-muted-foreground lg:size-8" />
                        <p className="text-sm font-semibold text-foreground lg:text-base">
                          All vehicles hidden
                        </p>
                        <p className="text-xs text-muted-foreground lg:text-sm">
                          Toggle Sprinter &amp; Urvan or Car &amp; Uber back on
                          to see pending vehicles.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {bacentasWithVisibleRecords.length > 0 &&
                    !groupByGovernorship && (
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {bacentasWithVisibleRecords.map(renderBacentaWithRecords)}
                      </div>
                    )}

                  {bacentasWithVisibleRecords.length > 0 &&
                    groupByGovernorship && (
                      <Accordion type="multiple" className="space-y-3">
                        {governorshipGroups.map((group) => {
                          const groupVehicleCount = group.items.reduce(
                            (sum, item) => sum + item.records.length,
                            0
                          )
                          return (
                            <AccordionItem
                              key={group.id}
                              value={group.id}
                              className="overflow-hidden rounded-xl border border-border bg-card"
                            >
                              <AccordionTrigger className="min-h-12 px-4 hover:no-underline">
                                <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                                  <span className="truncate text-sm font-semibold text-foreground">
                                    {group.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="border-arrivals/30 bg-arrivals/10 text-arrivals tabular-nums"
                                  >
                                    {groupVehicleCount}{' '}
                                    {groupVehicleCount === 1
                                      ? 'vehicle'
                                      : 'vehicles'}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pt-1">
                                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                  {group.items.map(renderBacentaWithRecords)}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )
                        })}
                      </Accordion>
                    )}
                </section>
              </div>
            )}
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StateBacentasToCount
