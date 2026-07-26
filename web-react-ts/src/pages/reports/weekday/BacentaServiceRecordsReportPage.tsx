import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { getHumanReadableDate } from 'global-utils'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import { BACENTA_SERVICE_RECORDS_QUERY } from '../_shared/reports.gql'
import {
  defaultRangeIsoStrings,
  parseDateInput,
  toWeekKey,
} from '../_shared/week-utils'
import type { ServiceRecordDetailEntry } from '../_shared/report-types'

const buildHeaders = (t: TFunction) =>
  [
    { label: t('reports.weekday.serviceDate'), key: 'serviceDate' },
    { label: t('reports.shared.year'), key: 'year' },
    { label: t('reports.shared.week'), key: 'week' },
    { label: t('reports.weekday.noServiceReason'), key: 'noServiceReason' },
    { label: t('reports.shared.attendance'), key: 'attendance' },
    { label: t('reports.shared.income'), key: 'income' },
    { label: t('reports.weekday.cash'), key: 'cash' },
    { label: t('reports.weekday.onlineGiving'), key: 'onlineGiving' },
    { label: t('reports.weekday.numberOfTithers'), key: 'numberOfTithers' },
    { label: t('reports.weekday.foreignCurrency'), key: 'foreignCurrency' },
    { label: t('reports.weekday.dollarIncome'), key: 'dollarIncome' },
    { label: t('reports.weekday.recordedBy'), key: 'recordedByName' },
    { label: t('reports.weekday.recordedByPhone'), key: 'recordedByPhone' },
    { label: t('reports.weekday.recordedAt'), key: 'createdAt' },
    { label: t('reports.weekday.treasurers'), key: 'treasurerNames' },
    { label: t('reports.weekday.treasurerPhones'), key: 'treasurerPhones' },
    { label: t('reports.weekday.familyPicture'), key: 'familyPicture' },
    { label: t('reports.weekday.treasurerSelfie'), key: 'treasurerSelfie' },
    { label: t('reports.weekday.bankingSlip'), key: 'bankingSlip' },
    {
      label: t('reports.weekday.transactionStatus'),
      key: 'transactionStatus',
    },
    { label: t('reports.weekday.bankingProof'), key: 'bankingProofLabel' },
    { label: t('reports.weekday.bankedBy'), key: 'bankedByName' },
    { label: t('reports.weekday.bankedByPhone'), key: 'bankedByPhone' },
    { label: t('reports.weekday.serviceRecordId'), key: 'id' },
  ] as const

const buildPreviewColumns = (t: TFunction) => [
  { key: 'serviceDate', label: t('reports.weekday.date') },
  { key: 'attendance', label: t('reports.shared.attendance') },
  { key: 'income', label: t('reports.shared.income') },
  { key: 'noServiceReason', label: t('reports.weekday.noServiceReason') },
  { key: 'recordedByName', label: t('reports.weekday.recordedBy') },
]

const formatTreasurerNames = (entry: ServiceRecordDetailEntry) =>
  entry.treasurers
    .map((treasurer) => treasurer.name.trim())
    .filter(Boolean)
    .join('; ')

const formatTreasurerPhones = (entry: ServiceRecordDetailEntry) =>
  entry.treasurers
    .map((treasurer) => treasurer.phone ?? '')
    .filter(Boolean)
    .join('; ')

const formatBankingProof = (entry: ServiceRecordDetailEntry, t: TFunction) => {
  if (entry.bankingProof === null) return ''
  return entry.bankingProof ? t('reports.weekday.yes') : t('reports.weekday.no')
}

const toRow = (entry: ServiceRecordDetailEntry, t: TFunction) => ({
  serviceDate: entry.serviceDate ?? '',
  year: entry.year ?? '',
  week: entry.week ?? '',
  noServiceReason: entry.noServiceReason ?? '',
  attendance: entry.attendance ?? '',
  income: entry.income ?? '',
  cash: entry.cash ?? '',
  onlineGiving: entry.onlineGiving ?? '',
  numberOfTithers: entry.numberOfTithers ?? '',
  foreignCurrency: entry.foreignCurrency ?? '',
  dollarIncome: entry.dollarIncome ?? '',
  recordedByName: entry.recordedByName ?? '',
  recordedByPhone: entry.recordedByPhone ?? '',
  createdAt: entry.createdAt ?? '',
  treasurerNames: formatTreasurerNames(entry),
  treasurerPhones: formatTreasurerPhones(entry),
  familyPicture: entry.familyPicture ?? '',
  treasurerSelfie: entry.treasurerSelfie ?? '',
  bankingSlip: entry.bankingSlip ?? '',
  transactionStatus: entry.transactionStatus ?? '',
  bankingProofLabel: formatBankingProof(entry, t),
  bankedByName: entry.bankedByName ?? '',
  bankedByPhone: entry.bankedByPhone ?? '',
  id: entry.id,
})

const BacentaServiceRecordsReportPage = () => {
  const { t } = useTranslation()
  const { selectedScope } = useChurchRoleScope()
  const churchType = selectedScope?.churchType
  const churchId = selectedScope?.churchId
  const churchName = selectedScope?.churchName ?? ''

  const defaults = useMemo(() => defaultRangeIsoStrings(), [])
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)

  const startDateObj = parseDateInput(startDate)
  const endDateObj = parseDateInput(endDate)
  const startWeekKey = startDateObj ? toWeekKey(startDateObj) : null
  const endWeekKey = endDateObj ? toWeekKey(endDateObj) : null

  const skip =
    churchType !== 'Bacenta' ||
    !churchId ||
    startWeekKey === null ||
    endWeekKey === null ||
    startWeekKey > endWeekKey

  type QueryData = {
    bacentas?: Array<{
      id: string
      name: string
      weekdayServiceRecordsReport?: ServiceRecordDetailEntry[]
    }>
  }

  const { data, loading, error } = useQuery<QueryData>(
    BACENTA_SERVICE_RECORDS_QUERY,
    {
      variables: { id: churchId, startWeekKey, endWeekKey },
      skip,
    }
  )

  const entries: ServiceRecordDetailEntry[] = useMemo(
    () => data?.bacentas?.[0]?.weekdayServiceRecordsReport ?? [],
    [data]
  )

  const headers = useMemo(() => buildHeaders(t), [t])
  const previewColumns = useMemo(() => buildPreviewColumns(t), [t])
  const rows = useMemo(() => entries.map((entry) => toRow(entry, t)), [entries, t])

  const rangeLabel =
    startWeekKey !== null && endWeekKey !== null
      ? `${getHumanReadableDate(startDate) ?? startDate} → ${
          getHumanReadableDate(endDate) ?? endDate
        }`
      : null

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${
    safeChurchName ? `${safeChurchName} ` : ''
  }Bacenta Weekday Service Records - ${generatedOn}.csv`

  if (churchType !== 'Bacenta') {
    return (
      <ReportPageShell
        title={t('reports.weekday.title')}
        highlightWord={t('reports.weekday.serviceRecords')}
      >
        <p className="text-sm text-muted-foreground">
          {t('reports.weekday.bacentaOnly')}
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord={t('reports.weekday.serviceRecordsHighlight')}
      subtitle={t('reports.weekday.serviceRecordsSubtitle')}
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
            title={t('reports.weekday.serviceRecordsHighlight')}
            description={t('reports.weekday.serviceRecordsDescription')}
            filename={filename}
            loading={loading}
            rows={rows}
            headers={headers}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={previewColumns}
            emptyMessage={t('reports.weekday.serviceRecordsEmpty')}
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default BacentaServiceRecordsReportPage
