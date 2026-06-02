import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderCustom from 'components/Placeholder'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { DISPLAY_VEHICLE_PAYMENT_RECORDS } from '../arrivalsQueries'
import { SEND_VEHICLE_SUPPORT } from '../arrivalsMutation'
import { VehicleRecord } from '../arrivals-types'
import {
  convertOutboundToBoolean,
  convertOutboundToString,
  OUTBOUND_OPTIONS,
} from '../arrivals-utils'
import '../Arrivals.css'

type FormOptions = {
  momoNumber: string
  momoName: string
  vehicleTopUp: number
  outbound: string
}

const FormPayVehicleRecord = () => {
  const navigate = useNavigate()
  const { bacentaId } = useContext(ChurchContext)
  const { vehicleRecordId } = useContext(ServiceContext)
  const { show, handleShow, handleClose } = useModal()

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
      .typeError('Please enter a valid number')
      .integer('You cannot have attendance with decimals!')
      .required('This is a required field'),
    momoName: Yup.string().required('This is a required field'),
    momoNumber: Yup.string().required('This is a required field'),
    outbound: Yup.string().required('Please select an option'),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const { setSubmitting } = onSubmitProps

    if (!isRecordFromToday) {
      alertMsg(
        'This bussing record is not for today. You can only pay for vehicles bussed today.'
      )
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
        `Money Successfully Sent to ${supportRes.data.SendVehicleSupport.momoName}`
      )
      setSubmitting(false)
      navigate(`/bacenta/vehicle-details`)
    } catch (error: any) {
      setSubmitting(false)
      alertMsg(error)
    }

    navigate(`/bacenta/vehicle-details`)
  }

  const detailRows = [
    ['Stream', bacenta?.stream.name],
    ['Council Pastor', bacenta?.governorship.council.leader.fullName],
    ['Council', bacenta?.governorship.council.name],
    ['Governorship', bacenta?.governorship.name],
    ['Attendance', `${vehicle?.attendance || 0}`],
    ['Vehicle Type', vehicle?.vehicle || 0],
    [
      'In and Out',
      <span className="yellow" key="in-out">
        {convertOutboundToString(vehicle?.outbound) || 0}
      </span>,
    ],
    [
      'View Picture',
      <button
        type="button"
        className="text-primary underline-offset-4 hover:underline"
        onClick={() => handleShow()}
        key="view"
      >
        Click Here
      </button>,
    ],
    [
      'Top Up From Church',
      <CurrencySpan
        className="font-semibold text-[hsl(var(--success))]"
        number={vehicle?.vehicleTopUp}
        key="top-up"
      />,
    ],
  ]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <PlaceholderCustom as="h3" loading={loading}>
          <HeadingPrimary>Vehicle Attendance Form</HeadingPrimary>
        </PlaceholderCustom>

        {!loading && vehicle && !isRecordFromToday && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              This bussing record is not for today. You can only pay for
              vehicles bussed today.
            </AlertDescription>
          </Alert>
        )}

        <div className="my-4 flex items-center gap-3">
          <CloudinaryImage
            src={bacenta?.leader.pictureUrl}
            className="avatar"
          />
          <div>
            <div>{`${bacenta?.name} Bacenta`}</div>
            <div className="text-sm text-muted-foreground">{`Leader: ${bacenta?.leader.fullName}`}</div>
          </div>
        </div>
        <Dialog
          open={show}
          onOpenChange={(open) => (open ? handleShow() : handleClose())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{bacenta?.name} Bacenta Picture</DialogTitle>
            </DialogHeader>
            <CloudinaryImage
              className="bus-picture"
              src={vehicle?.picture}
              size="respond"
            />
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
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
                label="Vehicle Top Up Amount*"
                placeholder={vehicle?.vehicleTopUp.toString()}
              />
              <Card className="my-3 border-[hsl(var(--warning))]/60">
                <CardContent className="p-4">
                  <RadioButtons
                    name="outbound"
                    label="Are They Bussing Back?"
                    options={OUTBOUND_OPTIONS}
                  />
                </CardContent>
              </Card>
              <Input
                name="momoNumber"
                label="Momo Number*"
                placeholder={vehicle?.momoNumber.toString()}
              />
              <Input
                name="momoName"
                label="Momo Name*"
                placeholder={vehicle?.momoName.toString()}
              />

              <Card className="mt-4 text-center">
                <CardContent className="p-4">
                  I can confirm that the above data is correct and I approve the
                  vehicle top up for this bacenta
                </CardContent>
                <CardFooter className="justify-center p-4 pt-0">
                  <SubmitButton formik={formik} disabled={!isRecordFromToday} />
                </CardFooter>
              </Card>
            </Form>
          )}
        </Formik>
      </div>
    </ApolloWrapper>
  )
}

export default FormPayVehicleRecord
