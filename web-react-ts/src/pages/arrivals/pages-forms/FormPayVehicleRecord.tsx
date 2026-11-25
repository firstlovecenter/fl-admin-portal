import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { isToday } from 'lib/date-utils'
import { AlertTriangle } from 'lucide-react'
import SubmitButton from 'components/formik/SubmitButton'
import { alertMsg, alertSuccess } from 'global-utils'
import Input from 'components/formik/Input'
import CloudinaryImage from 'components/CloudinaryImage'
import CurrencySpan from 'components/CurrencySpan'
import TableFromArrays from 'components/TableFromArrays/TableFromArrays'
import useModal from 'hooks/useModal'
import RadioButtons from 'components/formik/RadioButtons'
import { Alert, AlertDescription } from 'components/ui/alert'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardFooter } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { DISPLAY_VEHICLE_PAYMENT_RECORDS } from '../arrivalsQueries'
import { SEND_VEHICLE_SUPPORT } from '../arrivalsMutation'
import { VehicleRecord } from '../arrivals-types'
import {
  convertOutboundToBoolean,
  convertOutboundToString,
  OUTBOUND_OPTIONS,
} from '../arrivals-utils'
import { useTranslation } from 'react-i18next'

type FormOptions = {
  momoNumber: string
  momoName: string
  vehicleTopUp: number
  outbound: string
}

const FormPayVehicleRecord = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { bacentaId } = useContext(ChurchContext)
  const { vehicleRecordId } = useContext(ServiceContext)
  const { show, handleShow, handleClose } = useModal()
  const {
    show: confirmShow,
    handleShow: handleConfirmShow,
    handleClose: handleConfirmClose,
  } = useModal()

  const { data, loading, error } = useQuery(DISPLAY_VEHICLE_PAYMENT_RECORDS, {
    variables: { vehicleRecordId, bacentaId },
  })
  const [SendVehicleSupport] = useMutation(SEND_VEHICLE_SUPPORT)

  const vehicle: VehicleRecord = data?.vehicleRecords[0]
  const bacenta = data?.bacentas[0]
  const isRecordFromToday = !!vehicle?.createdAt && isToday(vehicle.createdAt)

  const initialValues: FormOptions = {
    momoName: vehicle?.momoName,
    momoNumber: vehicle?.momoNumber,
    vehicleTopUp: vehicle?.vehicleTopUp,
    outbound: convertOutboundToString(bacenta?.outbound) ?? 'In Only',
  }

  const validationSchema = Yup.object({
    vehicleTopUp: Yup.number()
      .typeError(t('arrivals.form.validNumber'))
      .integer(t('arrivals.form.noAttendanceDecimals'))
      .required(t('arrivals.form.required')),
    momoName: Yup.string().required(t('arrivals.form.required')),
    momoNumber: Yup.string().required(t('arrivals.form.required')),
    outbound: Yup.string().required(t('arrivals.form.selectOption')),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const { setSubmitting } = onSubmitProps

    if (!isRecordFromToday) {
      alertMsg(t('arrivals.form.notTodayPay'))
      return
    }

    setSubmitting(true)

    try {
      const supportRes = await SendVehicleSupport({
        variables: {
          vehicleRecordId,
          momoNumber: values.momoNumber,
          momoName: values.momoName,
          vehicleTopUp: values.vehicleTopUp,
          outbound: convertOutboundToBoolean(values.outbound),
        },
      })

      alertSuccess(
        t('arrivals.form.moneySent', {
          name: supportRes.data.SendVehicleSupport.momoName,
        })
      )
      navigate(`/bacenta/vehicle-details`)
    } catch (error: unknown) {
      alertMsg(error)
    } finally {
      setSubmitting(false)
    }
  }

  const detailRows = [
    [t('arrivals.payment.stream'), bacenta?.stream.name],
    [
      t('arrivals.form.councilPastor'),
      bacenta?.governorship.council.leader.fullName,
    ],
    [t('arrivals.payment.council'), bacenta?.governorship.council.name],
    [t('arrivals.payment.governorship'), bacenta?.governorship.name],
    [t('arrivals.payment.attendance'), `${vehicle?.attendance || 0}`],
    [t('arrivals.form.vehicleType'), vehicle?.vehicle || 0],
    [
      t('arrivals.vehicle.inAndOut'),
      <span className="text-warning" key="in-out">
        {convertOutboundToString(vehicle?.outbound) || 0}
      </span>,
    ],
    [
      t('arrivals.form.viewPicture'),
      <button
        type="button"
        className="text-primary underline-offset-4 hover:underline"
        onClick={() => handleShow()}
        key="view"
      >
        {t('arrivals.form.clickHere')}
      </button>,
    ],
    [
      t('arrivals.form.topUpFromChurch'),
      <CurrencySpan
        className="font-semibold text-[hsl(var(--success))]"
        number={vehicle?.vehicleTopUp}
        key="top-up"
      />,
    ],
  ]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('arrivals.form.vehicleAttendance')}
          </h1>
        </StickyPageHeader>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4 py-5">

        {!loading && vehicle && !isRecordFromToday && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              {t('arrivals.form.notTodayPay')}
            </AlertDescription>
          </Alert>
        )}

        <div className="my-4 flex items-center gap-3">
          <CloudinaryImage
            src={bacenta?.leader.pictureUrl}
            className="size-11 rounded-full object-cover"
          />
          <div>
            <div>
              {t('arrivals.bussing.bacentaName', { name: bacenta?.name })}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('arrivals.form.leaderName', {
                name: bacenta?.leader.fullName,
              })}
            </div>
          </div>
        </div>
        <Dialog
          open={show}
          onOpenChange={(open) => (open ? handleShow() : handleClose())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('arrivals.form.bacentaPicture', { name: bacenta?.name })}
              </DialogTitle>
            </DialogHeader>
            <CloudinaryImage
              className="w-full rounded-lg object-cover"
              src={vehicle?.picture}
              size="respond"
            />
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t('arrivals.common.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="mt-4">
          <TableFromArrays tableArray={detailRows} loading={loading} />
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <Form className="space-y-3">
              <Input
                name="vehicleTopUp"
                label={t('arrivals.form.vehicleTopUpAmount')}
                placeholder={vehicle?.vehicleTopUp.toString()}
              />
              <Card className="my-3 border-[hsl(var(--warning))]/60">
                <CardContent className="p-4">
                  <RadioButtons
                    name="outbound"
                    label={t('arrivals.form.areTheyBussingBack')}
                    options={OUTBOUND_OPTIONS}
                  />
                </CardContent>
              </Card>
              <Input
                name="momoNumber"
                label={t('arrivals.form.momoNumberRequired')}
                placeholder={vehicle?.momoNumber.toString()}
              />
              <Input
                name="momoName"
                label={t('arrivals.form.momoNameRequired')}
                placeholder={vehicle?.momoName.toString()}
              />

              <Card className="mt-4 text-center">
                <CardContent className="p-4">
                  {t('arrivals.form.approveVehicleTopUp')}
                </CardContent>
                <CardFooter className="justify-center p-4 pt-0">
                  <Button
                    type="button"
                    disabled={!formik.isValid || formik.isSubmitting || !isRecordFromToday}
                    onClick={handleConfirmShow}
                  >
                    {t('services.form.reviewAndSubmit')}
                  </Button>
                </CardFooter>
              </Card>

              {/* ── Confirmation dialog ── */}
              <Dialog
                open={confirmShow}
                onOpenChange={(open) => !open && handleConfirmClose()}
              >
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>
                      {t('services.form.confirmTitle')}
                    </DialogTitle>
                    <DialogDescription>
                      {t('shared.confirmDialog.reviewDetails')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {t('arrivals.form.vehicleType')}
                      </span>
                      <span className="font-medium text-foreground">
                        {vehicle?.vehicle}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {t('arrivals.form.vehicleTopUpAmount')}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formik.values.vehicleTopUp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {t('arrivals.vehicle.inAndOut')}
                      </span>
                      <span className="font-medium text-foreground">
                        {formik.values.outbound}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {t('arrivals.form.momoNumberRequired')}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formik.values.momoNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {t('arrivals.form.momoNameRequired')}
                      </span>
                      <span className="font-medium text-foreground">
                        {formik.values.momoName}
                      </span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleConfirmClose}>
                      {t('shared.actions.edit')}
                    </Button>
                    <SubmitButton
                      onClick={() => {
                        handleConfirmClose()
                        formik.handleSubmit()
                      }}
                      formik={formik}
                    />
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Form>
          )}
        </Formik>
      </div>
      </div>
    </ApolloWrapper>
  )
}

export default FormPayVehicleRecord
