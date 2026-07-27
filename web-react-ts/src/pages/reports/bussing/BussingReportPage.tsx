import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import { useWeeklyReportQuery } from '../_shared/useWeeklyReportQuery'
import { BUSSING_REPORT_QUERIES } from '../_shared/reports.gql'
import type { WeeklyChurchReportEntry } from '../_shared/report-types'

const buildHeaders = (t: TFunction) =>
  [
    { label: t('reports.shared.year'), key: 'year' },
    { label: t('reports.shared.week'), key: 'week' },
    {
      label: t('reports.shared.bussingAttendance'),
      key: 'bussingAttendance',
    },
    {
      label: t('reports.shared.bussingLeaderDeclaration'),
      key: 'bussingLeaderDeclaration',
    },
    { label: t('reports.shared.sprinters'), key: 'numberOfSprinters' },
    { label: t('reports.shared.urvans'), key: 'numberOfUrvans' },
    { label: t('reports.shared.cars'), key: 'numberOfCars' },
    { label: t('reports.shared.bussingTopUp'), key: 'bussingTopUp' },
    { label: t('reports.shared.church'), key: 'churchName' },
  ] as const

const buildPreviewColumns = (t: TFunction) => [
  { key: 'year', label: t('reports.shared.year') },
  { key: 'week', label: t('reports.shared.week') },
  { key: 'bussingAttendance', label: t('reports.shared.bussingAttShort') },
  { key: 'bussingTopUp', label: t('reports.shared.topUp') },
]

const toRow = (entry: WeeklyChurchReportEntry) => ({
  year: entry.year,
  week: entry.week,
  bussingAttendance: entry.bussingAttendance ?? '',
  bussingLeaderDeclaration: entry.bussingLeaderDeclaration ?? '',
  numberOfSprinters: entry.numberOfSprinters ?? '',
  numberOfUrvans: entry.numberOfUrvans ?? '',
  numberOfCars: entry.numberOfCars ?? '',
  bussingTopUp: entry.bussingTopUp ?? '',
  churchName: entry.churchName,
})

const BussingReportPage = () => {
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
    queriesByLevel: BUSSING_REPORT_QUERIES,
    reportField: 'weekdayIncomeBussingReport',
  })

  const headers = useMemo(() => buildHeaders(t), [t])
  const previewColumns = useMemo(() => buildPreviewColumns(t), [t])

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${safeChurchName ? `${safeChurchName} ` : ''}${
    churchType ?? ''
  } Bussing - ${generatedOn}.csv`

  if (!churchType) {
    return (
      <ReportPageShell
        title={t('reports.bussing.title')}
        highlightWord={t('reports.bussing.report')}
      >
        <p className="text-sm text-muted-foreground">
          {t('reports.bussing.selectScope')}
        </p>
      </ReportPageShell>
    )
  }

  const levelLabel = t(`shared.churchLevel.${churchType}`)

  return (
    <ReportPageShell
      title={churchName}
      highlightWord={t('reports.bussing.title')}
      subtitle={t('reports.bussing.subtitle', { level: levelLabel })}
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
            title={t('reports.bussing.title')}
            description={t('reports.bussing.description', {
              level: levelLabel,
            })}
            filename={filename}
            loading={loading}
            rows={entries.map(toRow)}
            headers={headers}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={previewColumns}
            emptyMessage={t('reports.bussing.emptyMessage')}
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default BussingReportPage
