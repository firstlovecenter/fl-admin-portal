import { AlertTriangle, FileSpreadsheet, Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Alert, AlertDescription } from 'components/ui/alert'
import { Skeleton } from 'components/ui/skeleton'
import ArrivalDateSelector from 'components/ArrivalDateSelector/ArrivalDateSelector'
import useSelectedArrivalDate from 'hooks/useSelectedArrivalDate'

import { isArrivalsDownloadLevel } from 'pages/arrivals/utils/buildArrivalsWorkbook'
import useArrivalsExport from 'pages/arrivals/utils/useArrivalsExport'

import ReportPageShell from '../_shared/ReportPageShell'
import ArrivalsReportPreview from './ArrivalsReportPreview'

const DateSection = () => {
  const { t } = useTranslation()
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('reports.arrivals.bussingDate')}
      </p>
      <div className="mt-3">
        <ArrivalDateSelector />
      </div>
    </section>
  )
}

const PreviewSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-12 w-full rounded-md" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
)

type EmptyStateProps = {
  message: string
}

const EmptyState = ({ message }: EmptyStateProps) => {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          {t('reports.arrivals.nothingToPreview')}
        </h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <FileSpreadsheet className="size-5 text-muted-foreground/60" />
    </section>
  )
}

const ArrivalsReportPage = () => {
  const { t } = useTranslation()
  const { selectedScope } = useChurchRoleScope()
  const { arrivalDate, dateLabel } = useSelectedArrivalDate()

  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchId = selectedScope?.churchId

  const downloadLevel = isArrivalsDownloadLevel(churchType) ? churchType : null
  const downloadable = downloadLevel !== null && !!churchId

  const { payload, loading, error } = useArrivalsExport(
    downloadLevel,
    churchId,
    arrivalDate
  )

  if (!selectedScope) {
    return (
      <ReportPageShell
        title={t('reports.arrivals.title')}
        highlightWord={t('reports.arrivals.report')}
        highlightClassName="text-arrivals"
      >
        <p className="text-sm text-muted-foreground">
          {t('reports.arrivals.selectScope')}
        </p>
      </ReportPageShell>
    )
  }

  const hasPayloadData =
    payload &&
    ((payload.detail?.length ?? 0) > 0 || (payload.vehicles?.length ?? 0) > 0)

  return (
    <ReportPageShell
      title={churchName}
      highlightWord={t('reports.arrivals.highlight')}
      highlightClassName="text-arrivals"
      subtitle={t('reports.arrivals.subtitle')}
    >
      <div className="space-y-6">
        <DateSection />

        {!downloadable && (
          <EmptyState message={t('reports.arrivals.unavailableScope')} />
        )}

        {downloadable && loading && <PreviewSkeleton />}

        {downloadable && !loading && error && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {downloadable && !loading && !error && payload && !hasPayloadData && (
          <EmptyState
            message={t('reports.arrivals.noDataForDate', {
              church: payload.churchName || t('reports.shared.thisChurch'),
              date: dateLabel,
            })}
          />
        )}

        {downloadable &&
          !loading &&
          !error &&
          payload &&
          hasPayloadData &&
          downloadLevel &&
          churchId && (
            <ArrivalsReportPreview
              payload={payload}
              level={downloadLevel}
              churchId={churchId}
            />
          )}
      </div>
    </ReportPageShell>
  )
}

export default ArrivalsReportPage
