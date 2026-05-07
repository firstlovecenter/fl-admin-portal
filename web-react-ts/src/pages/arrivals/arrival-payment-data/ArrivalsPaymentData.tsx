import React, { useContext } from 'react'
import { CSVLink } from 'react-csv'
import { Download } from 'lucide-react'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import { getHumanReadableDate } from 'jd-date-utils'
import { Skeleton } from 'components/ui/skeleton'
import { Button } from 'components/ui/button'
import ErrorScreen from 'components/base-component/ErrorScreen'
import { DISPLAY_ARRIVALS_PAYMENT_DATA } from '../arrivalsQueries'

const INITIAL_PAGE_SIZE = 25
const PAGE_SIZE = 25

interface ArrivalPaymentRow {
  stream: string
  bacenta: string
  council: string
  councilHead: string
  governorship: string
  leader: string
  bacentaCode: string
  attendance: number
  confirmedAttendance: number
  vehicle: string
  outbound: string
  topUp: number
  vehicleCost: number
  momoNumber: string
  momoName: string
  comments: string
  society: string
  date: string
  arrivalTime: string
}

type ArrivalsPaymentDataResponse = {
  streams: Array<{
    id: string
    name: string
    arrivalsPaymentCount: number
    arrivalsPaymentData: ArrivalPaymentRow[]
  }>
}

const headers = [
  { label: 'Date', key: 'date' },
  { label: 'Stream', key: 'stream' },
  { label: 'Council', key: 'council' },
  { label: 'Council Head', key: 'councilHead' },
  { label: 'Governorship', key: 'governorship' },
  { label: 'Bacenta', key: 'bacenta' },
  { label: 'Leader', key: 'leader' },
  { label: 'Bacenta Code', key: 'bacentaCode' },
  { label: 'Attendance', key: 'attendance' },
  { label: 'Confirmed Attendance', key: 'confirmedAttendance' },
  { label: 'Vehicle', key: 'vehicle' },
  { label: 'In and Out', key: 'outbound' },
  { label: 'Top Up', key: 'topUp' },
  { label: 'Vehicle Cost', key: 'vehicleCost' },
  { label: 'Momo Number', key: 'momoNumber' },
  { label: 'Momo Name', key: 'momoName' },
  { label: 'Comments', key: 'comments' },
  { label: 'Society', key: 'society' },
  { label: 'Arrival Time', key: 'arrivalTime' },
]

const ArrivalsPaymentData = () => {
  const today = new Date().toISOString().slice(0, 10)
  const { currentUser } = useContext(MemberContext)
  const { arrivalDate } = useContext(ChurchContext)
  const church = currentUser?.currentChurch
  const arrivalsDate = arrivalDate || today

  const {
    items,
    totalCount,
    loading,
    error,
    fetchingMore,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll<ArrivalsPaymentDataResponse, ArrivalPaymentRow>({
    query: DISPLAY_ARRIVALS_PAYMENT_DATA,
    variables: {
      streamId: currentUser?.currentChurch?.id,
      arrivalsDate,
    },
    initialPageSize: INITIAL_PAGE_SIZE,
    pageSize: PAGE_SIZE,
    getItems: (d) => d?.streams?.[0]?.arrivalsPaymentData ?? [],
    getCount: (d) => d?.streams?.[0]?.arrivalsPaymentCount,
    skip: !currentUser?.currentChurch?.id,
  })

  if (error) return <ErrorScreen error={error} />

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-7xl px-4 py-5 lg:px-6 lg:py-8">
        <header className="mb-6 text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Arrival&apos;s Payment Data
          </h1>
          <p className="text-sm text-muted-foreground">
            {church?.name} {church?.__typename}
            {totalCount !== undefined && (
              <>
                {' '}
                — {totalCount}{' '}
                {totalCount === 1 ? 'vehicle' : 'vehicles'} on{' '}
                {getHumanReadableDate(arrivalsDate)}
              </>
            )}
          </p>
        </header>

        {loading && items.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-20 text-center text-sm text-muted-foreground">
            No arrivals payment data for{' '}
            {getHumanReadableDate(arrivalsDate)}.
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-end">
              <Button variant="outline" size="default" asChild className="gap-1.5">
                <CSVLink
                  filename={`${church?.name} ${
                    church?.__typename
                  } - ${getHumanReadableDate(
                    arrivalsDate
                  )} - Buses To Be Paid.csv`}
                  headers={headers}
                  data={items}
                >
                  <Download className="size-4" />
                  Download CSV
                </CSVLink>
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-left">#</th>
                    <th className="px-3 py-2.5 text-left">Bacenta</th>
                    <th className="px-3 py-2.5 text-left">Code</th>
                    <th className="px-3 py-2.5 text-left">Leader</th>
                    <th className="px-3 py-2.5 text-left">Council</th>
                    <th className="px-3 py-2.5 text-right">Attendance</th>
                    <th className="px-3 py-2.5 text-right">Confirmed</th>
                    <th className="px-3 py-2.5 text-left">Vehicle</th>
                    <th className="px-3 py-2.5 text-left">In/Out</th>
                    <th className="px-3 py-2.5 text-right">Top Up</th>
                    <th className="px-3 py-2.5 text-right">Cost</th>
                    <th className="px-3 py-2.5 text-left">Momo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((row, index) => (
                    <tr
                      key={`${row.bacentaCode}-${row.vehicle}-${index}`}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-3 py-2 text-muted-foreground tabular-nums">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 text-foreground">{row.bacenta}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.bacentaCode}
                      </td>
                      <td className="px-3 py-2 text-foreground">{row.leader}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.council}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">
                        {row.attendance}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">
                        {row.confirmedAttendance}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.vehicle}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.outbound}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">
                        {row.topUp?.toLocaleString('en-US')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">
                        {row.vehicleCost?.toLocaleString('en-US')}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.momoNumber}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {fetchingMore && (
                <div className="space-y-2 p-3">
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              )}
              {hasMore && <div ref={sentinelRef} aria-hidden className="h-1" />}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default ArrivalsPaymentData
