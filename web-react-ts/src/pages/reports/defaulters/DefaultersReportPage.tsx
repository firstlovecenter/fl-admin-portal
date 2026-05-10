import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import WeekSelector from 'components/WeekSelector/WeekSelector'
import useSelectedWeek from 'hooks/useSelectedWeek'

import DownloadDefaultersButton from 'pages/services/defaulters/DownloadDefaultersButton'
import { isDefaultersDownloadLevel } from 'pages/services/defaulters/utils/buildDefaultersWorkbook'

const DefaultersReportPage = () => {
  const navigate = useNavigate()
  const { selectedScope } = useChurchRoleScope()
  const { weekLabel, isCurrent } = useSelectedWeek()

  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchId = selectedScope?.churchId

  const downloadable = isDefaultersDownloadLevel(churchType) && !!churchId
  const downloadLevel = isDefaultersDownloadLevel(churchType)
    ? churchType
    : null

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reports')}
          className="self-start text-muted-foreground"
        >
          <ArrowLeft />
          Back to reports
        </Button>

        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {churchName || 'Defaulters'}{' '}
            <span className="text-defaulters">Defaulters Report</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Download a comprehensive defaulters list for any week. Includes a
            per-Bacenta breakdown and, at Council and above, a summary by
            sub-church.
          </p>
        </header>

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
      </main>
    </div>
  )
}

export default DefaultersReportPage
