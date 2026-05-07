import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import { useWeeklyReportQuery } from '../_shared/useWeeklyReportQuery'
import { BUSSING_SUB_CHURCHES_QUERIES } from '../_shared/reports.gql'
import type { WeeklyChurchReportEntry } from '../_shared/report-types'

const HEADERS = [
  { label: 'Sub-Church Level', key: 'churchLevel' },
  { label: 'Sub-Church', key: 'churchName' },
  { label: 'Year', key: 'year' },
  { label: 'Week', key: 'week' },
  { label: 'Bussing Attendance', key: 'bussingAttendance' },
  { label: 'Bussing Leader Declaration', key: 'bussingLeaderDeclaration' },
  { label: 'Sprinters', key: 'numberOfSprinters' },
  { label: 'Urvans', key: 'numberOfUrvans' },
  { label: 'Cars', key: 'numberOfCars' },
  { label: 'Bussing Top-Up', key: 'bussingTopUp' },
] as const

const PREVIEW_COLUMNS = [
  { key: 'churchName', label: 'Sub-Church' },
  { key: 'year', label: 'Year' },
  { key: 'week', label: 'Week' },
  { key: 'bussingAttendance', label: 'Bussing Att.' },
  { key: 'bussingTopUp', label: 'Top-Up' },
]

const toRow = (entry: WeeklyChurchReportEntry) => ({
  churchLevel: entry.churchLevel,
  churchName: entry.churchName,
  year: entry.year,
  week: entry.week,
  bussingAttendance: entry.bussingAttendance ?? '',
  bussingLeaderDeclaration: entry.bussingLeaderDeclaration ?? '',
  numberOfSprinters: entry.numberOfSprinters ?? '',
  numberOfUrvans: entry.numberOfUrvans ?? '',
  numberOfCars: entry.numberOfCars ?? '',
  bussingTopUp: entry.bussingTopUp ?? '',
})

const BussingSubChurchesReportPage = () => {
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
    queriesByLevel: BUSSING_SUB_CHURCHES_QUERIES,
    reportField: 'subChurchesReport',
  })

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${safeChurchName ? `${safeChurchName} ` : ''}${
    churchType ?? ''
  } Bussing by Sub-Church - ${generatedOn}.csv`

  if (!churchType) {
    return (
      <ReportPageShell title="Bussing" highlightWord="Sub-Churches">
        <p className="text-sm text-muted-foreground">
          Select a church scope to download the bussing breakdown.
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Bussing by Sub-Church"
      subtitle={`Per-week Sunday bussing totals for each sub-church under this ${churchType.toLowerCase()}.`}
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
            title="Bussing by Sub-Church"
            description="Per-week bussing attendance, leader declaration, vehicles, and top-up for each immediate sub-church."
            filename={filename}
            loading={loading}
            rows={entries.map(toRow)}
            headers={HEADERS}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={PREVIEW_COLUMNS}
            emptyMessage="No bussing aggregates in the selected range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default BussingSubChurchesReportPage
