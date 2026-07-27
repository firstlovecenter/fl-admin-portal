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
import { isToday } from 'lib/date-utils'
import { AlertTriangle } from 'lucide-react'
import SubmitButton from 'components/formik/SubmitButton'
import { alertMsg, throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import Textarea from 'components/formik/Textarea'
import CloudinaryImage from 'components/CloudinaryImage'
import Select from 'components/formik/Select'
import { Alert, AlertDescription } from 'components/ui/alert'
import { Card, CardContent, CardFooter } from 'components/ui/card'
import { DISPLAY_VEHICLE_RECORDS } from '../arrivalsQueries'
import { CONFIRM_VEHICLE_BY_ADMIN } from '../arrivalsMutation'
import { BacentaWithArrivals, VehicleRecord } from '../arrivals-types'
import { VEHICLE_OPTIONS_WITH_CAR } from '../arrivals-utils'
import '../Arrivals.css'
import { useTranslation } from 'react-i18next'

type FormOptions = {
  attendance: string
  vehicle: string
  comments: string
}

const FormAttendanceConfirmation = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { bacentaId } = useContext(ChurchContext)
  const { vehicleRecordId } = useContext(ServiceContext)

  const { data, loading, error } = useQuery(DISPLAY_VEHICLE_RECORDS, {
    variables: { vehicleRecordId, bacentaId },
  })
  const [ConfirmVehicleByAdmin] = useMutation(CONFIRM_VEHICLE_BY_ADMIN)

  const vehicle: VehicleRecord = data?.vehicleRecords[0]
  const bacenta: BacentaWithArrivals = data?.bacentas[0]
  const isRecordFromToday = !!vehicle?.createdAt && isToday(vehicle.createdAt)

  const initialValues: FormOptions = {
    attendance: '',
    vehicle: vehicle?.vehicle,
    comments: '',
  }

  const validationSchema = Yup.object({
    attendance: Yup.number()
      .typeError(t('arrivals.form.validNumber'))
      .integer(t('arrivals.form.noAttendanceDecimals'))
      .required(t('arrivals.form.required')),
    vehicle: Yup.string().required(t('arrivals.form.required')),
    comments: Yup.string().when(['attendance', 'vehicle'], {
      is: (attendance: number, vehicleType: string) => {
        if (
          attendance !== vehicle?.leaderDeclaration ||
          vehicleType !== vehicle?.vehicle
        ) {
          return true
        }
      },
      then: Yup.string().required(t('arrivals.form.explainDifference')),
    }),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const { setSubmitting } = onSubmitProps

    if (!isRecordFromToday) {
      alertMsg(t('arrivals.form.notTodayCount'))
      return
    }

    setSubmitting(true)

    // ConfirmVehicleByAdmin records attendance and approves the bussing top-up
    // in a single round trip. Re-submitting a vehicle that was already counted
    // re-derives the top-up, which heals a record whose top-up never got set.
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

    navigate(`/bacenta/vehicle-details`)
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <PlaceholderCustom as="h3" loading={loading}>
          <HeadingPrimary>
            {t('arrivals.form.vehicleAttendance')}
          </HeadingPrimary>
        </PlaceholderCustom>
        <PlaceholderCustom as="h6" loading={loading}>
          <HeadingSecondary>{`${bacenta?.name} ${bacenta?.__typename}`}</HeadingSecondary>
          <p>
            {t('arrivals.form.pictureSubmittedBy', {
              name: vehicle?.created_by.fullName,
            })}
          </p>
        </PlaceholderCustom>

        {!loading && vehicle && !isRecordFromToday && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              {t('arrivals.form.notTodayCount')}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="space-y-2 p-4">
            <CloudinaryImage
              className="confirmation-picture"
              src={vehicle?.picture}
              size="respond"
            />
            <div className="text-sm text-muted-foreground">
              {t('arrivals.form.claimedAttendance')}
              {': '}
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
                label={t('arrivals.form.attendanceFromPicture')}
                placeholder={vehicle?.leaderDeclaration.toString()}
              />
              <Select
                name="vehicle"
                label={t('arrivals.form.vehicleType')}
                options={VEHICLE_OPTIONS_WITH_CAR}
                defaultOption={t('arrivals.form.selectVehicleType')}
              />

              <Textarea name="comments" label={t('arrivals.common.comments')} />
              <Card className="text-center">
                <CardContent className="p-4">
                  {t('arrivals.form.approveVehicleTopUp')}
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

export default FormAttendanceConfirmation
