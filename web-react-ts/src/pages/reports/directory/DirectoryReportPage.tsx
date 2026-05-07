import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
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
  type DirectoryReportEntry,
  type ReportLevel,
} from '../_shared/report-types'

const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g

const DIRECTORY_HEADERS = [
  { label: 'Name', key: 'name' },
  { label: 'Parent', key: 'parentName' },
  { label: 'Leader', key: 'leaderName' },
  { label: 'Phone', key: 'leaderPhone' },
  { label: 'WhatsApp', key: 'leaderWhatsApp' },
] as const

type CsvRow = {
  name: string
  parentName: string
  leaderName: string
  leaderPhone: string
  leaderWhatsApp: string
}

const LEVEL_PLURAL: Record<ReportLevel, string> = {
  Bacenta: 'Bacentas',
  Governorship: 'Governorships',
  Council: 'Councils',
  Stream: 'Streams',
  Campus: 'Campuses',
  Oversight: 'Oversights',
}

const LEVEL_ORDER: ReportLevel[] = [
  'Oversight',
  'Campus',
  'Stream',
  'Council',
  'Governorship',
  'Bacenta',
]

const toCsvRow = (entry: DirectoryReportEntry): CsvRow => ({
  name: entry.name ?? '',
  parentName: entry.parentName ?? '',
  leaderName: entry.leaderName ?? '',
  leaderPhone: entry.leaderPhone ?? '',
  leaderWhatsApp: entry.leaderWhatsApp ?? '',
})

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
      out[level].sort((a, b) => {
        const parentCompare = (a.parentName ?? '').localeCompare(
          b.parentName ?? ''
        )
        if (parentCompare !== 0) return parentCompare
        return a.name.localeCompare(b.name)
      })
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
              const rows = grouped[level].map(toCsvRow)
              const filename = buildFilename(level)
              return (
                <section
                  key={level}
                  className="rounded-xl border border-border bg-card p-5"
                >
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
                        {grouped[level].length.toLocaleString('en-GH')}{' '}
                        {grouped[level].length === 1 ? 'entry' : 'entries'}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                        {filename}
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    className="mt-4 h-11 w-full gap-2 font-semibold"
                  >
                    <CSVLink
                      data={rows}
                      headers={[...DIRECTORY_HEADERS]}
                      filename={filename}
                      target="_self"
                    >
                      <Download className="size-4" />
                      Download CSV
                    </CSVLink>
                  </Button>
                </section>
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
