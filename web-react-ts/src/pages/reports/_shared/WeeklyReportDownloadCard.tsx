import { useMemo, useState, type ReactNode } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
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
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  Inbox,
} from 'lucide-react'
import { CSVLink } from 'react-csv'
import StatTile from './StatTile'

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

const SortIcon = ({ sorted }: { sorted: 'asc' | 'desc' | false }) => {
  if (sorted === 'asc') return <ChevronUp className="size-3.5 shrink-0" />
  if (sorted === 'desc') return <ChevronDown className="size-3.5 shrink-0" />
  return <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />
}

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
  const previewRows = rows.slice(0, 5)
  const [sorting, setSorting] = useState<SortingState>([])
  const columns = useMemo<ColumnDef<Record<string, string | number>>[]>(
    () =>
      previewColumns.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        cell: ({ getValue }) => {
          const value = getValue()
          if (value === undefined || value === '')
            return <span className="text-muted-foreground">—</span>
          return value as string | number
        },
      })),
    [previewColumns]
  )
  const table = useReactTable({
    data: previewRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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
      </section>
    </div>
  )
}

export default WeeklyReportDownloadCard
