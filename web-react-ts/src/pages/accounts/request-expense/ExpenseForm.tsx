import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import Input from 'components/formik/Input'
import { newClientTransactionId } from 'lib/idempotency'
import RadioButtons from 'components/formik/RadioButtons'
import SubmitButton from 'components/formik/SubmitButton'
import Textarea from 'components/formik/Textarea'
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
import { Form, Formik, FormikHelpers } from 'formik'
import { throwToSentry } from 'global-utils'
import useModal from 'hooks/useModal'
import { Clock, Receipt, Wallet } from 'lucide-react'
import { useContext, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { COUNCIL_ACCOUNT_DASHBOARD } from '../accountsGQL'
import { CouncilForAccounts } from '../accounts-types'
import { isAccountOpen } from '../accounts-utils'
import { translateCategoryLabel } from '../accounts-i18n'
import AccountBlockedMsg from './AccountBlockedMsg'
import { EXPENSE_REQUEST } from './expenseGQL'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'

const formatCurrency = (value: number | null | undefined) => {
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 0,
    }).format(value ?? 0)
  } catch {
    return `GHS ${(value ?? 0).toLocaleString('en-GH', {
      maximumFractionDigits: 0,
    })}`
  }
}

type ExpenseFormValues = {
  requestedAmount: string
  ghostBussingSociety: string
  category: string
  description: string
}

const HrAutoFill = ({
  category,
  hrAmount,
  setFieldValue,
}: {
  category: string
  hrAmount: number | undefined
  setFieldValue: (field: string, value: string) => void
}) => {
  useEffect(() => {
    if (
      category === 'HR' &&
      typeof hrAmount === 'number' &&
      hrAmount > 0
    ) {
      setFieldValue('requestedAmount', hrAmount.toString())
    }
  }, [category, hrAmount, setFieldValue])

  return null
}

const ResetGhostBussingOnCategoryChange = ({
  category,
  ghostBussingSociety,
  setFieldValue,
}: {
  category: string
  ghostBussingSociety: string
  setFieldValue: (field: string, value: string) => void
}) => {
  useEffect(() => {
    if (category !== 'Bussing' && ghostBussingSociety !== '0') {
      setFieldValue('ghostBussingSociety', '0')
    }
  }, [category, ghostBussingSociety, setFieldValue])

  return null
}

const ExpenseForm = () => {
  const { t } = useTranslation()
  const { councilId, clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const { show, handleClose, handleShow } = useModal()
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(COUNCIL_ACCOUNT_DASHBOARD, {
    variables: {
      id: councilId,
    },
  })
  // SYN-109: refetch active queries so balance cards on previously
  // open dashboard tabs reflect the new pending-approval row without
  // requiring a hard refresh.
  const [ExpenseRequest] = useMutation(EXPENSE_REQUEST, {
    refetchQueries: 'active',
  })

  const council: CouncilForAccounts = data?.councils[0]

  const initialValues: ExpenseFormValues = {
    requestedAmount: '',
    ghostBussingSociety: '0',
    category: '',
    description: '',
  }

  const validationSchema = useMemo(
    () =>
      Yup.object({
        requestedAmount: Yup.number()
          .typeError(t('accounts.common.validNumber'))
          .required(t('accounts.common.required')),
        category: Yup.string().required(t('accounts.common.required')),
        description: Yup.string()
          .trim()
          .required(t('accounts.common.required'))
          .max(500, t('accounts.expense.descriptionMax')),
      }),
    [t]
  )

  const onSubmit = async (
    values: ExpenseFormValues,
    onSubmitProps: FormikHelpers<ExpenseFormValues>
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
          clientTransactionId: newClientTransactionId(),
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
    <ApolloWrapper data={data} loading={loading} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {council?.name ? (
              <>{council.name} </>
            ) : (
              <Skeleton className="mr-2 inline-block h-7 w-40 align-middle" />
            )}
            <span className="text-banking">
              {t('accounts.expense.titleHighlight')}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('accounts.expense.subtitle')}
          </p>
        </StickyPageHeader>
        <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {(formik) => {
              const isBussingCategory = formik.values.category === 'Bussing'
              const totalAmount =
                parseFloat(formik.values.requestedAmount || '0') +
                (isBussingCategory
                  ? parseFloat(formik.values.ghostBussingSociety || '0')
                  : 0)
              const isHrCategory = formik.values.category === 'HR'
              const categoryDisplay = translateCategoryLabel(
                t,
                formik.values.category
              ) || t('accounts.expense.emDash')

              return (
                <Form>
                  <HrAutoFill
                    category={formik.values.category}
                    hrAmount={council?.hrAmount}
                    setFieldValue={formik.setFieldValue}
                  />
                  <ResetGhostBussingOnCategoryChange
                    category={formik.values.category}
                    ghostBussingSociety={formik.values.ghostBussingSociety}
                    setFieldValue={formik.setFieldValue}
                  />

                  <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
                    <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
                      <Card>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-banking/10">
                              <Wallet className="size-5 text-banking" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {t('accounts.common.weekdayAccount')}
                              </p>
                              {loading ? (
                                <Skeleton className="mt-1 h-7 w-24" />
                              ) : (
                                <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                                  {formatCurrency(council?.weekdayBalance)}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t('accounts.expense.availableBefore')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-dashed">
                        <CardContent className="flex items-start gap-3 p-4">
                          <Clock className="size-4 shrink-0 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {t('accounts.expense.hoursHint')}
                          </p>
                        </CardContent>
                      </Card>
                    </aside>

                    <section className="lg:col-start-1 lg:row-start-1">
                      <Card>
                        <CardContent className="space-y-6 p-5">
                          <div className="space-y-2">
                            <Input
                              name="requestedAmount"
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              label={t('accounts.expense.amountWeekdayLabel')}
                              placeholder={t('accounts.common.enterAmount')}
                              readOnly={isHrCategory}
                            />
                            {isHrCategory && (
                              <p className="text-xs text-muted-foreground">
                                {t('accounts.expense.hrAutofillHint')}
                              </p>
                            )}
                          </div>

                          {formik.values.category === 'Bussing' && (
                            <Input
                              name="ghostBussingSociety"
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              label={t('accounts.expense.amountBussingLabel')}
                              placeholder={t('accounts.common.enterAmount')}
                            />
                          )}

                          <RadioButtons
                            name="category"
                            label={t('accounts.expense.categoryLabel')}
                            options={[
                              {
                                key: t('accounts.expense.categoryBussing'),
                                value: 'Bussing',
                              },
                              {
                                key: t('accounts.expense.categoryHr'),
                                value: 'HR',
                              },
                              {
                                key: t('accounts.expense.categoryConstruction'),
                                value: 'Construction',
                              },
                              {
                                key: t('accounts.expense.categoryMinistry'),
                                value: 'Ministry Expense',
                              },
                            ]}
                          />

                          <Textarea
                            name="description"
                            label={t('accounts.common.description')}
                            placeholder={t(
                              'accounts.expense.descriptionPlaceholder'
                            )}
                          />
                        </CardContent>
                      </Card>

                      <div className="mt-6 flex justify-center">
                        <Button
                          type="button"
                          size="lg"
                          onClick={async () => {
                            const errors = await formik.validateForm()
                            formik.setTouched(
                              Object.keys(errors).reduce(
                                (acc, key) => ({ ...acc, [key]: true }),
                                {}
                              )
                            )
                            if (Object.keys(errors).length === 0) {
                              handleShow()
                            }
                          }}
                          className="h-12 w-full gap-2 px-8 text-base font-semibold sm:w-auto sm:min-w-64"
                        >
                          <Receipt className="size-5" />
                          {t('accounts.expense.reviewSubmit')}
                        </Button>
                      </div>
                    </section>
                  </div>

                  <Dialog
                    open={show}
                    onOpenChange={(open) => (open ? handleShow() : handleClose())}
                  >
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {t('accounts.expense.confirmTitle')}
                        </DialogTitle>
                        <DialogDescription>
                          {t('accounts.expense.confirmBody')}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm text-muted-foreground">
                            {t('accounts.expense.totalAmount')}
                          </span>
                          <span className="text-xl font-semibold tabular-nums text-foreground">
                            {formatCurrency(totalAmount)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm text-muted-foreground">
                            {t('accounts.common.category')}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {categoryDisplay}
                          </span>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">
                            {t('accounts.common.description')}
                          </span>
                          <p className="text-sm text-foreground">
                            {formik.values.description ||
                              t('accounts.expense.emDash')}
                          </p>
                        </div>
                      </div>

                      <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <DialogClose asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            {t('shared.actions.cancel')}
                          </Button>
                        </DialogClose>
                        <SubmitButton
                          onClick={() => formik.handleSubmit()}
                          formik={formik}
                          className="w-full sm:w-auto sm:min-w-40"
                        >
                          {t('accounts.expense.confirmSubmit')}
                        </SubmitButton>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Form>
              )
            }}
          </Formik>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default ExpenseForm
