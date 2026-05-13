import { useMutation, useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext, useState } from 'react'
import {
  APPROVE_EXPENSE,
  DECLINE_EXPENSE,
  GET_COUNCIL_PENDING_APPROVAL_TRANSACTIONS,
} from './approvals-gql'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { Button, Container } from 'react-bootstrap'
import { CouncilForAccounts } from '../accounts-types'
import { AccountTransaction } from '../transaction-history/transaction-types'
import TransactionCard from '../TransactionCard'
import { CheckCircleFill, XCircleFill } from 'react-bootstrap-icons'
import { throwToSentry } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'

const Approvals = () => {
  const { campusId } = useContext(ChurchContext)
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

  const initialValues = {
    charge: '',
  }

  const validationSchema = Yup.object({
    charge: Yup.number().required('Required'),
  })

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>Pending Approvals</HeadingPrimary>
        <HeadingSecondary>{campus?.name}</HeadingSecondary>

        <div className="mt-4">
          {!campus?.councils.some(
            (council: CouncilForAccounts) => !!council.transactions.length
          ) && <NoDataComponent text="There are no pending approvals" />}

          {campus?.councils.map((council: CouncilForAccounts) => (
            // SYN-110: keyed on council.id so React doesn't reuse the
            // wrong card across re-renders. The previous fragment had
            // no key and produced the standard React warning.
            <React.Fragment key={council.id}>
              {!!council.transactions.length && (
                <div className="fw-bold fs-4">{council.name}</div>
              )}

              <div>
                {council.transactions.map(
                  (transaction: AccountTransaction) => {
                    const onSubmit = async (
                      values: typeof initialValues,
                      onSubmitProps: FormikHelpers<typeof initialValues>
                    ) => {
                      const { setSubmitting, resetForm } = onSubmitProps

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
                    <div className="mb-4" key={transaction.id}>
                      <TransactionCard transaction={transaction} />
                      <div className="text-center mt-4">
                        <Formik
                          initialValues={initialValues}
                          validationSchema={validationSchema}
                          onSubmit={onSubmit}
                        >
                          {(formik) => (
                            <Form>
                              <Input
                                name="charge"
                                label="Charge"
                                placeholder="in GHS"
                              />
                              <SubmitButton formik={formik}>
                                <div>
                                  Approve <CheckCircleFill />
                                </div>
                              </SubmitButton>
                              <Button
                                className="px-3 ms-2"
                                variant="danger"
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
                                  'Loading'
                                ) : (
                                  <>
                                    Decline <XCircleFill />
                                  </>
                                )}
                              </Button>
                            </Form>
                          )}
                        </Formik>
                      </div>
                      <hr />
                    </div>
                  )
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </Container>
    </ApolloWrapper>
  )
}

export default Approvals
