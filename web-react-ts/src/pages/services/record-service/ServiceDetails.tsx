import { useMutation } from '@apollo/client'
import RoleView from 'auth/RoleView'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import CurrencySpan from 'components/CurrencySpan'
import { MemberContext } from 'contexts/MemberContext'
import { Church, ServiceRecord } from 'global-types'
import { alertMsg, throwToSentry } from 'global-utils'
import { parseNeoTime } from 'jd-date-utils'
import { CheckCircle, FileUp, Trash2, TrendingUp } from 'lucide-react'
import { permitAdmin, permitTellerStream } from 'permission-utils'
import { Fragment, type ReactNode, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  MANUALLY_CONFIRM_OFFERING_PAYMENT,
  DELETE_SERVICE_RECORD,
} from './RecordServiceMutations'

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

const ServiceDetails = ({ service, church, loading }: ServiceDetailsProps) => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const [ManuallyConfirmOfferingPayment] = useMutation(
    MANUALLY_CONFIRM_OFFERING_PAYMENT
  )
  const [DeleteServiceRecord] = useMutation(DELETE_SERVICE_RECORD)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteService = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this service record? This action cannot be undone.'
    )
    if (!confirmDelete) return

    setDeleting(true)
    try {
      await DeleteServiceRecord({
        variables: { serviceRecordId: service?.id },
      })
      alertMsg('Service record deleted successfully')
      navigate(-1)
    } catch (error) {
      throwToSentry('Error deleting service record', error)
      alertMsg('Failed to delete service record. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

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
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  const noBankingProof =
    service?.cash &&
    !service?.bankingProof &&
    !service?.bankingSlip &&
    !service?.tellerConfirmationTime &&
    service?.transactionStatus !== 'success'

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        {/* Page header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {church?.__typename} Meeting Details
          </h1>
          <p className="text-sm text-muted-foreground">
            {church?.name} · {church?.__typename}
          </p>
          {service?.created_by && (
            <p className="text-sm text-muted-foreground">
              Recorded by {service.created_by.fullName}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {!currentUser.noIncomeTracking && service?.bankingSlipUploader && (
              <Badge
                variant="outline"
                className="border-banking/40 bg-banking/5 text-banking"
              >
                Banking Slip · {service.bankingSlipUploader.fullName}
              </Badge>
            )}
            {!currentUser.noIncomeTracking &&
              service?.transactionStatus === 'success' && (
                <Badge
                  variant="outline"
                  className="border-banking/40 bg-banking/5 text-banking"
                >
                  Banked · {service.offeringBankedBy?.fullName}
                </Badge>
              )}
            <RoleView roles={[...permitAdmin('Council'), ...permitTellerStream()]}>
              {!currentUser.noIncomeTracking && service?.bankingConfirmer && (
                <Badge
                  variant="outline"
                  className="border-success/40 bg-success/5 text-success"
                >
                  Confirmed · {service.bankingConfirmer.fullName}
                </Badge>
              )}
            </RoleView>
          </div>
        </div>

        {/* Special event info */}
        {service?.name && service?.description && (
          <div className="space-y-1 rounded-xl border border-arrivals/30 bg-arrivals/5 p-4">
            <p className="text-sm font-semibold text-foreground">{service.name}</p>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </div>
        )}

        {/* Cancelled service — no attendance */}
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

        {/* 2-column layout — only when service happened */}
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
                <DetailRow label="Income">
                  <CurrencySpan number={service.income} />
                </DetailRow>
                {service.onlineGiving ? (
                  <DetailRow label="Online Giving">
                    <CurrencySpan number={service.onlineGiving} />
                  </DetailRow>
                ) : null}
                {service.cash ? (
                  <>
                    <DetailRow label="Cash">
                      <CurrencySpan number={service.cash} />
                    </DetailRow>
                    <DetailRow label="Number of Tithers">
                      <span className="tabular-nums">
                        {service.numberOfTithers}
                      </span>
                    </DetailRow>
                    {service.foreignCurrency && (
                      <DetailRow label="Foreign Currency & Cheques">
                        <span className="text-right">
                          {service.foreignCurrency
                            .split('\n')
                            .map((line, i, arr) => (
                              <Fragment key={i}>
                                {line}
                                {i < arr.length - 1 && <br />}
                              </Fragment>
                            ))}
                        </span>
                      </DetailRow>
                    )}
                    {service.treasurers?.map((treasurer, i) => (
                      <DetailRow key={i} label={`Treasurer ${i + 1}`}>
                        {treasurer.fullName}
                      </DetailRow>
                    ))}
                  </>
                ) : null}
                {service.noServiceReason && (
                  <DetailRow label="No Service Reason">
                    {service.noServiceReason}
                  </DetailRow>
                )}
              </div>
            </div>

            {/* RIGHT — photos + actions (sticky on desktop) */}
            <div className="space-y-4 lg:sticky lg:top-6">
              {((!currentUser.noIncomeTracking && service.treasurerSelfie) ||
                service.familyPicture ||
                (!currentUser.noIncomeTracking && service.bankingSlip)) && (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Photos
                    </h2>
                  </div>
                  <div className="space-y-4 p-4">
                    {!currentUser.noIncomeTracking && service.treasurerSelfie && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Treasurer Selfie
                        </p>
                        <img
                          src={service.treasurerSelfie}
                          alt="treasurer selfie"
                          className="w-full rounded-lg object-cover"
                        />
                      </div>
                    )}
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
                    {!currentUser.noIncomeTracking && service.bankingSlip && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Banking Slip
                        </p>
                        <img
                          src={service.bankingSlip}
                          alt="banking slip"
                          className="w-full rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Banking missing warning */}
              {noBankingProof && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <p className="text-sm font-semibold text-destructive">
                    Banking slip not submitted
                  </p>
                </div>
              )}

              {/* Self-banking receipt */}
              {!currentUser.noIncomeTracking && service.offeringBankedBy && (
                <div className="space-y-2 rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {service.offeringBankedBy.fullName} used the Self Banking
                    Feature.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/self-banking/receipt')}
                  >
                    View Banking Details
                  </Button>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                {noBankingProof && church.__typename !== 'Hub' && (
                  <>
                    <RoleView
                      roles={[
                        ...permitAdmin('Oversight'),
                        ...permitTellerStream(),
                      ]}
                    >
                      <Button
                        variant="outline"
                        className="w-full min-h-[44px] gap-2"
                        disabled={submitting}
                        onClick={async () => {
                          setSubmitting(true)
                          const confirmed = window.confirm(
                            'Do you want to confirm banking for this service?'
                          )
                          if (confirmed) {
                            try {
                              const res = await ManuallyConfirmOfferingPayment({
                                variables: { serviceRecordId: service.id },
                              })
                              if (res.errors)
                                throw new Error(res.errors[0].message)
                              alertMsg(
                                'Offering Payment has been confirmed. Thank you!'
                              )
                            } catch (error) {
                              throwToSentry('', error)
                            } finally {
                              setSubmitting(false)
                            }
                          } else {
                            setSubmitting(false)
                          }
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {submitting ? 'Confirming…' : 'Confirm Offering'}
                      </Button>
                    </RoleView>
                    <RoleView roles={permitAdmin('Stream')}>
                      <Button
                        variant="outline"
                        className="w-full min-h-[44px] gap-2"
                        onClick={() =>
                          navigate(
                            `/${church.__typename.toLowerCase()}/banking-slip/submission`
                          )
                        }
                      >
                        <FileUp className="h-4 w-4" />
                        Upload Banking Slip
                      </Button>
                    </RoleView>
                  </>
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
                <RoleView roles={['fishers']}>
                  <Button
                    variant="destructive"
                    className="w-full min-h-[44px] gap-2"
                    disabled={deleting}
                    onClick={handleDeleteService}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Deleting…' : 'Delete Service'}
                  </Button>
                </RoleView>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ServiceDetails
