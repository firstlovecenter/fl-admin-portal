import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import { useWeeklyReportQuery } from '../_shared/useWeeklyReportQuery'
import { WEEKDAY_INCOME_BUSSING_QUERIES } from '../_shared/reports.gql'
import type { WeeklyChurchReportEntry } from '../_shared/report-types'

const HEADERS = [
  { label: 'Year', key: 'year' },
  { label: 'Week', key: 'week' },
  { label: 'Service Income', key: 'serviceIncome' },
  { label: 'Service Income (USD)', key: 'serviceDollarIncome' },
  { label: 'Service Attendance', key: 'serviceAttendance' },
  { label: 'Number of Services', key: 'numberOfServices' },
  { label: 'Bussing Attendance', key: 'bussingAttendance' },
  { label: 'Bussing Leader Declaration', key: 'bussingLeaderDeclaration' },
  { label: 'Sprinters', key: 'numberOfSprinters' },
  { label: 'Urvans', key: 'numberOfUrvans' },
  { label: 'Cars', key: 'numberOfCars' },
  { label: 'Bussing Top-Up', key: 'bussingTopUp' },
  { label: 'Church', key: 'churchName' },
] as const

const PREVIEW_COLUMNS = [
  { key: 'year', label: 'Year' },
  { key: 'week', label: 'Week' },
  { key: 'serviceIncome', label: 'Service Income' },
  { key: 'bussingAttendance', label: 'Bussing Att.' },
]

const toRow = (entry: WeeklyChurchReportEntry) => ({
  year: entry.year,
  week: entry.week,
  serviceIncome: entry.serviceIncome ?? '',
  serviceDollarIncome: entry.serviceDollarIncome ?? '',
  serviceAttendance: entry.serviceAttendance ?? '',
  numberOfServices: entry.numberOfServices ?? '',
  bussingAttendance: entry.bussingAttendance ?? '',
  bussingLeaderDeclaration: entry.bussingLeaderDeclaration ?? '',
  numberOfSprinters: entry.numberOfSprinters ?? '',
  numberOfUrvans: entry.numberOfUrvans ?? '',
  numberOfCars: entry.numberOfCars ?? '',
  bussingTopUp: entry.bussingTopUp ?? '',
  churchName: entry.churchName,
})

const WeekdayIncomeBussingReportPage = () => {
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
    queriesByLevel: WEEKDAY_INCOME_BUSSING_QUERIES,
    reportField: 'weekdayIncomeBussingReport',
  })

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${safeChurchName ? `${safeChurchName} ` : ''}${
    churchType ?? ''
  } Income & Bussing - ${generatedOn}.csv`

  if (!churchType) {
    return (
      <ReportPageShell title="Income &" highlightWord="Bussing">
        <p className="text-sm text-muted-foreground">
          Select a church scope to download the income & bussing report.
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Income & Bussing"
      subtitle={`Weekly weekday income and bussing totals for this ${churchType.toLowerCase()}.`}
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
            title="Weekday Income & Bussing"
            description={`Per-week service income and bussing totals for this ${churchType.toLowerCase()}.`}
            filename={filename}
            loading={loading}
            rows={entries.map(toRow)}
            headers={HEADERS}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={PREVIEW_COLUMNS}
            emptyMessage="No income or bussing aggregates in the selected range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default WeekdayIncomeBussingReportPage
