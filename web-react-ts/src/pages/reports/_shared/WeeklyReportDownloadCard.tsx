import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'
import {
  CalendarRange,
  Download,
  FileSpreadsheet,
  Inbox,
} from 'lucide-react'
import { CSVLink } from 'react-csv'
import { type ReactNode } from 'react'
import type { WeeklyChurchReportEntry } from './report-types'

type CsvHeader = {
  label: string
  key: string
}

type WeeklyReportDownloadCardProps = {
  title: string
  description: string
  filename: string
  loading: boolean
  rows: Record<string, string | number>[]
  headers: readonly CsvHeader[]
  entriesCount: number
  rangeLabel?: string
  previewColumns: { key: string; label: string }[]
  emptyMessage?: string
  /**
   * Optional secondary panel rendered above the preview table — used by
   * pages that need to surface scope-specific notes (e.g. the bacenta
   * "self only" hint on the sub-churches report).
   */
  notice?: ReactNode
}

const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g
export const sanitizeFilenamePart = (value: string) =>
  value.replace(ILLEGAL_FILENAME_CHARS, '-')

const WeeklyReportDownloadCard = ({
  title,
  description,
  filename,
  loading,
  rows,
  headers,
  entriesCount,
  rangeLabel,
  previewColumns,
  emptyMessage = 'No records in the selected date range.',
  notice,
}: WeeklyReportDownloadCardProps) => {
  if (loading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="mx-auto h-12 w-full rounded-md sm:w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </section>
    )
  }

  if (entriesCount === 0) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
        <FileSpreadsheet className="size-5 text-muted-foreground/60" />
      </section>
    )
  }

  const previewRows = rows.slice(0, 5)

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* LEFT — action panel */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-banking/10 text-banking">
              <FileSpreadsheet className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3">
            <StatTile
              icon={<FileSpreadsheet className="size-4" />}
              label="Rows"
              value={entriesCount.toLocaleString('en-GH')}
            />
            <StatTile
              icon={<CalendarRange className="size-4" />}
              label="Range"
              value={rangeLabel ?? '—'}
            />
          </dl>
        </section>

        {notice}

        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filename
          </p>
          <p className="mt-2 truncate font-mono text-sm text-foreground">
            {filename}
          </p>
        </section>

        <Button
          asChild
          className="h-12 w-full gap-2 text-base font-semibold"
        >
          <CSVLink
            data={rows}
            headers={[...headers]}
            filename={filename}
            target="_self"
          >
            <Download className="size-5" />
            Download CSV
          </CSVLink>
        </Button>
      </div>

      {/* RIGHT — preview */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preview
          </h3>
          <p className="text-xs text-muted-foreground tabular-nums">
            {entriesCount > previewRows.length
              ? `Showing first ${previewRows.length} of ${entriesCount.toLocaleString(
                  'en-GH'
                )}`
              : `Showing ${entriesCount} of ${entriesCount}`}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {previewColumns.map((col) => (
                <TableHead key={col.key} className="px-3">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, index) => (
              <TableRow key={`${index}`}>
                {previewColumns.map((col) => (
                  <TableCell key={col.key} className="px-3">
                    {row[col.key] !== undefined && row[col.key] !== '' ? (
                      row[col.key]
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}

type StatTileProps = {
  icon: ReactNode
  label: string
  value: string
}

const StatTile = ({ icon, label, value }: StatTileProps) => (
  <div className="rounded-lg border border-border bg-background/40 p-3">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
    </div>
    <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">
      {value}
    </p>
  </div>
)

export type { WeeklyChurchReportEntry }
export default WeeklyReportDownloadCard
