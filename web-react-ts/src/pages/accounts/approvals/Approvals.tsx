import { useMutation, useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  APPROVE_EXPENSE,
  DECLINE_EXPENSE,
  GET_COUNCIL_PENDING_APPROVAL_TRANSACTIONS,
} from './approvals-gql'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { CouncilForAccounts } from '../accounts-types'
import {
  translateAccountLabel,
  translateCategoryLabel,
  translateStatusLabel,
} from '../accounts-i18n'
import { AccountTransaction } from '../transaction-history/transaction-types'
import { getHumanReadableDateTime, throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Separator } from 'components/ui/separator'
import { Checkbox } from 'components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { CheckCircle2, Inbox, Loader2, XCircle } from 'lucide-react'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import useBulkSelect from 'hooks/useBulkSelect'

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

const Approvals = () => {
  const { t } = useTranslation()
  const { campusId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  // SYN-110: per-card lock keyed on transaction id. The previous shared
  // `submitting` boolean meant tapping decline on Tx A then Tx B before
  // A returned would fire BOTH (the Decline button's `disabled` flipped
  // back briefly between renders). With the cypher-level idempotency
  // guard from SYN-92/94, that race is no longer reachable from the
  // server, but the FE should still gate the affordance per-card so
  // the user gets correct visual feedback.
  const [decliningIds, setDecliningIds] = useState<Set<string>>(new Set())
  const [confirmingApproveId, setConfirmingApproveId] = useState<string | null>(
    null
  )
  const isDeclining = (id: string) => decliningIds.has(id)
  const markDeclining = (id: string, on: boolean) =>
    setDecliningIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  // Bulk select state
  const [bulkCharge, setBulkCharge] = useState('')
  const [bulkApproving, setBulkApproving] = useState(false)
  const [bulkDeclining, setBulkDeclining] = useState(false)
  const [confirmBulkDecline, setConfirmBulkDecline] = useState(false)

  const { data, loading, error, refetch } = useQuery(
    GET_COUNCIL_PENDING_APPROVAL_TRANSACTIONS,
    {
      variables: { campusId },
    }
  )
  // SYN-109: refetch active queries so balance cards on previously
  // open dashboard tabs reflect the approve/decline outcome without
  // requiring a hard refresh. The in-component refetch() call already
  // updates THIS view; refetchQueries covers OTHER mounted views.
  const [approveExpense] = useMutation(APPROVE_EXPENSE, {
    refetchQueries: 'active',
  })
  const [declineExpense] = useMutation(DECLINE_EXPENSE, {
    refetchQueries: 'active',
  })

  const campus = data?.campuses[0]
  const currency = currentUser.currency || 'GHS'

  const councilsWithPending: CouncilForAccounts[] =
    campus?.councils?.filter(
      (council: CouncilForAccounts) => council.transactions.length > 0
    ) ?? []
  const totalPending = councilsWithPending.reduce(
    (sum, council) => sum + council.transactions.length,
    0
  )

  const allTransactionIds = useMemo(
    () => councilsWithPending.flatMap((c) => c.transactions.map((t) => t.id)),
    [councilsWithPending]
  )

  const { selectedIds, toggle, selectAll, clear, isSelected, count, isAllSelected } =
    useBulkSelect(allTransactionIds)

  const initialValues = { charge: '' }

  const validationSchema = useMemo(
    () =>
      Yup.object({
        charge: Yup.number()
          .typeError(t('accounts.common.validNumber'))
          .required(t('accounts.approvals.chargeRequired')),
      }),
    [t]
  )

  const handleBulkApprove = async () => {
    const chargeValue = parseFloat(bulkCharge)
    if (isNaN(chargeValue)) return
    setBulkApproving(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((transactionId) =>
          approveExpense({ variables: { transactionId, charge: chargeValue } })
        )
      )
      await refetch()
      clear()
      setBulkCharge('')
    } catch (err) {
      throwToSentry('Error bulk approving transactions', err)
    } finally {
      setBulkApproving(false)
    }
  }

  const handleBulkDecline = async () => {
    setConfirmBulkDecline(false)
    setBulkDeclining(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((transactionId) =>
          declineExpense({ variables: { transactionId } })
        )
      )
      await refetch()
      clear()
    } catch (err) {
      throwToSentry('Error bulk declining transactions', err)
    } finally {
      setBulkDeclining(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className={`min-h-svh bg-background ${count > 0 ? 'pb-48' : 'pb-[env(safe-area-inset-bottom)]'}`}>
        <StickyPageHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t('accounts.approvals.titlePrefix')}{' '}
                <span className="text-banking">
                  {t('accounts.approvals.titleHighlight')}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                {campus?.name}
                {totalPending > 0 ? (
                  <>
                    {' · '}
                    <span className="font-medium tabular-nums text-foreground">
                      {totalPending}
                    </span>{' '}
                    {t('accounts.approvals.awaitingReview')}
                  </>
                ) : null}
              </p>
            </div>
            {totalPending > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-transactions"
                  checked={isAllSelected}
                  onCheckedChange={(checked) => (checked ? selectAll() : clear())}
                  aria-label="Select all pending transactions"
                  className="h-5 w-5"
                />
                <label
                  htmlFor="select-all-transactions"
                  className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                >
                  All
                </label>
              </div>
            )}
          </div>
        </StickyPageHeader>

        <main className="mx-auto max-w-3xl px-4 py-5 lg:px-6 lg:py-8">
          {totalPending === 0 ? (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted/60">
                  <Inbox className="size-6 text-muted-foreground" />
                </span>
                <p className="text-sm font-medium text-foreground">
                  {t('accounts.approvals.emptyTitle')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('accounts.approvals.emptyBody')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 space-y-6">
              {councilsWithPending.map((council) => (
                // SYN-110: keyed on council.id so React doesn't reuse the
                // wrong card across re-renders. The previous fragment had
                // no key and produced the standard React warning.
                <section key={council.id} className="space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      {council.name}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {t('accounts.approvals.pendingCount', {
                        count: council.transactions.length,
                      })}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {council.transactions.map(
                      (transaction: AccountTransaction) => {
                        const selected = isSelected(transaction.id)

                        const onApprove = async (
                          values: typeof initialValues,
                          helpers: FormikHelpers<typeof initialValues>
                        ) => {
                          const { setSubmitting, resetForm } = helpers
                          try {
                            setSubmitting(true)
                            await approveExpense({
                              variables: {
                                transactionId: transaction.id,
                                charge: parseFloat(values.charge),
                              },
                            })
                            await refetch()
                          } catch (err) {
                            throwToSentry(
                              'There was an error approving the transaction',
                              err
                            )
                          } finally {
                            resetForm()
                            setSubmitting(false)
                          }
                        }

                        return (
                          <Card
                            key={transaction.id}
                            className={`overflow-hidden transition-colors ${
                              selected ? 'border-warning/40 bg-warning/5' : ''
                            }`}
                          >
                            <CardContent className="space-y-5 p-5">
                              {/* Selection checkbox */}
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={() => toggle(transaction.id)}
                                  aria-label={`Select transaction ${transaction.id}`}
                                  className="h-5 w-5"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {selected ? 'Selected for bulk action' : 'Select for bulk action'}
                                </span>
                              </div>

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {t('accounts.approvals.amountRequested')}
                                  </p>
                                  <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-foreground">
                                    {formatAmount(transaction.amount, currency)}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="h-7 self-start border-warning/30 bg-warning/15 px-3 text-xs font-semibold uppercase tracking-wider text-warning"
                                >
                                  {translateStatusLabel(t, transaction.status)}
                                </Badge>
                              </div>

                              <Separator />

                              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                <div className="space-y-0.5">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {t('accounts.common.category')}
                                  </dt>
                                  <dd className="font-medium text-foreground">
                                    {translateCategoryLabel(
                                      t,
                                      transaction.category
                                    )}
                                  </dd>
                                </div>
                                <div className="space-y-0.5">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {t('accounts.common.account')}
                                  </dt>
                                  <dd className="font-medium text-foreground">
                                    {translateAccountLabel(
                                      t,
                                      transaction.account
                                    )}
                                  </dd>
                                </div>
                                <div className="space-y-0.5 sm:col-span-2">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {t('accounts.common.description')}
                                  </dt>
                                  <dd className="text-foreground break-words">
                                    {transaction.description}
                                  </dd>
                                </div>
                                <div className="space-y-0.5">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {t('accounts.approvals.loggedBy')}
                                  </dt>
                                  <dd className="font-medium text-foreground">
                                    {transaction.loggedBy?.fullName}
                                  </dd>
                                </div>
                                <div className="space-y-0.5">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {t('accounts.approvals.created')}
                                  </dt>
                                  <dd className="text-foreground">
                                    {getHumanReadableDateTime(
                                      transaction.createdAt
                                    )}
                                  </dd>
                                </div>
                              </dl>

                              <Separator />

                              <Formik
                                initialValues={initialValues}
                                validationSchema={validationSchema}
                                onSubmit={onApprove}
                              >
                                {(formik) => (
                                  <>
                                    <Form className="space-y-4">
                                      <Input
                                        name="charge"
                                        label={t(
                                          'accounts.approvals.chargeLabel'
                                        )}
                                        placeholder={t(
                                          'accounts.approvals.chargePlaceholder'
                                        )}
                                        type="number"
                                        inputMode="decimal"
                                      />
                                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="lg"
                                          className="h-12 w-full gap-2 px-6 sm:w-auto sm:min-w-40"
                                          disabled={isDeclining(transaction.id)}
                                          onClick={async () => {
                                            try {
                                              markDeclining(transaction.id, true)
                                              await declineExpense({
                                                variables: {
                                                  transactionId: transaction.id,
                                                },
                                              })
                                              await refetch()
                                            } catch (err) {
                                              throwToSentry(
                                                'There was an error declining the transaction',
                                                err
                                              )
                                            } finally {
                                              markDeclining(
                                                transaction.id,
                                                false
                                              )
                                            }
                                          }}
                                        >
                                          {isDeclining(transaction.id) ? (
                                            <>
                                              <Loader2 className="size-4 animate-spin" />
                                              {t('accounts.approvals.declining')}
                                            </>
                                          ) : (
                                            <>
                                              <XCircle className="size-5" />
                                              {t('accounts.approvals.decline')}
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="lg"
                                          className="h-12 w-full gap-2 px-6 sm:w-auto sm:min-w-40"
                                          disabled={
                                            !formik.isValid ||
                                            formik.isSubmitting ||
                                            isDeclining(transaction.id)
                                          }
                                          onClick={async () => {
                                            const errors =
                                              await formik.validateForm()
                                            if (
                                              Object.keys(errors).length === 0
                                            ) {
                                              setConfirmingApproveId(
                                                transaction.id
                                              )
                                            } else {
                                              formik.setTouched(
                                                Object.keys(errors).reduce(
                                                  (acc, key) => ({
                                                    ...acc,
                                                    [key]: true,
                                                  }),
                                                  {}
                                                )
                                              )
                                            }
                                          }}
                                        >
                                          <CheckCircle2 className="size-5" />
                                          {t('accounts.approvals.approve')}
                                        </Button>
                                      </div>
                                    </Form>

                                    {/* Per-card approve confirmation */}
                                    <Dialog
                                      open={
                                        confirmingApproveId === transaction.id
                                      }
                                      onOpenChange={(open) =>
                                        !open && setConfirmingApproveId(null)
                                      }
                                    >
                                      <DialogContent className="sm:max-w-sm">
                                        <DialogHeader>
                                          <DialogTitle>
                                            {t(
                                              'accounts.approvals.confirmApproveTitle'
                                            )}
                                          </DialogTitle>
                                          <DialogDescription>
                                            {translateCategoryLabel(
                                              t,
                                              transaction.category
                                            )}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-3 py-1 text-sm">
                                          <div className="flex items-baseline justify-between gap-3">
                                            <span className="text-muted-foreground">
                                              {t('accounts.common.amount')}
                                            </span>
                                            <span className="text-xl font-semibold tabular-nums text-foreground">
                                              {formatAmount(
                                                transaction.amount,
                                                currency
                                              )}
                                            </span>
                                          </div>
                                          {formik.values.charge && (
                                            <div className="flex items-center justify-between gap-3">
                                              <span className="text-muted-foreground">
                                                {t(
                                                  'accounts.approvals.chargeLabel'
                                                )}
                                              </span>
                                              <span className="font-medium tabular-nums text-foreground">
                                                {formatAmount(
                                                  parseFloat(
                                                    formik.values.charge
                                                  ),
                                                  currency
                                                )}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">
                                              {t('accounts.common.description')}
                                            </span>
                                            <span className="max-w-[55%] text-right text-xs font-medium text-foreground">
                                              {transaction.description}
                                            </span>
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button
                                            variant="outline"
                                            onClick={() =>
                                              setConfirmingApproveId(null)
                                            }
                                          >
                                            {t('shared.actions.cancel')}
                                          </Button>
                                          <SubmitButton
                                            formik={formik}
                                            onClick={() => {
                                              setConfirmingApproveId(null)
                                              formik.handleSubmit()
                                            }}
                                            className="gap-2"
                                          >
                                            <CheckCircle2 className="size-4" />
                                            {t('accounts.approvals.approve')}
                                          </SubmitButton>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </>
                                )}
                              </Formik>
                            </CardContent>
                          </Card>
                        )
                      }
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>

        {/* Bulk action bar — fixed bottom, slides up when items are selected */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border transition-transform duration-200 ease-in-out ${
            count > 0 ? 'translate-y-0' : 'translate-y-full pointer-events-none'
          }`}
          aria-hidden={count === 0}
        >
          <div className="pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 px-4">
            <p className="text-sm font-medium text-foreground mb-3">
              <span className="text-banking font-bold">{count}</span>{' '}
              expense{count !== 1 ? 's' : ''} selected
            </p>
            <div className="mb-3">
              <label
                htmlFor="bulk-charge"
                className="block text-xs font-medium text-muted-foreground mb-1.5"
              >
                {t('accounts.approvals.chargeLabel')} (applies to all selected)
              </label>
              <input
                id="bulk-charge"
                type="number"
                inputMode="decimal"
                placeholder={t('accounts.approvals.chargePlaceholder')}
                value={bulkCharge}
                onChange={(e) => setBulkCharge(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-muted/40 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 min-h-[44px] gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmBulkDecline(true)}
                disabled={bulkDeclining || bulkApproving}
              >
                {bulkDeclining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Decline {count}
              </Button>
              <Button
                className="flex-1 min-h-[44px] gap-1.5"
                onClick={handleBulkApprove}
                disabled={bulkApproving || bulkDeclining || !bulkCharge}
              >
                {bulkApproving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Approve {count}
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk decline confirmation */}
        <AlertDialog
          open={confirmBulkDecline}
          onOpenChange={setConfirmBulkDecline}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Decline {count} Expense{count !== 1 ? 's' : ''}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                These expenses will be declined and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDecline}
                className="bg-destructive hover:bg-destructive/90"
              >
                Decline All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ApolloWrapper>
  )
}

export default Approvals
