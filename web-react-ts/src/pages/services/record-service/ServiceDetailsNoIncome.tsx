import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from 'components/ui/dialog'
import { Skeleton } from 'components/ui/skeleton'
import CurrencySpan from 'components/CurrencySpan'
import { Church, ServiceRecord } from 'global-types'
import { parseNeoTime } from 'jd-date-utils'
import { type ReactNode, useEffect } from 'react'
import { VisuallyHidden } from 'radix-ui'
import { useNavigate } from 'react-router'

type ServiceDetailsProps = {
  service: ServiceRecord
  church: Church
  loading: boolean
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">
        {children}
      </span>
    </div>
  )
}

function PhotoTile({
  src,
  label,
  shape = 'rect',
}: {
  src: string
  label: string
  shape?: 'rect' | 'square'
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Expand ${label}`}
          className={
            shape === 'square'
              ? 'group relative aspect-square w-full overflow-hidden rounded-lg ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              : 'group relative h-44 w-full overflow-hidden rounded-lg ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          }
        >
          <img
            src={src}
            alt={label}
            loading="lazy"
            className="h-full w-full object-cover object-top transition group-hover:scale-[1.02] group-active:scale-[0.99]"
          />
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl border-0 bg-transparent p-0 shadow-none sm:max-w-3xl"
      >
        <VisuallyHidden.Root>
          <DialogTitle>{label}</DialogTitle>
        </VisuallyHidden.Root>
        <img
          src={src}
          alt={label}
          className="h-auto max-h-[85vh] w-full rounded-lg object-contain"
        />
      </DialogContent>
    </Dialog>
  )
}

const ServiceDetailsNoIncome = ({
  service,
  church,
  loading,
}: ServiceDetailsProps) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (!service && !loading) {
      navigate(-1)
    }
  }, [service, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        {/* Page header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {church?.__typename} Service Details
          </h1>
          <p className="text-sm text-muted-foreground">
            {church?.name} · {church?.__typename}
          </p>
          {service?.created_by && (
            <p className="text-sm text-muted-foreground">
              Recorded by {service.created_by.fullName}
            </p>
          )}
        </div>

        {/* Cancelled service */}
        {service?.noServiceReason && !service?.attendance && (
          <div className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-foreground">
              Service Cancelled ·{' '}
              {new Date(service.serviceDate.date).toDateString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {service.noServiceReason}
            </p>
          </div>
        )}

        {/* 2-column layout */}
        {service?.attendance && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* LEFT — record data */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Service Record
                </h2>
              </div>
              <div className="divide-y divide-border">
                <DetailRow label="Date of Service">
                  {new Date(service.serviceDate.date).toDateString()}
                </DetailRow>
                <DetailRow label="Form Filled At">
                  {parseNeoTime(service.createdAt)}
                </DetailRow>
                <DetailRow label="Attendance">
                  <span className="tabular-nums">{service.attendance}</span>
                </DetailRow>
                {service.onlineGiving ? (
                  <DetailRow label="Online Giving">
                    <CurrencySpan number={service.onlineGiving} />
                  </DetailRow>
                ) : null}
                {service.noServiceReason && (
                  <DetailRow label="No Service Reason">
                    {service.noServiceReason}
                  </DetailRow>
                )}
              </div>
            </div>

            {/* RIGHT — photos (sticky on desktop) */}
            <div className="space-y-4 lg:sticky lg:top-6">

              {/* Photos card — height-capped */}
              {(service.familyPicture || (service.onStagePictures?.length ?? 0) > 0) && (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Photos
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {service.familyPicture && (
                      <div className="p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Family Picture
                        </p>
                        <PhotoTile
                          src={service.familyPicture}
                          label="Family Picture"
                        />
                      </div>
                    )}
                    {(service.onStagePictures?.length ?? 0) > 0 && (
                      <div className="p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          On Stage
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {service.onStagePictures?.map((image: string, i: number) =>
                            image ? (
                              <PhotoTile
                                key={i}
                                src={image}
                                label={`On Stage ${i + 1}`}
                                shape="square"
                              />
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ServiceDetailsNoIncome
