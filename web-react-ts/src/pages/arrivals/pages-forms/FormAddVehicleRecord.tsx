import SubmitButton from 'components/formik/SubmitButton'
import { Form, Formik, FormikHelpers } from 'formik'
import { useMutation, useQuery } from '@apollo/client'
import { useContext } from 'react'
import * as Yup from 'yup'
import { useLocation, useNavigate } from 'react-router'
import { KeyRound } from 'lucide-react'
import { BACENTA_ARRIVALS, DISPLAY_BUSSING_RECORDS } from '../arrivalsQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { RECORD_BUSSING_FROM_BACENTA } from '../arrivalsMutation'
import { parseDate } from 'lib/date-utils'
import { ServiceContext } from 'contexts/ServiceContext'
import { throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import Select from 'components/formik/Select'
import { VEHICLE_OPTIONS_WITH_CAR } from '../arrivals-utils'
import ImageUpload from 'components/formik/ImageUpload'
import { BacentaWithArrivals } from '../arrivals-types'

type FormOptions = {
  leaderDeclaration: string
  vehicle: string
  picture: string
}

const FormAddVehicleRecord = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { bacentaId, clickCard } = useContext(ChurchContext)
  const { bussingRecordId } = useContext(ServiceContext)

  const today = new Date().toISOString().slice(0, 10)
  const { data, loading, error } = useQuery(BACENTA_ARRIVALS, {
    variables: { id: bacentaId, date: today, bussingDate: today },
  })
  const bacenta: BacentaWithArrivals = data?.bacentas[0]

  const initialValues: FormOptions = {
    leaderDeclaration: '',
    vehicle: '',
    picture: '',
  }

  const [RecordVehicleFromBacenta] = useMutation(RECORD_BUSSING_FROM_BACENTA)
  const validationSchema = Yup.object({
    leaderDeclaration: Yup.number()
      .typeError('Please enter a valid number')
      .positive()
      .integer('You cannot have attendance with decimals!')
      .max(200, 'Attendance cannot exceed 200')
      .required('This is a required field'),
    vehicle: Yup.string().required('This is a required field'),
    picture: Yup.string().required('This is a required field'),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      const res = await RecordVehicleFromBacenta({
        variables: {
          bacentaId,
          leaderDeclaration: parseInt(values.leaderDeclaration),
          bussingRecordId: bussingRecordId,
          vehicle: values.vehicle,
          picture: values.picture,
        },
        refetchQueries: [
          {
            query: BACENTA_ARRIVALS,
            variables: { id: bacentaId, date: today, bussingDate: today },
          },
          {
            query: DISPLAY_BUSSING_RECORDS,
            variables: { bussingRecordId, bacentaId },
          },
        ],
        awaitRefetchQueries: true,
      })

      const recordedVehicle = res.data?.RecordVehicleFromBacenta
      if (recordedVehicle) {
        clickCard(recordedVehicle)
        onSubmitProps.resetForm()
        navigate(`/bacenta/vehicle-details`)
      }
    } catch (error: any) {
      throwToSentry('There was a problem submitting your form', error)
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  const serviceDate = parseDate(
    bacenta?.bussingThisWeek?.serviceDate?.date?.toString()
  )

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Formik
        key={`${bussingRecordId}-${location.key}`}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        validateOnMount
      >
        {(formik) => (
          <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
            <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
              <header className="mb-6 space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {bacenta?.name ?? 'Bacenta'}{' '}
                  <span className="text-arrivals">Arrivals</span>
                </h1>
                {serviceDate && (
                  <p className="text-sm text-muted-foreground">
                    Service Date · {serviceDate}
                  </p>
                )}
              </header>

              {bacenta?.arrivalsCodeOfTheDay && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-arrivals/30 bg-arrivals/10 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-arrivals/20">
                    <KeyRound className="h-5 w-5 text-arrivals" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Code of the Day
                    </p>
                    <p className="font-mono text-lg font-bold tracking-wider tabular-nums text-foreground">
                      {bacenta.arrivalsCodeOfTheDay}
                    </p>
                  </div>
                </div>
              )}

              <Form>
                {/* 2-column on lg+, stacked on mobile */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                  {/* Left — primary data entry */}
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <div className="border-b border-border px-4 py-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Bussing Details
                        </h2>
                      </div>
                      <div className="space-y-4 px-4 py-4">
                        <Input
                          name="leaderDeclaration"
                          type="number"
                          inputMode="numeric"
                          label="Attendance"
                        />
                        <Select
                          name="vehicle"
                          label="Type of Vehicle"
                          options={VEHICLE_OPTIONS_WITH_CAR}
                          defaultOption="Select a vehicle type"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right — photo + submit (sticky on desktop) */}
                  <div className="space-y-4 lg:sticky lg:top-6">
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <div className="border-b border-border px-4 py-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Bussing Picture
                        </h2>
                      </div>
                      <div className="px-4 py-4">
                        <ImageUpload
                          key={`picture-${formik.values.picture || 'empty'}`}
                          name="picture"
                          placeholder="Upload a bussing picture"
                          setFieldValue={formik.setFieldValue}
                          aria-describedby="UploadBussingPicture"
                        />
                      </div>
                    </div>

                    <p className="text-center text-xs italic leading-relaxed text-muted-foreground">
                      I can confirm that the above data is correct and I am
                      cursed if I do the work of the Lord deceitfully.
                    </p>
                    <SubmitButton formik={formik} />
                  </div>
                </div>
              </Form>
            </main>
          </div>
        )}
      </Formik>
    </ApolloWrapper>
  )
}

export default FormAddVehicleRecord
