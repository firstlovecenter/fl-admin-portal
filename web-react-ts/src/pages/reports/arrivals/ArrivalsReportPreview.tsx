import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Bus, ChevronDown, ChevronUp, ChevronsUpDown, Coins, FileSpreadsheet, Home, Users } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'
import DownloadArrivalsButton from 'pages/arrivals/DownloadArrivalsButton'
import {
  ArrivalsDetailRow,
  ArrivalsDownloadLevel,
  ArrivalsExportPayload,
} from 'pages/arrivals/utils/buildArrivalsWorkbook'

import StatTile from '../_shared/StatTile'
import { sanitizeFilenamePart } from '../_shared/WeeklyReportDownloadCard'

const PREVIEW_ROW_LIMIT = 10

const safeNum = (value: number | null | undefined): number => value ?? 0

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-GH').format(value)

const formatGhs = (value: number): string =>
  `GHS ${new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}`

type Totals = {
  attendance: number
  vehicles: number
  topUp: number
  bacentas: number
  bacentasBussed: number
}

const computeTotals = (rows: ArrivalsDetailRow[]): Totals =>
  rows.reduce<Totals>(
    (acc, row) => ({
      attendance: acc.attendance + safeNum(row.attendance),
      vehicles:
        acc.vehicles +
        safeNum(row.sprinters) +
        safeNum(row.urvans) +
        safeNum(row.cars),
      topUp: acc.topUp + safeNum(row.bussingTopUp),
      bacentas: acc.bacentas + 1,
      bacentasBussed:
        acc.bacentasBussed + (row.bussingRecorded === 'true' ? 1 : 0),
    }),
    { attendance: 0, vehicles: 0, topUp: 0, bacentas: 0, bacentasBussed: 0 }
  )

const SortIcon = ({ sorted }: { sorted: 'asc' | 'desc' | false }) => {
  if (sorted === 'asc') return <ChevronUp className="size-3.5 shrink-0" />
  if (sorted === 'desc') return <ChevronDown className="size-3.5 shrink-0" />
  return <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />
}

const columnHelper = createColumnHelper<ArrivalsDetailRow>()

type ArrivalsReportPreviewProps = {
  payload: ArrivalsExportPayload
  level: ArrivalsDownloadLevel
  churchId: string
}

const ArrivalsReportPreview = ({
  payload,
  level,
  churchId,
}: ArrivalsReportPreviewProps) => {
  const detail = payload.detail ?? []
  const vehicles = payload.vehicles ?? []
  const totals = computeTotals(detail)
  const previewRows = detail.slice(0, PREVIEW_ROW_LIMIT)

  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo(
    () => [
      columnHelper.accessor('bacenta', {
        header: 'Bacenta',
        cell: (info) => (
          <span className="font-medium">
            {info.getValue() ?? <span className="text-muted-foreground">—</span>}
          </span>
        ),
      }),
      columnHelper.accessor('leader', {
        header: 'Leader',
        cell: (info) => (
          <span className="text-muted-foreground">
            {info.getValue() ?? <span>—</span>}
          </span>
        ),
      }),
      columnHelper.accessor((row) => safeNum(row.attendance), {
        id: 'attendance',
        header: 'Attendance',
        sortingFn: 'basic',
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatNumber(getValue())}</span>
        ),
      }),
      columnHelper.accessor(
        (row) =>
          safeNum(row.sprinters) + safeNum(row.urvans) + safeNum(row.cars),
        {
          id: 'vehicleCount',
          header: 'Vehicles',
          sortingFn: 'basic',
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatNumber(getValue())}</span>
          ),
        }
      ),
      columnHelper.accessor((row) => safeNum(row.bussingTopUp), {
        id: 'topUp',
        header: 'Top-Up (GHS)',
        sortingFn: 'basic',
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatNumber(getValue())}</span>
        ),
      }),
    ],
    []
  )

  const table = useReactTable({
    data: previewRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const totalLabel = detail.length.toLocaleString('en-GH')
  const filenameStem = sanitizeFilenamePart(
    `${payload.churchName} ${payload.level} Arrivals ${payload.arrivalDate}`
  )

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* LEFT — action panel */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-arrivals/10 text-arrivals">
              <FileSpreadsheet className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">
                Arrivals
              </h2>
              <p className="text-sm text-muted-foreground">
                Bacenta detail, per-vehicle detail, and a sub-church summary
                at Council and above.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3">
            <StatTile
              icon={<Users className="size-4" />}
              label="Attendance"
              value={formatNumber(totals.attendance)}
            />
            <StatTile
              icon={<Bus className="size-4" />}
              label="Vehicles"
              value={formatNumber(totals.vehicles)}
            />
            <StatTile
              icon={<Coins className="size-4" />}
              label="Top-Up"
              value={formatGhs(totals.topUp)}
            />
            <StatTile
              icon={<Home className="size-4" />}
              label="Bussed"
              value={`${formatNumber(totals.bacentasBussed)} / ${formatNumber(
                totals.bacentas
              )}`}
            />
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filename
          </p>
          <p className="mt-2 break-words font-mono text-sm text-foreground">
            {filenameStem}
          </p>
        </section>

        <DownloadArrivalsButton
          level={level}
          churchId={churchId}
          payload={payload}
          showLabel
          className="h-12 w-full gap-2 text-base font-semibold"
        />
      </div>

      {/* RIGHT — preview */}
      <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preview
          </h3>
          <p className="text-xs text-muted-foreground tabular-nums">
            {detail.length > previewRows.length
              ? `Showing first ${previewRows.length} of ${totalLabel}`
              : `Showing ${detail.length} of ${totalLabel}`}
          </p>
        </div>
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
                      className="px-3 py-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
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
                          <SortIcon sorted={header.column.getIsSorted()} />
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
                <TableRow key={row.id} className="border-b border-border">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-3 text-sm">
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
        {vehicles.length > 0 && (
          <p className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            Vehicle detail ({vehicles.length.toLocaleString('en-GH')}{' '}
            {vehicles.length === 1 ? 'row' : 'rows'}) is included as a
            separate sheet in the download.
          </p>
        )}
      </section>
    </div>
  )
}

export default ArrivalsReportPreview
