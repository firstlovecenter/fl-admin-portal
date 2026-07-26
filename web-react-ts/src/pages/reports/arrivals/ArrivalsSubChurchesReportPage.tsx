import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

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

const levelLabel = (level: string, t: TFunction) =>
  t(`shared.churchLevel.${level}`)

const metricHeaders = (t: TFunction) =>
  [
    { label: t('reports.shared.activeBacentas'), key: 'activeBacentas' },
    { label: t('reports.shared.bacentasBussed'), key: 'bacentasWithBussing' },
    { label: t('reports.shared.totalAttendance'), key: 'totalAttendance' },
    {
      label: t('reports.shared.totalLeaderDeclaration'),
      key: 'totalLeaderDeclaration',
    },
    { label: t('reports.shared.sprinters'), key: 'totalSprinters' },
    { label: t('reports.shared.urvans'), key: 'totalUrvans' },
    { label: t('reports.shared.cars'), key: 'totalCars' },
    { label: t('reports.shared.bussingCostGhs'), key: 'totalBussingCost' },
    { label: t('reports.shared.bussingTopUpGhs'), key: 'totalBussingTopUp' },
  ] as const

const decoratorHeadersFor = (level: ArrivalsTargetLevel, t: TFunction) => {
  const label = levelLabel(level, t)
  return [
    { key: `${level}_name`, label },
    {
      key: `${level}_leader`,
      label: t('reports.shared.levelLeader', { level: label }),
    },
    {
      key: `${level}_phone`,
      label: t('reports.shared.levelLeaderPhone', { level: label }),
    },
  ]
}

const buildHeaders = (
  selected: readonly ArrivalsTargetLevel[],
  t: TFunction
) => {
  const ordered = SUB_CHURCH_TARGETS_ORDERED.filter(
    (l): l is ArrivalsTargetLevel =>
      l !== 'Campus' && selected.includes(l as ArrivalsTargetLevel)
  )
  return [
    ...ordered.flatMap((l) => decoratorHeadersFor(l, t)),
    ...metricHeaders(t).map((h) => ({ key: h.key, label: h.label })),
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

const previewColumnsFor = (
  selected: readonly ArrivalsTargetLevel[],
  t: TFunction
) => {
  const ordered = SUB_CHURCH_TARGETS_ORDERED.filter(
    (l): l is ArrivalsTargetLevel =>
      l !== 'Campus' && selected.includes(l as ArrivalsTargetLevel)
  )
  return [
    ...ordered.flatMap((l) => {
      const label = levelLabel(l, t)
      return [
        { key: `${l}_name`, label },
        {
          key: `${l}_leader`,
          label: t('reports.shared.levelLeader', { level: label }),
        },
      ]
    }),
    { key: 'bacentasWithBussing', label: t('reports.shared.bussed') },
    { key: 'totalAttendance', label: t('reports.shared.attendance') },
    { key: 'totalBussingTopUp', label: t('reports.shared.topUp') },
  ]
}

const levelKey = (levels: readonly ArrivalsTargetLevel[]) => levels.join(',')

const ArrivalsSubChurchesReportPage = () => {
  const { t } = useTranslation()
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

  const headers = useMemo(
    () => buildHeaders(appliedLevels, t),
    [appliedLevels, t]
  )
  const previewColumns = useMemo(
    () => (appliedTarget ? previewColumnsFor(appliedLevels, t) : []),
    [appliedLevels, appliedTarget, t]
  )

  const targetLabel = appliedTarget
    ? levelLabel(appliedTarget, t)
    : t('reports.shared.subChurch')
  const byTitle = t('reports.shared.byLevel', {
    report: t('reports.arrivals.reportName'),
    level: targetLabel,
  })

  const filename = useMemo(() => {
    const safe = sanitizeFilenamePart(churchName)
    return `${safe} ${appliedTarget ?? 'Sub-Church'} Arrivals Summary ${arrivalDate}.csv`
  }, [churchName, appliedTarget, arrivalDate])

  if (!selectedScope) {
    return (
      <ReportPageShell
        title={t('reports.arrivals.title')}
        highlightWord={t('reports.arrivals.bySubChurch')}
        highlightClassName="text-arrivals"
      >
        <p className="text-sm text-muted-foreground">
          {t('reports.shared.selectScopeBreakdown')}
        </p>
      </ReportPageShell>
    )
  }

  if (!pickerScope) {
    return (
      <ReportPageShell
        title={churchName}
        highlightWord={t('reports.arrivals.arrivalsBySubChurch')}
        highlightClassName="text-arrivals"
      >
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            {t('reports.arrivals.subChurchUnavailable')}
          </AlertDescription>
        </Alert>
      </ReportPageShell>
    )
  }

  return (
    <ReportPageShell
      title={churchName}
      highlightWord={byTitle}
      highlightClassName="text-arrivals"
      subtitle={t('reports.shared.pickerSubtitle')}
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
            {t('reports.arrivals.bussingDate')}
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
            title={byTitle}
            description={t('reports.shared.oneRowPerLevel', {
              level: appliedTarget
                ? levelLabel(appliedTarget, t)
                : t('reports.shared.subChurchFallback'),
              church: churchName || t('reports.shared.thisChurch'),
              period: dateLabel,
            })}
            filename={filename}
            loading={loading}
            rows={rows}
            headers={headers}
            entriesCount={rows.length}
            rangeLabel={dateLabel}
            previewColumns={previewColumns}
            emptyMessage={t('reports.arrivals.emptyMessage', {
              church: churchName,
              date: dateLabel,
            })}
          />
        )}
      </div>
    </ReportPageShell>
  )
}

export default ArrivalsSubChurchesReportPage
