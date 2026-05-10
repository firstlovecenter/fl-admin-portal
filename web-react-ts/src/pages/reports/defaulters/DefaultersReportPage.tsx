import { FileSpreadsheet } from 'lucide-react'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Card, CardContent } from 'components/ui/card'
import WeekSelector from 'components/WeekSelector/WeekSelector'
import useSelectedWeek from 'hooks/useSelectedWeek'
import ReportPageShell from 'pages/reports/_shared/ReportPageShell'

import DownloadDefaultersButton from 'pages/services/defaulters/DownloadDefaultersButton'
import { isDefaultersDownloadLevel } from 'pages/services/defaulters/utils/buildDefaultersWorkbook'

const DefaultersReportPage = () => {
  const { selectedScope } = useChurchRoleScope()
  const { weekLabel, isCurrent } = useSelectedWeek()

  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchId = selectedScope?.churchId

  const downloadLevel = isDefaultersDownloadLevel(churchType) ? churchType : null
  const downloadable = !!churchId && downloadLevel !== null

  return (
    <ReportPageShell
      title={churchName}
      highlightWord="Defaulters Report"
      highlightClassName="text-defaulters"
      subtitle="Download a comprehensive defaulters list for any week. Includes a per-Bacenta breakdown and, at Council and above, a summary by sub-church."
    >
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
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

          <Card>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-defaulters/10 text-defaulters">
                <FileSpreadsheet className="size-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="font-semibold text-foreground">
                    Comprehensive defaulters list
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Every Bacenta in {churchName || 'this church'} for the
                    selected week — banking status, form submission, attendance,
                    income, and vacation status.
                  </p>
                </div>
                {downloadable && downloadLevel ? (
                  <DownloadDefaultersButton
                    level={downloadLevel}
                    churchId={churchId}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Defaulters download is available at Governorship, Council,
                    Stream, and Campus scopes. Switch your church-in-focus to
                    one of those levels to enable it.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* right column — reserved for future supplementary content */}
        <div className="hidden lg:block" aria-hidden="true" />
      </div>
    </ReportPageShell>
  )
}

export default DefaultersReportPage
