import { useMutation, useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import useModal from 'hooks/useModal'
import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { COUNCIL_ACCOUNT_DASHBOARD } from '../accountsGQL'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Button, Container, Modal } from 'react-bootstrap'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { throwToSentry } from 'global-utils'
import { DEBIT_BUSSING_SOCIETY } from '../request-expense/expenseGQL'
import { CouncilForAccounts } from '../accounts-types'

const BussingExpenseEntry = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const { show, handleClose, handleShow } = useModal()
  const router = useRouter()

  const { data, loading, error } = useQuery(COUNCIL_ACCOUNT_DASHBOARD, {
    variables: {
      id: councilId,
    },
  })
  const [DebitBussingSociety] = useMutation(DEBIT_BUSSING_SOCIETY)

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
        },
      })

      if (!res.data?.DebitBussingSociety) return

      clickCard(res.data.DebitBussingSociety)
      router.push('/accounts/transaction-details/')
    } catch (err) {
      throwToSentry('Error Making Expense Request', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
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
              <Container className="mb-4">
                <div className="my-4">
                  <Input
                    name="amountSpent"
                    label="How much are was spent on bussing today?"
                    placeholder="Enter an amount"
                  />
                </div>

                <Modal show={show} onHide={handleClose} centered scrollable>
                  <Modal.Header closeButton>
                    Please confirm the amount spent
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                      Amount Spent:{' '}
                      <span className="text-info">
                        GHS{' '}
                        {parseFloat(
                          formik.values.amountSpent.toString()
                        ).toLocaleString('en-US')}
                      </span>
                    </p>

                    <p>
                      Bussing Society Balance:{' '}
                      <span className="text-info">
                        GHS{' '}
                        {parseFloat(
                          council?.bussingSocietyBalance.toString()
                        ).toLocaleString('en-US')}
                      </span>
                    </p>

                    <p>
                      Category: <span className="text-info">Bussing</span>
                    </p>
                    {council.bussingSocietyBalance <
                      parseFloat(formik.values.amountSpent) && (
                      <span className="text-danger fw-bold">
                        Submitting this will send {council.name} Council balance
                        into negative balance of{' '}
                        {council.bussingSocietyBalance -
                          parseFloat(formik.values.amountSpent)}{' '}
                        GHS
                      </span>
                    )}
                  </Modal.Body>

                  <Modal.Footer>
                    <SubmitButton
                      onClick={formik.handleSubmit}
                      formik={formik}
                    />
                    <Button variant="primary" onClick={handleClose}>
                      Close
                    </Button>
                  </Modal.Footer>
                </Modal>

                <div className="text-center mt-5">
                  <Button onClick={handleShow} className="px-5">
                    Submit
                  </Button>
                </div>
              </Container>
            </Form>
          )}
        </Formik>
      </Container>
    </ApolloWrapper>
  )
}

export default BussingExpenseEntry
