import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import { useWeeklyReportQuery } from '../_shared/useWeeklyReportQuery'
import { SERVICES_HELD_REPORT_QUERIES } from '../_shared/reports.gql'
import type { WeeklyChurchReportEntry } from '../_shared/report-types'

const HEADERS = [
  { label: 'Year', key: 'year' },
  { label: 'Week', key: 'week' },
  { label: 'Number of Services', key: 'numberOfServices' },
  { label: 'Total Attendance', key: 'serviceAttendance' },
  { label: 'Church', key: 'churchName' },
] as const

const PREVIEW_COLUMNS = [
  { key: 'year', label: 'Year' },
  { key: 'week', label: 'Week' },
  { key: 'numberOfServices', label: 'Services' },
  { key: 'serviceAttendance', label: 'Attendance' },
]

const toRow = (entry: WeeklyChurchReportEntry) => ({
  year: entry.year,
  week: entry.week,
  numberOfServices: entry.numberOfServices ?? '',
  serviceAttendance: entry.serviceAttendance ?? '',
  churchName: entry.churchName,
})

const ServicesHeldReportPage = () => {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    loading,
    error,
    entries,
    churchType,
    churchName,
    rangeLabel,
  } = useWeeklyReportQuery({
    queriesByLevel: SERVICES_HELD_REPORT_QUERIES,
    reportField: 'servicesHeldReport',
  })

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${safeChurchName ? `${safeChurchName} ` : ''}${
    churchType ?? ''
  } Services Held - ${generatedOn}.csv`

  if (!churchType) {
    return (
      <ReportPageShell title="Services" highlightWord="Held">
        <p className="text-sm text-muted-foreground">
          Select a church scope to download the services-held report.
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Services Held"
      subtitle={`Weekly attendance and service counts for this ${churchType.toLowerCase()}.`}
    >
      <div className="space-y-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        <ApolloWrapper data={entries} loading={loading} error={error} placeholder>
          <WeeklyReportDownloadCard
            title="Services Held"
            description={`Number of services and total attendance per week for this ${churchType.toLowerCase()}.`}
            filename={filename}
            loading={loading}
            rows={entries.map(toRow)}
            headers={HEADERS}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={PREVIEW_COLUMNS}
            emptyMessage="No service aggregates were recorded in the selected date range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default ServicesHeldReportPage
