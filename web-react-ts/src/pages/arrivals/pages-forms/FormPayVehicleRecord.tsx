import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext } from 'react'
import { Button, Card, Col, Container, Modal, Row } from 'react-bootstrap'
import { DISPLAY_VEHICLE_PAYMENT_RECORDS } from '../arrivalsQueries'
import { SEND_VEHICLE_SUPPORT } from '../arrivalsMutation'
import { useRouter } from 'next/navigation'
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

type FormOptions = {
  momoNumber: string
  momoName: string
  vehicleTopUp: number
  outbound: string
}

const FormPayVehicleRecord = () => {
  const router = useRouter()
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
      router.push(`/bacenta/vehicle-details`)
    } catch (error: any) {
      setSubmitting(false)
      alertMsg(error)
    }

    router.push(`/bacenta/vehicle-details`)
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
        <Container>
          <PlaceholderCustom as="h3" loading={loading}>
            <HeadingPrimary>{`Vehicle Attendance Form`}</HeadingPrimary>
          </PlaceholderCustom>
        </Container>

        <Container className="my-4">
          <Row>
            <Col className="col-auto">
              <CloudinaryImage
                src={bacenta?.leader.pictureUrl}
                className="avatar"
              />
            </Col>
            <Col>
              <div>{`${bacenta?.name} Bacenta`}</div>
              <div className="text-secondary">{`Leader: ${bacenta?.leader.fullName}`}</div>
            </Col>
          </Row>
          <Modal className="dark" show={show} onHide={handleClose} centered>
            <Modal.Header>
              <Modal.Title>{bacenta?.name} Bacenta Picture</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <CloudinaryImage
                className="bus-picture"
                src={vehicle?.picture}
                size="respond"
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
          <Row className="mt-4">
            <TableFromArrays tableArray={detailRows} loading={loading} />
          </Row>
        </Container>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <Container>
              <Form>
                <Input
                  name="vehicleTopUp"
                  label="Vehicle Top Up Amount*"
                  placeholder={vehicle?.vehicleTopUp.toString()}
                />
                <Card border="warning" className="my-3">
                  <Card.Body>
                    <RadioButtons
                      name="outbound"
                      label="Are They Bussing Back?"
                      options={OUTBOUND_OPTIONS}
                    />
                  </Card.Body>
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
                  <Card.Body>
                    I can confirm that the above data is correct and I approve
                    the vehicle top up for this bacenta
                  </Card.Body>
                  <Card.Footer>
                    <SubmitButton formik={formik} />
                  </Card.Footer>
                </Card>
              </Form>
            </Container>
          )}
        </Formik>
      </>
    </ApolloWrapper>
  )
}

export default FormPayVehicleRecord
