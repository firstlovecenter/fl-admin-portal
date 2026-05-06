import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import CurrencySpan from 'components/CurrencySpan'
import { Church, ServiceRecord } from 'global-types'
import { parseNeoTime } from 'jd-date-utils'
import { TrendingUp } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
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

            {/* RIGHT — photo + action (sticky on desktop) */}
            <div className="space-y-4 lg:sticky lg:top-6">
              {(service.familyPicture || service.onStagePictures?.length) && (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Photos
                    </h2>
                  </div>
                  <div className="space-y-4 p-4">
                    {service.familyPicture && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Family Picture
                        </p>
                        <img
                          src={service.familyPicture}
                          alt="service report"
                          className="w-full rounded-lg object-cover"
                        />
                      </div>
                    )}
                    {(service.onStagePictures?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          On Stage
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {service.onStagePictures?.map((image: string) =>
                            image ? (
                              <img
                                key={image}
                                src={image}
                                alt="on stage attendance"
                                loading="lazy"
                                className="w-full rounded-lg object-cover"
                              />
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                className="w-full min-h-[44px] gap-2"
                onClick={() =>
                  navigate(`/${church?.__typename.toLowerCase()}/graphs`)
                }
              >
                <TrendingUp className="h-4 w-4" />
                View Last 4 Weeks
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ServiceDetailsNoIncome
