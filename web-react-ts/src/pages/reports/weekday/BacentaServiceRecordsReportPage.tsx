import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
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

const HEADERS = [
  { label: 'Service Date', key: 'serviceDate' },
  { label: 'Year', key: 'year' },
  { label: 'Week', key: 'week' },
  { label: 'No-Service Reason', key: 'noServiceReason' },
  { label: 'Attendance', key: 'attendance' },
  { label: 'Income', key: 'income' },
  { label: 'Cash', key: 'cash' },
  { label: 'Online Giving', key: 'onlineGiving' },
  { label: 'Number of Tithers', key: 'numberOfTithers' },
  { label: 'Foreign Currency', key: 'foreignCurrency' },
  { label: 'Dollar Income', key: 'dollarIncome' },
  { label: 'Recorded By', key: 'recordedByName' },
  { label: 'Recorded By Phone', key: 'recordedByPhone' },
  { label: 'Recorded At', key: 'createdAt' },
  { label: 'Treasurers', key: 'treasurerNames' },
  { label: 'Treasurer Phones', key: 'treasurerPhones' },
  { label: 'Family Picture', key: 'familyPicture' },
  { label: 'Treasurer Selfie', key: 'treasurerSelfie' },
  { label: 'Banking Slip', key: 'bankingSlip' },
  { label: 'Transaction Status', key: 'transactionStatus' },
  { label: 'Banking Proof', key: 'bankingProofLabel' },
  { label: 'Banked By', key: 'bankedByName' },
  { label: 'Banked By Phone', key: 'bankedByPhone' },
  { label: 'Service Record ID', key: 'id' },
] as const

const PREVIEW_COLUMNS = [
  { key: 'serviceDate', label: 'Date' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'income', label: 'Income' },
  { key: 'noServiceReason', label: 'No-Service Reason' },
  { key: 'recordedByName', label: 'Recorded By' },
]

const formatTreasurerNames = (entry: ServiceRecordDetailEntry) =>
  entry.treasurers
    .map((t) => t.name.trim())
    .filter(Boolean)
    .join('; ')

const formatTreasurerPhones = (entry: ServiceRecordDetailEntry) =>
  entry.treasurers
    .map((t) => t.phone ?? '')
    .filter(Boolean)
    .join('; ')

const formatBankingProof = (entry: ServiceRecordDetailEntry) => {
  if (entry.bankingProof === null) return ''
  return entry.bankingProof ? 'Yes' : 'No'
}

const toRow = (entry: ServiceRecordDetailEntry) => ({
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
  bankingProofLabel: formatBankingProof(entry),
  bankedByName: entry.bankedByName ?? '',
  bankedByPhone: entry.bankedByPhone ?? '',
  id: entry.id,
})

const BacentaServiceRecordsReportPage = () => {
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
      <ReportPageShell title="Weekday" highlightWord="Service Records">
        <p className="text-sm text-muted-foreground">
          The detailed per-service Weekday report is only available at Bacenta
          scope. Switch to a Bacenta to download it.
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Weekday Service Records"
      subtitle="One row per individual service record, with treasurer, photo, and banking detail."
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
            title="Weekday Service Records"
            description="Full per-service detail for this Bacenta — including no-service reasons, treasurers, photo URLs, and banking-proof state."
            filename={filename}
            loading={loading}
            rows={entries.map(toRow)}
            headers={HEADERS}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={PREVIEW_COLUMNS}
            emptyMessage="No service records in the selected range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default BacentaServiceRecordsReportPage
