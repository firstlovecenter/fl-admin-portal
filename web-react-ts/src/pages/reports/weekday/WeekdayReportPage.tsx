import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import { useWeeklyReportQuery } from '../_shared/useWeeklyReportQuery'
import { WEEKDAY_REPORT_QUERIES } from '../_shared/reports.gql'
import type { WeeklyChurchReportEntry } from '../_shared/report-types'

const HEADERS = [
  { label: 'Year', key: 'year' },
  { label: 'Week', key: 'week' },
  { label: 'Service Attendance', key: 'serviceAttendance' },
  { label: 'Number of Services', key: 'numberOfServices' },
  { label: 'Service Income', key: 'serviceIncome' },
  { label: 'Service Income (USD)', key: 'serviceDollarIncome' },
  { label: 'Church', key: 'churchName' },
] as const

const PREVIEW_COLUMNS = [
  { key: 'year', label: 'Year' },
  { key: 'week', label: 'Week' },
  { key: 'serviceAttendance', label: 'Attendance' },
  { key: 'serviceIncome', label: 'Income' },
]

const toRow = (entry: WeeklyChurchReportEntry) => ({
  year: entry.year,
  week: entry.week,
  serviceAttendance: entry.serviceAttendance ?? '',
  numberOfServices: entry.numberOfServices ?? '',
  serviceIncome: entry.serviceIncome ?? '',
  serviceDollarIncome: entry.serviceDollarIncome ?? '',
  churchName: entry.churchName,
})

const WeekdayReportPage = () => {
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
    queriesByLevel: WEEKDAY_REPORT_QUERIES,
    reportField: 'weekdayIncomeBussingReport',
  })

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${safeChurchName ? `${safeChurchName} ` : ''}${
    churchType ?? ''
  } Weekday - ${generatedOn}.csv`

  if (!churchType) {
    return (
      <ReportPageShell title="Weekday" highlightWord="Report">
        <p className="text-sm text-muted-foreground">
          Select a church scope to download the weekday report.
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Weekday"
      subtitle={`Per-week weekday service attendance and income for this ${churchType.toLowerCase()}.`}
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
            title="Weekday"
            description={`Per-week service attendance, count, and income for this ${churchType.toLowerCase()}.`}
            filename={filename}
            loading={loading}
            rows={entries.map(toRow)}
            headers={HEADERS}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={PREVIEW_COLUMNS}
            emptyMessage="No weekday aggregates in the selected range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default WeekdayReportPage
