import { useMutation, useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { COUNCIL_ACCOUNT_DASHBOARD } from '../accountsGQL'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { Button, Container, Modal } from 'react-bootstrap'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import useModal from 'hooks/useModal'
import {
  DEPOSIT_INTO_COUNCIL_BUSSING_SOCIETY,
  DEPOSIT_INTO_COUNCIL_CURRENT_ACCOUNTS,
  SET_HR_AMOUNT,
} from './depositGQL'
import { throwToSentry } from 'global-utils'
import RoleView from 'auth/RoleView'
import { CouncilForAccounts } from '../accounts-types'

const MakeDepositForm = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const { show, handleClose, handleShow } = useModal()
  const router = useRouter()

  const { data, loading, error } = useQuery(COUNCIL_ACCOUNT_DASHBOARD, {
    variables: {
      id: councilId,
    },
  })
  const [DepositIntoCouncilCurrentAccount] = useMutation(
    DEPOSIT_INTO_COUNCIL_CURRENT_ACCOUNTS,
    {
      refetchQueries: [
        { query: COUNCIL_ACCOUNT_DASHBOARD, variables: { id: councilId } },
      ],
    }
  )

  const [DepositIntoCouncilBussingSociety] = useMutation(
    DEPOSIT_INTO_COUNCIL_BUSSING_SOCIETY,
    {
      refetchQueries: [
        { query: COUNCIL_ACCOUNT_DASHBOARD, variables: { id: councilId } },
      ],
    }
  )
  const [setHRAmount] = useMutation(SET_HR_AMOUNT, {
    refetchQueries: [
      { query: COUNCIL_ACCOUNT_DASHBOARD, variables: { id: councilId } },
    ],
  })

  const council: CouncilForAccounts = data?.councils[0]

  const initialValues = {
    hrAmount: council?.hrAmount?.toString() ?? '',
    weekdayBalanceDepositAmount: '',
    bussingSocietyBalance: council?.bussingSocietyBalance?.toString() ?? '',
  }
  const validationSchema = Yup.object({
    hrAmount: Yup.number()
      .typeError('Please enter a valid number')
      .required('This is a required field'),
    weekdayBalanceDepositAmount: Yup.number()
      .typeError('Please enter a valid number')
      .required('This is a required field'),
    bussingSocietyBalance: Yup.number()
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
      const mutations = []

      if (parseFloat(values.weekdayBalanceDepositAmount) > 0.0) {
        mutations.push(
          DepositIntoCouncilCurrentAccount({
            variables: {
              councilId,
              weekdayBalanceDepositAmount: parseFloat(
                values.weekdayBalanceDepositAmount
              ),
            },
          })
        )
      }

      if (parseFloat(values.hrAmount) !== council?.hrAmount) {
        mutations.push(
          setHRAmount({
            variables: {
              councilId,
              amount: parseFloat(values.hrAmount),
            },
          })
        )
      }

      if (
        parseFloat(values.bussingSocietyBalance) !==
        council?.bussingSocietyBalance
      ) {
        mutations.push(
          DepositIntoCouncilBussingSociety({
            variables: {
              councilId,
              bussingSocietyBalance: parseFloat(values.bussingSocietyBalance),
            },
          })
        )
      }

      const res = await Promise.all(mutations)

      res.map((response) => {
        if (response.data?.setHRAmount) {
          clickCard(response.data?.setHRAmount)
        }

        if (response.data?.DepositIntoCouncilCurrentAccount) {
          clickCard(response.data?.DepositIntoCouncilCurrentAccount)
        }

        if (response.data?.DepositIntoCouncilBussingSociety) {
          clickCard(response.data?.DepositIntoCouncilBussingSociety)
        }

        return null
      })

      if (parseFloat(values.hrAmount) !== council?.hrAmount) {
        router.push('/accounts/council/dashboard')
      } else {
        router.push('/accounts/transaction-details/')
      }
    } catch (err) {
      throwToSentry('Error Depositing into Council Account', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>{`${council?.name} ${council?.__typename}`}</HeadingPrimary>
        <HeadingSecondary>{council?.leader.fullName}</HeadingSecondary>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <Form>
              <Container className="mb-4">
                <RoleView roles={['adminCampus']}>
                  <Input
                    name="weekdayBalanceDepositAmount"
                    label="Weekday Account Balance Deposit Amount"
                    placeholder="Enter an amount"
                  />
                  <Input
                    name="hrAmount"
                    label="HR Amount"
                    placeholder="Enter an amount"
                  />
                </RoleView>
                <RoleView roles={['arrivalsAdminCampus']}>
                  <Input
                    name="bussingSocietyBalance"
                    label="Current Bussing Society Balance"
                    placeholder="Enter an amount"
                  />
                </RoleView>
                <Modal show={show} onHide={handleClose} centered scrollable>
                  <Modal.Header closeButton>
                    Please confirm the amounts to deposit
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                      Weekday Income Amount:{' '}
                      <span className="text-info">
                        GHS{' '}
                        {parseFloat(
                          formik.values.weekdayBalanceDepositAmount
                        ).toLocaleString('en-US')}
                      </span>
                    </p>

                    <p>
                      HR Amount:{' '}
                      <span className="text-info">
                        GHS{' '}
                        {parseFloat(formik.values.hrAmount).toLocaleString(
                          'en-US'
                        )}
                      </span>
                    </p>

                    <p>
                      Bussing Society Balance:{' '}
                      <span className="text-info">
                        GHS{' '}
                        {parseFloat(
                          formik.values.bussingSocietyBalance
                        ).toLocaleString('en-US')}
                      </span>
                    </p>
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
                  <Button
                    onClick={() => {
                      if (formik.values.bussingSocietyBalance === '') {
                        formik.setFieldValue('bussingSocietyBalance', '0')
                      }
                      if (formik.values.weekdayBalanceDepositAmount === '') {
                        formik.setFieldValue('weekdayBalanceDepositAmount', '0')
                      }
                      handleShow()
                    }}
                    className="px-5"
                  >
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

export default MakeDepositForm
