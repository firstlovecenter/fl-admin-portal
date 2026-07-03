import { useMemo } from 'react'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import { isUsdDisplayLevel } from 'lib/display-currency'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import { useWeeklyReportQuery } from '../_shared/useWeeklyReportQuery'
import { WEEKDAY_REPORT_QUERIES } from '../_shared/reports.gql'
import type { WeeklyChurchReportEntry } from '../_shared/report-types'

// A multi-currency Oversight/Denomination stores income as the USD total, so the
// native "Service Income" column would just duplicate the USD one — collapse the
// pair into a single USD column there. A single-currency oversight keeps native
// income (the aggregate's `serviceCurrency` says so), so it shows the native
// column like any campus. When the currency is unknown, fall back to the level.
const buildHeaders = (
  churchType: string | undefined,
  incomeCurrency: string | null | undefined
) => {
  const incomeColumns = isUsdDisplayLevel(churchType, incomeCurrency)
    ? [{ label: 'Service Income (USD)', key: 'serviceDollarIncome' }]
    : [
        { label: 'Service Income', key: 'serviceIncome' },
        { label: 'Service Income (USD)', key: 'serviceDollarIncome' },
      ]
  return [
    { label: 'Year', key: 'year' },
    { label: 'Week', key: 'week' },
    { label: 'Service Attendance', key: 'serviceAttendance' },
    { label: 'Number of Services', key: 'numberOfServices' },
    ...incomeColumns,
    { label: 'Church', key: 'churchName' },
  ]
}

const buildPreviewColumns = (
  churchType: string | undefined,
  incomeCurrency: string | null | undefined
) => {
  const usd = isUsdDisplayLevel(churchType, incomeCurrency)
  return [
    { key: 'year', label: 'Year' },
    { key: 'week', label: 'Week' },
    { key: 'serviceAttendance', label: 'Attendance' },
    {
      key: usd ? 'serviceDollarIncome' : 'serviceIncome',
      label: usd ? 'Income (USD)' : 'Income',
    },
  ]
}

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

  // The income currency travels on each aggregate. An oversight's currency is a
  // property of its (stable) campus composition, so the whole table shares one —
  // take it from the first entry that carries it.
  const incomeCurrency = useMemo(
    () => entries.find((entry) => entry.serviceCurrency)?.serviceCurrency ?? null,
    [entries]
  )

  const headers = useMemo(
    () => buildHeaders(churchType, incomeCurrency),
    [churchType, incomeCurrency]
  )
  const previewColumns = useMemo(
    () => buildPreviewColumns(churchType, incomeCurrency),
    [churchType, incomeCurrency]
  )

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
            headers={headers}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={previewColumns}
            emptyMessage="No weekday aggregates in the selected range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default WeekdayReportPage
