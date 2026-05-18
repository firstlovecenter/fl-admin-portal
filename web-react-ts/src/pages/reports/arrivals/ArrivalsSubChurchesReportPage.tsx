import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Alert, AlertDescription } from 'components/ui/alert'
import ArrivalDateSelector from 'components/ArrivalDateSelector/ArrivalDateSelector'
import useSelectedArrivalDate from 'hooks/useSelectedArrivalDate'

import ApplyBar from 'pages/reports/_shared/ApplyBar'
import ReportPageShell from 'pages/reports/_shared/ReportPageShell'
import SubChurchLevelPicker from 'pages/reports/_shared/SubChurchLevelPicker'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from 'pages/reports/_shared/WeeklyReportDownloadCard'
import {
  SUB_CHURCH_TARGETS_ORDERED,
  type SubChurchesTargetLevel,
} from 'pages/reports/_shared/report-types'
import { isArrivalsDownloadLevel } from 'pages/arrivals/utils/buildArrivalsWorkbook'
import type {
  ArrivalsAncestorRow,
  ArrivalsSummaryAtLevelRow,
} from 'pages/arrivals/utils/buildArrivalsWorkbook'
import useArrivalsExport, {
  type ArrivalsTargetLevel,
} from 'pages/arrivals/utils/useArrivalsExport'

// Arrivals supports the same scope subset as Defaulters (Campus / Stream
// / Council). See backend `ARRIVALS_SUMMARY_AT_LEVEL` for the wired combos.
type ArrivalsScope = 'Campus' | 'Stream' | 'Council'

const TARGETS_BY_SCOPE: Record<ArrivalsScope, readonly ArrivalsTargetLevel[]> =
  {
    Campus: ['Stream', 'Council', 'Governorship'],
    Stream: ['Council', 'Governorship'],
    Council: ['Governorship'],
  }

const isArrivalsScope = (value: string): value is ArrivalsScope =>
  value === 'Campus' || value === 'Stream' || value === 'Council'

const METRIC_HEADERS = [
  { label: 'Active Bacentas', key: 'activeBacentas' },
  { label: 'Bacentas Bussed', key: 'bacentasWithBussing' },
  { label: 'Total Attendance', key: 'totalAttendance' },
  { label: 'Total Leader Declaration', key: 'totalLeaderDeclaration' },
  { label: 'Sprinters', key: 'totalSprinters' },
  { label: 'Urvans', key: 'totalUrvans' },
  { label: 'Cars', key: 'totalCars' },
  { label: 'Bussing Cost (GHS)', key: 'totalBussingCost' },
  { label: 'Bussing Top-Up (GHS)', key: 'totalBussingTopUp' },
] as const

const decoratorHeadersFor = (level: ArrivalsTargetLevel) => [
  { key: `${level}_name`, label: level },
  { key: `${level}_leader`, label: `${level} Leader` },
  { key: `${level}_phone`, label: `${level} Leader Phone` },
]

const buildHeaders = (selected: readonly ArrivalsTargetLevel[]) => {
  const ordered = SUB_CHURCH_TARGETS_ORDERED.filter(
    (l): l is ArrivalsTargetLevel =>
      l !== 'Campus' && selected.includes(l as ArrivalsTargetLevel)
  )
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
  entry: ArrivalsSummaryAtLevelRow,
  selected: readonly ArrivalsTargetLevel[],
  target: ArrivalsTargetLevel
): Record<string, string | number> => {
  const row: Record<string, string | number> = {}
  for (const lvl of selected) {
    if (lvl === target) {
      row[`${lvl}_name`] = entry.targetName ?? ''
      row[`${lvl}_leader`] = joinName(
        entry.targetLeaderFirstName,
        entry.targetLeaderLastName
      )
      row[`${lvl}_phone`] = entry.targetLeaderPhone ?? ''
    } else {
      const a: ArrivalsAncestorRow | undefined = entry.ancestors.find(
        (x) => x.level === lvl
      )
      row[`${lvl}_name`] = a?.name ?? ''
      row[`${lvl}_leader`] = joinName(a?.leaderFirstName, a?.leaderLastName)
      row[`${lvl}_phone`] = a?.leaderPhone ?? ''
    }
  }
  row.activeBacentas = entry.activeBacentas ?? ''
  row.bacentasWithBussing = entry.bacentasWithBussing ?? ''
  row.totalAttendance = entry.totalAttendance ?? ''
  row.totalLeaderDeclaration = entry.totalLeaderDeclaration ?? ''
  row.totalSprinters = entry.totalSprinters ?? ''
  row.totalUrvans = entry.totalUrvans ?? ''
  row.totalCars = entry.totalCars ?? ''
  row.totalBussingCost = entry.totalBussingCost ?? ''
  row.totalBussingTopUp = entry.totalBussingTopUp ?? ''
  return row
}

const previewColumnsFor = (selected: readonly ArrivalsTargetLevel[]) => {
  const ordered = SUB_CHURCH_TARGETS_ORDERED.filter(
    (l): l is ArrivalsTargetLevel =>
      l !== 'Campus' && selected.includes(l as ArrivalsTargetLevel)
  )
  return [
    ...ordered.flatMap((l) => [
      { key: `${l}_name`, label: l },
      { key: `${l}_leader`, label: `${l} Leader` },
    ]),
    { key: 'bacentasWithBussing', label: 'Bussed' },
    { key: 'totalAttendance', label: 'Attendance' },
    { key: 'totalBussingTopUp', label: 'Top-Up' },
  ]
}

const levelKey = (levels: readonly ArrivalsTargetLevel[]) => levels.join(',')

const ArrivalsSubChurchesReportPage = () => {
  const { selectedScope } = useChurchRoleScope()
  const { arrivalDate, dateLabel } = useSelectedArrivalDate()

  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchId = selectedScope?.churchId

  const pickerScope = isArrivalsScope(churchType)
    ? (churchType as ArrivalsScope)
    : null

  const initialTargets = useMemo<ArrivalsTargetLevel[]>(
    () => (pickerScope ? [...TARGETS_BY_SCOPE[pickerScope]] : []),
    [pickerScope]
  )

  const [draftLevels, setDraftLevels] = useState<ArrivalsTargetLevel[]>(
    initialTargets
  )
  const [appliedLevels, setAppliedLevels] = useState<ArrivalsTargetLevel[]>(
    initialTargets
  )

  // Seed once per scope — see BussingSubChurchesReportPage for the
  // freeze-cause writeup.
  const seededScopeRef = useRef<string | null>(null)
  useEffect(() => {
    if (!pickerScope || seededScopeRef.current === pickerScope) return
    seededScopeRef.current = pickerScope
    const all = [...TARGETS_BY_SCOPE[pickerScope]]
    setDraftLevels(all)
    setAppliedLevels(all)
  }, [pickerScope])

  const appliedTarget = appliedLevels[appliedLevels.length - 1] ?? null

  // arrivalDate flows through `useSelectedArrivalDate` (shared with the
  // dashboards) — we don't gate it behind Apply. Only the picker is
  // staged.
  const isDirty = levelKey(draftLevels) !== levelKey(appliedLevels)

  const applyFilters = () => setAppliedLevels(draftLevels)
  const discardChanges = () => setDraftLevels(appliedLevels)

  const downloadLevel = isArrivalsDownloadLevel(churchType) ? churchType : null
  const { payload, loading, error } = useArrivalsExport(
    pickerScope ? downloadLevel : null,
    churchId,
    arrivalDate,
    appliedTarget
  )

  const rows = useMemo(() => {
    if (!appliedTarget || !payload?.summaryAtLevel) return []
    return payload.summaryAtLevel.map((e) =>
      buildRow(e, appliedLevels, appliedTarget)
    )
  }, [payload, appliedLevels, appliedTarget])

  const headers = useMemo(() => buildHeaders(appliedLevels), [appliedLevels])
  const previewColumns = useMemo(
    () => (appliedTarget ? previewColumnsFor(appliedLevels) : []),
    [appliedLevels, appliedTarget]
  )

  const filename = useMemo(() => {
    const safe = sanitizeFilenamePart(churchName)
    return `${safe} ${appliedTarget ?? 'Sub-Church'} Arrivals Summary ${arrivalDate}.csv`
  }, [churchName, appliedTarget, arrivalDate])

  if (!selectedScope) {
    return (
      <ReportPageShell
        title="Arrivals"
        highlightWord="by Sub-Church"
        highlightClassName="text-arrivals"
      >
        <p className="text-sm text-muted-foreground">
          Select a church scope to download the breakdown.
        </p>
      </ReportPageShell>
    )
  }

  if (!pickerScope) {
    return (
      <ReportPageShell
        title={churchName}
        highlightWord="Arrivals by Sub-Church"
        highlightClassName="text-arrivals"
      >
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            The by-sub-church arrivals breakdown is available at Council,
            Stream, and Campus scopes. Switch your church-in-focus to one of
            those levels to enable it.
          </AlertDescription>
        </Alert>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord={`Arrivals by ${appliedTarget ?? 'Sub-Church'}`}
      highlightClassName="text-arrivals"
      subtitle="Pick the row level and which ancestor columns to include, then click Apply to refresh the report."
    >
      <div className="space-y-6">
        <SubChurchLevelPicker
          availableLevels={
            TARGETS_BY_SCOPE[pickerScope] as readonly SubChurchesTargetLevel[]
          }
          selectedLevels={draftLevels as readonly SubChurchesTargetLevel[]}
          onChange={(next) =>
            setDraftLevels(next as ArrivalsTargetLevel[])
          }
        />

        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bussing date
          </p>
          <div className="mt-3">
            <ArrivalDateSelector />
          </div>
        </section>

        <ApplyBar
          isDirty={isDirty}
          onApply={applyFilters}
          onDiscard={discardChanges}
        />

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <WeeklyReportDownloadCard
            title={`Arrivals by ${appliedTarget ?? 'Sub-Church'}`}
            description={`One row per ${
              appliedTarget?.toLowerCase() ?? 'sub-church'
            } in ${churchName || 'this church'} for ${dateLabel}, with ancestor decoration columns for every ticked level above.`}
            filename={filename}
            loading={loading}
            rows={rows}
            headers={headers}
            entriesCount={rows.length}
            rangeLabel={dateLabel}
            previewColumns={previewColumns}
            emptyMessage={`No arrivals data for ${churchName} on ${dateLabel}.`}
          />
        )}
      </div>
    </ReportPageShell>
  )
}

export default ArrivalsSubChurchesReportPage
