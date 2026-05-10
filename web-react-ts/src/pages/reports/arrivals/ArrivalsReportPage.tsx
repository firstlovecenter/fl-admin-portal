import { FileSpreadsheet } from 'lucide-react'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Card, CardContent } from 'components/ui/card'
import ArrivalDateSelector from 'components/ArrivalDateSelector/ArrivalDateSelector'
import useSelectedArrivalDate from 'hooks/useSelectedArrivalDate'

import DownloadArrivalsButton from 'pages/arrivals/DownloadArrivalsButton'
import { isArrivalsDownloadLevel } from 'pages/arrivals/utils/buildArrivalsWorkbook'

const ArrivalsReportPage = () => {
  const { selectedScope } = useChurchRoleScope()
  const { dateLabel, isCurrent } = useSelectedArrivalDate()

  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchId = selectedScope?.churchId

  const downloadLevel = isArrivalsDownloadLevel(churchType)
    ? churchType
    : null
  const downloadable = downloadLevel !== null && !!churchId

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {churchName || 'Arrivals'}{' '}
            <span className="text-arrivals">Arrivals Report</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Download a comprehensive arrivals snapshot for any Sunday —
            per-Bacenta detail, per-vehicle detail, and a summary by sub-church
            at Council and above.
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bussing date
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {isCurrent ? 'Most recent Sunday' : dateLabel}
                  </p>
                </div>
                <ArrivalDateSelector />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-arrivals/10 text-arrivals">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      Comprehensive arrivals list
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Every Bacenta in {churchName || 'this church'} for the
                      selected date — attendance, leader declaration,
                      vehicle counts, top-up amounts, and per-vehicle
                      transaction status.
                    </p>
                  </div>
                  {downloadable && downloadLevel ? (
                    <DownloadArrivalsButton
                      level={downloadLevel}
                      churchId={churchId}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Arrivals download is available at Governorship, Council,
                      Stream, and Campus scopes. Switch your church-in-focus
                      to one of those levels to enable it.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </main>
    </div>
  )
}

export default ArrivalsReportPage
