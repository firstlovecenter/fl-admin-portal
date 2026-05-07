import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import { Loader2, LocateFixed, Wallet } from 'lucide-react'
import * as Yup from 'yup'
import {
  DECIMAL_NUM_REGEX,
  SERVICE_DAY_OPTIONS,
  VACATION_OPTIONS,
  throwToSentry,
} from 'global-utils'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Governorship } from 'global-types'
import { permitAdminArrivals } from 'permission-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import { MAKE_BACENTA_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import RoleView from 'auth/RoleView'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import SubmitButton from 'components/formik/SubmitButton'
import { DISPLAY_GOVERNORSHIP } from 'pages/directory/display/ReadQueries'
import Select from 'components/formik/Select'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import UpdateBusPaymentDialog from 'pages/directory/update/UpdateBusPaymentDialog'

export interface BacentaFormValues extends FormikInitialValues {
  governorship?: Governorship
  meetingDay: string
  vacationStatus: string
  venueLatitude: string | number
  venueLongitude: string | number
  adminId?: string
  adminName?: string
  deputyLeaderId?: string
  deputyLeaderName?: string
}

type BacentaFormProps = {
  initialValues: BacentaFormValues
  onSubmit: (
    values: BacentaFormValues,
    onSubmitProps: FormikHelpers<BacentaFormValues>
  ) => void
  title: string
  newBacenta: boolean
}

const BacentaForm = ({
  initialValues,
  onSubmit,
  title,
  newBacenta,
}: BacentaFormProps) => {
  const { clickCard, bacentaId } = useContext(ChurchContext)
  const [closeDown, setCloseDown] = useState(false)
  const [editBussingOpen, setEditBussingOpen] = useState(false)

  const navigate = useNavigate()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [positionLoading, setPositionLoading] = useState(false)
  const [CloseDownBacenta] = useMutation(MAKE_BACENTA_INACTIVE, {
    refetchQueries: [
      {
        query: DISPLAY_GOVERNORSHIP,
        variables: { id: initialValues.governorship?.id },
      },
    ],
  })

  const validationSchema = Yup.object({
    name: Yup.string().required('Bacenta Name is a required field'),
    leaderId: Yup.string().required('Please choose a leader from the dropdown'),
    adminId: Yup.string(),
    deputyLeaderId: Yup.string(),
    vacationStatus: Yup.string().required(
      'Vacation Status is a required field'
    ),
    meetingDay: Yup.string().required('Meeting Day is a required field'),
    venueLatitude: Yup.string()
      .required('Please fill in your location info')
      .test(
        'is-decimal',
        'Please enter valid coordinates',
        (value) => !!(value + '').match(DECIMAL_NUM_REGEX)
      ),
    venueLongitude: Yup.string()
      .required('Please fill in your location info')
      .test(
        'is-decimal',
        'Please enter valid coordinates',
        (value) => !!(value + '').match(DECIMAL_NUM_REGEX)
      ),
  })

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {title}
          </h1>
          {initialValues.name && (
            <p className="text-sm text-muted-foreground">
              {initialValues.name}
            </p>
          )}
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {!newBacenta && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setCloseDown(true)}
            >
              Close Down Bacenta
            </Button>
          )}
          <RoleView roles={permitAdminArrivals('Governorship')}>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setEditBussingOpen(true)}
            >
              <Wallet className="size-4" />
              Edit Bussing Details
            </Button>
          </RoleView>
        </div>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            validateOnMount
          >
            {(formik) => (
              <Form className="space-y-6">
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <Input
                      name="name"
                      label="Name of Bacenta"
                      placeholder="Enter Name Here"
                    />
                    <Select
                      name="vacationStatus"
                      options={VACATION_OPTIONS}
                      defaultOption="Choose Vacation Status"
                      label="Status"
                    />

                    <RoleView roles={permitAdminArrivals('Governorship')}>
                      <SearchMember
                        name="leaderId"
                        initialValue={initialValues?.leaderName}
                        placeholder="Start typing"
                        label="Select a Leader"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Member Search Box"
                        error={formik.errors.leaderId}
                      />
                      <SearchMember
                        name="adminId"
                        initialValue={initialValues?.adminName}
                        placeholder="Start typing"
                        label="Select Bacenta Admin"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Admin Search Box"
                        error={formik.errors.adminId}
                      />
                      <SearchMember
                        name="deputyLeaderId"
                        initialValue={initialValues?.deputyLeaderName}
                        placeholder="Start typing"
                        label="Select Deputy Bacenta Leader"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Deputy Leader Search Box"
                        error={formik.errors.deputyLeaderId}
                      />
                    </RoleView>

                    <Select
                      label="Meeting Day"
                      name="meetingDay"
                      options={SERVICE_DAY_OPTIONS}
                      defaultOption="Pick a Service Day"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-3 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Service Venue Coordinates
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input name="venueLatitude" placeholder="Latitude" />
                      <Input name="venueLongitude" placeholder="Longitude" />
                    </div>
                    <Button
                      type="button"
                      className="w-full gap-2"
                      disabled={positionLoading}
                      onClick={() => {
                        setPositionLoading(true)

                        window.navigator.geolocation.getCurrentPosition(
                          (position) => {
                            formik.setFieldValue(
                              'venueLatitude',
                              position.coords.latitude
                            )
                            formik.setFieldValue(
                              'venueLongitude',
                              position.coords.longitude
                            )
                            setPositionLoading(false)
                          }
                        )
                      }}
                    >
                      {positionLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Loading
                        </>
                      ) : (
                        <>
                          <LocateFixed className="size-4" />
                          Locate Me Now
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Tap this button while you&apos;re at the bacenta service
                      venue.
                    </p>
                  </CardContent>
                </Card>

                <SubmitButton formik={formik} />
              </Form>
            )}
          </Formik>

          <aside className="space-y-3 lg:sticky lg:top-6">
            <Card>
              <CardContent className="space-y-2 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  About this form
                </h2>
                <p className="text-sm text-muted-foreground">
                  Update bacenta details — leadership, meeting day, vacation
                  status, and venue coordinates.
                </p>
                <p className="text-sm text-muted-foreground">
                  Use{' '}
                  <span className="font-medium text-foreground">
                    Edit Bussing Details
                  </span>{' '}
                  to manage Sunday top-ups and the bacenta&apos;s mobile money
                  number.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Dialog open={closeDown} onOpenChange={setCloseDown}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close Down Bacenta</DialogTitle>
            <DialogDescription>
              Are you sure you want to close down this bacenta? This action
              will mark it inactive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCloseDown(false)}
              disabled={buttonLoading}
            >
              No, take me back
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="gap-2"
              disabled={buttonLoading}
              onClick={async () => {
                try {
                  setButtonLoading(true)
                  const res = await CloseDownBacenta({
                    variables: {
                      id: bacentaId,
                      leaderId: initialValues.leaderId,
                    },
                  })

                  setButtonLoading(false)
                  clickCard(res.data.CloseDownBacenta)
                  setCloseDown(false)
                  navigate(`/governorship/displayall`)
                } catch (error) {
                  setButtonLoading(false)
                  throwToSentry(
                    `There was an error closing down this governorship`,
                    error
                  )
                }
              }}
            >
              {buttonLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Yes, I'm sure"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpdateBusPaymentDialog
        open={editBussingOpen}
        onOpenChange={setEditBussingOpen}
      />
    </div>
  )
}

export default BacentaForm
