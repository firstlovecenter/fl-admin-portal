import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import { useWeeklyReportQuery } from '../_shared/useWeeklyReportQuery'
import { SUB_CHURCHES_REPORT_QUERIES } from '../_shared/reports.gql'
import type { WeeklyChurchReportEntry } from '../_shared/report-types'

const HEADERS = [
  { label: 'Sub-Church Level', key: 'churchLevel' },
  { label: 'Sub-Church', key: 'churchName' },
  { label: 'Year', key: 'year' },
  { label: 'Week', key: 'week' },
  { label: 'Weekday Income', key: 'serviceIncome' },
  { label: 'Service Attendance', key: 'serviceAttendance' },
  { label: 'Sunday Attendance (Bussing)', key: 'bussingAttendance' },
  { label: 'Number of Services', key: 'numberOfServices' },
] as const

const PREVIEW_COLUMNS = [
  { key: 'churchName', label: 'Sub-Church' },
  { key: 'year', label: 'Year' },
  { key: 'week', label: 'Week' },
  { key: 'serviceIncome', label: 'Weekday Income' },
  { key: 'bussingAttendance', label: 'Sunday Att.' },
]

const toRow = (entry: WeeklyChurchReportEntry) => ({
  churchLevel: entry.churchLevel,
  churchName: entry.churchName,
  year: entry.year,
  week: entry.week,
  serviceIncome: entry.serviceIncome ?? '',
  serviceAttendance: entry.serviceAttendance ?? '',
  bussingAttendance: entry.bussingAttendance ?? '',
  numberOfServices: entry.numberOfServices ?? '',
})

const SubChurchesReportPage = () => {
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
    queriesByLevel: SUB_CHURCHES_REPORT_QUERIES,
    reportField: 'subChurchesReport',
  })

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${safeChurchName ? `${safeChurchName} ` : ''}${
    churchType ?? ''
  } Sub-Churches Breakdown - ${generatedOn}.csv`

  if (!churchType) {
    return (
      <ReportPageShell title="Sub-Churches" highlightWord="Breakdown">
        <p className="text-sm text-muted-foreground">
          Select a church scope to download the sub-churches breakdown.
        </p>
      </ReportPageShell>
    )
  }

  const isBacenta = churchType === 'Bacenta'

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Sub-Churches"
      subtitle={
        isBacenta
          ? 'Bacenta has no sub-churches — the export is the bacenta itself.'
          : `Per-week weekday income and Sunday attendance for each immediate sub-church.`
      }
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
            title="Sub-Churches Breakdown"
            description={
              isBacenta
                ? 'Per-week weekday income and Sunday attendance for this bacenta.'
                : `Per-week weekday income and Sunday attendance for each immediate sub-church.`
            }
            filename={filename}
            loading={loading}
            rows={entries.map(toRow)}
            headers={HEADERS}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={PREVIEW_COLUMNS}
            emptyMessage="No sub-church aggregates in the selected range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default SubChurchesReportPage
