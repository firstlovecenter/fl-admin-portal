import { useMutation, useQuery } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import { Loader2 } from 'lucide-react'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import RoleView from 'auth/RoleView'
import useAuth from 'auth/useAuth'
import { Button } from 'components/ui/button'
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
import { Skeleton } from 'components/ui/skeleton'
import Input from 'components/formik/Input'
import RadioButtons from 'components/formik/RadioButtons'
import Select from 'components/formik/Select'
import SubmitButton from 'components/formik/SubmitButton'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import {
  alertMsg,
  alertSuccess,
  MOMO_NUM_REGEX,
  randomOTPGenerator,
  throwToSentry,
} from 'global-utils'
import {
  convertOutboundToBoolean,
  convertOutboundToString,
  MOBILE_NETWORK_OPTIONS,
  OUTBOUND_OPTIONS,
} from 'pages/arrivals/arrivals-utils'
import { permitBacentaBussingAdmin } from 'permission-utils'
import {
  DISPLAY_BACENTA_BUSSING_DETAILS,
  SEND_MOBILE_VERIFICATION_NUMBER,
  UPDATE_BACENTA_BUSSING_DETAILS,
  UPDATE_BUS_PAYMENT_DETAILS,
} from './UpdateBacentaArrivals'

type FormOptions = {
  urvanTopUp: string
  sprinterTopUp: string
  outbound: string
  mobileNetwork: string
  momoName: string
  momoNumber: string
}

type PendingMomo = {
  momoName: string
  momoNumber: string
  mobileNetwork: string
}

type UpdateBusPaymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const UpdateBusPaymentDialog = ({
  open,
  onOpenChange,
}: UpdateBusPaymentDialogProps) => {
  const { t } = useTranslation()
  const { bacentaId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const { isAuthorised } = useAuth()
  const [otp, setOtp] = useState(() => randomOTPGenerator())
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [pendingMomo, setPendingMomo] = useState<PendingMomo | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  const { data, loading } = useQuery(DISPLAY_BACENTA_BUSSING_DETAILS, {
    variables: { id: bacentaId },
    skip: !bacentaId || !open,
  })
  const bacenta = data?.bacentas?.[0]

  const [UpdateBacentaBussingDetails] = useMutation(
    UPDATE_BACENTA_BUSSING_DETAILS
  )
  const [UpdateBusPaymentDetails] = useMutation(UPDATE_BUS_PAYMENT_DETAILS)
  const [SendMobileVerificationNumber] = useMutation(
    SEND_MOBILE_VERIFICATION_NUMBER
  )

  const initialValues: FormOptions = {
    urvanTopUp: bacenta?.urvanTopUp ?? '',
    sprinterTopUp: bacenta?.sprinterTopUp ?? '',
    outbound: convertOutboundToString(bacenta?.outbound),
    mobileNetwork: bacenta?.mobileNetwork ?? '',
    momoName: bacenta?.momoName ?? '',
    momoNumber: bacenta?.momoNumber ?? '',
  }

  const validationSchema = Yup.object({
    momoNumber: Yup.string().matches(
      MOMO_NUM_REGEX,
      t('directory.updateBusPaymentDialog.validation.invalidMomo')
    ),
    outbound: Yup.string().required(
      t('directory.updateBusPaymentDialog.validation.outboundRequired')
    ),
    momoName: Yup.string().when('momoNumber', {
      is: (momoNumber: string) => momoNumber && momoNumber.length > 0,
      then: Yup.string().required(
        t('directory.updateBusPaymentDialog.validation.momoNameRequired')
      ),
    }),
    mobileNetwork: Yup.string().when('momoNumber', {
      is: (momoNumber: string) => momoNumber && momoNumber.length > 0,
      then: Yup.string().required(
        t('directory.updateBusPaymentDialog.validation.mobileNetworkRequired')
      ),
    }),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const isAdmin = isAuthorised(permitBacentaBussingAdmin())
    const momoChanged =
      initialValues.momoNumber !== values.momoNumber && !!values.momoNumber

    try {
      if (isAdmin) {
        await UpdateBacentaBussingDetails({
          variables: {
            bacentaId,
            sprinterTopUp: parseFloat(values.sprinterTopUp || '0'),
            urvanTopUp: parseFloat(values.urvanTopUp || '0'),
            outbound: convertOutboundToBoolean(values.outbound),
          },
        })
      }

      if (momoChanged) {
        await SendMobileVerificationNumber({
          variables: {
            firstName: bacenta?.leader?.firstName,
            phoneNumber: values.momoNumber,
            otp,
          },
        })
        setPendingMomo({
          momoName: values.momoName.trim(),
          momoNumber: values.momoNumber,
          mobileNetwork: values.mobileNetwork,
        })
        onOpenChange(false)
        setVerifyOpen(true)
      } else {
        onOpenChange(false)
      }
    } catch (error) {
      alertMsg(error)
      throwToSentry('Failed to update bus payment details', error)
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  const resetVerifyState = () => {
    setVerifyOpen(false)
    setVerificationCode('')
    setPendingMomo(null)
    setOtp(randomOTPGenerator())
  }

  const handleVerify = async () => {
    if (!pendingMomo) return

    if (verificationCode !== otp) {
      alertMsg(t('directory.updateBusPaymentDialog.wrongCode'))
      return
    }

    setVerifying(true)
    try {
      await UpdateBusPaymentDetails({
        variables: {
          bacentaId,
          mobileNetwork: pendingMomo.mobileNetwork,
          momoName: pendingMomo.momoName,
          momoNumber: pendingMomo.momoNumber,
        },
      })
      alertSuccess(t('directory.updateBusPaymentDialog.verifiedSuccess'))
      resetVerifyState()
    } catch (error) {
      alertMsg(error)
      throwToSentry('There was a problem updating your momo number 😔', error)
    } finally {
      setVerifying(false)
    }
  }

  const handleVerifyOpenChange = (next: boolean) => {
    if (!next) resetVerifyState()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('directory.updateBusPaymentDialog.title')}</DialogTitle>
            <DialogDescription>
              {loading || !bacenta ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                bacenta.name
              )}
            </DialogDescription>
          </DialogHeader>

          {loading || !bacenta ? (
            <div className="space-y-4 py-2">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : (
            <Formik
              key={open ? bacenta.id : 'closed'}
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
              validateOnMount
            >
              {(formik) => (
                <Form className="space-y-4">
                  <RoleView roles={permitBacentaBussingAdmin()}>
                    <div className="space-y-4">
                      <Input
                        name="urvanTopUp"
                        type="number"
                        inputMode="decimal"
                        label={t('directory.updateBusPaymentDialog.urvanTopUpLabel')}
                        placeholder={t(
                          'directory.updateBusPaymentDialog.amountPlaceholder',
                          { currency: currentUser.currency }
                        )}
                      />
                      <Input
                        name="sprinterTopUp"
                        type="number"
                        inputMode="decimal"
                        label={t(
                          'directory.updateBusPaymentDialog.sprinterTopUpLabel'
                        )}
                        placeholder={t(
                          'directory.updateBusPaymentDialog.amountPlaceholder',
                          { currency: currentUser.currency }
                        )}
                      />
                      <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
                        <RadioButtons
                          name="outbound"
                          label={t(
                            'directory.updateBusPaymentDialog.bussingBackLabel'
                          )}
                          options={OUTBOUND_OPTIONS}
                        />
                      </div>
                    </div>
                  </RoleView>

                  <RoleView
                    roles={['leaderBacenta']}
                    verifyId={bacenta?.leader?.id}
                  >
                    <div className="space-y-4">
                      <Select
                        name="mobileNetwork"
                        label={t(
                          'directory.updateBusPaymentDialog.mobileNetworkLabel'
                        )}
                        options={MOBILE_NETWORK_OPTIONS}
                      />
                      <Input
                        name="momoNumber"
                        type="tel"
                        inputMode="numeric"
                        label={t('directory.updateBusPaymentDialog.momoNumberLabel')}
                        placeholder={t(
                          'directory.updateBusPaymentDialog.momoNumberPlaceholder'
                        )}
                      />
                      <Input
                        name="momoName"
                        label={t('directory.updateBusPaymentDialog.momoNameLabel')}
                      />
                    </div>
                  </RoleView>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={formik.isSubmitting}
                    >
                      {t('directory.common.cancel')}
                    </Button>
                    <SubmitButton formik={formik} />
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={verifyOpen} onOpenChange={handleVerifyOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t('directory.updateBusPaymentDialog.verifyTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('directory.updateBusPaymentDialog.verifyDescriptionPrefix')}{' '}
              <span className="font-mono font-medium">
                {pendingMomo?.momoNumber}
              </span>
              {t('directory.updateBusPaymentDialog.verifyDescriptionSuffix')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor="verificationCode">
              {t('directory.updateBusPaymentDialog.verificationCodeLabel')}
            </Label>
            <ShadcnInput
              id="verificationCode"
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="min-h-11 font-mono text-lg tracking-widest tabular-nums"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleVerifyOpenChange(false)}
              disabled={verifying}
            >
              {t('directory.common.cancel')}
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleVerify}
              disabled={verifying || !verificationCode}
              className="gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('directory.updateBusPaymentDialog.verifying')}
                </>
              ) : (
                t('directory.updateBusPaymentDialog.verifyNumber')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default UpdateBusPaymentDialog
