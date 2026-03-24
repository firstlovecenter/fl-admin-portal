import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext } from 'react'
import { DISPLAY_VEHICLE_PAYMENT_RECORDS } from '../arrivalsQueries'
import { SEND_VEHICLE_SUPPORT } from '../arrivalsMutation'
import { useNavigate } from 'react-router'
import SubmitButton from 'components/formik/SubmitButton'
import { alertMsg } from 'global-utils'
import { VehicleRecord } from '../arrivals-types'
import Input from 'components/formik/Input'
import CloudinaryImage from 'components/CloudinaryImage'
import '../Arrivals.css'
import {
  convertOutboundToString,
  convertOutboundToBoolean,
} from 'pages/directory/update/UpdateBusPaymentDetails'
import CurrencySpan from 'components/CurrencySpan'
import TableFromArrays from 'components/TableFromArrays/TableFromArrays'
import useModal from 'hooks/useModal'
import RadioButtons from 'components/formik/RadioButtons'
import { OUTBOUND_OPTIONS } from '../arrivals-utils'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardFooter } from 'components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from 'components/ui/dialog'

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
    setSubmitting(true)

    //If arrival time has been logged then send vehicle support
    try {
      const supportRes = await SendVehicleSupport({
        variables: {
          vehicleRecordId: vehicleRecordId,
          momoNumber: values.momoNumber,
          momoName: values.momoName,
          vehicleTopUp: values.vehicleTopUp,
          outbound: convertOutboundToBoolean(values.outbound),
        },
      })

      alertMsg(
        'Money Successfully Sent to ' +
          supportRes.data.SendVehicleSupport.momoName
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
      <span className="yellow">
        {convertOutboundToString(vehicle?.outbound) || 0}
      </span>,
    ],
    [
      'View Picture',
      <span className="text-primary" onClick={() => handleShow()}>
        Click Here
      </span>,
    ],
    [
      'Top Up From Church',
      <CurrencySpan className="fw-bold good" number={vehicle?.vehicleTopUp} />,
    ],
  ]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <>
        <div>
          <PlaceholderCustom as="h3" loading={loading}>
            <HeadingPrimary>{`Vehicle Attendance Form`}</HeadingPrimary>
          </PlaceholderCustom>
        </div>

        <div className="my-4">
          <div>
            <div className="col-auto">
              <CloudinaryImage
                src={bacenta?.leader.pictureUrl}
                className="avatar"
              />
            </div>
            <div>
              <div>{`${bacenta?.name} Bacenta`}</div>
              <div className="text-secondary">{`Leader: ${bacenta?.leader.fullName}`}</div>
            </div>
          </div>
          <Dialog open={show} onOpenChange={(open) => { if (!open) handleClose() }}>
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
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent></Dialog>
          <div className="mt-4">
            <TableFromArrays tableArray={detailRows} loading={loading} />
          </div>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <div>
              <Form>
                <Input
                  name="vehicleTopUp"
                  label="Vehicle Top Up Amount*"
                  placeholder={vehicle?.vehicleTopUp.toString()}
                />
                <Card border="warning" className="my-3">
                  <CardContent>
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

                <Card className="text-center mt-4">
                  <CardContent>
                    I can confirm that the above data is correct and I approve
                    the vehicle top up for this bacenta
                  </CardContent>
                  <CardFooter>
                    <SubmitButton formik={formik} />
                  </CardFooter>
                </Card>
              </Form>
            </div>
          )}
        </Formik>
      </>
    </ApolloWrapper>
  )
}

export default FormPayVehicleRecord
