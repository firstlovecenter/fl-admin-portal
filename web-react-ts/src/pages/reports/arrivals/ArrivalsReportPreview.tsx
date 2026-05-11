import { Bus, Coins, FileSpreadsheet, Home, Users } from 'lucide-react'

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
            <TableHeader>
              <TableRow>
                <TableHead className="px-3">Bacenta</TableHead>
                <TableHead className="px-3">Leader</TableHead>
                <TableHead className="px-3 text-right">Attendance</TableHead>
                <TableHead className="px-3 text-right">Vehicles</TableHead>
                <TableHead className="px-3 text-right">Top-Up (GHS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, idx) => {
                const vehicleCount =
                  safeNum(row.sprinters) +
                  safeNum(row.urvans) +
                  safeNum(row.cars)
                return (
                  <TableRow key={`${row.bacenta ?? 'bacenta'}-${idx}`}>
                    <TableCell className="px-3 font-medium">
                      {row.bacenta ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 text-muted-foreground">
                      {row.leader ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 text-right tabular-nums">
                      {formatNumber(safeNum(row.attendance))}
                    </TableCell>
                    <TableCell className="px-3 text-right tabular-nums">
                      {formatNumber(vehicleCount)}
                    </TableCell>
                    <TableCell className="px-3 text-right tabular-nums">
                      {formatNumber(safeNum(row.bussingTopUp))}
                    </TableCell>
                  </TableRow>
                )
              })}
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
