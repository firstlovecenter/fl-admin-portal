import { FileSpreadsheet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Card, CardContent } from 'components/ui/card'
import WeekSelector from 'components/WeekSelector/WeekSelector'
import useSelectedWeek from 'hooks/useSelectedWeek'
import ReportPageShell from 'pages/reports/_shared/ReportPageShell'

import DownloadDefaultersButton from 'pages/services/defaulters/DownloadDefaultersButton'
import { isDefaultersDownloadLevel } from 'pages/services/defaulters/utils/buildDefaultersWorkbook'

const DefaultersReportPage = () => {
  const { t } = useTranslation()
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
      highlightWord={t('reports.defaulters.highlight')}
      highlightClassName="text-defaulters"
      subtitle={t('reports.defaulters.subtitle')}
    >
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('reports.shared.weekSection')}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {isCurrent ? t('reports.shared.currentWeek') : weekLabel}
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
                    {t('reports.defaulters.listTitle')}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t('reports.defaulters.listDescription', {
                      church: churchName || t('reports.shared.thisChurch'),
                    })}
                  </p>
                </div>
                {downloadable && downloadLevel ? (
                  <DownloadDefaultersButton
                    level={downloadLevel}
                    churchId={churchId}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t('reports.defaulters.unavailableScope')}
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
