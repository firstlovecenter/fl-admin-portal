import { ApolloError, useMutation, useQuery } from '@apollo/client'
import ErrorPopup from 'components/Popup/ErrorPopup'
import Input from 'components/formik/Input'
import Select from 'components/formik/Select'
import SubmitButton from 'components/formik/SubmitButton'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Input as ShadcnInput } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { Skeleton } from 'components/ui/skeleton'
import { MemberContext } from 'contexts/MemberContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { Form, Formik, FormikHelpers } from 'formik'
import { Bacenta } from 'global-types'
import { MOMO_NUM_REGEX, throwToSentry } from 'global-utils'
import useModal from 'hooks/useModal'
import usePopup from 'hooks/usePopup'
import { parseDate } from 'jd-date-utils'
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

type PayOfferingProps = {
  church: Bacenta
  loading: boolean
  error: ApolloError | undefined
}

type FormOptions = {
  bankingDate: string
  cash: number
  momoName: string
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
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const initialValues: FormOptions = {
    bankingDate: new Date().toISOString().slice(0, 10),
    cash: service?.cash,
    momoName: '',
    mobileNetwork: '',
    mobileNumber: '',
  }

  useEffect(() => {
    if (service?.transactionStatus === 'send OTP') {
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
    momoName: Yup.string().when('mobileNumber', {
      is: (mobileNumber: string) => mobileNumber && mobileNumber.length > 0,
      then: Yup.string().required('Please enter the Momo Name'),
    }),
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
          stream_name: service.stream_name,
          mobileNetwork: values.mobileNetwork,
          mobileNumber: values.mobileNumber,
          momoName: values.momoName,
        },
      })
      if (paymentRes.errors) {
        throw new Error(paymentRes.errors[0]?.message)
      } else if (
        paymentRes.data?.BankServiceOffering.transactionStatus === 'send OTP'
      ) {
        handleShow()
      } else {
        setSubmitting(false)
        navigate('/self-banking/confirm-payment')
      }
    } catch (err: any) {
      setErrorMessage(err.message)
      togglePopup()
    }
  }

  const currency = currentUser.currency

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      {isOpen && (
        <ErrorPopup
          errorMessage={errorMessage}
          togglePopup={togglePopup}
          link={`/services/${church?.__typename.toLowerCase()}/self-banking`}
        />
      )}

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Offering Self-Banking
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {loading || !church ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <>
                {church.name}{' '}
                <span className="text-muted-foreground">
                  {church.__typename}
                </span>
              </>
            )}
          </h1>
          {church?.bankingCode && (
            <p className="font-mono text-sm text-muted-foreground">
              Banking Code: {church.bankingCode}
            </p>
          )}
        </header>

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
                        <Input name="momoName" label="MoMo Name" />
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
                  onOpenChange={(open) => (open ? handleShow() : handleClose())}
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
                        className="min-h-11 font-mono tabular-nums"
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      className="w-full gap-2"
                      disabled={otpSent}
                      onClick={() => {
                        setOtpSent(true)
                        SendPaymentOTP({
                          variables: {
                            serviceRecordId: service.id,
                            reference: service?.transactionReference,
                            otp,
                          },
                        })
                          .then(() => navigate('/self-banking/confirm-payment'))
                          .catch((err: any) => {
                            setOtpSent(false)
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
                    <button
                      type="button"
                      className="mt-1 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => {
                        setOtpSent(true)
                        ConfirmOfferingPayment({
                          variables: {
                            serviceRecordId: service.id,
                            stream_name: service.stream_name,
                          },
                        })
                          .then(() => {
                            setOtpSent(false)
                            navigate('/self-banking/confirm-payment')
                          })
                          .catch((err: any) => {
                            setOtpSent(false)
                            setErrorMessage(err.message)
                            throwToSentry(
                              'Error Confirming Offering Payment',
                              err
                            )
                          })
                      }}
                    >
                      Didn't receive a token? Tap to resend
                    </button>
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
