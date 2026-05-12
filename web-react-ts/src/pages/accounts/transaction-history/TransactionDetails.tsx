import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import RoleView from 'auth/RoleView'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Separator } from 'components/ui/separator'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { getHumanReadableDateTime, throwToSentry } from 'global-utils'
import useModal from 'hooks/useModal'
import {
  ArrowLeft,
  Building2,
  History,
  Loader2,
  Undo2,
  Wallet,
} from 'lucide-react'
import { permitAdmin, permitArrivals, permitLeader } from 'permission-utils'
import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AccountTransaction } from './transaction-types'
import {
  GET_TRANSACTION_DETAILS,
  UNDO_BUSSING_TRANSACTION,
  UNDO_WEEKDAY_TRANSACTION,
} from './transactionHistory'

type TransactionStatus = AccountTransaction['status']

const STATUS_STYLES: Record<TransactionStatus, string> = {
  success: 'bg-success/15 text-success border-success/30',
  'pending approval': 'bg-warning/15 text-warning border-warning/30',
  declined: 'bg-destructive/15 text-destructive border-destructive/30',
}

const formatAmount = (value: number | null | undefined, currency: string) => {
  const safeCurrency = currency || 'GHS'
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(value ?? 0)
  } catch {
    return `${(value ?? 0).toFixed(2)} ${safeCurrency}`
  }
}

type DetailRowProps = {
  label: string
  value: React.ReactNode
  loading?: boolean
}

const DetailRow = ({ label, value, loading }: DetailRowProps) => (
  <div className="flex items-start justify-between gap-3 py-3">
    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <span className="min-w-0 max-w-[60%] text-right text-sm font-medium text-foreground break-words">
      {loading ? <Skeleton className="ml-auto h-4 w-24" /> : value}
    </span>
  </div>
)

const TransactionDetails = () => {
  const { transactionId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const { show, handleClose, handleShow } = useModal()
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(GET_TRANSACTION_DETAILS, {
    variables: { id: transactionId },
  })
  const [UndoBussingTransaction, { loading: undoBussingLoading }] = useMutation(
    UNDO_BUSSING_TRANSACTION
  )
  const [UndoWeekdayTransaction, { loading: undoWeekdayLoading }] = useMutation(
    UNDO_WEEKDAY_TRANSACTION
  )
  const undoLoading = undoBussingLoading || undoWeekdayLoading

  const transaction: AccountTransaction | undefined =
    data?.accountTransactions?.[0]
  const currency = currentUser.currency || 'GHS'

  const handleUndo = async () => {
    if (!transaction) return
    try {
      if (transaction.category === 'Bussing') {
        await UndoBussingTransaction({ variables: { transactionId } })
      } else {
        await UndoWeekdayTransaction({ variables: { transactionId } })
      }
      navigate('/accounts/council/transaction-history')
    } catch (err) {
      throwToSentry('Error undoing transaction', err)
    } finally {
      handleClose()
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
          <header className="space-y-2 pr-14 md:pr-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Transaction <span className="text-banking">Details</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Full record of this expense — including who logged it and the
              account it touched.
            </p>
          </header>

          <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            {/* Supporting column — actions + balances after. First in DOM so it sits on top on mobile. */}
            <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
              {(typeof transaction?.weekdayBalance === 'number' ||
                typeof transaction?.bussingSocietyBalance === 'number') && (
                <Card>
                  <CardContent className="space-y-3 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Balance after transaction
                    </p>
                    {typeof transaction?.weekdayBalance === 'number' && (
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-banking/10">
                          <Wallet className="size-4 text-banking" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            Weekday account
                          </p>
                          <p className="truncate text-base font-semibold tabular-nums text-foreground">
                            {formatAmount(transaction.weekdayBalance, currency)}
                          </p>
                        </div>
                      </div>
                    )}
                    {!!transaction?.bussingSocietyBalance && (
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-arrivals/10">
                          <Wallet className="size-4 text-arrivals" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            Bussing society
                          </p>
                          <p className="truncate text-base font-semibold tabular-nums text-foreground">
                            {formatAmount(
                              transaction.bussingSocietyBalance,
                              currency
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="space-y-2 p-3">
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Jump to
                  </p>
                  <Link
                    to="/accounts/council/transaction-history"
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 active:bg-muted"
                  >
                    <History className="size-4 text-churches" />
                    Council transaction history
                  </Link>
                  <Link
                    to="/accounts/council/dashboard"
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 active:bg-muted"
                  >
                    <ArrowLeft className="size-4 text-banking" />
                    Council dashboard
                  </Link>
                  <RoleView
                    roles={[
                      ...permitAdmin('Campus'),
                      ...permitLeader('Campus'),
                      ...permitArrivals('Campus'),
                    ]}
                  >
                    <Link
                      to="/accounts/campus/dashboard"
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 active:bg-muted"
                    >
                      <Building2 className="size-4 text-members" />
                      Campus dashboard
                    </Link>
                  </RoleView>
                </CardContent>
              </Card>
            </aside>

            {/* Primary column — transaction record. */}
            <section className="space-y-6 lg:col-start-1 lg:row-start-1">
              <Card className="overflow-hidden">
                <CardContent className="space-y-5 p-5">
                  {/* Hero — amount + status */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Amount
                      </p>
                      {loading || !transaction ? (
                        <Skeleton className="mt-2 h-10 w-40" />
                      ) : (
                        <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-foreground">
                          {formatAmount(transaction.amount, currency)}
                        </p>
                      )}
                      {!!transaction?.charge && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          + {formatAmount(transaction.charge, currency)} charge
                        </p>
                      )}
                    </div>
                    {transaction?.status && (
                      <Badge
                        variant="outline"
                        className={`h-7 self-start px-3 text-xs font-semibold uppercase tracking-wider ${
                          STATUS_STYLES[transaction.status] ??
                          'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {transaction.status}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <div className="divide-y divide-border">
                    <DetailRow
                      label="Created at"
                      loading={loading || !transaction}
                      value={
                        transaction
                          ? getHumanReadableDateTime(transaction.createdAt)
                          : null
                      }
                    />
                    {transaction?.createdAt !== transaction?.lastModified && (
                      <DetailRow
                        label="Last modified"
                        loading={loading || !transaction}
                        value={
                          transaction
                            ? getHumanReadableDateTime(transaction.lastModified)
                            : null
                        }
                      />
                    )}
                    <DetailRow
                      label="Created by"
                      loading={loading || !transaction}
                      value={transaction?.loggedBy?.fullName}
                    />
                    <DetailRow
                      label="Account"
                      loading={loading || !transaction}
                      value={transaction?.account}
                    />
                    <DetailRow
                      label="Category"
                      loading={loading || !transaction}
                      value={transaction?.category}
                    />
                    <DetailRow
                      label="Description"
                      loading={loading || !transaction}
                      value={transaction?.description}
                    />
                  </div>
                </CardContent>
              </Card>

              <RoleView roles={permitAdmin('Campus')}>
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    onClick={handleShow}
                    disabled={!transaction || undoLoading}
                    className="h-12 w-full gap-2 px-8 text-base font-semibold sm:w-auto sm:min-w-64"
                  >
                    <Undo2 className="size-5" />
                    Undo Transaction
                  </Button>
                </div>

                <Dialog
                  open={show}
                  onOpenChange={(open) =>
                    open ? handleShow() : handleClose()
                  }
                >
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Undo this transaction?</DialogTitle>
                      <DialogDescription>
                        This reverses the transaction and restores the affected
                        account balance. The action will appear in the audit
                        history.
                      </DialogDescription>
                    </DialogHeader>

                    {transaction && (
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          {transaction.category} · {transaction.account}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                          {formatAmount(transaction.amount, currency)}
                        </p>
                      </div>
                    )}

                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto"
                          disabled={undoLoading}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleUndo}
                        disabled={undoLoading}
                        className="w-full gap-2 sm:w-auto sm:min-w-40"
                      >
                        {undoLoading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Undoing…
                          </>
                        ) : (
                          <>
                            <Undo2 className="size-4" />
                            Confirm undo
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </RoleView>
            </section>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default TransactionDetails
