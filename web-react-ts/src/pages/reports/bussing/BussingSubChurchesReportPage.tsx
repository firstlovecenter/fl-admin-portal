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
    { key: 'bussingAttendance', label: 'Bussing Att.' },
    { key: 'bussingTopUp', label: 'Top-Up' },
  ]
}

// Stable string fingerprint of a level list. Used to compare draft vs
// applied — comparing the arrays by reference would always show "dirty"
// because the picker emits a new array on every toggle.
const levelKey = (levels: readonly SubChurchesTargetLevel[]) =>
  levels.join(',')

const BussingSubChurchesReportPage = () => {
  const defaults = useMemo(() => defaultRangeIsoStrings(), [])

  // Draft state — what the user has changed locally but not yet applied.
  // The query NEVER reads these directly; only the applied snapshot drives
  // the fetch. That way the user can stage multiple filter changes (un-
  // tick two levels + nudge the date range) and commit them as one
  // request when they hit Apply.
  const [draftLevels, setDraftLevels] = useState<SubChurchesTargetLevel[]>(
    [...TARGETS_BY_SCOPE.Oversight]
  )
  const [draftStart, setDraftStart] = useState(defaults.start)
  const [draftEnd, setDraftEnd] = useState(defaults.end)

  // Applied snapshot — the actual query inputs. Updated on Apply click
  // (or on first mount via the scope-seed effect below).
  const [appliedLevels, setAppliedLevels] = useState<
    SubChurchesTargetLevel[]
  >([...TARGETS_BY_SCOPE.Oversight])
  const [appliedStart, setAppliedStart] = useState(defaults.start)
  const [appliedEnd, setAppliedEnd] = useState(defaults.end)

  // Deepest ticked = target. selectedLevels stays in canonical order so
  // last-index is always correct.
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
    queriesByScope: BUSSING_SUB_CHURCHES_AT_LEVEL_QUERIES,
    targetLevel: appliedTarget,
    startDate: appliedStart,
    endDate: appliedEnd,
  })

  const availableLevels = scope ? TARGETS_BY_SCOPE[scope] : []

  // Seed BOTH draft and applied exactly once per scope. Without the ref
  // guard, every checkbox click was reseeding back to all-ticked.
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
  // Memoised so the prop ref handed to WeeklyReportDownloadCard is
  // stable between renders — every fresh array reference invalidates
  // the card's `columns` useMemo and triggers a TanStack Table rebuild,
  // which in this layout was cascading into a render storm on click.
  const previewColumns = useMemo(
    () => (appliedTarget ? previewColumnsFor(appliedLevels) : []),
    [appliedLevels, appliedTarget]
  )

  // Generated-on is intentionally captured once per scope-mount; without
  // memoisation, `new Date()` runs every render and `filename` would
  // change reference each frame — making `CSVLink` rebuild its data URI
  // on every keystroke and contributing to the freeze.
  const filename = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const generatedOn = getHumanReadableDate(today) ?? today
    const safeChurchName = sanitizeFilenamePart(churchName)
    return `${safeChurchName ? `${safeChurchName} ` : ''}${
      scope ?? ''
    } Bussing by ${appliedTarget ?? 'Sub-Church'} - ${generatedOn}.csv`
  }, [churchName, scope, appliedTarget])

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
            title={`Bussing by ${appliedTarget ?? 'Sub-Church'}`}
            description={`Per-week bussing aggregates at the ${
              appliedTarget?.toLowerCase() ?? 'sub-church'
            } level, with ancestor decoration columns for every ticked level above.`}
            filename={filename}
            loading={loading}
            rows={rows}
            headers={headers}
            entriesCount={entries.length}
            rangeLabel={rangeLabel ?? undefined}
            previewColumns={previewColumns}
            emptyMessage="No bussing aggregates in the selected range."
          />
        </ApolloWrapper>
      </div>
    </ReportPageShell>
  )
}

export default BussingSubChurchesReportPage
