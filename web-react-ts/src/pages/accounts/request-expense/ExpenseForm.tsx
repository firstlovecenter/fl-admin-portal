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
import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { COUNCIL_ACCOUNT_DASHBOARD } from '../accountsGQL'
import { CouncilForAccounts } from '../accounts-types'
import { isAccountOpen } from '../accounts-utils'
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

  const validationSchema = Yup.object({
    requestedAmount: Yup.number()
      .typeError('Please enter a valid number')
      .required('This is a required field'),
    category: Yup.string().required('This is a required field'),
    description: Yup.string()
      .trim()
      .required('This is a required field')
      .max(500, 'Description must be 500 characters or fewer'),
  })

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
            <span className="text-banking">Expense Request</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Submit a new expense for approval by the campus admin.
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
                    {/* Supporting column — context. First in DOM so it sits on top on mobile. */}
                    <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
                      <Card>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-banking/10">
                              <Wallet className="size-5 text-banking" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                Weekday Account
                              </p>
                              {loading ? (
                                <Skeleton className="mt-1 h-7 w-24" />
                              ) : (
                                <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                                  {formatCurrency(council?.weekdayBalance)}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-muted-foreground">
                                Available before this request
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-dashed">
                        <CardContent className="flex items-start gap-3 p-4">
                          <Clock className="size-4 shrink-0 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Accounts are open from 6 a.m. to 3 p.m. daily.
                            Requests outside these hours are blocked.
                          </p>
                        </CardContent>
                      </Card>
                    </aside>

                    {/* Primary column — the form. */}
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
                              label="Amount from weekday account (GHS)"
                              placeholder="Enter an amount"
                              readOnly={isHrCategory}
                            />
                            {isHrCategory && (
                              <p className="text-xs text-muted-foreground">
                                Auto-filled from the HR amount on file.
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
                              label="Amount from bussing society (GHS)"
                              placeholder="Enter an amount"
                            />
                          )}

                          <RadioButtons
                            name="category"
                            label="Category of expense"
                            options={[
                              { key: 'Bussing', value: 'Bussing' },
                              { key: 'HR', value: 'HR' },
                              { key: 'Construction', value: 'Construction' },
                              {
                                key: 'Ministry Expense',
                                value: 'Ministry Expense',
                              },
                            ]}
                          />

                          <Textarea
                            name="description"
                            label="Description"
                            placeholder="Describe what this expense is for"
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
                          Review &amp; Submit
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
                        <DialogTitle>Confirm expense request</DialogTitle>
                        <DialogDescription>
                          Double-check the details below before submitting.
                          You can&apos;t edit a request after it&apos;s sent.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm text-muted-foreground">
                            Total amount
                          </span>
                          <span className="text-xl font-semibold tabular-nums text-foreground">
                            {formatCurrency(totalAmount)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm text-muted-foreground">
                            Category
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {formik.values.category || '—'}
                          </span>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">
                            Description
                          </span>
                          <p className="text-sm text-foreground">
                            {formik.values.description || '—'}
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
                            Cancel
                          </Button>
                        </DialogClose>
                        <SubmitButton
                          onClick={() => formik.handleSubmit()}
                          formik={formik}
                          className="w-full sm:w-auto sm:min-w-40"
                        >
                          Confirm &amp; Submit
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
