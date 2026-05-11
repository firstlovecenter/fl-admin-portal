import { AlertTriangle } from 'lucide-react'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Alert, AlertDescription } from 'components/ui/alert'
import ArrivalDateSelector from 'components/ArrivalDateSelector/ArrivalDateSelector'
import useSelectedArrivalDate from 'hooks/useSelectedArrivalDate'
import { getSubChurchLevel, plural } from 'global-utils'
import type { ChurchLevel } from 'global-types'

import ReportPageShell from 'pages/reports/_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from 'pages/reports/_shared/WeeklyReportDownloadCard'
import useArrivalsExport from 'pages/arrivals/utils/useArrivalsExport'
import { isArrivalsDownloadLevel } from 'pages/arrivals/utils/buildArrivalsWorkbook'

const HEADERS = [
  { label: 'Sub-Church', key: 'child' },
  { label: 'Leader', key: 'childLeader' },
  { label: 'Active Bacentas', key: 'activeBacentas' },
  { label: 'Bacentas Bussed', key: 'bacentasWithBussing' },
  { label: 'Total Attendance', key: 'totalAttendance' },
  { label: 'Total Leader Declaration', key: 'totalLeaderDeclaration' },
  { label: 'Sprinters', key: 'totalSprinters' },
  { label: 'Urvans', key: 'totalUrvans' },
  { label: 'Cars', key: 'totalCars' },
  { label: 'Bussing Cost (GHS)', key: 'totalBussingCost' },
  { label: 'Bussing Top-Up (GHS)', key: 'totalBussingTopUp' },
] as const

const PREVIEW_COLUMNS = [
  { key: 'child', label: 'Sub-Church' },
  { key: 'childLeader', label: 'Leader' },
  { key: 'bacentasWithBussing', label: 'Bussed' },
  { key: 'totalAttendance', label: 'Attendance' },
  { key: 'totalBussingTopUp', label: 'Top-Up' },
]

const blank = (value: string | number | null | undefined): string =>
  value === null || value === undefined ? '' : String(value)

const ArrivalsSubChurchesReportPage = () => {
  const { selectedScope } = useChurchRoleScope()
  const { arrivalDate, dateLabel } = useSelectedArrivalDate()

  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchId = selectedScope?.churchId

  const downloadLevel = isArrivalsDownloadLevel(churchType) ? churchType : null
  const hasSubChurches =
    downloadLevel !== null && downloadLevel !== 'Governorship'
  const subChurchType = hasSubChurches
    ? getSubChurchLevel(churchType as ChurchLevel)
    : ''
  const subChurchPlural = subChurchType ? plural(subChurchType) : ''

  const { payload, loading, error } = useArrivalsExport(
    hasSubChurches ? downloadLevel : null,
    churchId,
    arrivalDate
  )

  const summary = payload?.summary ?? []
  const rows = summary.map((row) => ({
    child: blank(row.child),
    childLeader: blank(row.childLeader),
    activeBacentas: blank(row.activeBacentas),
    bacentasWithBussing: blank(row.bacentasWithBussing),
    totalAttendance: blank(row.totalAttendance),
    totalLeaderDeclaration: blank(row.totalLeaderDeclaration),
    totalSprinters: blank(row.totalSprinters),
    totalUrvans: blank(row.totalUrvans),
    totalCars: blank(row.totalCars),
    totalBussingCost: blank(row.totalBussingCost),
    totalBussingTopUp: blank(row.totalBussingTopUp),
  }))

  const filename = `${sanitizeFilenamePart(churchName)} ${
    subChurchType || 'Sub-Church'
  } Arrivals Summary ${arrivalDate}.csv`

  if (!selectedScope) {
    return (
      <ReportPageShell
        title="Arrivals"
        highlightWord="by Sub-Church"
        highlightClassName="text-arrivals"
      >
        <p className="text-sm text-muted-foreground">
          Select a church scope to download the breakdown.
        </p>
      </ReportPageShell>
    )
  }

  if (!hasSubChurches) {
    return (
      <ReportPageShell
        title={churchName}
        highlightWord={`Arrivals by ${subChurchType || 'Sub-Church'}`}
        highlightClassName="text-arrivals"
      >
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            The by-sub-church arrivals breakdown is available at Council,
            Stream, and Campus scopes. Switch your church-in-focus to one of
            those levels to enable it.
          </AlertDescription>
        </Alert>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord={`Arrivals by ${subChurchType}`}
      highlightClassName="text-arrivals"
      subtitle={`One row per ${subChurchType} under ${
        churchName || 'this church'
      } for the selected Sunday — bacentas bussed, attendance, leader declaration, vehicles, cost, and top-up.`}
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bussing date
          </p>
          <div className="mt-3">
            <ArrivalDateSelector />
          </div>
        </section>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <WeeklyReportDownloadCard
            title={`Arrivals by ${subChurchType}`}
            description={`One row per ${subChurchType} in ${
              churchName || 'this church'
            }. ${subChurchPlural} ranked by name.`}
            filename={filename}
            loading={loading}
            rows={rows}
            headers={HEADERS}
            entriesCount={rows.length}
            rangeLabel={dateLabel}
            previewColumns={PREVIEW_COLUMNS}
            emptyMessage={`No arrivals data for ${churchName} on ${dateLabel}.`}
          />
        )}
      </div>
    </ReportPageShell>
  )
}

export default ArrivalsSubChurchesReportPage
