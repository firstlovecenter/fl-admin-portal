import { useQuery } from '@apollo/client'
import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Users,
} from 'lucide-react'
import { getHumanReadableDate, parseNeoTime } from 'jd-date-utils'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import RoleView from 'auth/RoleView'
import { permitAdminArrivals } from 'permission-utils'
import CurrencySpan from 'components/CurrencySpan'
import CloudinaryImage from 'components/CloudinaryImage'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Skeleton } from 'components/ui/skeleton'
import { cn } from 'components/lib/utils'
import { DISPLAY_BUSSING_RECORDS } from './arrivalsQueries'
import { BacentaWithArrivals, BussingRecord } from './arrivals-types'
import VehicleButton from './components/VehicleButton'

const FactRow = ({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn('flex items-center justify-between gap-4 px-4 py-3', className)}>
    <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
    <span className="text-right text-sm font-medium text-foreground">{children}</span>
  </div>
)

const BusFormDetails = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { bussingRecordId } = useContext(ServiceContext)
  const navigate = useNavigate()
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery(DISPLAY_BUSSING_RECORDS, {
    variables: { bussingRecordId, bacentaId },
  })

  const bussing: BussingRecord = data?.bussingRecords[0]
  const church: BacentaWithArrivals = data?.bacentas[0]

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data} placeholder>
        <div><div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto w-full max-w-2xl px-4 py-5 lg:px-6 lg:py-8">

            {/* Header */}
            <header className="mb-6 space-y-2">
              {loading ? (
                <>
                  <Skeleton className="h-8 w-56" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-48" />
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                    Bacenta{' '}
                    <span className="text-arrivals">Bussing Details</span>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {church?.name} Bacenta
                  </p>
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <p>Recorded by {bussing?.created_by?.fullName}</p>
                    {bussing?.counted_by?.length ? (
                      <RoleView roles={permitAdminArrivals('Stream')}>
                        <p>
                          Counted by{' '}
                          {bussing.counted_by.map((counter, i) => (
                            <span key={counter.id} className="font-medium text-success">
                              {counter.fullName}
                              {i < bussing.counted_by.length - 1 && ' | '}
                            </span>
                          ))}
                        </p>
                      </RoleView>
                    ) : null}
                  </div>
                </>
              )}
            </header>

            <div className="space-y-4">

              {/* Key facts card */}
              <Card className="overflow-hidden">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Summary
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))
                  ) : (
                    <>
                      <FactRow label="Date of Service">
                        {getHumanReadableDate(
                          bussing?.serviceDate?.date?.toString()
                        )}
                      </FactRow>

                      {/* Mobilisation picture — navigable link row */}
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                        onClick={() => navigate('/arrivals/mobilisation-picture')}
                      >
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Camera className="size-4 shrink-0" />
                          Mobilisation Picture
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-arrivals">
                          View <ChevronRight className="size-4" />
                        </span>
                      </button>

                      <FactRow label="Leader Says">
                        {bussing?.leaderDeclaration ?? '—'}
                      </FactRow>

                      <FactRow label="Confirmed Attendance">
                        <span className="flex items-center gap-1.5 text-success">
                          <Users className="size-4" />
                          {bussing?.attendance ?? '—'}
                        </span>
                      </FactRow>

                      <FactRow label="Bussing Top-Up">
                        <span className="tabular-nums">
                          <CurrencySpan number={bussing?.bussingTopUp} />
                        </span>
                      </FactRow>

                      {bussing?.numberOfBusses ? (
                        <FactRow label="Number of Buses">
                          {bussing.numberOfBusses}
                        </FactRow>
                      ) : null}

                      {bussing?.numberOfSprinters ? (
                        <FactRow label="Number of Sprinters">
                          {bussing.numberOfSprinters}
                        </FactRow>
                      ) : null}

                      {bussing?.numberOfUrvans ? (
                        <FactRow label="Number of Urvans">
                          {bussing.numberOfUrvans}
                        </FactRow>
                      ) : null}

                      {bussing?.numberOfCars ? (
                        <FactRow label="Private Cars">
                          {bussing.numberOfCars}
                        </FactRow>
                      ) : null}

                      {bussing?.mobileNetwork && (
                        <FactRow label="Mobile Network">
                          {bussing.mobileNetwork}
                        </FactRow>
                      )}

                      {bussing?.momoNumber && (
                        <FactRow label="Momo Number">
                          <span className="font-mono">{bussing.momoNumber}</span>
                        </FactRow>
                      )}

                      {bussing?.momoName && (
                        <FactRow label="Momo Name">{bussing.momoName}</FactRow>
                      )}

                      {bussing?.comments && (
                        <FactRow label="Comments">
                          <span className="italic text-muted-foreground">
                            {bussing.comments}
                          </span>
                        </FactRow>
                      )}

                      {bussing?.arrivalTime && (
                        <FactRow label="Arrival Time">
                          <span className="flex items-center gap-1.5 text-success">
                            <Clock className="size-4" />
                            <CheckCircle2 className="size-4" />
                            {parseNeoTime(bussing.arrivalTime.toString())}
                          </span>
                        </FactRow>
                      )}
                    </>
                  )}
                </div>
              </Card>

              {/* Bussing pictures */}
              {(loading || bussing?.bussingPictures?.length) ? (
                <Card className="overflow-hidden">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Bussing Pictures
                    </p>
                  </div>
                  <CardContent className="p-4">
                    {loading ? (
                      <div className="flex gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="size-24 shrink-0 rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {bussing.bussingPictures?.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            aria-label={`View bussing picture ${i + 1}`}
                            onClick={() => setLightboxSrc(src)}
                            className="size-24 shrink-0 overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90 active:opacity-75"
                          >
                            <CloudinaryImage
                              src={src}
                              size="respond"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {/* Vehicle records */}
              {(loading || bussing?.vehicleRecords?.length) ? (
                <Card className="overflow-hidden">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Vehicles
                    </p>
                  </div>
                  <CardContent className="space-y-2 p-4">
                    {loading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                      ))
                    ) : (
                      bussing?.vehicleRecords?.map((record, i) => (
                        <VehicleButton key={record.id ?? i} record={record} />
                      ))
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {/* Back button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => navigate('/arrivals')}
              >
                <ArrowLeft className="size-4" />
                Back to Arrivals Home
              </Button>

            </div>
          </main>
        </div>

        {/* Lightbox dialog */}
        <Dialog
          open={!!lightboxSrc}
          onOpenChange={(open) => !open && setLightboxSrc(null)}
        >
          <DialogContent
            className="flex max-h-svh max-w-[95vw] flex-col items-center justify-center gap-4 bg-black/95 p-4 sm:max-w-3xl"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Bussing Picture</DialogTitle>
              <DialogDescription>Full size bussing picture</DialogDescription>
            </DialogHeader>
            {lightboxSrc && (
              <img
                src={lightboxSrc}
                alt="Full-size bussing record"
                className="max-h-[80svh] w-full rounded-lg object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
        </div></ApolloWrapper>
    </PullToRefresh>
  )
}

export default BusFormDetails
