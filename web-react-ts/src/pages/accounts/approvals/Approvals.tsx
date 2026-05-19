import { useMutation, useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext, useState } from 'react'
import {
  APPROVE_EXPENSE,
  DECLINE_EXPENSE,
  GET_COUNCIL_PENDING_APPROVAL_TRANSACTIONS,
} from './approvals-gql'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { CouncilForAccounts } from '../accounts-types'
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
import { CheckCircle2, Inbox, Loader2, XCircle } from 'lucide-react'

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
  const isDeclining = (id: string) => decliningIds.has(id)
  const markDeclining = (id: string, on: boolean) =>
    setDecliningIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

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

  const initialValues = { charge: '' }

  const validationSchema = Yup.object({
    charge: Yup.number().required('Required'),
  })

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-3xl px-4 py-5 lg:px-6 lg:py-8">
          <header className="space-y-2 pl-14 pr-14 md:px-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Pending <span className="text-banking">Approvals</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {campus?.name}
              {totalPending > 0 ? (
                <>
                  {' · '}
                  <span className="font-medium tabular-nums text-foreground">
                    {totalPending}
                  </span>{' '}
                  awaiting review
                </>
              ) : null}
            </p>
          </header>

          {totalPending === 0 ? (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted/60">
                  <Inbox className="size-6 text-muted-foreground" />
                </span>
                <p className="text-sm font-medium text-foreground">
                  No pending approvals
                </p>
                <p className="text-xs text-muted-foreground">
                  Expense requests awaiting your review will appear here.
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
                      {council.transactions.length} pending
                    </span>
                  </div>

                  <div className="space-y-4">
                    {council.transactions.map(
                      (transaction: AccountTransaction) => {
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
                          <Card key={transaction.id} className="overflow-hidden">
                            <CardContent className="space-y-5 p-5">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Amount requested
                                  </p>
                                  <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-foreground">
                                    {formatAmount(transaction.amount, currency)}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="h-7 self-start border-warning/30 bg-warning/15 px-3 text-xs font-semibold uppercase tracking-wider text-warning"
                                >
                                  {transaction.status}
                                </Badge>
                              </div>

                              <Separator />

                              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                <div className="space-y-0.5">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Category
                                  </dt>
                                  <dd className="font-medium text-foreground">
                                    {transaction.category}
                                  </dd>
                                </div>
                                <div className="space-y-0.5">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Account
                                  </dt>
                                  <dd className="font-medium text-foreground">
                                    {transaction.account}
                                  </dd>
                                </div>
                                <div className="space-y-0.5 sm:col-span-2">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Description
                                  </dt>
                                  <dd className="text-foreground break-words">
                                    {transaction.description}
                                  </dd>
                                </div>
                                <div className="space-y-0.5">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Logged by
                                  </dt>
                                  <dd className="font-medium text-foreground">
                                    {transaction.loggedBy?.fullName}
                                  </dd>
                                </div>
                                <div className="space-y-0.5">
                                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Created
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
                                  <Form className="space-y-4">
                                    <Input
                                      name="charge"
                                      label="Charge (GHS)"
                                      placeholder="e.g. 5"
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
                                            markDeclining(transaction.id, false)
                                          }
                                        }}
                                      >
                                        {isDeclining(transaction.id) ? (
                                          <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Declining…
                                          </>
                                        ) : (
                                          <>
                                            <XCircle className="size-5" />
                                            Decline
                                          </>
                                        )}
                                      </Button>
                                      <SubmitButton
                                        formik={formik}
                                        className="h-12 w-full gap-2 px-6 sm:w-auto sm:min-w-40"
                                      >
                                        <CheckCircle2 className="size-5" />
                                        Approve
                                      </SubmitButton>
                                    </div>
                                  </Form>
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
      </div>
    </ApolloWrapper>
  )
}

export default Approvals
