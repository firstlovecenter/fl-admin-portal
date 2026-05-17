import { useState, useMemo, useEffect } from 'react'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import SubChurchLevelPicker from '../_shared/SubChurchLevelPicker'
import { useSubChurchesAtLevelQuery } from '../_shared/useSubChurchesAtLevelQuery'
import { WEEKDAY_SUB_CHURCHES_AT_LEVEL_QUERIES } from '../_shared/reports.gql'
import {
  SUB_CHURCH_TARGETS_ORDERED,
  TARGETS_BY_SCOPE,
  type SubChurchesTargetLevel,
  type WeeklyChurchReportEntryWithAncestors,
} from '../_shared/report-types'

const METRIC_HEADERS = [
  { label: 'Year', key: 'year' },
  { label: 'Week', key: 'week' },
  { label: 'Service Attendance', key: 'serviceAttendance' },
  { label: 'Number of Services', key: 'numberOfServices' },
  { label: 'Service Income', key: 'serviceIncome' },
  { label: 'Service Income (USD)', key: 'serviceDollarIncome' },
] as const

const decoratorHeadersFor = (level: SubChurchesTargetLevel) => [
  { key: `${level}_name`, label: level },
  { key: `${level}_leader`, label: `${level} Leader` },
  { key: `${level}_phone`, label: `${level} Leader Phone` },
]

const buildHeaders = (selected: readonly SubChurchesTargetLevel[]) => {
  const ordered = SUB_CHURCH_TARGETS_ORDERED.filter((l) => selected.includes(l))
  return [
    ...ordered.flatMap(decoratorHeadersFor),
    ...METRIC_HEADERS.map((h) => ({ key: h.key, label: h.label })),
  ]
}

const joinName = (
  first: string | null | undefined,
  last: string | null | undefined
) => [first, last].filter(Boolean).join(' ').trim()

const buildRow = (
  entry: WeeklyChurchReportEntryWithAncestors,
  selected: readonly SubChurchesTargetLevel[],
  target: SubChurchesTargetLevel
): Record<string, string | number> => {
  const row: Record<string, string | number> = {}
  for (const lvl of selected) {
    if (lvl === target) {
      row[`${lvl}_name`] = entry.churchName ?? ''
      row[`${lvl}_leader`] = joinName(
        entry.targetLeaderFirstName,
        entry.targetLeaderLastName
      )
      row[`${lvl}_phone`] = entry.targetLeaderPhone ?? ''
    } else {
      const a = entry.ancestors.find((x) => x.level === lvl)
      row[`${lvl}_name`] = a?.name ?? ''
      row[`${lvl}_leader`] = joinName(a?.leaderFirstName, a?.leaderLastName)
      row[`${lvl}_phone`] = a?.leaderPhone ?? ''
    }
  }
  row.year = entry.year
  row.week = entry.week
  row.serviceAttendance = entry.serviceAttendance ?? ''
  row.numberOfServices = entry.numberOfServices ?? ''
  row.serviceIncome = entry.serviceIncome ?? ''
  row.serviceDollarIncome = entry.serviceDollarIncome ?? ''
  return row
}

const previewColumnsFor = (
  selected: readonly SubChurchesTargetLevel[],
  target: SubChurchesTargetLevel
) => [
  { key: `${target}_name`, label: target },
  ...selected
    .filter((l) => l !== target)
    .slice(0, 1)
    .map((l) => ({ key: `${l}_name`, label: l })),
  { key: 'year', label: 'Year' },
  { key: 'week', label: 'Week' },
  { key: 'serviceIncome', label: 'Income' },
  { key: 'serviceAttendance', label: 'Attendance' },
]

const WeekdaySubChurchesReportPage = () => {
  const [selectedLevels, setSelectedLevels] = useState<SubChurchesTargetLevel[]>(
    [...TARGETS_BY_SCOPE.Oversight]
  )
  const target = selectedLevels[selectedLevels.length - 1] ?? null

  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    loading,
    error,
    entries,
    scope,
    churchName,
    rangeLabel,
  } = useSubChurchesAtLevelQuery({
    queriesByScope: WEEKDAY_SUB_CHURCHES_AT_LEVEL_QUERIES,
    targetLevel: target,
  })

  const availableLevels = scope ? TARGETS_BY_SCOPE[scope] : []

  useEffect(() => {
    if (!scope) return
    setSelectedLevels([...TARGETS_BY_SCOPE[scope]])
  }, [scope])

  const headers = useMemo(() => buildHeaders(selectedLevels), [selectedLevels])
  const rows = useMemo(
    () =>
      target
        ? entries.map((e) => buildRow(e, selectedLevels, target))
        : [],
    [entries, selectedLevels, target]
  )

  const today = new Date().toISOString().slice(0, 10)
  const generatedOn = getHumanReadableDate(today) ?? today
  const safeChurchName = sanitizeFilenamePart(churchName)
  const filename = `${safeChurchName ? `${safeChurchName} ` : ''}${
    scope ?? ''
  } Weekday by ${target ?? 'Sub-Church'} - ${generatedOn}.csv`

  if (!scope) {
    return (
      <ReportPageShell title="Weekday" highlightWord="Sub-Churches">
        <p className="text-sm text-muted-foreground">
          Sub-church weekday breakdowns aren&apos;t available at your current
          scope.
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Weekday by Sub-Church"
      subtitle="Pick the row level and which ancestor columns to include."
    >
      <div className="space-y-6">
        <SubChurchLevelPicker
          availableLevels={availableLevels}
          selectedLevels={selectedLevels}
          onChange={setSelectedLevels}
        />

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        <ApolloWrapper data={entries} loading={loading} error={error} placeholder>
          <WeeklyReportDownloadCard
            title={`Weekday by ${target ?? 'Sub-Church'}`}
            description={`Per-week weekday attendance and income at the ${
              target?.toLowerCase() ?? 'sub-church'
            } level, with ancestor decoration columns for every ticked level above.`}
            filename={filename}
            loading={loading}
            rows={rows}
            headers={headers}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={target ? previewColumnsFor(selectedLevels, target) : []}
            emptyMessage="No weekday aggregates in the selected range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default WeekdaySubChurchesReportPage
