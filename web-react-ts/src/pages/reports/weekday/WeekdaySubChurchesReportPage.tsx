import { useState, useMemo, useEffect, useRef } from 'react'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { getHumanReadableDate } from 'global-utils'
import ApplyBar from '../_shared/ApplyBar'
import DateRangePicker from '../_shared/DateRangePicker'
import ReportPageShell from '../_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from '../_shared/WeeklyReportDownloadCard'
import SubChurchLevelPicker from '../_shared/SubChurchLevelPicker'
import { useSubChurchesAtLevelQuery } from '../_shared/useSubChurchesAtLevelQuery'
import { defaultRangeIsoStrings } from '../_shared/week-utils'
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

// Preview includes Name + Leader for every ticked level (canonical top-
// down: ancestors first, target last), then a handful of metric columns.
// Phone stays out of the preview to keep the table from running off the
// right edge — the full triplet (Name / Leader / Leader Phone) is still
// in the downloaded CSV.
const previewColumnsFor = (
  selected: readonly SubChurchesTargetLevel[]
) => {
  const ordered = SUB_CHURCH_TARGETS_ORDERED.filter((l) => selected.includes(l))
  return [
    ...ordered.flatMap((l) => [
      { key: `${l}_name`, label: l },
      { key: `${l}_leader`, label: `${l} Leader` },
    ]),
    { key: 'year', label: 'Year' },
    { key: 'week', label: 'Week' },
    { key: 'serviceIncome', label: 'Income' },
    { key: 'serviceAttendance', label: 'Attendance' },
  ]
}

const levelKey = (levels: readonly SubChurchesTargetLevel[]) =>
  levels.join(',')

const WeekdaySubChurchesReportPage = () => {
  const defaults = useMemo(() => defaultRangeIsoStrings(), [])

  const [draftLevels, setDraftLevels] = useState<SubChurchesTargetLevel[]>(
    [...TARGETS_BY_SCOPE.Oversight]
  )
  const [draftStart, setDraftStart] = useState(defaults.start)
  const [draftEnd, setDraftEnd] = useState(defaults.end)

  const [appliedLevels, setAppliedLevels] = useState<
    SubChurchesTargetLevel[]
  >([...TARGETS_BY_SCOPE.Oversight])
  const [appliedStart, setAppliedStart] = useState(defaults.start)
  const [appliedEnd, setAppliedEnd] = useState(defaults.end)

  const appliedTarget =
    appliedLevels[appliedLevels.length - 1] ?? null

  const {
    loading,
    error,
    entries,
    scope,
    churchName,
    rangeLabel,
  } = useSubChurchesAtLevelQuery({
    queriesByScope: WEEKDAY_SUB_CHURCHES_AT_LEVEL_QUERIES,
    targetLevel: appliedTarget,
    startDate: appliedStart,
    endDate: appliedEnd,
  })

  const availableLevels = scope ? TARGETS_BY_SCOPE[scope] : []

  // Seed BOTH draft and applied exactly once per scope. See
  // BussingSubChurchesReportPage for the full rationale.
  const seededScopeRef = useRef<string | null>(null)
  useEffect(() => {
    if (!scope || seededScopeRef.current === scope) return
    seededScopeRef.current = scope
    const all = [...TARGETS_BY_SCOPE[scope]]
    setDraftLevels(all)
    setAppliedLevels(all)
  }, [scope])

  const isDirty =
    levelKey(draftLevels) !== levelKey(appliedLevels) ||
    draftStart !== appliedStart ||
    draftEnd !== appliedEnd

  const applyFilters = () => {
    setAppliedLevels(draftLevels)
    setAppliedStart(draftStart)
    setAppliedEnd(draftEnd)
  }

  const discardChanges = () => {
    setDraftLevels(appliedLevels)
    setDraftStart(appliedStart)
    setDraftEnd(appliedEnd)
  }

  const headers = useMemo(
    () => buildHeaders(appliedLevels),
    [appliedLevels]
  )
  const rows = useMemo(
    () =>
      appliedTarget
        ? entries.map((e) => buildRow(e, appliedLevels, appliedTarget))
        : [],
    [entries, appliedLevels, appliedTarget]
  )
  // Stable ref so the card's `columns` useMemo and TanStack Table don't
  // rebuild on every parent render. See BussingSubChurchesReportPage
  // for the full freeze-cause writeup.
  const previewColumns = useMemo(
    () => (appliedTarget ? previewColumnsFor(appliedLevels) : []),
    [appliedLevels, appliedTarget]
  )

  const filename = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const generatedOn = getHumanReadableDate(today) ?? today
    const safeChurchName = sanitizeFilenamePart(churchName)
    return `${safeChurchName ? `${safeChurchName} ` : ''}${
      scope ?? ''
    } Weekday by ${appliedTarget ?? 'Sub-Church'} - ${generatedOn}.csv`
  }, [churchName, scope, appliedTarget])

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
      subtitle="Pick the row level and which ancestor columns to include, then click Apply to refresh the report."
    >
      <div className="space-y-6">
        <SubChurchLevelPicker
          availableLevels={availableLevels}
          selectedLevels={draftLevels}
          onChange={setDraftLevels}
        />

        <DateRangePicker
          startDate={draftStart}
          endDate={draftEnd}
          onStartDateChange={setDraftStart}
          onEndDateChange={setDraftEnd}
        />

        <ApplyBar
          isDirty={isDirty}
          onApply={applyFilters}
          onDiscard={discardChanges}
        />

        <ApolloWrapper data={entries} loading={loading} error={error} placeholder>
          <WeeklyReportDownloadCard
            title={`Weekday by ${appliedTarget ?? 'Sub-Church'}`}
            description={`Per-week weekday attendance and income at the ${
              appliedTarget?.toLowerCase() ?? 'sub-church'
            } level, with ancestor decoration columns for every ticked level above.`}
            filename={filename}
            loading={loading}
            rows={rows}
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

export default WeekdaySubChurchesReportPage
