import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
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
  incomeCurrency: string | null | undefined,
  t: TFunction
) => {
  const incomeColumns = isUsdDisplayLevel(churchType, incomeCurrency)
    ? [{ label: t('reports.shared.serviceIncomeUsd'), key: 'serviceDollarIncome' }]
    : [
        { label: t('reports.shared.serviceIncome'), key: 'serviceIncome' },
        {
          label: t('reports.shared.serviceIncomeUsd'),
          key: 'serviceDollarIncome',
        },
      ]
  return [
    { label: t('reports.shared.year'), key: 'year' },
    { label: t('reports.shared.week'), key: 'week' },
    {
      label: t('reports.shared.serviceAttendance'),
      key: 'serviceAttendance',
    },
    {
      label: t('reports.shared.numberOfServices'),
      key: 'numberOfServices',
    },
    ...incomeColumns,
    { label: t('reports.shared.church'), key: 'churchName' },
  ]
}

const buildPreviewColumns = (
  churchType: string | undefined,
  incomeCurrency: string | null | undefined,
  t: TFunction
) => {
  const usd = isUsdDisplayLevel(churchType, incomeCurrency)
  return [
    { key: 'year', label: t('reports.shared.year') },
    { key: 'week', label: t('reports.shared.week') },
    { key: 'serviceAttendance', label: t('reports.shared.attendance') },
    {
      key: usd ? 'serviceDollarIncome' : 'serviceIncome',
      label: usd
        ? t('reports.shared.incomeUsd')
        : t('reports.shared.income'),
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
  const { t } = useTranslation()
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
    () => buildHeaders(churchType, incomeCurrency, t),
    [churchType, incomeCurrency, t]
  )
  const previewColumns = useMemo(
    () => buildPreviewColumns(churchType, incomeCurrency, t),
    [churchType, incomeCurrency, t]
  )

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${safeChurchName ? `${safeChurchName} ` : ''}${
    churchType ?? ''
  } Weekday - ${generatedOn}.csv`

  if (!churchType) {
    return (
      <ReportPageShell
        title={t('reports.weekday.title')}
        highlightWord={t('reports.weekday.report')}
      >
        <p className="text-sm text-muted-foreground">
          {t('reports.weekday.selectScope')}
        </p>
      </ReportPageShell>
    )
  }

  const levelLabel = t(`shared.churchLevel.${churchType}`)

  return (
    <ReportPageShell
      title={churchName}
      highlightWord={t('reports.weekday.title')}
      subtitle={t('reports.weekday.subtitle', { level: levelLabel })}
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
            title={t('reports.weekday.title')}
            description={t('reports.weekday.description', {
              level: levelLabel,
            })}
            filename={filename}
            loading={loading}
            rows={entries.map(toRow)}
            headers={headers}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={previewColumns}
            emptyMessage={t('reports.weekday.emptyMessage')}
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default WeekdayReportPage
