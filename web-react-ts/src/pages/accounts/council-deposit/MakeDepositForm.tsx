import { useMutation, useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import useModal from 'hooks/useModal'
import { throwToSentry } from 'global-utils'
import { newClientTransactionId } from 'lib/idempotency'
import RoleView from 'auth/RoleView'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { COUNCIL_ACCOUNT_DASHBOARD } from '../accountsGQL'
import {
  DEPOSIT_INTO_COUNCIL_BUSSING_SOCIETY,
  DEPOSIT_INTO_COUNCIL_CURRENT_ACCOUNTS,
  SET_HR_AMOUNT,
} from './depositGQL'
import { CouncilForAccounts } from '../accounts-types'

const MakeDepositForm = () => {
  const { t } = useTranslation()
  const { councilId, clickCard } = useContext(ChurchContext)
  const { show, handleClose, handleShow } = useModal()
  const navigate = useNavigate()

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
  const validationSchema = useMemo(
    () =>
      Yup.object({
        hrAmount: Yup.number()
          .typeError(t('accounts.common.validNumber'))
          .required(t('accounts.common.required')),
        weekdayBalanceDepositAmount: Yup.number()
          .typeError(t('accounts.common.validNumber'))
          .required(t('accounts.common.required')),
        bussingSocietyBalance: Yup.number()
          .typeError(t('accounts.common.validNumber'))
          .required(t('accounts.common.required')),
      }),
    [t]
  )

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
              clientTransactionId: newClientTransactionId(),
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
              clientTransactionId: newClientTransactionId(),
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
        navigate('/accounts/council/dashboard')
      } else {
        navigate('/accounts/transaction-details/')
      }
    } catch (err) {
      throwToSentry('Error Depositing into Council Account', err)
    } finally {
      setSubmitting(false)
    }
  }

  const churchTypeLabel = council?.__typename
    ? t(`shared.churchLevel.${council.__typename}`, {
        defaultValue: council.__typename,
      })
    : ''

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <HeadingPrimary>{`${council?.name ?? ''} ${churchTypeLabel}`.trim()}</HeadingPrimary>
        <HeadingSecondary>{council?.leader.fullName}</HeadingSecondary>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <Form>
              <div className="mb-4 space-y-4">
                <RoleView roles={['adminCampus']}>
                  <Input
                    name="weekdayBalanceDepositAmount"
                    label={t('accounts.deposit.weekdayDepositLabel')}
                    placeholder={t('accounts.common.enterAmount')}
                  />
                  <Input
                    name="hrAmount"
                    label={t('accounts.deposit.hrAmountLabel')}
                    placeholder={t('accounts.common.enterAmount')}
                  />
                </RoleView>
                <RoleView roles={['arrivalsAdminCampus']}>
                  <Input
                    name="bussingSocietyBalance"
                    label={t('accounts.deposit.bussingBalanceLabel')}
                    placeholder={t('accounts.common.enterAmount')}
                  />
                </RoleView>
                <Dialog
                  open={show}
                  onOpenChange={(open) =>
                    open ? handleShow() : handleClose()
                  }
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t('accounts.deposit.confirmTitle')}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                      <p>
                        {t('accounts.deposit.weekdayIncomeAmount')}{' '}
                        <span className="text-[hsl(var(--maps))]">
                          {t('accounts.deposit.ghsAmount', {
                            amount: parseFloat(
                              formik.values.weekdayBalanceDepositAmount
                            ).toLocaleString('en-US'),
                          })}
                        </span>
                      </p>

                      <p>
                        {t('accounts.deposit.hrAmount')}{' '}
                        <span className="text-[hsl(var(--maps))]">
                          {t('accounts.deposit.ghsAmount', {
                            amount: parseFloat(
                              formik.values.hrAmount
                            ).toLocaleString('en-US'),
                          })}
                        </span>
                      </p>

                      <p>
                        {t('accounts.deposit.bussingSocietyBalance')}{' '}
                        <span className="text-[hsl(var(--maps))]">
                          {t('accounts.deposit.ghsAmount', {
                            amount: parseFloat(
                              formik.values.bussingSocietyBalance
                            ).toLocaleString('en-US'),
                          })}
                        </span>
                      </p>
                    </div>

                    <DialogFooter>
                      <SubmitButton
                        onClick={formik.handleSubmit}
                        formik={formik}
                      />
                      <Button variant="outline" onClick={handleClose}>
                        {t('accounts.common.close')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="mt-5 text-center">
                  <Button
                    type="button"
                    disabled={formik.isSubmitting}
                    onClick={() => {
                      if (formik.values.bussingSocietyBalance === '') {
                        formik.setFieldValue('bussingSocietyBalance', '0')
                      }
                      if (formik.values.weekdayBalanceDepositAmount === '') {
                        formik.setFieldValue(
                          'weekdayBalanceDepositAmount',
                          '0'
                        )
                      }
                      handleShow()
                    }}
                    className="px-8"
                  >
                    {t('shared.form.submit')}
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

export default MakeDepositForm
