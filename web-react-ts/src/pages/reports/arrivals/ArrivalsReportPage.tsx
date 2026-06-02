import { AlertTriangle, FileSpreadsheet, Inbox } from 'lucide-react'

import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { Alert, AlertDescription } from 'components/ui/alert'
import { Skeleton } from 'components/ui/skeleton'
import ArrivalDateSelector from 'components/ArrivalDateSelector/ArrivalDateSelector'
import useSelectedArrivalDate from 'hooks/useSelectedArrivalDate'

import { isArrivalsDownloadLevel } from 'pages/arrivals/utils/buildArrivalsWorkbook'
import useArrivalsExport from 'pages/arrivals/utils/useArrivalsExport'

import ReportPageShell from '../_shared/ReportPageShell'
import ArrivalsReportPreview from './ArrivalsReportPreview'

const DateSection = () => (
  <section className="rounded-xl border border-border bg-card p-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      Bussing date
    </p>
    <div className="mt-3">
      <ArrivalDateSelector />
    </div>
  </section>
)

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

const EmptyState = ({ message }: EmptyStateProps) => (
  <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
    <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Inbox className="size-7" />
    </div>
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-foreground">
        Nothing to preview
      </h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
    <FileSpreadsheet className="size-5 text-muted-foreground/60" />
  </section>
)

const ArrivalsReportPage = () => {
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
        title="Arrivals"
        highlightWord="Report"
        highlightClassName="text-arrivals"
      >
        <p className="text-sm text-muted-foreground">
          Select a church scope to preview the arrivals report.
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
      highlightWord="Arrivals Report"
      highlightClassName="text-arrivals"
      subtitle={`Preview the arrivals snapshot for any Sunday — per-Bacenta detail, per-vehicle detail, and a summary by sub-church at Council and above — then download the full workbook.`}
    >
      <div className="space-y-6">
        <DateSection />

        {!downloadable && (
          <EmptyState
            message="Arrivals download is available at Governorship, Council, Stream, and Campus scopes. Switch your church-in-focus to one of those levels to enable it."
          />
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
            message={`No arrivals data recorded for ${
              payload.churchName || 'this church'
            } on ${dateLabel}. Pick a different Sunday to preview that week.`}
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
