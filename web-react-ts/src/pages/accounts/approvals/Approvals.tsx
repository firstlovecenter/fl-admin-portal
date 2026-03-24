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
import { CouncilForAccounts } from '../accounts-types'
import TransactionCard from '../TransactionCard'
import { CheckCircle2, XCircle } from 'lucide-react'
import { throwToSentry } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { Button } from 'components/ui/button'

const Approvals = () => {
  const { campusId } = useContext(ChurchContext)
  const [submitting, setSubmitting] = useState(false)
  const { data, loading, error, refetch } = useQuery(
    GET_COUNCIL_PENDING_APPROVAL_TRANSACTIONS,
    {
      variables: { campusId },
    }
  )
  const [approveExpense] = useMutation(APPROVE_EXPENSE)
  const [declineExpense] = useMutation(DECLINE_EXPENSE)

  const campus = data?.campuses[0]

  const initialValues = {
    charge: '',
  }

  const validationSchema = Yup.object({
    charge: Yup.number().required('Required'),
  })

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <HeadingPrimary>Pending Approvals</HeadingPrimary>
        <HeadingSecondary>{campus?.name}</HeadingSecondary>

        <div className="mt-4">
          {!campus?.councils.some(
            (council: CouncilForAccounts) => !!council.transactions.length
          ) && <NoDataComponent text="There are no pending approvals" />}

          {campus?.councils.map(
            (council: CouncilForAccounts, index: number) => (
              <>
                {!!council.transactions.length && (
                  <div className="fw-bold fs-4">{council.name}</div>
                )}

                <div>
                  {council.transactions.map((transaction: any) => {
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
                      <div className="mb-4">
                        <TransactionCard transaction={transaction} />
                        <div className="text-center mt-4">
                          <Formik
                            initialValues={initialValues}
                            validationSchema={validationSchema}
                            onSubmit={onSubmit}
                          >
                            {(formik) => (
                              <form>
                                <Input
                                  name="charge"
                                  label="Charge"
                                  placeholder="in GHS"
                                />
                                <SubmitButton formik={formik}>
                                  <div>
                                    Approve <CheckCircle2 />
                                  </div>
                                </SubmitButton>
                                <Button
                                  className="px-3 ms-2"
                                  variant="destructive"
                                  disabled={submitting}
                                  onClick={async () => {
                                    try {
                                      setSubmitting(true)
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
                                      setSubmitting(false)
                                    }
                                  }}
                                >
                                  {submitting ? (
                                    'Loading'
                                  ) : (
                                    <>
                                      Decline <XCircle />
                                    </>
                                  )}
                                </Button>
                              </form>
                            )}
                          </Formik>
                        </div>
                        <hr />
                      </div>
                    )
                  })}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </ApolloWrapper>
  )
}

export default Approvals
