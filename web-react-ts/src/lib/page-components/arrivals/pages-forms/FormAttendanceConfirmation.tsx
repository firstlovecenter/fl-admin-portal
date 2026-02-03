import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext } from 'react'
import { Card, Container } from 'react-bootstrap'
import { DISPLAY_VEHICLE_RECORDS } from '../arrivalsQueries'
import {
  CONFIRM_VEHICLE_BY_ADMIN,
  SET_VEHICLE_SUPPORT,
} from '../arrivalsMutation'
import { useRouter } from 'next/navigation'
import SubmitButton from 'components/formik/SubmitButton'
import { alertMsg, throwToSentry } from 'global-utils'
import { BacentaWithArrivals, VehicleRecord } from '../arrivals-types'
import Input from 'components/formik/Input'
import Textarea from 'components/formik/Textarea'
import CloudinaryImage from 'components/CloudinaryImage'
import Select from 'components/formik/Select'
import { VEHICLE_OPTIONS_WITH_CAR } from '../arrivals-utils'
import '../Arrivals.css'

type FormOptions = {
  attendance: string
  vehicle: string
  comments: string
}

const FormAttendanceConfirmation = () => {
  const router = useRouter()
  const { bacentaId } = useContext(ChurchContext)
  const { vehicleRecordId } = useContext(ServiceContext)

  const { data, loading, error } = useQuery(DISPLAY_VEHICLE_RECORDS, {
    variables: { vehicleRecordId, bacentaId },
  })
  const [ConfirmVehicleByAdmin] = useMutation(CONFIRM_VEHICLE_BY_ADMIN)
  const [SetVehicleSupport] = useMutation(SET_VEHICLE_SUPPORT)

  const vehicle: VehicleRecord = data?.vehicleRecords[0]
  const bacenta: BacentaWithArrivals = data?.bacentas[0]

  const initialValues: FormOptions = {
    attendance: '',
    vehicle: vehicle?.vehicle,
    comments: '',
  }

  const validationSchema = Yup.object({
    attendance: Yup.number()
      .typeError('Please enter a valid number')
      .integer('You cannot have attendance with decimals!')
      .required('This is a required field'),
    vehicle: Yup.string().required('This is a required field'),
    comments: Yup.string().when(['attendance', 'vehicle'], {
      is: (attendance: number, vehicleType: string) => {
        if (
          attendance !== vehicle?.leaderDeclaration ||
          vehicleType !== vehicle?.vehicle
        ) {
          return true
        }
      },
      then: Yup.string().required(
        'You need to explain if the numbers are different'
      ),
    }),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const { setSubmitting } = onSubmitProps
    setSubmitting(true)

    const res = await ConfirmVehicleByAdmin({
      variables: {
        vehicleRecordId,
        attendance: parseInt(values.attendance),
        vehicle: values.vehicle,
        comments: values.comments,
      },
    }).catch((error) =>
      throwToSentry('There was an error confirming vehicle', error)
    )

    const vehicleData = res?.data.ConfirmVehicleByAdmin

    await SetVehicleSupport({
      variables: {
        vehicleRecordId,
      },
    }).catch((error) =>
      alertMsg(`There was an error setting vehicle support ${error}`)
    )

    if (
      !vehicleData.vehicleTopUp ||
      bacenta?.stream_name === 'Anagkazo Encounter'
    ) {
      //if there is no value for the vehicle top up
      router.push(`/bacenta/vehicle-details`)
    }

    router.push(`/bacenta/vehicle-details`)
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <>
        <Container>
          <PlaceholderCustom as="h3" loading={loading}>
            <HeadingPrimary>Vehicle Attendance Form</HeadingPrimary>
          </PlaceholderCustom>
          <PlaceholderCustom as="h6" loading={loading}>
            <HeadingSecondary>{`${bacenta?.name} ${bacenta?.__typename}`}</HeadingSecondary>
            <p>{`Picture Submitted by ${vehicle?.created_by.fullName}`}</p>
          </PlaceholderCustom>
        </Container>

        <Container className="mb-2">
          <Card>
            <Card.Body>
              <CloudinaryImage
                className="confirmation-picture"
                src={vehicle?.picture}
                size="respond"
              />
              <div className="text-secondary">
                Claimed Attendance:{' '}
                <span className="fw-bold text-info">
                  {vehicle?.leaderDeclaration || 0}
                </span>
              </div>
            </Card.Body>
          </Card>
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
                  name="attendance"
                  label="Attendance (from Picture)*"
                  placeholder={vehicle?.leaderDeclaration.toString()}
                />
                <Select
                  name="vehicle"
                  label="Type of Vehicle"
                  options={VEHICLE_OPTIONS_WITH_CAR}
                  defaultOption="Select a vehicle type"
                />

                <Textarea name="comments" label="Comments" />
                <Card className="text-center">
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

export default FormAttendanceConfirmation
