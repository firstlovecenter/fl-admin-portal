import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Alert, AlertDescription } from 'components/ui/alert'
import { Card, CardContent } from 'components/ui/card'
import WeekSelector from 'components/WeekSelector/WeekSelector'
import useSelectedWeek from 'hooks/useSelectedWeek'

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
import { isDefaultersDownloadLevel } from 'pages/services/defaulters/utils/buildDefaultersWorkbook'
import type {
  DefaultersSummaryAtLevelRow,
  DefaultersAncestorRow,
} from 'pages/services/defaulters/utils/buildDefaultersWorkbook'
import useDefaultersExport, {
  type DefaultersTargetLevel,
} from 'pages/services/defaulters/utils/useDefaultersExport'

// Defaulters supports a strict subset of the picker target levels —
// Campus / Stream / Council scopes, target rolls down to Governorship at
// most. Mirrors backend `DEFAULTERS_SUMMARY_AT_LEVEL` in
// api/src/resolvers/downloads/defaulters-cypher.ts.
type DefaultersScope = 'Campus' | 'Stream' | 'Council'

const TARGETS_BY_SCOPE: Record<
  DefaultersScope,
  readonly DefaultersTargetLevel[]
> = {
  Campus: ['Stream', 'Council', 'Governorship'],
  Stream: ['Council', 'Governorship'],
  Council: ['Governorship'],
}

const isDefaultersScope = (value: string): value is DefaultersScope =>
  value === 'Campus' || value === 'Stream' || value === 'Council'

const METRIC_HEADERS = [
  { label: 'Active Bacentas', key: 'activeBacentas' },
  { label: 'Services Filed', key: 'servicesFiled' },
  { label: 'Form Defaulters', key: 'formDefaulters' },
  { label: 'Banked', key: 'banked' },
  { label: 'Banking Defaulters', key: 'bankingDefaulters' },
  { label: 'Cancelled', key: 'cancelled' },
] as const

const decoratorHeadersFor = (level: DefaultersTargetLevel) => [
  { key: `${level}_name`, label: level },
  { key: `${level}_leader`, label: `${level} Leader` },
  { key: `${level}_phone`, label: `${level} Leader Phone` },
]

const buildHeaders = (selected: readonly DefaultersTargetLevel[]) => {
  const ordered = SUB_CHURCH_TARGETS_ORDERED.filter(
    (l): l is DefaultersTargetLevel =>
      l !== 'Campus' && selected.includes(l as DefaultersTargetLevel)
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
  entry: DefaultersSummaryAtLevelRow,
  selected: readonly DefaultersTargetLevel[],
  target: DefaultersTargetLevel
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
      const a: DefaultersAncestorRow | undefined = entry.ancestors.find(
        (x) => x.level === lvl
      )
      row[`${lvl}_name`] = a?.name ?? ''
      row[`${lvl}_leader`] = joinName(a?.leaderFirstName, a?.leaderLastName)
      row[`${lvl}_phone`] = a?.leaderPhone ?? ''
    }
  }
  row.activeBacentas = entry.activeBacentas ?? ''
  row.servicesFiled = entry.servicesFiled ?? ''
  row.formDefaulters = entry.formDefaulters ?? ''
  row.banked = entry.banked ?? ''
  row.bankingDefaulters = entry.bankingDefaulters ?? ''
  row.cancelled = entry.cancelled ?? ''
  return row
}

// Preview = Name + Leader per ticked level (top-down) plus the headline
// metric pair. Phone is omitted on screen for layout reasons — the CSV
// still carries it.
const previewColumnsFor = (selected: readonly DefaultersTargetLevel[]) => {
  const ordered = SUB_CHURCH_TARGETS_ORDERED.filter(
    (l): l is DefaultersTargetLevel =>
      l !== 'Campus' && selected.includes(l as DefaultersTargetLevel)
  )
  return [
    ...ordered.flatMap((l) => [
      { key: `${l}_name`, label: l },
      { key: `${l}_leader`, label: `${l} Leader` },
    ]),
    { key: 'activeBacentas', label: 'Active' },
    { key: 'formDefaulters', label: 'Form Def.' },
    { key: 'bankingDefaulters', label: 'Banking Def.' },
  ]
}

const levelKey = (levels: readonly DefaultersTargetLevel[]) => levels.join(',')

const DefaultersSubChurchesReportPage = () => {
  const { selectedScope } = useChurchRoleScope()
  const { weekStart, weekLabel, weekShortLabel, isCurrent } = useSelectedWeek()

  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchId = selectedScope?.churchId

  // Picker is only meaningful when scope has aggregate-backed descendants
  // — Campus / Stream / Council. Governorship scope can only roll down to
  // Bacenta, which we exclude by policy (same as Bussing/Weekday).
  const pickerScope =
    isDefaultersScope(churchType) ? (churchType as DefaultersScope) : null

  const initialTargets = useMemo<DefaultersTargetLevel[]>(
    () => (pickerScope ? [...TARGETS_BY_SCOPE[pickerScope]] : []),
    [pickerScope]
  )

  const [draftLevels, setDraftLevels] = useState<DefaultersTargetLevel[]>(
    initialTargets
  )
  const [appliedLevels, setAppliedLevels] = useState<DefaultersTargetLevel[]>(
    initialTargets
  )

  // Seed once per scope — without the ref guard the picker would reseed
  // on every render (see BussingSubChurchesReportPage for the freeze
  // writeup).
  const seededScopeRef = useRef<string | null>(null)
  useEffect(() => {
    if (!pickerScope || seededScopeRef.current === pickerScope) return
    seededScopeRef.current = pickerScope
    const all = [...TARGETS_BY_SCOPE[pickerScope]]
    setDraftLevels(all)
    setAppliedLevels(all)
  }, [pickerScope])

  const appliedTarget = appliedLevels[appliedLevels.length - 1] ?? null

  // We don't gate weekStart with the Apply bar — the Defaulters page has
  // always used `useSelectedWeek` (a stateful component shared with the
  // dashboards) and re-fetches on every selection. Only the picker is
  // staged. Apply commits the picker draft; week changes still fire
  // immediately.
  const isDirty = levelKey(draftLevels) !== levelKey(appliedLevels)

  const applyFilters = () => setAppliedLevels(draftLevels)
  const discardChanges = () => setDraftLevels(appliedLevels)

  const downloadLevel = isDefaultersDownloadLevel(churchType) ? churchType : null
  const { payload, loading, error } = useDefaultersExport(
    pickerScope ? downloadLevel : null,
    churchId,
    weekStart,
    isCurrent,
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
    return `${safe} ${appliedTarget ?? 'Sub-Church'} Defaulters Summary ${weekShortLabel}.csv`
  }, [churchName, appliedTarget, weekShortLabel])

  if (!selectedScope) {
    return (
      <ReportPageShell
        title="Defaulters"
        highlightWord="by Sub-Church"
        highlightClassName="text-defaulters"
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
        highlightWord="Defaulters by Sub-Church"
        highlightClassName="text-defaulters"
      >
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            The by-sub-church defaulters breakdown is available at Council,
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
      highlightWord={`Defaulters by ${appliedTarget ?? 'Sub-Church'}`}
      highlightClassName="text-defaulters"
      subtitle="Pick the row level and which ancestor columns to include, then click Apply to refresh the report."
    >
      <div className="space-y-6">
        <SubChurchLevelPicker
          availableLevels={
            TARGETS_BY_SCOPE[pickerScope] as readonly SubChurchesTargetLevel[]
          }
          selectedLevels={draftLevels as readonly SubChurchesTargetLevel[]}
          onChange={(next) =>
            setDraftLevels(next as DefaultersTargetLevel[])
          }
        />

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Week
              </p>
              <p className="mt-1 text-sm text-foreground">
                {isCurrent ? 'Current week' : weekLabel}
              </p>
            </div>
            <WeekSelector />
          </CardContent>
        </Card>

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
            title={`Defaulters by ${appliedTarget ?? 'Sub-Church'}`}
            description={`One row per ${
              appliedTarget?.toLowerCase() ?? 'sub-church'
            } in ${churchName || 'this church'} for ${weekShortLabel}, with ancestor decoration columns for every ticked level above.`}
            filename={filename}
            loading={loading}
            rows={rows}
            headers={headers}
            entriesCount={rows.length}
            rangeLabel={weekShortLabel}
            previewColumns={previewColumns}
            emptyMessage={`No defaulters data for ${churchName} in ${weekShortLabel}.`}
          />
        )}
      </div>
    </ReportPageShell>
  )
}

export default DefaultersSubChurchesReportPage
