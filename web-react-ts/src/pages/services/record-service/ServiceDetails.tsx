import { useMutation } from '@apollo/client'
import RoleView from 'auth/RoleView'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from 'components/ui/dialog'
import { Skeleton } from 'components/ui/skeleton'
import CurrencySpan from 'components/CurrencySpan'
import { MemberContext } from 'contexts/MemberContext'
import { Church, Member, Role, ServiceRecord } from 'global-types'
import { alertMsg, throwToSentry } from 'global-utils'
import { parseNeoTime } from 'jd-date-utils'
import {
  AlertTriangle,
  Banknote,
  CheckCircle,
  FileUp,
  Trash2,
} from 'lucide-react'
import { permitAdmin, permitLeader, permitTellerStream } from 'permission-utils'
import BankingHistorySection from './BankingHistorySection'
import {
  Fragment,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { VisuallyHidden } from 'radix-ui'
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

const SELF_BANKING_ROLES_BY_TYPE: Record<string, Role[]> = {
  Bacenta: ['leaderBacenta'],
  Governorship: ['leaderGovernorship', 'adminGovernorship'],
  Council: ['leaderCouncil', 'adminCouncil'],
  Stream: ['leaderStream', 'adminStream'],
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

function getInitials(name?: string): string {
  if (!name) return ''
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
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

function TreasurerCell({ treasurer }: { treasurer: Member }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Avatar className="h-7 w-7 ring-1 ring-border">
        {treasurer.pictureUrl ? (
          <AvatarImage src={treasurer.pictureUrl} alt={treasurer.fullName} />
        ) : null}
        <AvatarFallback className="text-[10px]">
          {getInitials(treasurer.fullName)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium text-foreground">
        {treasurer.fullName}
      </span>
    </div>
  )
}

const ServiceDetails = ({ service, church, loading }: ServiceDetailsProps) => {
  const { currentUser, userJobs } = useContext(MemberContext)
  const navigate = useNavigate()

  const isChurchManualBanking = useMemo(() => {
    const churchId = church?.id
    if (!churchId || !userJobs) return false
    for (const job of userJobs) {
      const found = job.church?.find((c: Church) => c?.id === churchId)
      if (found) return !!found.isManualBanking
    }
    return false
  }, [church?.id, userJobs])

  const [ManuallyConfirmOfferingPayment] = useMutation(
    MANUALLY_CONFIRM_OFFERING_PAYMENT
  )
  const [DeleteServiceRecord] = useMutation(DELETE_SERVICE_RECORD)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteService = async () => {
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
        <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  const trackIncome = !currentUser.noIncomeTracking

  const noBankingProof =
    service?.cash &&
    !service?.bankingProof &&
    !service?.bankingSlip &&
    !service?.tellerConfirmationTime &&
    service?.transactionStatus !== 'success'

  const churchType = church?.__typename
  const selfBankingRoles =
    (churchType && SELF_BANKING_ROLES_BY_TYPE[churchType]) ?? []
  const selfBankingPath = `/services/${churchType?.toLowerCase()}/self-banking`

  const showWarning = trackIncome && noBankingProof
  const showAdminBankingActions = trackIncome && noBankingProof
  const showSelfBankingPay =
    trackIncome &&
    noBankingProof &&
    selfBankingRoles.length > 0 &&
    !isChurchManualBanking
  const showBankingReceiptLink =
    trackIncome && Boolean(service?.offeringBankedBy)
  const showActionsCard =
    showAdminBankingActions || showSelfBankingPay || showBankingReceiptLink

  const showRightRail =
    Boolean(service?.attendance) &&
    (showActionsCard ||
      (trackIncome && service.treasurerSelfie) ||
      service?.familyPicture ||
      (trackIncome && service?.bankingSlip))

  const isCancelled = Boolean(service?.noServiceReason && !service?.attendance)

  const deleteTrashButton = (
    <RoleView roles={['fishers']}>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete service record"
            className="size-11 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            disabled={deleting}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this service record?</AlertDialogTitle>
            <AlertDialogDescription>
              {service?.serviceDate?.date
                ? `This will permanently remove the record for ${
                    church?.name
                  } on ${new Date(service.serviceDate.date).toDateString()}.`
                : `This will permanently remove this record for ${church?.name}.`}{' '}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="min-h-11">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault()
                handleDeleteService()
              }}
              className="min-h-11 bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
            >
              {deleting ? 'Deleting…' : 'Delete record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleView>
  )

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        {/* FULL-WIDTH TOP BAND — page header + event / cancelled banners */}
        <div className="space-y-4">
          {/* Page header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {church?.name}{' '}
              <span className="text-churches">Meeting Details</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {church?.__typename}
            </p>
            {service?.created_by && (
              <p className="text-sm text-muted-foreground">
                Recorded by {service.created_by.fullName}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {trackIncome && service?.bankingSlipUploader && (
                <Badge
                  variant="outline"
                  className="border-banking/40 bg-banking/5 text-banking"
                >
                  Banking Slip · {service.bankingSlipUploader.fullName}
                </Badge>
              )}
              {trackIncome && service?.transactionStatus === 'success' && (
                <Badge
                  variant="outline"
                  className="border-banking/40 bg-banking/5 text-banking"
                >
                  Banked · {service.offeringBankedBy?.fullName}
                </Badge>
              )}
              <RoleView
                roles={[...permitAdmin('Council'), ...permitTellerStream()]}
              >
                {trackIncome && service?.bankingConfirmer && (
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
              <p className="text-sm font-semibold text-foreground">
                {service.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {service.description}
              </p>
            </div>
          )}

          {/* Cancelled service — no attendance */}
          {isCancelled && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Service Cancelled ·{' '}
                  {service?.serviceDate?.date
                    ? new Date(service.serviceDate.date).toDateString()
                    : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {service?.noServiceReason}
                </p>
              </div>
              {deleteTrashButton}
            </div>
          )}
        </div>

        {/* 2-COLUMN GRID — Service Record (left) and Action Required + Photos (right) start at the same y */}
        {(service?.attendance || showRightRail) && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* LEFT — Service Record card */}
            <div className="space-y-6">
              {/* Service Record card — only when service happened */}
              {service?.attendance && (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Service Record
                    </h2>
                    {deleteTrashButton}
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
                    {trackIncome && (
                      <DetailRow label="Income">
                        <CurrencySpan number={service.income} />
                      </DetailRow>
                    )}
                    {trackIncome && service.onlineGiving ? (
                      <DetailRow label="Online Giving">
                        <CurrencySpan number={service.onlineGiving} />
                      </DetailRow>
                    ) : null}
                    {trackIncome && service.cash ? (
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
                      </>
                    ) : null}
                    {trackIncome &&
                      service.treasurers?.map((treasurer, i) => (
                        <DetailRow key={i} label={`Treasurer ${i + 1}`}>
                          <TreasurerCell treasurer={treasurer} />
                        </DetailRow>
                      ))}
                    {service.noServiceReason && (
                      <DetailRow label="No Service Reason">
                        {service.noServiceReason}
                      </DetailRow>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — actions and photos (sticky on desktop). Reserved space stays empty when there's no content. */}
            {showRightRail && (
              <div className="space-y-4 lg:sticky lg:top-6">
                {/* Actions card — only when there's something to do */}
                {showActionsCard && (
                  <div
                    className={
                      showWarning
                        ? 'overflow-hidden rounded-xl border border-warning/40 bg-warning/5'
                        : 'overflow-hidden rounded-xl border border-border bg-card'
                    }
                  >
                    <div
                      className={
                        showWarning
                          ? 'flex items-center gap-2 border-b border-warning/30 px-4 py-3'
                          : 'border-b border-border px-4 py-3'
                      }
                    >
                      {showWarning && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      <h2
                        className={
                          showWarning
                            ? 'text-xs font-semibold uppercase tracking-wider text-warning'
                            : 'text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                        }
                      >
                        {showWarning ? 'Action Required' : 'Actions'}
                      </h2>
                    </div>
                    <div className="space-y-2 p-3">
                      {showWarning && (
                        <p className="px-1 pb-1 text-sm text-foreground/80">
                          Cash was recorded but no banking proof has been
                          submitted yet.
                        </p>
                      )}
                      {showSelfBankingPay && (
                        <RoleView roles={selfBankingRoles}>
                          <Button
                            className="w-full min-h-11 gap-2"
                            onClick={() => navigate(selfBankingPath)}
                          >
                            <Banknote className="h-4 w-4" />
                            Pay Offering
                          </Button>
                        </RoleView>
                      )}
                      {showAdminBankingActions && (
                        <>
                          <RoleView
                            roles={['fishers', ...permitTellerStream()]}
                          >
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  className="w-full min-h-11 gap-2"
                                  disabled={submitting}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  {submitting
                                    ? 'Confirming…'
                                    : 'Confirm Offering'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirm offering banking?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Do you want to confirm banking for this
                                    service?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    disabled={submitting}
                                    className="min-h-11"
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    disabled={submitting}
                                    className="min-h-11"
                                    onClick={async (event) => {
                                      event.preventDefault()
                                      setSubmitting(true)
                                      try {
                                        const res =
                                          await ManuallyConfirmOfferingPayment({
                                            variables: {
                                              serviceRecordId: service.id,
                                            },
                                          })
                                        if (res.errors)
                                          throw new Error(
                                            res.errors[0].message
                                          )
                                        alertMsg(
                                          'Offering Payment has been confirmed. Thank you!'
                                        )
                                      } catch (error) {
                                        throwToSentry('', error)
                                      } finally {
                                        setSubmitting(false)
                                      }
                                    }}
                                  >
                                    {submitting
                                      ? 'Confirming…'
                                      : 'Confirm Offering'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </RoleView>
                          <RoleView roles={permitAdmin('Stream')}>
                            <Button
                              variant="outline"
                              className="w-full min-h-11 gap-2"
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
                      {showBankingReceiptLink && (
                        <Button
                          variant="ghost"
                          className="w-full min-h-11 justify-start px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => navigate('/self-banking/receipt')}
                        >
                          View banking details
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Banking history — audit-trail audience:
                      - leaders of the owning church and above (they have a
                        legitimate need to see who took the money on records
                        for their church),
                      - Stream-level admins and above (govern banking
                        operations for their stream's services),
                      - tellers (they ARE the actors that produce 'teller'
                        rows; they should see their own work and that of
                        their peers on records they processed). */}
                <RoleView
                  roles={[
                    ...permitLeader('Bacenta'),
                    ...permitAdmin('Stream'),
                    ...permitTellerStream(),
                  ]}
                >
                  <BankingHistorySection
                    bankingHistory={service.bankingHistory}
                  />
                </RoleView>

                {/* Photos card — below actions, images height-capped */}
                {((trackIncome && service.treasurerSelfie) ||
                  service.familyPicture ||
                  (trackIncome && service.bankingSlip)) && (
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-4 py-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Photos
                      </h2>
                    </div>
                    <div className="divide-y divide-border">
                      {trackIncome && service.treasurerSelfie && (
                        <div className="p-3">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Treasurer Selfie
                          </p>
                          <PhotoTile
                            src={service.treasurerSelfie}
                            label="Treasurer Selfie"
                          />
                        </div>
                      )}
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
                      {trackIncome && service.bankingSlip && (
                        <div className="p-3">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Banking Slip
                          </p>
                          <PhotoTile
                            src={service.bankingSlip}
                            label="Banking Slip"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default ServiceDetails
