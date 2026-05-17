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
import { useNavigate } from 'react-router'
import SubmitButton from 'components/formik/SubmitButton'
import { alertMsg, throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import Textarea from 'components/formik/Textarea'
import CloudinaryImage from 'components/CloudinaryImage'
import Select from 'components/formik/Select'
import { Card, CardContent, CardFooter } from 'components/ui/card'
import { DISPLAY_VEHICLE_RECORDS } from '../arrivalsQueries'
import {
  CONFIRM_VEHICLE_BY_ADMIN,
  SET_VEHICLE_SUPPORT,
} from '../arrivalsMutation'
import { BacentaWithArrivals, VehicleRecord } from '../arrivals-types'
import { VEHICLE_OPTIONS_WITH_CAR } from '../arrivals-utils'
import '../Arrivals.css'

type FormOptions = {
  attendance: string
  vehicle: string
  comments: string
}

const FormAttendanceConfirmation = () => {
  const navigate = useNavigate()
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
        attendance: parseInt(values.attendance, 10),
        vehicle: values.vehicle,
        comments: values.comments,
      },
    }).catch((err) =>
      throwToSentry('There was an error confirming vehicle', err)
    )

    const vehicleData = res?.data?.ConfirmVehicleByAdmin

    if (!vehicleData) {
      setSubmitting(false)
      return
    }

    await SetVehicleSupport({
      variables: {
        vehicleRecordId,
      },
    }).catch((err) =>
      alertMsg(`There was an error setting vehicle support ${err}`)
    )

    if (
      !vehicleData.vehicleTopUp ||
      bacenta?.stream_name === 'Anagkazo Encounter'
    ) {
      navigate(`/bacenta/vehicle-details`)
    }

    navigate(`/bacenta/vehicle-details`)
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <PlaceholderCustom as="h3" loading={loading}>
          <HeadingPrimary>Vehicle Attendance Form</HeadingPrimary>
        </PlaceholderCustom>
        <PlaceholderCustom as="h6" loading={loading}>
          <HeadingSecondary>{`${bacenta?.name} ${bacenta?.__typename}`}</HeadingSecondary>
          <p>{`Picture Submitted by ${vehicle?.created_by.fullName}`}</p>
        </PlaceholderCustom>

        <Card>
          <CardContent className="space-y-2 p-4">
            <CloudinaryImage
              className="confirmation-picture"
              src={vehicle?.picture}
              size="respond"
            />
            <div className="text-sm text-muted-foreground">
              Claimed Attendance:{' '}
              <span className="font-semibold text-[hsl(var(--maps))]">
                {vehicle?.leaderDeclaration || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <Form className="space-y-4">
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
                <CardContent className="p-4">
                  I can confirm that the above data is correct and I approve the
                  vehicle top up for this bacenta
                </CardContent>
                <CardFooter className="justify-center p-4 pt-0">
                  <SubmitButton formik={formik} />
                </CardFooter>
              </Card>
            </Form>
          )}
        </Formik>
      </div>
    </ApolloWrapper>
  )
}

export default FormAttendanceConfirmation
