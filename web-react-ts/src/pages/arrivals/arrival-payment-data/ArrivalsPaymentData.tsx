import { useContext, useMemo, useState } from 'react'
import { CSVLink } from 'react-csv'
import {
  Bus,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Inbox,
} from 'lucide-react'
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
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
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
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { useTranslation } from 'react-i18next'
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

const getHeaders = (t: (key: string) => string) => [
  { label: t('arrivals.payment.date'), key: 'date' },
  { label: t('arrivals.payment.stream'), key: 'stream' },
  { label: t('arrivals.payment.council'), key: 'council' },
  { label: t('arrivals.payment.councilHead'), key: 'councilHead' },
  { label: t('arrivals.payment.governorship'), key: 'governorship' },
  { label: t('arrivals.payment.bacenta'), key: 'bacenta' },
  { label: t('arrivals.payment.leader'), key: 'leader' },
  { label: t('arrivals.payment.bacentaCode'), key: 'bacentaCode' },
  { label: t('arrivals.payment.attendance'), key: 'attendance' },
  {
    label: t('arrivals.payment.confirmedAttendance'),
    key: 'confirmedAttendance',
  },
  { label: t('arrivals.payment.vehicle'), key: 'vehicle' },
  { label: t('arrivals.payment.inAndOut'), key: 'outbound' },
  { label: t('arrivals.payment.topUp'), key: 'topUp' },
  { label: t('arrivals.payment.vehicleCost'), key: 'vehicleCost' },
  { label: t('arrivals.common.momoNumber'), key: 'momoNumber' },
  { label: t('arrivals.common.momoName'), key: 'momoName' },
  { label: t('arrivals.common.comments'), key: 'comments' },
  { label: t('arrivals.payment.society'), key: 'society' },
  { label: t('arrivals.vehicle.arrivalTime'), key: 'arrivalTime' },
]

const SortIcon = ({ sorted }: { sorted: 'asc' | 'desc' | false }) => {
  if (sorted === 'asc') return <ChevronUp className="size-3.5 shrink-0" />
  if (sorted === 'desc') return <ChevronDown className="size-3.5 shrink-0" />
  return <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />
}

const columnHelper = createColumnHelper<ArrivalPaymentRow>()

const ArrivalsPaymentData = () => {
  const { t, i18n } = useTranslation()
  const today = new Date().toISOString().slice(0, 10)
  const { currentUser } = useContext(MemberContext)
  const { arrivalDate } = useContext(ChurchContext)
  const { selectedScope } = useChurchRoleScope()
  const church = currentUser?.currentChurch
  const arrivalsDate = arrivalDate || today
  // Follow the "Church in Focus" picker so multi-stream admins can switch
  // streams without leaving the page (SYN-163). Falls back to the member's
  // home stream when the focused scope is not a Stream.
  const focusedStreamId =
    selectedScope?.churchType === 'Stream' ? selectedScope.churchId : undefined
  const streamId = focusedStreamId ?? church?.id ?? currentUser?.stream

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
  const headers = useMemo(() => getHeaders(t), [t])
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
        header: t('arrivals.payment.bacenta'),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('bacentaCode', {
        header: t('arrivals.payment.code'),
        enableSorting: false,
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('leader', {
        header: t('arrivals.payment.leader'),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('council', {
        header: t('arrivals.payment.council'),
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('attendance', {
        header: t('arrivals.payment.attendance'),
        sortingFn: 'basic',
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      columnHelper.accessor('confirmedAttendance', {
        header: t('arrivals.payment.confirmed'),
        sortingFn: 'basic',
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      columnHelper.accessor('vehicle', {
        header: t('arrivals.payment.vehicle'),
        enableSorting: false,
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('outbound', {
        header: t('arrivals.payment.inOut'),
        enableSorting: false,
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('topUp', {
        header: t('arrivals.payment.topUp'),
        sortingFn: 'basic',
        cell: (info) => (
          <span className="tabular-nums">
            {info.getValue().toLocaleString(i18n.language)}
          </span>
        ),
      }),
      columnHelper.accessor('vehicleCost', {
        header: t('arrivals.payment.cost'),
        sortingFn: 'basic',
        cell: (info) => (
          <span className="tabular-nums">
            {info.getValue().toLocaleString(i18n.language)}
          </span>
        ),
      }),
      columnHelper.accessor('momoNumber', {
        header: t('arrivals.payment.momo'),
        enableSorting: false,
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
    ],
    [i18n.language, t]
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
    data?.streams?.[0]?.name ??
    (focusedStreamId ? selectedScope?.churchName : church?.name) ??
    currentUser?.stream_name

  const csvFilename = streamName
    ? t('arrivals.payment.csvFilenameWithStream', {
        streamName,
        date: humanDate,
      })
    : t('arrivals.payment.csvFilename', { date: humanDate })

  const summaryCard = (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('arrivals.common.summary')}
        </h2>
      </div>
      <dl className="divide-y divide-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-arrivals/10 flex items-center justify-center shrink-0">
            <CalendarDays className="size-4 text-arrivals" />
          </div>
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-muted-foreground">
              {t('arrivals.payment.date')}
            </dt>
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
            <dt className="text-xs text-muted-foreground">
              {t('arrivals.common.vehicles')}
            </dt>
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
      <StickyPageHeader>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          {streamName ? `${streamName} ` : ''}
          <span className="text-arrivals">{t('arrivals.payment.title')}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {humanDate}
          {totalCount !== undefined && (
            <> · {t('arrivals.payment.vehicleCount', { count: totalCount })}</>
          )}
        </p>
      </StickyPageHeader>
      <main className="mx-auto max-w-7xl px-4 py-5 lg:px-6 lg:py-8 space-y-6">
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
                  {t('arrivals.payment.noData')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('arrivals.payment.nothingToPay', { date: humanDate })}
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
                {hasMore && (
                  <div ref={sentinelRef} aria-hidden className="h-1" />
                )}
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
                  {t('arrivals.payment.downloadCsv')}
                </CSVLink>
              </Button>
            ) : (
              <Button
                variant="default"
                disabled
                className="h-11 w-full gap-2 font-semibold"
              >
                <Download className="size-4" />
                {t('arrivals.payment.downloadCsv')}
              </Button>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

export default ArrivalsPaymentData
