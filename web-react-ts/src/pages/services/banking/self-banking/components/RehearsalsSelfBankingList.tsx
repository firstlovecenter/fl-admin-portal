import { ApolloError, ApolloQueryResult } from '@apollo/client'
import { Badge } from 'components/ui/badge'
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
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceRecord } from 'global-types'
import { capitalise, throwToSentry } from 'global-utils'
import { parseDate } from 'jd-date-utils'
import {
  AlertCircle,
  Banknote,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightSmall,
  Clock,
  Inbox,
  Wallet,
} from 'lucide-react'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import ConfirmPaymentButton, {
  ConfirmPaymentServiceType,
} from './button/ConfirmPayment'

type RehearsalsSelfBankingListProps = {
  church: any
  loading: boolean
  error: ApolloError | undefined
  skip: number
  setSkip: (skip: number) => void
  refetch: (
    variables?:
      | Partial<{
          serviceRecordId?: string
          governorshipId?: string
          councilId?: string
        }>
      | undefined
  ) => Promise<ApolloQueryResult<any>>
  confirmationTools: {
    confirmService: ConfirmPaymentServiceType
    setConfirmService: (service: ConfirmPaymentServiceType) => void
  }
  popupTools: {
    show: boolean
    handleShow: () => void
    handleClose: () => void
  }
}

type StatusVariant = 'pending' | 'success' | 'failed' | 'new'

const statusForRehearsal = (rehearsal: ServiceRecord): StatusVariant => {
  if (
    rehearsal.transactionStatus === 'pending' ||
    rehearsal.transactionStatus === 'send OTP'
  ) {
    return 'pending'
  }
  if (rehearsal.transactionStatus === 'success') return 'success'
  if (
    rehearsal.transactionStatus === 'failed' ||
    rehearsal.transactionStatus === 'abandoned'
  ) {
    return 'failed'
  }
  return 'new'
}

const statusLabel: Record<StatusVariant, string> = {
  pending: 'Pending',
  success: 'Banked',
  failed: 'Failed',
  new: 'Ready to bank',
}

const statusBadgeClass: Record<StatusVariant, string> = {
  pending: 'border-warning/40 bg-warning/10 text-warning',
  success: 'border-banking/40 bg-banking/10 text-banking',
  failed: 'border-destructive/40 bg-destructive/10 text-destructive',
  new: 'border-brand/30 bg-brand/10 text-brand',
}

const StatusBadge = ({ variant }: { variant: StatusVariant }) => (
  <Badge variant="outline" className={statusBadgeClass[variant]}>
    {variant === 'pending' && <Clock className="mr-1 size-3" />}
    {variant === 'failed' && <AlertCircle className="mr-1 size-3" />}
    {statusLabel[variant]}
  </Badge>
)

const SKIP_VALUE = 10

const RehearsalsSelfBankingList = ({
  church,
  loading,
  error,
  refetch,
  confirmationTools,
  popupTools,
  skip,
  setSkip,
}: RehearsalsSelfBankingListProps) => {
  const { clickCard } = useContext(ChurchContext)
  const { show, handleShow, handleClose } = popupTools
  const { confirmService, setConfirmService } = confirmationTools
  const navigate = useNavigate()

  if (error) {
    throwToSentry('', error)
  }

  const rehearsals: ServiceRecord[] = (church?.rehearsals ?? []).filter(
    (rehearsal: ServiceRecord) =>
      !rehearsal.noServiceReason && !rehearsal.bankingSlip
  )

  const hasRehearsals = rehearsals.length > 0

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Self-Banking
          </p>
          {loading && !church ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {church?.name}{' '}
              <span className="text-muted-foreground">{church?.__typename}</span>
            </h1>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {church?.bankingCode && (
              <Badge
                variant="outline"
                className="border-banking/40 bg-banking/5 font-mono text-banking"
              >
                Banking Code · {church.bankingCode}
              </Badge>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Rehearsals to bank
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tap a rehearsal to bank its offering
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="Older rehearsals"
                  disabled={skip - SKIP_VALUE < 0}
                  onClick={() => setSkip(skip - SKIP_VALUE)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="Newer rehearsals"
                  disabled={(church?.rehearsals?.length ?? 0) < SKIP_VALUE}
                  onClick={() => {
                    if ((church?.rehearsals?.length ?? 0) < SKIP_VALUE) return
                    setSkip(skip + SKIP_VALUE)
                  }}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {loading && !church && (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            )}

            {!loading && !hasRehearsals && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <Inbox className="size-6 text-muted-foreground" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-base font-medium text-foreground">
                      Nothing to bank yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      When you record a rehearsal with cash, it will show up
                      here ready to bank.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasRehearsals && (
              <div className="space-y-3">
                {rehearsals.map((rehearsal) => {
                  const variant = statusForRehearsal(rehearsal)
                  return (
                    <button
                      key={rehearsal.id}
                      type="button"
                      className="group block w-full rounded-xl border border-border bg-card text-left shadow-card transition-colors hover:border-brand/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:bg-muted"
                      onClick={() => {
                        clickCard(rehearsal)
                        setConfirmService({ id: rehearsal.id })
                        if (rehearsal.transactionStatus === 'pending') {
                          handleShow()
                          return
                        }
                        if (rehearsal.transactionStatus === 'success') {
                          navigate('/self-banking/receipt')
                          return
                        }
                        navigate(
                          `/rehearsals/${church.__typename.toLowerCase()}/self-banking/pay`
                        )
                      }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-banking/10">
                          <Banknote className="size-5 text-banking" />
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {parseDate(rehearsal.serviceDate.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Offering ·{' '}
                            <span className="font-mono tabular-nums text-foreground">
                              {rehearsal.cash}
                            </span>
                            {rehearsal.transactionStatus
                              ? ` · ${capitalise(rehearsal.transactionStatus)}`
                              : ''}
                          </p>
                        </div>
                        <StatusBadge variant={variant} />
                        <ChevronRightSmall className="size-4 shrink-0 text-muted-foreground" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
                    <Wallet className="size-5 text-brand" />
                  </span>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-foreground">
                      How self-banking works
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Three quick steps
                    </p>
                  </div>
                </div>
                <ol className="space-y-3 text-sm">
                  {[
                    'Pick a rehearsal to bank from the list.',
                    'Enter your MoMo number — we send a prompt to authorise.',
                    'Approve on your phone, then confirm here.',
                  ].map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2 p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Need help?
                </h3>
                <p className="text-sm text-muted-foreground">
                  If a transaction looks stuck or charges look off, tap the
                  rehearsal and reach out to your stream administrator.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Dialog open={show} onOpenChange={(open) => (open ? handleShow() : handleClose())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm pending payment</DialogTitle>
            <DialogDescription>
              Your transaction status is still pending. Tap below to confirm
              with the network.
            </DialogDescription>
          </DialogHeader>
          <ConfirmPaymentButton
            service={confirmService}
            refetch={refetch}
            handleClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RehearsalsSelfBankingList
