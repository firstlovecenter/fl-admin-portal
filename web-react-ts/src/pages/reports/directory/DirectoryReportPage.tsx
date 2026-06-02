import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
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
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { getHumanReadableDate } from 'global-utils'
import {
  Building2,
  Download,
  FileSpreadsheet,
  Inbox,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { CSVLink } from 'react-csv'
import { DIRECTORY_REPORT_QUERIES } from '../_shared/reports.gql'
import ReportPageShell from '../_shared/ReportPageShell'
import {
  LEVEL_COLLECTION_KEY,
  isReportLevel,
  type DirectoryAncestorEntry,
  type DirectoryReportEntry,
  type ReportLevel,
} from '../_shared/report-types'

const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g

const LEVEL_PLURAL: Record<ReportLevel, string> = {
  Bacenta: 'Bacentas',
  Governorship: 'Governorships',
  Council: 'Councils',
  Stream: 'Streams',
  Campus: 'Campuses',
  Oversight: 'Oversights',
}

// Top-down order is the natural reading order for chain columns: at Council
// scope the bacenta CSV reads Governorship → Bacenta, not Bacenta →
// Governorship. The Cypher returns ancestors closest-first; we reverse for
// the spreadsheet so the highest ancestor is the leftmost group.
const LEVEL_ORDER: ReportLevel[] = [
  'Oversight',
  'Campus',
  'Stream',
  'Council',
  'Governorship',
  'Bacenta',
]

// Bacenta is the only level with location data — every other level just
// returns null for lat/long and the column would be dead weight.
const hasCoordinates = (level: ReportLevel) => level === 'Bacenta'

type CsvRow = Record<string, string>

type ColumnSpec = {
  key: string
  label: string
  /** When true, included in the on-screen preview table. */
  showInPreview?: boolean
  toCell: (entry: DirectoryReportEntry) => string
}

const formatCoord = (n: number | null | undefined): string =>
  typeof n === 'number' && Number.isFinite(n) ? n.toFixed(6) : ''

const blank = (s: string | null | undefined): string => s ?? ''

const findAncestor = (
  entry: DirectoryReportEntry,
  level: ReportLevel
): DirectoryAncestorEntry | undefined =>
  entry.ancestors.find((a) => a.level === level)

const ancestorColumns = (ancestorLevel: ReportLevel): ColumnSpec[] => {
  const prefix = ancestorLevel
  return [
    {
      key: `${prefix}.name`,
      label: prefix,
      showInPreview: true,
      toCell: (entry) => blank(findAncestor(entry, ancestorLevel)?.name),
    },
    {
      key: `${prefix}.leaderFirstName`,
      label: `${prefix} Leader First Name`,
      toCell: (entry) =>
        blank(findAncestor(entry, ancestorLevel)?.leaderFirstName),
    },
    {
      key: `${prefix}.leaderLastName`,
      label: `${prefix} Leader Last Name`,
      toCell: (entry) =>
        blank(findAncestor(entry, ancestorLevel)?.leaderLastName),
    },
    {
      key: `${prefix}.leaderPhone`,
      label: `${prefix} Leader Phone`,
      toCell: (entry) =>
        blank(findAncestor(entry, ancestorLevel)?.leaderPhone),
    },
    {
      key: `${prefix}.leaderWhatsApp`,
      label: `${prefix} Leader WhatsApp`,
      toCell: (entry) =>
        blank(findAncestor(entry, ancestorLevel)?.leaderWhatsApp),
    },
  ]
}

/**
 * Builds columns for one row group (all entries share the same level). The
 * shape of the ancestor chain is identical across rows in a group — we sample
 * the first row to discover which ancestor levels are present and emit one
 * five-column block per ancestor, highest level first.
 */
const buildColumns = (
  level: ReportLevel,
  rows: DirectoryReportEntry[]
): ColumnSpec[] => {
  const sample = rows[0]
  const ancestorLevels = sample
    ? // Top-down: walk the level order and keep the ones that appear in the
      // sample's ancestor list. This guarantees a stable column ordering and
      // tolerates the Cypher returning them closest-first.
      LEVEL_ORDER.filter((lvl) =>
        sample.ancestors.some((a) => a.level === lvl)
      )
    : []

  const columns: ColumnSpec[] = []
  ancestorLevels.forEach((ancestorLevel) => {
    columns.push(...ancestorColumns(ancestorLevel))
  })

  columns.push(
    {
      key: 'name',
      label: level,
      showInPreview: true,
      toCell: (entry) => blank(entry.name),
    },
    {
      key: 'leaderFirstName',
      label: 'Leader First Name',
      showInPreview: true,
      toCell: (entry) => blank(entry.leaderFirstName),
    },
    {
      key: 'leaderLastName',
      label: 'Leader Last Name',
      showInPreview: true,
      toCell: (entry) => blank(entry.leaderLastName),
    },
    {
      key: 'leaderPhone',
      label: 'Leader Phone',
      showInPreview: true,
      toCell: (entry) => blank(entry.leaderPhone),
    },
    {
      key: 'leaderWhatsApp',
      label: 'Leader WhatsApp',
      toCell: (entry) => blank(entry.leaderWhatsApp),
    }
  )

  if (hasCoordinates(level)) {
    columns.push(
      {
        key: 'latitude',
        label: 'Latitude',
        toCell: (entry) => formatCoord(entry.latitude),
      },
      {
        key: 'longitude',
        label: 'Longitude',
        toCell: (entry) => formatCoord(entry.longitude),
      }
    )
  }

  return columns
}

const toCsvRow = (entry: DirectoryReportEntry, columns: ColumnSpec[]): CsvRow =>
  columns.reduce<CsvRow>((row, col) => {
    row[col.key] = col.toCell(entry)
    return row
  }, {})

// Sort walks the full ancestor chain top-down so rows group under the leftmost
// CSV column first, then break ties on each subsequent ancestor, then on the
// entry's own name. Without this, at Stream+ scope a Bacenta CSV would silently
// interleave rows from different Campus/Stream/Council branches that share a
// Governorship name.
const compareEntries = (
  a: DirectoryReportEntry,
  b: DirectoryReportEntry
): number => {
  for (const level of LEVEL_ORDER) {
    const aAnc = a.ancestors.find((x) => x.level === level)?.name ?? ''
    const bAnc = b.ancestors.find((x) => x.level === level)?.name ?? ''
    const cmp = aAnc.localeCompare(bAnc)
    if (cmp !== 0) return cmp
  }
  return a.name.localeCompare(b.name)
}

const DirectoryReportPage = () => {
  const { selectedScope } = useChurchRoleScope()
  const churchType = isReportLevel(selectedScope?.churchType)
    ? selectedScope?.churchType
    : undefined
  const churchId = selectedScope?.churchId
  const churchName = selectedScope?.churchName ?? ''

  // Pass a stable fallback document when churchType is missing — Apollo
  // validates the document inside useState lazy init regardless of `skip`.
  const query = churchType
    ? DIRECTORY_REPORT_QUERIES[churchType]
    : DIRECTORY_REPORT_QUERIES.Bacenta

  const { data, loading, error } = useQuery(query, {
    variables: { id: churchId },
    skip: !churchId || !churchType,
  })

  const entries: DirectoryReportEntry[] = useMemo(() => {
    if (!data || !churchType) return []
    const collection = data[LEVEL_COLLECTION_KEY[churchType]]
    return collection?.[0]?.directoryReport ?? []
  }, [data, churchType])

  const grouped = useMemo(() => {
    const out: Record<ReportLevel, DirectoryReportEntry[]> = {
      Bacenta: [],
      Governorship: [],
      Council: [],
      Stream: [],
      Campus: [],
      Oversight: [],
    }
    entries.forEach((entry) => {
      if (out[entry.level]) {
        out[entry.level].push(entry)
      }
    })
    LEVEL_ORDER.forEach((level) => {
      out[level].sort(compareEntries)
    })
    return out
  }, [entries])

  const presentLevels = LEVEL_ORDER.filter(
    (level) => grouped[level].length > 0
  )

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = churchName.replace(ILLEGAL_FILENAME_CHARS, '-')

  const buildFilename = (level: ReportLevel) =>
    `${safeChurchName ? `${safeChurchName} ` : ''}${LEVEL_PLURAL[level]} Directory - ${generatedOn}.csv`

  if (!selectedScope || !churchType) {
    return (
      <ReportPageShell title="Church" highlightWord="Directory">
        <p className="text-sm text-muted-foreground">
          Select a church scope to download the directory.
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Directory"
      subtitle="One CSV per church level — leaders and contact numbers."
    >
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div className="space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : presentLevels.length === 0 ? (
            <EmptyState />
          ) : (
            presentLevels.map((level) => {
              const groupEntries = grouped[level]
              const columns = buildColumns(level, groupEntries)
              const previewColumns = columns.filter((c) => c.showInPreview)
              const rows = groupEntries.map((entry) => toCsvRow(entry, columns))
              const headers = columns.map((c) => ({
                label: c.label,
                key: c.key,
              }))
              const filename = buildFilename(level)
              const previewRows = rows.slice(0, 5)
              const totalLabel = groupEntries.length.toLocaleString('en-GH')
              return (
                <div
                  key={level}
                  className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-stretch lg:gap-6"
                >
                  <section className="flex h-full flex-col gap-5 rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-banking/10 text-banking">
                        {level === 'Bacenta' ? (
                          <Users className="size-5" />
                        ) : (
                          <Building2 className="size-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-foreground">
                          {LEVEL_PLURAL[level]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {totalLabel}{' '}
                          {groupEntries.length === 1 ? 'entry' : 'entries'}
                        </p>
                        <p className="mt-1 break-words font-mono text-xs text-muted-foreground">
                          {filename}
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      className="h-11 w-full gap-2 px-8 font-semibold lg:mt-auto"
                    >
                      <CSVLink
                        data={rows}
                        headers={headers}
                        filename={filename}
                        target="_self"
                      >
                        <Download className="size-4" />
                        Download CSV
                      </CSVLink>
                    </Button>
                  </section>

                  <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between px-4 py-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Preview
                      </h3>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {groupEntries.length > previewRows.length
                          ? `Showing first ${previewRows.length} of ${totalLabel}`
                          : `Showing ${groupEntries.length} of ${totalLabel}`}
                      </p>
                    </div>
                    <div className="overflow-x-auto border-t border-border">
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
                            <TableRow key={`${level}-${index}`}>
                              {previewColumns.map((col) => (
                                <TableCell key={col.key} className="px-3">
                                  {row[col.key] ? (
                                    row[col.key]
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
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
            })
          )}
        </div>
      </ApolloWrapper>
    </ReportPageShell>
  )
}

const LoadingSkeleton = () => (
  <>
    {[0, 1, 2].map((index) => (
      <Skeleton key={index} className="h-32 w-full rounded-xl" />
    ))}
  </>
)

const EmptyState = () => (
  <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
    <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Inbox className="size-7" />
    </div>
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-foreground">
        Nothing to export
      </h2>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t find any sub-churches for this scope.
      </p>
    </div>
    <FileSpreadsheet className="size-5 text-muted-foreground/60" />
  </section>
)

export default DirectoryReportPage
