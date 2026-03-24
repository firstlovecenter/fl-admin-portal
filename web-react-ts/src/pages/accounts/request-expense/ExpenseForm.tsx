import { useMutation, useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import useModal from 'hooks/useModal'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import { COUNCIL_ACCOUNT_DASHBOARD } from '../accountsGQL'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { throwToSentry } from 'global-utils'
import RadioButtons from 'components/formik/RadioButtons'
import Textarea from 'components/formik/Textarea'
import { EXPENSE_REQUEST } from './expenseGQL'
import { CouncilForAccounts } from '../accounts-types'
import { isAccountOpen } from '../accounts-utils'
import AccountBlockedMsg from './AccountBlockedMsg'
import { MemberContext } from 'contexts/MemberContext'
import { Button } from 'components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogFooter } from 'components/ui/dialog'

const ExpenseForm = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const { show, handleClose, handleShow } = useModal()
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(COUNCIL_ACCOUNT_DASHBOARD, {
    variables: {
      id: councilId,
    },
  })
  const [ExpenseRequest] = useMutation(EXPENSE_REQUEST)

  const council: CouncilForAccounts = data?.councils[0]

  const initialValues = {
    requestedAmount: '',
    ghostBussingSociety: '0',
    category: '',
    description: '',
  }

  const validationSchema = Yup.object({
    requestedAmount: Yup.number()
      .typeError('Please enter a valid number')
      .required('This is a required field'),
    category: Yup.string().required('This is a required field'),
    description: Yup.string().required('This is a required field'),
  })

  const onSubmit = async (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    const { setSubmitting } = onSubmitProps

    setSubmitting(true)
    try {
      const res = await ExpenseRequest({
        variables: {
          councilId,
          expenseAmount: parseFloat(values.requestedAmount),
          expenseCategory: values.category,
          accountType: 'Weekday Account',

          description: values.description,
        },
      })

      clickCard(res.data.ExpenseRequest)
      navigate('/accounts/transaction-details/')
    } catch (err) {
      throwToSentry('Error Making Expense Request', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAccountOpen() && !currentUser.roles.includes('fishers')) {
    return <AccountBlockedMsg />
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <HeadingPrimary>{`${council?.name} ${council?.__typename} Expense Form`}</HeadingPrimary>
        <HeadingSecondary>
          Fill Out This Form For Any Expense You Need
        </HeadingSecondary>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <Form>
              <div className="mb-4">
                <div className="my-4">
                  <Input
                    name="requestedAmount"
                    label="How much are you requesting from your weekday account"
                    placeholder="Enter an amount"
                    value={
                      formik.values.category === 'HR'
                        ? (formik.values.requestedAmount =
                            council?.hrAmount.toString())
                        : formik.values.requestedAmount
                    }
                  />
                  {formik.values.category === 'Bussing' && (
                    <Input
                      name="ghostBussingSociety"
                      label="How much from your bussing society?"
                      placeholder="Enter an amount"
                    />
                  )}
                </div>

                <div className="mb-4">
                  <RadioButtons
                    name="category"
                    label="Category of Expense"
                    options={[
                      { key: 'Bussing', value: 'Bussing' },
                      { key: 'HR', value: 'HR' },
                      { key: 'Construction', value: 'Construction' },
                      { key: 'Ministry Expense', value: 'Ministry Expense' },
                    ]}
                  />
                </div>
                <div className="mb-4">
                  <Textarea
                    name="description"
                    label="Description"
                    placeholder="Enter a description"
                  />
                </div>
                <Dialog open={show} onOpenChange={(open) => { if (!open) handleClose() }} centered scrollable><DialogContent>
                  <DialogHeader>
                    Please confirm the amounts to deposit
                  </DialogHeader>
                  
                    <p>
                      Requested Amount:{' '}
                      <span className="text-info">
                        GHS{' '}
                        {(
                          parseFloat(formik.values.requestedAmount) +
                          parseFloat(formik.values.ghostBussingSociety ?? '0')
                        ).toLocaleString('en-US')}
                      </span>
                    </p>

                    <p>
                      Category:{' '}
                      <span className="text-info">
                        {formik.values.category}
                      </span>
                    </p>

                    <p>
                      Description:{' '}
                      <span className="text-info">
                        {formik.values.description}
                      </span>
                    </p>
                  

                  <DialogFooter>
                    <SubmitButton
                      onClick={formik.handleSubmit}
                      formik={formik}
                    />
                    <Button variant="default" onClick={handleClose}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent></Dialog>

                <div className="text-center mt-5">
                  <Button onClick={handleShow} className="px-5">
                    Submit
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </ApolloWrapper>
  )
}

export default ExpenseForm
