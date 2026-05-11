import { useQuery } from '@apollo/client'
import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  Search,
  Wallet,
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
import { Skeleton } from 'components/ui/skeleton'

import { cn } from 'components/lib/utils'
import CurrencySpan from 'components/CurrencySpan'
import { ChurchContext } from 'contexts/ChurchContext'
import { SHORT_POLL_INTERVAL } from 'global-utils'

import { BacentaWithArrivals, VehicleRecord } from '../arrivals-types'
import { COUNCIL_VEHICLES_TO_BE_PAID } from '../bussingStatusQueries'
import { SectionLabel } from '../components/live-feed'
import VehicleButtonPayment from '../components/VehiclePaymentButton'

type BacentaWithRecords = {
  bacenta: BacentaWithArrivals
  records: VehicleRecord[]
}

type GovernorshipGroup = {
  id: string
  name: string
  items: BacentaWithRecords[]
}

const ListSkeleton = () => (
  <div className="space-y-3">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="space-y-3 rounded-lg border border-border bg-card p-3"
      >
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-12 w-full" />
      </div>
    ))}
  </div>
)

const StateVehiclesToBePaid = () => {
  const navigate = useNavigate()
  const { councilId, clickCard, arrivalDate } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(
    COUNCIL_VEHICLES_TO_BE_PAID,
    {
      variables: { id: councilId, arrivalDate },
      pollInterval: SHORT_POLL_INTERVAL,
      skip: !councilId,
    }
  )

  const [search, setSearch] = useState('')
  const [seePaid, setSeePaid] = useState(false)

  const church = data?.councils?.[0]
  const allBacentas: BacentaWithArrivals[] = church?.bacentasToBePaid ?? []
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

  const bacentasWithVisibleRecords = useMemo<BacentaWithRecords[]>(
    () =>
      filteredBacentas
        .map((bacenta) => ({
          bacenta,
          records: (bacenta.bussingThisWeek?.vehicleRecords ?? []).filter(
            (record) =>
              seePaid
                ? record.transactionStatus === 'success'
                : record.transactionStatus !== 'success'
          ),
        }))
        .filter(({ records }) => records.length > 0),
    [filteredBacentas, seePaid]
  )

  const visibleVehicleCount = bacentasWithVisibleRecords.reduce(
    (sum, { records }) => sum + records.length,
    0
  )
  const visibleAmount = bacentasWithVisibleRecords.reduce(
    (sum, { records }) =>
      sum + records.reduce((s, r) => s + (r.vehicleTopUp ?? 0), 0),
    0
  )

  const governorshipGroups = useMemo<GovernorshipGroup[]>(() => {
    const map = new Map<string, GovernorshipGroup>()
    bacentasWithVisibleRecords.forEach((item) => {
      const id = item.bacenta.governorship?.id ?? 'unassigned'
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
  }, [bacentasWithVisibleRecords])

  const renderBacentaWithRecords = ({
    bacenta,
    records,
  }: BacentaWithRecords) => (
    <Card
      key={bacenta.id}
      onClickCapture={() => {
        clickCard(bacenta)
        if (bacenta.bussingThisWeek) clickCard(bacenta.bussingThisWeek)
      }}
    >
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {bacenta.name} Bacenta
          </p>
          <p className="text-xs text-muted-foreground">
            {bacenta.leader?.nameWithTitle ?? bacenta.leader?.fullName ?? ''}
          </p>
        </div>
        <div className="space-y-2">
          {records.map((record) => (
            <VehicleButtonPayment
              key={record.id}
              record={record}
              onClick={() => {
                clickCard(record)
                navigate(
                  record.transactionStatus === 'success'
                    ? '/bacenta/vehicle-details'
                    : '/arrivals/pay-vehicle'
                )
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const baseEmpty = !!church && !loading && allBacentas.length === 0
  const searchEmpty =
    !!church && !loading && !!trimmedSearch && filteredBacentas.length === 0
  const toggleEmpty =
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
              className="-ml-2 mb-4 min-h-11 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <header className="mb-6 space-y-2 lg:mb-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-banking">
                <Wallet className="size-3.5" />
                <span>Vehicle Payments</span>
              </div>
              {loading && !church ? (
                <Skeleton className="h-9 w-72" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {church?.name ?? ''}{' '}
                  <span className="text-banking">
                    {seePaid ? 'Paid Vehicles' : 'Vehicles To Be Paid'}
                  </span>
                </h1>
              )}
              <p className="text-sm text-muted-foreground">
                {seePaid
                  ? 'Vehicles that have been paid out for today.'
                  : 'Vehicles awaiting top-up payment.'}
              </p>
            </header>

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

                  <div
                    role="tablist"
                    aria-label="Payment status filter"
                    className="grid grid-cols-2 gap-2"
                  >
                    <Button
                      type="button"
                      role="tab"
                      aria-selected={!seePaid}
                      variant={!seePaid ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSeePaid(false)}
                      className={cn('min-h-11', seePaid && 'opacity-60')}
                    >
                      Unpaid
                    </Button>
                    <Button
                      type="button"
                      role="tab"
                      aria-selected={seePaid}
                      variant={seePaid ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSeePaid(true)}
                      className={cn('min-h-11', !seePaid && 'opacity-60')}
                    >
                      Paid
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <SectionLabel>Vehicles</SectionLabel>
                  {!loading && church && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {visibleVehicleCount}{' '}
                      {visibleVehicleCount === 1 ? 'vehicle' : 'vehicles'}
                    </span>
                  )}
                </div>

                {loading && !church && <ListSkeleton />}

                {baseEmpty && (
                  <Card className="border-success/40 bg-success/5">
                    <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                      <CheckCircle2 className="size-8 text-success" />
                      <p className="text-base font-semibold text-foreground">
                        Nothing to pay
                      </p>
                      <p className="text-sm text-muted-foreground">
                        No vehicles are pending payment.
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

                {toggleEmpty && (
                  <Card>
                    <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                      <Wallet className="size-8 text-muted-foreground" />
                      <p className="text-base font-semibold text-foreground">
                        {seePaid
                          ? 'No paid vehicles yet'
                          : 'All vehicles are paid'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {seePaid
                          ? 'Switch to Unpaid to see what is still pending.'
                          : 'Switch to Paid to see completed payouts.'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {bacentasWithVisibleRecords.length > 0 && (
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
                                className="border-banking/30 bg-banking/10 text-banking tabular-nums"
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

              <aside className="space-y-3 lg:sticky lg:top-6 lg:order-2">
                <SectionLabel>Summary</SectionLabel>
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <div>
                      {loading && !church ? (
                        <Skeleton className="h-10 w-16" />
                      ) : (
                        <p className="text-4xl font-bold tabular-nums tracking-tight text-banking">
                          {visibleVehicleCount}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {visibleVehicleCount === 1 ? 'vehicle' : 'vehicles'}{' '}
                        {seePaid ? 'paid' : 'pending'}
                      </p>
                    </div>

                    {!!visibleAmount && (
                      <div>
                        <Coins className="mb-1 size-4 text-banking" />
                        <p className="text-sm font-medium text-foreground">
                          <CurrencySpan
                            number={visibleAmount}
                            className="tabular-nums"
                          />{' '}
                          {seePaid ? 'paid out' : 'to pay out'}
                        </p>
                      </div>
                    )}

                    {church && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-banking/30 bg-banking/10 text-banking"
                        >
                          {church?.__typename}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">
                          {church?.name}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Tap a vehicle to{' '}
                      {seePaid ? 'view its payout' : 'process payment'}.
                    </p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StateVehiclesToBePaid
