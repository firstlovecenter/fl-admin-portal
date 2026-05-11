import { Form, Formik, FormikHelpers } from 'formik'
import {
  Building2,
  Loader2,
  LocateFixed,
  MapPin,
  Users,
  Wallet,
} from 'lucide-react'
import * as Yup from 'yup'
import {
  DECIMAL_NUM_REGEX,
  SERVICE_DAY_OPTIONS,
  VACATION_OPTIONS,
} from 'global-utils'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Governorship } from 'global-types'
import { permitAdminArrivals } from 'permission-utils'
import { useState } from 'react'
import RoleView from 'auth/RoleView'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import SubmitButton from 'components/formik/SubmitButton'
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
}

type SectionHeaderProps = {
  icon: React.ReactNode
  title: string
  description?: string
}

const SectionHeader = ({ icon, title, description }: SectionHeaderProps) => (
  <div className="flex items-start gap-3 border-b border-border px-5 py-4">
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-members/10 text-members">
      {icon}
    </div>
    <div className="min-w-0">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  </div>
)

const BacentaForm = ({
  initialValues,
  onSubmit,
  title,
}: BacentaFormProps) => {
  const [editBussingOpen, setEditBussingOpen] = useState(false)
  const [positionLoading, setPositionLoading] = useState(false)

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
        <header className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-members">
            {title}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {initialValues.name ? (
              <>
                {initialValues.name}{' '}
                <span className="text-members">Bacenta</span>
              </>
            ) : (
              <span className="text-members">New Bacenta</span>
            )}
          </h1>
        </header>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          validateOnMount
        >
          {(formik) => {
            const currentStatus = formik.values.vacationStatus
            const isOnVacation = currentStatus === 'Vacation'

            return (
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
                <Form className="space-y-6">
                  <Card className="overflow-hidden">
                    <SectionHeader
                      icon={<Building2 className="size-4" />}
                      title="Bacenta Details"
                      description="Name, status, and meeting day"
                    />
                    <CardContent className="space-y-4 p-5">
                      <Input
                        name="name"
                        label="Name of Bacenta"
                        placeholder="Enter Name Here"
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Select
                          name="vacationStatus"
                          options={VACATION_OPTIONS}
                          defaultOption="Choose Vacation Status"
                          label="Status"
                        />
                        <Select
                          label="Meeting Day"
                          name="meetingDay"
                          options={SERVICE_DAY_OPTIONS}
                          defaultOption="Pick a Service Day"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <RoleView roles={permitAdminArrivals('Governorship')}>
                    <Card className="overflow-hidden">
                      <SectionHeader
                        icon={<Users className="size-4" />}
                        title="Leadership"
                        description="Bacenta leader, admin, and deputy leader"
                      />
                      <CardContent className="space-y-4 p-5">
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
                      </CardContent>
                    </Card>
                  </RoleView>

                  <Card className="overflow-hidden">
                    <SectionHeader
                      icon={<MapPin className="size-4" />}
                      title="Service Venue"
                      description="GPS coordinates of the bacenta venue"
                    />
                    <CardContent className="space-y-4 p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          name="venueLatitude"
                          label="Latitude"
                          placeholder="0.000000"
                          inputMode="decimal"
                        />
                        <Input
                          name="venueLongitude"
                          label="Longitude"
                          placeholder="0.000000"
                          inputMode="decimal"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2 sm:w-auto sm:min-w-64"
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
                        <p className="text-center text-xs text-muted-foreground">
                          Tap this button while you&apos;re at the bacenta
                          service venue.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center sm:justify-end">
                    <SubmitButton formik={formik} />
                  </div>
                </Form>

                <aside className="space-y-3 lg:sticky lg:top-6">
                  {currentStatus && (
                    <Card>
                      <CardContent className="space-y-2 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Current status
                        </h3>
                        <div>
                          <Badge
                            variant={isOnVacation ? 'warning' : 'success'}
                          >
                            {currentStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isOnVacation
                            ? 'On vacation — no service or bussing expected this week.'
                            : 'Active — a service record is expected each week.'}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <RoleView roles={permitAdminArrivals('Governorship')}>
                    <Card>
                      <CardContent className="space-y-3 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Quick actions
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => setEditBussingOpen(true)}
                        >
                          <Wallet className="size-4" />
                          Edit Bussing Details
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Manage Sunday top-ups, outbound trips, and the
                          bacenta&apos;s mobile money number.
                        </p>
                      </CardContent>
                    </Card>
                  </RoleView>

                  <Card>
                    <CardContent className="space-y-2 p-5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        About this form
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Update bacenta details — leadership, meeting day,
                        vacation status, and venue coordinates. Changes are
                        logged to history.
                      </p>
                    </CardContent>
                  </Card>
                </aside>
              </div>
            )
          }}
        </Formik>
      </main>

      <UpdateBusPaymentDialog
        open={editBussingOpen}
        onOpenChange={setEditBussingOpen}
      />
    </div>
  )
}

export default BacentaForm
