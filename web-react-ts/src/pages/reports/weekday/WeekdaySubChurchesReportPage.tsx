import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import { useWeeklyReportQuery } from '../_shared/useWeeklyReportQuery'
import { WEEKDAY_SUB_CHURCHES_QUERIES } from '../_shared/reports.gql'
import type { WeeklyChurchReportEntry } from '../_shared/report-types'

const HEADERS = [
  { label: 'Sub-Church Level', key: 'churchLevel' },
  { label: 'Sub-Church', key: 'churchName' },
  { label: 'Year', key: 'year' },
  { label: 'Week', key: 'week' },
  { label: 'Service Attendance', key: 'serviceAttendance' },
  { label: 'Number of Services', key: 'numberOfServices' },
  { label: 'Service Income', key: 'serviceIncome' },
  { label: 'Service Income (USD)', key: 'serviceDollarIncome' },
] as const

const PREVIEW_COLUMNS = [
  { key: 'churchName', label: 'Sub-Church' },
  { key: 'year', label: 'Year' },
  { key: 'week', label: 'Week' },
  { key: 'serviceIncome', label: 'Income' },
  { key: 'serviceAttendance', label: 'Attendance' },
]

const toRow = (entry: WeeklyChurchReportEntry) => ({
  churchLevel: entry.churchLevel,
  churchName: entry.churchName,
  year: entry.year,
  week: entry.week,
  serviceAttendance: entry.serviceAttendance ?? '',
  numberOfServices: entry.numberOfServices ?? '',
  serviceIncome: entry.serviceIncome ?? '',
  serviceDollarIncome: entry.serviceDollarIncome ?? '',
})

const WeekdaySubChurchesReportPage = () => {
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
    queriesByLevel: WEEKDAY_SUB_CHURCHES_QUERIES,
    reportField: 'subChurchesReport',
  })

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${safeChurchName ? `${safeChurchName} ` : ''}${
    churchType ?? ''
  } Weekday by Sub-Church - ${generatedOn}.csv`

  if (!churchType) {
    return (
      <ReportPageShell title="Weekday" highlightWord="Sub-Churches">
        <p className="text-sm text-muted-foreground">
          Select a church scope to download the weekday breakdown.
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Weekday by Sub-Church"
      subtitle={`Per-week weekday attendance and income for each sub-church under this ${churchType.toLowerCase()}.`}
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
            title="Weekday by Sub-Church"
            description={`Per-week weekday attendance and income for each immediate sub-church.`}
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

export default WeekdaySubChurchesReportPage
