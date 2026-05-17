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
import { BUSSING_SUB_CHURCHES_AT_LEVEL_QUERIES } from '../_shared/reports.gql'
import {
  SUB_CHURCH_TARGETS_ORDERED,
  TARGETS_BY_SCOPE,
  type SubChurchesTargetLevel,
  type WeeklyChurchReportEntryWithAncestors,
} from '../_shared/report-types'

const METRIC_HEADERS = [
  { label: 'Year', key: 'year' },
  { label: 'Week', key: 'week' },
  { label: 'Bussing Attendance', key: 'bussingAttendance' },
  { label: 'Bussing Leader Declaration', key: 'bussingLeaderDeclaration' },
  { label: 'Sprinters', key: 'numberOfSprinters' },
  { label: 'Urvans', key: 'numberOfUrvans' },
  { label: 'Cars', key: 'numberOfCars' },
  { label: 'Bussing Top-Up', key: 'bussingTopUp' },
] as const

const decoratorHeadersFor = (level: SubChurchesTargetLevel) => [
  { key: `${level}_name`, label: level },
  { key: `${level}_leader`, label: `${level} Leader` },
  { key: `${level}_phone`, label: `${level} Leader Phone` },
]

const buildHeaders = (selected: readonly SubChurchesTargetLevel[]) => {
  // Always canonical top-down order so the spreadsheet reads naturally
  // even if the user toggled in arbitrary order.
  const ordered = SUB_CHURCH_TARGETS_ORDERED.filter((l) => selected.includes(l))
  return [
    ...ordered.flatMap(decoratorHeadersFor),
    ...METRIC_HEADERS.map((h) => ({ key: h.key, label: h.label })),
  ]
}

// Mirrors the backend's `trim(coalesce(...))` so a row with only one
// of {firstName, lastName} populated still renders that single token
// rather than collapsing to ''.
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
  row.bussingAttendance = entry.bussingAttendance ?? ''
  row.bussingLeaderDeclaration = entry.bussingLeaderDeclaration ?? ''
  row.numberOfSprinters = entry.numberOfSprinters ?? ''
  row.numberOfUrvans = entry.numberOfUrvans ?? ''
  row.numberOfCars = entry.numberOfCars ?? ''
  row.bussingTopUp = entry.bussingTopUp ?? ''
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
  { key: 'bussingAttendance', label: 'Bussing Att.' },
  { key: 'bussingTopUp', label: 'Top-Up' },
]

const BussingSubChurchesReportPage = () => {
  // We can't read the scope until the hook runs, so seed with the full
  // Oversight target list (the longest valid set) and then prune as soon
  // as we know the scope. The "default = all ticked" rule means each
  // page-mount starts with every available level on.
  const [selectedLevels, setSelectedLevels] = useState<SubChurchesTargetLevel[]>(
    [...TARGETS_BY_SCOPE.Oversight]
  )

  // Deepest ticked = target. selectedLevels is kept in canonical order by
  // the picker's onChange so this is safe.
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
    queriesByScope: BUSSING_SUB_CHURCHES_AT_LEVEL_QUERIES,
    targetLevel: target,
  })

  const availableLevels = scope ? TARGETS_BY_SCOPE[scope] : []

  // Reseed the picker once we know the scope (default = all available
  // ticked). Reseed again only if the scope itself changes — the user's
  // own toggles must not be overwritten on every re-render.
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
  } Bussing by ${target ?? 'Sub-Church'} - ${generatedOn}.csv`

  if (!scope) {
    return (
      <ReportPageShell title="Bussing" highlightWord="Sub-Churches">
        <p className="text-sm text-muted-foreground">
          Sub-church bussing breakdowns aren&apos;t available at your current
          scope.
        </p>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Bussing by Sub-Church"
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
            title={`Bussing by ${target ?? 'Sub-Church'}`}
            description={`Per-week bussing aggregates at the ${
              target?.toLowerCase() ?? 'sub-church'
            } level, with ancestor decoration columns for every ticked level above.`}
            filename={filename}
            loading={loading}
            rows={rows}
            headers={headers}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={target ? previewColumnsFor(selectedLevels, target) : []}
            emptyMessage="No bussing aggregates in the selected range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default BussingSubChurchesReportPage
