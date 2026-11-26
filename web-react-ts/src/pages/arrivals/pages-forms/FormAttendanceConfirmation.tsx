import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { isToday } from 'lib/date-utils'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import SubmitButton from 'components/formik/SubmitButton'
import { alertMsg, throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import Textarea from 'components/formik/Textarea'
import CloudinaryImage from 'components/CloudinaryImage'
import Select from 'components/formik/Select'
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
import { Skeleton } from 'components/ui/skeleton'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import useModal from 'hooks/useModal'
import { DISPLAY_VEHICLE_RECORDS } from '../arrivalsQueries'
import { CONFIRM_VEHICLE_BY_ADMIN } from '../arrivalsMutation'
import { BacentaWithArrivals, VehicleRecord } from '../arrivals-types'
import { VEHICLE_OPTIONS_WITH_CAR } from '../arrivals-utils'
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
  const { show, handleClose, handleShow } = useModal()

  const vehicle: VehicleRecord = data?.vehicleRecords[0]
  const bacenta: BacentaWithArrivals = data?.bacentas[0]
  const isRecordFromToday = !!vehicle?.createdAt && isToday(vehicle.createdAt)

  const initialValues: FormOptions = {
    attendance: '',
    vehicle: vehicle?.vehicle,
    comments: '',
  }

  // SYN-276: mirror ConfirmVehicleByAdmin's 0–200 guard so an out-of-range
  // count is caught on the form instead of round-tripping to a server refusal.
  const validationSchema = Yup.object({
    attendance: Yup.number()
      .typeError(t('arrivals.form.validNumber'))
      .integer(t('arrivals.form.noAttendanceDecimals'))
      .min(0, t('arrivals.form.validNumber'))
      .max(200, t('arrivals.form.attendanceMax'))
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
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('arrivals.form.vehicleAttendance')}
          </h1>
          {loading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {bacenta?.name} {bacenta?.__typename}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('arrivals.form.pictureSubmittedBy', {
                  name: vehicle?.created_by.fullName,
                })}
              </p>
            </>
          )}
        </StickyPageHeader>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4 py-5">

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
              className="w-full rounded-lg object-cover"
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
                type="number"
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
                  <Dialog
                    open={show}
                    onOpenChange={(open) => !open && handleClose()}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t('arrivals.form.confirmAttendanceTitle')}
                        </DialogTitle>
                        <DialogDescription>
                          {t('shared.confirmDialog.reviewDetails')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-1 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">
                            {t('arrivals.form.claimedAttendance')}
                          </span>
                          <div className="flex items-center gap-2 font-medium tabular-nums text-foreground">
                            <span>{vehicle?.leaderDeclaration ?? 0}</span>
                            {String(formik.values.attendance) !==
                              String(vehicle?.leaderDeclaration) && (
                              <>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span className="text-warning">
                                  {formik.values.attendance}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {formik.values.vehicle !== vehicle?.vehicle && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              {t('arrivals.form.vehicleType')}
                            </span>
                            <div className="flex items-center gap-2 font-medium text-foreground">
                              <span>{vehicle?.vehicle}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="text-warning">
                                {formik.values.vehicle}
                              </span>
                            </div>
                          </div>
                        )}
                        {formik.values.comments && (
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">
                              {t('arrivals.common.comments')}
                            </span>
                            <span className="font-medium text-foreground">
                              {formik.values.comments}
                            </span>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                          {t('shared.actions.edit')}
                        </Button>
                        <SubmitButton
                          onClick={formik.handleSubmit}
                          formik={formik}
                          disabled={!isRecordFromToday}
                        />
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    onClick={handleShow}
                    disabled={!formik.isValid || formik.isSubmitting || !isRecordFromToday}
                  >
                    {t('services.form.reviewAndSubmit')}
                  </Button>
                </CardFooter>
              </Card>
            </Form>
          )}
        </Formik>
      </div>
      </div>
    </ApolloWrapper>
  )
}

export default FormAttendanceConfirmation
