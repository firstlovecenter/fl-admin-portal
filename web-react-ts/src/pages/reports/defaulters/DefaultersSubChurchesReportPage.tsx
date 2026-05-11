import { AlertTriangle } from 'lucide-react'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Alert, AlertDescription } from 'components/ui/alert'
import { Card, CardContent } from 'components/ui/card'
import WeekSelector from 'components/WeekSelector/WeekSelector'
import useSelectedWeek from 'hooks/useSelectedWeek'
import { getSubChurchLevel, plural } from 'global-utils'
import type { ChurchLevel } from 'global-types'

import ReportPageShell from 'pages/reports/_shared/ReportPageShell'
import WeeklyReportDownloadCard, {
  sanitizeFilenamePart,
} from 'pages/reports/_shared/WeeklyReportDownloadCard'
import { isDefaultersDownloadLevel } from 'pages/services/defaulters/utils/buildDefaultersWorkbook'
import useDefaultersExport from 'pages/services/defaulters/utils/useDefaultersExport'

const HEADERS = [
  { label: 'Sub-Church', key: 'child' },
  { label: 'Leader', key: 'childLeader' },
  { label: 'Active Bacentas', key: 'activeBacentas' },
  { label: 'Services Filed', key: 'servicesFiled' },
  { label: 'Form Defaulters', key: 'formDefaulters' },
  { label: 'Banked', key: 'banked' },
  { label: 'Banking Defaulters', key: 'bankingDefaulters' },
  { label: 'Cancelled', key: 'cancelled' },
] as const

const PREVIEW_COLUMNS = [
  { key: 'child', label: 'Sub-Church' },
  { key: 'childLeader', label: 'Leader' },
  { key: 'activeBacentas', label: 'Active' },
  { key: 'formDefaulters', label: 'Form Def.' },
  { key: 'bankingDefaulters', label: 'Banking Def.' },
]

const blank = (value: string | number | null | undefined): string =>
  value === null || value === undefined ? '' : String(value)

const DefaultersSubChurchesReportPage = () => {
  const { selectedScope } = useChurchRoleScope()
  const { weekStart, weekLabel, weekShortLabel, isCurrent } = useSelectedWeek()

  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchId = selectedScope?.churchId

  const downloadLevel = isDefaultersDownloadLevel(churchType) ? churchType : null
  // Sub-church breakdown only makes sense at Council+ — at Governorship the
  // sub-church IS the Bacenta, which the main defaulters workbook already
  // covers in full detail.
  const hasSubChurches =
    downloadLevel !== null && downloadLevel !== 'Governorship'
  const subChurchType = hasSubChurches
    ? getSubChurchLevel(churchType as ChurchLevel)
    : ''
  const subChurchPlural = subChurchType ? plural(subChurchType) : ''

  const { payload, loading, error } = useDefaultersExport(
    hasSubChurches ? downloadLevel : null,
    churchId,
    weekStart,
    isCurrent
  )

  const summary = payload?.summary ?? []
  const rows = summary.map((row) => ({
    child: blank(row.child),
    childLeader: blank(row.childLeader),
    activeBacentas: blank(row.activeBacentas),
    servicesFiled: blank(row.servicesFiled),
    formDefaulters: blank(row.formDefaulters),
    banked: blank(row.banked),
    bankingDefaulters: blank(row.bankingDefaulters),
    cancelled: blank(row.cancelled),
  }))

  const filename = `${sanitizeFilenamePart(churchName)} ${
    subChurchType || 'Sub-Church'
  } Defaulters Summary ${weekShortLabel}.csv`

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

  if (!hasSubChurches) {
    return (
      <ReportPageShell
        title={churchName}
        highlightWord={`Defaulters by ${subChurchType || 'Sub-Church'}`}
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
      highlightWord={`Defaulters by ${subChurchType}`}
      highlightClassName="text-defaulters"
      subtitle={`One row per ${subChurchType} under ${
        churchName || 'this church'
      } for the selected week — services filed, form defaulters, banked, banking defaulters, and cancelled.`}
    >
      <div className="space-y-6">
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

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <WeeklyReportDownloadCard
            title={`Defaulters by ${subChurchType}`}
            description={`One row per ${subChurchType} in ${
              churchName || 'this church'
            }. ${subChurchPlural} ranked by name.`}
            filename={filename}
            loading={loading}
            rows={rows}
            headers={HEADERS}
            entriesCount={rows.length}
            rangeLabel={weekShortLabel}
            previewColumns={PREVIEW_COLUMNS}
            emptyMessage={`No defaulters data for ${churchName} in ${weekShortLabel}.`}
          />
        )}
      </div>
    </ReportPageShell>
  )
}

export default DefaultersSubChurchesReportPage
