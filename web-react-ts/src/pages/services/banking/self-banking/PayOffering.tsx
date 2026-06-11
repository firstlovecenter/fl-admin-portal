import { ApolloError, useMutation, useQuery } from '@apollo/client'
import Input from 'components/formik/Input'
import Select from 'components/formik/Select'
import SubmitButton from 'components/formik/SubmitButton'
import { Alert, AlertDescription, AlertTitle } from 'components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Input as ShadcnInput } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { Skeleton } from 'components/ui/skeleton'
import { MemberContext } from 'contexts/MemberContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { Form, Formik, FormikHelpers } from 'formik'
import { Bacenta } from 'global-types'
import { MOMO_NUM_REGEX, throwToSentry } from 'global-utils'
import { TRANSACTION_STATUS } from '../banking-constants'
import useModal from 'hooks/useModal'
import usePopup from 'hooks/usePopup'
import { parseDate } from 'lib/date-utils'
import { Banknote, Info, Loader2, Wallet } from 'lucide-react'
import { MOBILE_NETWORK_OPTIONS } from 'pages/arrivals/arrivals-utils'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import * as Yup from 'yup'
import {
  CONFIRM_OFFERING_PAYMENT,
  DISPLAY_OFFERING_DETAILS,
  PAY_OFFERING_MUTATION,
  SEND_PAYMENT_OTP,
} from './bankingQueries'

// Paystack mobile-money OTPs are always 4 or 6 digits (mirrors backend regex).
const OTP_REGEX = /^(\d{4}|\d{6})$/

const messageFromError = (err: unknown): string => {
  if (err instanceof Error) return err.message
  return String(err)
}

type PayOfferingProps = {
  church: Bacenta
  loading: boolean
  error: ApolloError | undefined
}

type FormOptions = {
  mobileNetwork: string
  mobileNumber: string
}

const PayOffering = (props: PayOfferingProps) => {
  const { church } = props
  const { serviceRecordId } = useContext(ServiceContext)
  const { currentUser } = useContext(MemberContext)
  const { data, loading, error } = useQuery(DISPLAY_OFFERING_DETAILS, {
    variables: { serviceRecordId },
  })
  const [BankServiceOffering] = useMutation(PAY_OFFERING_MUTATION)
  const [SendPaymentOTP] = useMutation(SEND_PAYMENT_OTP)
  const [ConfirmOfferingPayment] = useMutation(CONFIRM_OFFERING_PAYMENT)
  const navigate = useNavigate()

  const service = data?.serviceRecords[0]
  const cashAndCharges = service?.cash
    ? parseFloat((service.cash / (1 - 0.0195) + 0.01).toFixed(2))
    : 0
  const charges = service?.cash
    ? Number((cashAndCharges - service.cash).toFixed(2))
    : 0

  const { togglePopup, isOpen } = usePopup()
  const { show, handleClose, handleShow } = useModal()
  const [errorMessage, setErrorMessage] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const initialValues: FormOptions = {
    mobileNetwork: '',
    mobileNumber: '',
  }

  useEffect(() => {
    if (service?.transactionStatus === TRANSACTION_STATUS.SEND_OTP) {
      handleShow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service])

  const validationSchema = Yup.object({
    mobileNumber: Yup.string()
      .required('You must enter a mobile number')
      .matches(
        MOMO_NUM_REGEX,
        'Enter a valid MoMo Number without spaces. eg. (02XXXXXXXX)'
      ),
    mobileNetwork: Yup.string().when('mobileNumber', {
      is: (mobileNumber: string) => mobileNumber && mobileNumber.length > 0,
      then: Yup.string().required('Please enter the Mobile Network'),
    }),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const { setSubmitting } = onSubmitProps

    setSubmitting(true)
    try {
      const paymentRes = await BankServiceOffering({
        variables: {
          serviceRecordId,
          mobileNetwork: values.mobileNetwork,
          mobileNumber: values.mobileNumber,
        },
      })
      if (paymentRes.errors) {
        throw new Error(paymentRes.errors[0]?.message)
      }
      if (
        paymentRes.data?.BankServiceOffering.transactionStatus ===
        TRANSACTION_STATUS.SEND_OTP
      ) {
        handleShow()
      } else {
        navigate('/self-banking/confirm-payment')
      }
    } catch (err: unknown) {
      setErrorMessage(messageFromError(err))
      togglePopup()
    } finally {
      setSubmitting(false)
    }
  }

  const currency = currentUser.currency

  const isPoimenError = errorMessage.includes('Poimen')

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <AlertDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) togglePopup()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Payment failed</AlertDialogTitle>
            <AlertDialogDescription>
              {isPoimenError
                ? 'There was a problem with your payment.'
                : 'Please make sure you have enough funds in your mobile wallet, and try again after 30 mins – 1 hour.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <code className="block break-words rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {errorMessage}
          </code>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                togglePopup()
                navigate('/services/bacenta/self-banking')
              }}
            >
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <StickyPageHeader>
        {loading || !church ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {church.name} <span className="text-banking">Banking</span>
          </h1>
        )}
        {church?.bankingCode && (
          <p className="font-mono text-sm text-muted-foreground">
            Banking Code: {church.bankingCode}
          </p>
        )}
      </StickyPageHeader>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        {error && (
          <Card>
            <CardContent className="p-5 text-sm text-destructive">
              {error.message}
            </CardContent>
          </Card>
        )}

        {(loading || !service) && !error && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        )}

        {service && (
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {(formik) => (
              <Form>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                  {/* LEFT — service info + form */}
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-lg bg-banking/10">
                            <Banknote className="size-5 text-banking" />
                          </span>
                          <div className="space-y-0.5">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                              Service Date
                            </p>
                            <p className="text-base font-semibold text-foreground">
                              {parseDate(service.serviceDate.date)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/30 p-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Cash
                            </p>
                            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                              {service.cash} {currency}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Charges
                            </p>
                            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-warning">
                              {charges.toFixed(2)} {currency}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Total
                            </p>
                            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                              {cashAndCharges} {currency}
                            </p>
                          </div>
                        </div>

                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Info className="mt-0.5 size-3.5 shrink-0" />
                          The charge represents a small fee for using the
                          self-banking feature.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-4 p-5">
                        <h2 className="text-sm font-semibold text-foreground">
                          Mobile Money details
                        </h2>
                        <Select
                          name="mobileNetwork"
                          label="Mobile Network"
                          options={MOBILE_NETWORK_OPTIONS}
                        />
                        <Input
                          name="mobileNumber"
                          label="MoMo Number"
                          type="tel"
                          inputMode="tel"
                          placeholder="02XXXXXXXX"
                        />
                      </CardContent>
                    </Card>

                    <SubmitButton formik={formik}>Make Payment</SubmitButton>
                  </div>

                  {/* RIGHT — sticky payable summary */}
                  <aside className="space-y-4 lg:sticky lg:top-6">
                    <Card>
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
                            <Wallet className="size-5 text-brand" />
                          </span>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            You'll pay
                          </p>
                        </div>
                        <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                          {cashAndCharges}{' '}
                          <span className="text-base font-medium text-muted-foreground">
                            {currency}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cash + service charges
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="space-y-2 p-5">
                        <h3 className="text-sm font-semibold text-foreground">
                          Charges explained
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          The {charges.toFixed(2)} {currency} charge covers the
                          mobile money network fee. Your church receives the
                          full {service.cash} {currency} offering.
                        </p>
                      </CardContent>
                    </Card>
                  </aside>
                </div>

                {/* OTP dialog */}
                <Dialog
                  open={show}
                  onOpenChange={(open) => {
                    if (open) {
                      handleShow()
                    } else {
                      setOtpError('')
                      handleClose()
                    }
                  }}
                >
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Enter OTP</DialogTitle>
                      <DialogDescription>
                        A registration token was just sent to your phone via
                        text message. Enter it below to authorise the payment.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="otp">One-time code</Label>
                      <ShadcnInput
                        id="otp"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        pattern="(\d{4}|\d{6})"
                        className="min-h-11 font-mono tabular-nums"
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ''))
                          if (otpError) setOtpError('')
                        }}
                      />
                    </div>
                    {otpError && (
                      <Alert variant="destructive">
                        <AlertTitle>Could not submit OTP</AlertTitle>
                        <AlertDescription>{otpError}</AlertDescription>
                      </Alert>
                    )}
                    <Button
                      type="button"
                      size="lg"
                      className="w-full gap-2"
                      disabled={otpSent}
                      onClick={() => {
                        if (!OTP_REGEX.test(otp)) {
                          setOtpError('Enter a valid OTP (4 or 6 digits).')
                          return
                        }
                        setOtpError('')
                        setOtpSent(true)
                        SendPaymentOTP({
                          variables: {
                            serviceRecordId: service.id,
                            otp,
                          },
                        })
                          .then(() => {
                            setOtpError('')
                            handleClose()
                            navigate('/self-banking/confirm-payment')
                          })
                          .catch((err: unknown) => {
                            setOtpSent(false)
                            setOtpError(messageFromError(err))
                            throwToSentry('Error sending payment OTP', err)
                          })
                      }}
                    >
                      {otpSent ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        'Submit OTP'
                      )}
                    </Button>
                    <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col sm:space-x-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="w-full"
                        disabled={otpSent}
                        onClick={() => {
                          setOtpError('')
                          setOtpSent(true)
                          ConfirmOfferingPayment({
                            variables: {
                              serviceRecordId: service.id,
                            },
                          })
                            .then(() => {
                              setOtpSent(false)
                              handleClose()
                              navigate('/self-banking/confirm-payment')
                            })
                            .catch((err: unknown) => {
                              setOtpSent(false)
                              setOtpError(messageFromError(err))
                              throwToSentry(
                                'Error Confirming Offering Payment',
                                err
                              )
                            })
                        }}
                      >
                        Already paid? Check status
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        size="lg"
                        className="w-full text-muted-foreground"
                        onClick={() => {
                          setOtpError('')
                          handleClose()
                          navigate('/self-banking/confirm-payment')
                        }}
                      >
                        Cancel and check status later
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Form>
            )}
          </Formik>
        )}
      </main>
    </div>
  )
}

export default PayOffering
