import { useMutation, useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import useModal from 'hooks/useModal'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { throwToSentry } from 'global-utils'
import { newClientTransactionId } from 'lib/idempotency'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { COUNCIL_ACCOUNT_DASHBOARD } from '../accountsGQL'
import { DEBIT_BUSSING_SOCIETY } from '../request-expense/expenseGQL'
import { CouncilForAccounts } from '../accounts-types'

const BussingExpenseEntry = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const { show, handleClose, handleShow } = useModal()
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(COUNCIL_ACCOUNT_DASHBOARD, {
    variables: {
      id: councilId,
    },
  })
  // SYN-109: refetch active queries so the bussing-society balance on
  // every open dashboard tab refreshes after a debit.
  const [DebitBussingSociety] = useMutation(DEBIT_BUSSING_SOCIETY, {
    refetchQueries: 'active',
  })

  const council: CouncilForAccounts = data?.councils[0]

  const initialValues = {
    amountSpent: '',
  }

  const validationSchema = Yup.object({
    amountSpent: Yup.number()
      .typeError('Please enter a valid number')
      .required('This is a required field'),
  })

  const onSubmit = async (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    const { setSubmitting } = onSubmitProps

    setSubmitting(true)
    try {
      const res = await DebitBussingSociety({
        variables: {
          councilId,
          expenseAmount: parseFloat(values.amountSpent.toString()),
          expenseCategory: 'Bussing',
          clientTransactionId: newClientTransactionId(),
        },
      })

      if (!res.data?.DebitBussingSociety) return

      clickCard(res.data.DebitBussingSociety)
      navigate('/accounts/transaction-details/')
    } catch (err) {
      throwToSentry('Error Making Expense Request', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <HeadingPrimary>{`${council?.name} ${council?.__typename} Expense Form`}</HeadingPrimary>
        <HeadingSecondary>
          Pls input the amount that was spent on bussing
        </HeadingSecondary>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <Form>
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div>
                    <Input
                      name="amountSpent"
                      label="How much are was spent on bussing today?"
                      placeholder="Enter an amount"
                    />
                  </div>

                  <Dialog
                    open={show}
                    onOpenChange={(open) => (open ? handleShow() : handleClose())}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Please confirm the amount spent
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 text-sm">
                        <p>
                          Amount Spent:{' '}
                          <span className="text-[hsl(var(--maps))]">
                            GHS{' '}
                            {parseFloat(
                              formik.values.amountSpent.toString()
                            ).toLocaleString('en-US')}
                          </span>
                        </p>

                        <p>
                          Bussing Society Balance:{' '}
                          <span className="text-[hsl(var(--maps))]">
                            GHS{' '}
                            {parseFloat(
                              council?.bussingSocietyBalance.toString()
                            ).toLocaleString('en-US')}
                          </span>
                        </p>

                        <p>
                          Category:{' '}
                          <span className="text-[hsl(var(--maps))]">
                            Bussing
                          </span>
                        </p>
                        {council.bussingSocietyBalance <
                          parseFloat(formik.values.amountSpent) && (
                          <span className="font-semibold text-destructive">
                            Submitting this will send {council.name} Council
                            balance into negative balance of{' '}
                            {council.bussingSocietyBalance -
                              parseFloat(formik.values.amountSpent)}{' '}
                            GHS
                          </span>
                        )}
                      </div>

                      <DialogFooter>
                        <SubmitButton
                          onClick={formik.handleSubmit}
                          formik={formik}
                        />
                        <Button variant="outline" onClick={handleClose}>
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="mt-5 text-center">
                    <Button
                      type="button"
                      onClick={handleShow}
                      disabled={formik.isSubmitting}
                      className="px-8"
                    >
                      Submit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Form>
          )}
        </Formik>
      </div>
    </ApolloWrapper>
  )
}

export default BussingExpenseEntry
