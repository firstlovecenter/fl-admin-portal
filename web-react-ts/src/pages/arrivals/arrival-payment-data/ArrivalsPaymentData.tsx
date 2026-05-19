import { useContext, useMemo, useState } from 'react'
import { CSVLink } from 'react-csv'
import { Bus, CalendarDays, ChevronDown, ChevronUp, ChevronsUpDown, Download, Inbox } from 'lucide-react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import { getHumanReadableDate } from 'lib/date-utils'
import { Skeleton } from 'components/ui/skeleton'
import { Button } from 'components/ui/button'
import ErrorScreen from 'components/base-component/ErrorScreen'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'
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

const formatNumber = (value: number | undefined | null) =>
  value == null ? '' : value.toLocaleString('en-GH')

const SortIcon = ({ sorted }: { sorted: 'asc' | 'desc' | false }) => {
  if (sorted === 'asc') return <ChevronUp className="size-3.5 shrink-0" />
  if (sorted === 'desc') return <ChevronDown className="size-3.5 shrink-0" />
  return <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />
}

const columnHelper = createColumnHelper<ArrivalPaymentRow>()

const ArrivalsPaymentData = () => {
  const today = new Date().toISOString().slice(0, 10)
  const { currentUser } = useContext(MemberContext)
  const { arrivalDate } = useContext(ChurchContext)
  const church = currentUser?.currentChurch
  const arrivalsDate = arrivalDate || today
  const streamId = church?.id ?? currentUser?.stream

  const {
    data,
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
      streamId,
      arrivalsDate,
    },
    initialPageSize: INITIAL_PAGE_SIZE,
    pageSize: PAGE_SIZE,
    getItems: (d) => d?.streams?.[0]?.arrivalsPaymentData ?? [],
    getCount: (d) => d?.streams?.[0]?.arrivalsPaymentCount,
    skip: !streamId,
  })

  const [sorting, setSorting] = useState<SortingState>([])
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'index',
        header: '#',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.index + 1}
          </span>
        ),
      }),
      columnHelper.accessor('bacenta', {
        header: 'Bacenta',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('bacentaCode', {
        header: 'Code',
        enableSorting: false,
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('leader', {
        header: 'Leader',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('council', {
        header: 'Council',
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('attendance', {
        header: 'Attendance',
        sortingFn: 'basic',
        cell: (info) => (
          <span className="tabular-nums">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('confirmedAttendance', {
        header: 'Confirmed',
        sortingFn: 'basic',
        cell: (info) => (
          <span className="tabular-nums">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('vehicle', {
        header: 'Vehicle',
        enableSorting: false,
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('outbound', {
        header: 'In/Out',
        enableSorting: false,
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('topUp', {
        header: 'Top Up',
        sortingFn: 'basic',
        cell: (info) => (
          <span className="tabular-nums">{formatNumber(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('vehicleCost', {
        header: 'Cost',
        sortingFn: 'basic',
        cell: (info) => (
          <span className="tabular-nums">{formatNumber(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('momoNumber', {
        header: 'Momo',
        enableSorting: false,
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
    ],
    []
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (error) return <ErrorScreen error={error} />

  const humanDate = getHumanReadableDate(arrivalsDate)
  const hasData = items.length > 0
  const showInitialLoading = loading && items.length === 0
  const streamName =
    data?.streams?.[0]?.name ?? church?.name ?? currentUser?.stream_name

  const csvFilename = streamName
    ? `${streamName} Stream - ${humanDate} - Buses To Be Paid.csv`
    : `Stream - ${humanDate} - Buses To Be Paid.csv`

  const summaryCard = (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Summary
        </h2>
      </div>
      <dl className="divide-y divide-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-arrivals/10 flex items-center justify-center shrink-0">
            <CalendarDays className="size-4 text-arrivals" />
          </div>
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted-foreground">Date</dt>
            <dd className="text-sm font-medium text-foreground truncate">
              {humanDate}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-arrivals/10 flex items-center justify-center shrink-0">
            <Bus className="size-4 text-arrivals" />
          </div>
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted-foreground">Vehicles</dt>
            <dd className="text-sm font-medium text-foreground tabular-nums">
              {showInitialLoading ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                totalCount ?? items.length
              )}
            </dd>
          </div>
        </div>
      </dl>
    </div>
  )

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-7xl px-4 py-5 lg:px-6 lg:py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {streamName ? `${streamName} ` : ''}
            <span className="text-arrivals">Arrivals Payment</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {humanDate}
            {totalCount !== undefined && (
              <>
                {' '}
                · {totalCount} {totalCount === 1 ? 'vehicle' : 'vehicles'}
              </>
            )}
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
          {/* Primary column — table */}
          <div className="order-2 lg:order-1 space-y-4">
            {showInitialLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : !hasData ? (
              <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Inbox className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No arrivals payment data
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nothing to pay for {humanDate} yet.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className="border-b border-border hover:bg-transparent"
                      >
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="px-4 py-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                              <button
                                type="button"
                                onClick={(e) =>
                                  header.column.getToggleSortingHandler()?.(e)
                                }
                                className="-ml-1 flex min-h-11 items-center gap-1 rounded px-1 transition-colors hover:text-foreground"
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                <SortIcon
                                  sorted={header.column.getIsSorted()}
                                />
                              </button>
                            ) : (
                              <div className="flex min-h-11 items-center">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </div>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-b border-border"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="px-4 py-3 text-sm"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                {fetchingMore && (
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-12 w-full rounded" />
                    <Skeleton className="h-12 w-full rounded" />
                    <Skeleton className="h-12 w-full rounded" />
                  </div>
                )}
                {hasMore && <div ref={sentinelRef} aria-hidden className="h-1" />}
              </div>
            )}
          </div>

          {/* Secondary column — summary + download */}
          <aside className="order-1 lg:order-2 space-y-4 lg:sticky lg:top-4">
            {summaryCard}
            {hasData ? (
              <Button
                variant="default"
                asChild
                className="h-11 w-full gap-2 font-semibold"
              >
                <CSVLink
                  filename={csvFilename}
                  headers={headers}
                  data={table.getRowModel().rows.map((row) => row.original)}
                >
                  <Download className="size-4" />
                  Download CSV
                </CSVLink>
              </Button>
            ) : (
              <Button
                variant="default"
                disabled
                className="h-11 w-full gap-2 font-semibold"
              >
                <Download className="size-4" />
                Download CSV
              </Button>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

export default ArrivalsPaymentData
