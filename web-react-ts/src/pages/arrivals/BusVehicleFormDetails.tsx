import { useQuery } from '@apollo/client'
import RoleView from 'auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import CloudinaryImage from 'components/CloudinaryImage'
import CurrencySpan from 'components/CurrencySpan'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { getHumanReadableDate, getTime, parseNeoTime } from 'jd-date-utils'
import {
  permitAdminArrivals,
  permitArrivalsCounter,
  permitArrivalsPayer,
} from 'permission-utils'
import { useContext, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ChevronLeft,
  CreditCard,
  Home,
  Image as ImageIcon,
  ListChecks,
  Sigma,
} from 'lucide-react'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Skeleton } from 'components/ui/skeleton'
import { capitalise } from 'global-utils'
import { BacentaWithArrivals, VehicleRecord } from './arrivals-types'
import { beforeCountingDeadline } from './arrivals-utils'
import { DISPLAY_VEHICLE_RECORDS } from './arrivalsQueries'

type DataRowProps = {
  label: string
  children: React.ReactNode
  loading?: boolean
}

const DataRow = ({ label, children, loading }: DataRowProps) => (
  <div className="flex items-start justify-between gap-4 px-4 py-3">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right">
      {loading ? <Skeleton className="h-4 w-24" /> : children}
    </span>
  </div>
)

const BusVehicleFormDetails = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { vehicleRecordId } = useContext(ServiceContext)
  const [picturePopup, setPicturePopup] = useState('')
  const [pictureOpen, setPictureOpen] = useState(false)
  const { data, loading, error } = useQuery(DISPLAY_VEHICLE_RECORDS, {
    variables: { vehicleRecordId, bacentaId },
  })
  const navigate = useNavigate()
  const vehicle: VehicleRecord = data?.vehicleRecords?.[0]
  const church: BacentaWithArrivals = data?.bacentas?.[0]

  const openPicture = (src: string) => {
    setPicturePopup(src)
    setPictureOpen(true)
  }

  const inOutLabel = vehicle?.outbound ? 'In and Out' : 'In Only'
  const txnSuccess = vehicle?.transactionStatus === 'success'

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
          <header className="mb-6 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {church?.name ?? 'Loading…'}{' '}
              <span className="text-arrivals">Vehicle Details</span>
            </h1>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
              {vehicle?.created_by?.fullName && (
                <span>
                  Recorded by{' '}
                  <span className="text-foreground">
                    {vehicle.created_by.fullName}
                  </span>
                </span>
              )}
              {vehicle?.counted_by?.fullName && (
                <RoleView roles={permitAdminArrivals('Stream')}>
                  <span className="hidden sm:inline">·</span>
                  <span>
                    Counted by{' '}
                    <span className="text-success">
                      {vehicle.counted_by.fullName}
                    </span>
                  </span>
                </RoleView>
              )}
            </div>
            {vehicle && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge
                  variant="outline"
                  className="border-warning/40 bg-warning/10 text-warning-foreground"
                >
                  {inOutLabel}
                </Badge>
                {vehicle.transactionStatus && (
                  <Badge
                    variant={txnSuccess ? 'default' : 'outline'}
                    className={
                      txnSuccess
                        ? 'bg-success text-white'
                        : 'border-warning/40 bg-warning/10 text-warning-foreground'
                    }
                  >
                    {capitalise(vehicle.transactionStatus)}
                  </Badge>
                )}
              </div>
            )}
          </header>

          {/* 2-column on lg+, stacked on mobile */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Left — primary data */}
            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <Sigma className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bussing Record
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  <DataRow label="Date of Service" loading={loading}>
                    {vehicle?.createdAt
                      ? getHumanReadableDate(vehicle.createdAt)
                      : '—'}
                  </DataRow>
                  <DataRow label="Time Filled" loading={loading}>
                    {vehicle?.createdAt
                      ? getTime(new Date(vehicle.createdAt))
                      : '—'}
                  </DataRow>
                  <DataRow label="Leader Says" loading={loading}>
                    <span className="tabular-nums">
                      {vehicle?.leaderDeclaration ?? '—'}
                    </span>
                  </DataRow>
                  <DataRow label="Confirmed Attendance" loading={loading}>
                    <span className="font-semibold tabular-nums text-success">
                      {vehicle?.attendance ?? '—'}
                    </span>
                  </DataRow>
                  <DataRow label="Vehicle Top Up" loading={loading}>
                    <span className="font-semibold tabular-nums text-success">
                      <CurrencySpan number={vehicle?.vehicleTopUp ?? 0} />
                    </span>
                  </DataRow>
                  {vehicle?.vehicle && (
                    <DataRow label="Category" loading={loading}>
                      {vehicle.vehicle}
                    </DataRow>
                  )}
                  {vehicle?.arrivalTime && (
                    <DataRow label="Arrival Time" loading={loading}>
                      <span className="font-semibold tabular-nums text-success">
                        {parseNeoTime(vehicle.arrivalTime.toString())}
                      </span>
                    </DataRow>
                  )}
                  <DataRow label="In and Out" loading={loading}>
                    <span className="font-semibold text-warning-foreground">
                      {inOutLabel}
                    </span>
                  </DataRow>
                  {vehicle?.comments && (
                    <DataRow label="Comments" loading={loading}>
                      <span className="italic">{vehicle.comments}</span>
                    </DataRow>
                  )}
                </div>
              </div>

              {vehicle?.transactionStatus && (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Financial Details
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    <DataRow label="Transaction Reference">
                      <span className="font-mono text-xs">
                        {vehicle.transactionReference || '—'}
                      </span>
                    </DataRow>
                    <DataRow label="Transaction Status">
                      <span
                        className={
                          txnSuccess
                            ? 'font-semibold text-success'
                            : 'font-semibold text-warning-foreground'
                        }
                      >
                        {capitalise(vehicle.transactionStatus)}
                      </span>
                    </DataRow>
                    <DataRow label="Mobile Network">
                      {vehicle.mobileNetwork || '—'}
                    </DataRow>
                    <DataRow label="Momo Name">
                      {capitalise(vehicle.momoName ?? '')}
                    </DataRow>
                    <DataRow label="Momo Number">
                      <span className="font-mono">
                        {vehicle.momoNumber || '—'}
                      </span>
                    </DataRow>
                  </div>
                </div>
              )}
            </div>

            {/* Right — picture + actions (sticky on desktop) */}
            <div className="space-y-4 lg:sticky lg:top-6">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vehicle Picture
                  </h2>
                </div>
                {vehicle?.picture ? (
                  <button
                    type="button"
                    onClick={() => openPicture(vehicle.picture)}
                    className="block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="View full-size vehicle picture"
                  >
                    <CloudinaryImage
                      className="h-auto w-full object-cover"
                      src={vehicle.picture}
                      size="respond"
                    />
                  </button>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted/40 text-sm text-muted-foreground">
                    {loading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      'No picture submitted'
                    )}
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </h2>
                </div>
                <div className="space-y-2 p-4">
                  {vehicle && !beforeCountingDeadline(vehicle, church) && (
                    <RoleView roles={permitArrivalsPayer()}>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() =>
                          navigate('/arrivals/vehicles-to-be-paid')
                        }
                      >
                        <CreditCard className="h-4 w-4" />
                        Continue Payments
                      </Button>
                    </RoleView>
                  )}

                  <RoleView roles={permitArrivalsCounter()}>
                    {vehicle && beforeCountingDeadline(vehicle, church) && (
                      <>
                        {!vehicle.arrivalTime && (
                          <Button
                            size="lg"
                            className="w-full bg-warning text-foreground hover:bg-warning/90"
                            onClick={() =>
                              navigate('/arrivals/submit-vehicle-attendance')
                            }
                          >
                            I Want to Count
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => navigate('/arrivals/bacentas-to-count')}
                    >
                      <ListChecks className="h-4 w-4" />
                      Continue Counting
                    </Button>
                  </RoleView>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => navigate('/arrivals')}
                  >
                    <Home className="h-4 w-4" />
                    Back to Arrivals Home
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Picture viewer */}
          <Dialog open={pictureOpen} onOpenChange={setPictureOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {church?.name
                    ? `${church.name} ${church.__typename ?? ''} Picture`.trim()
                    : 'Vehicle Picture'}
                </DialogTitle>
              </DialogHeader>
              {picturePopup && (
                <CloudinaryImage
                  className="h-auto w-full rounded-lg"
                  src={picturePopup}
                  size="respond"
                />
              )}
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPictureOpen(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default BusVehicleFormDetails
