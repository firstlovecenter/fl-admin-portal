import { Form, Formik, FormikHelpers } from 'formik'
import {
  Building2,
  Loader2,
  LocateFixed,
  MapPin,
  Users,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
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
  const { t } = useTranslation()
  const [editBussingOpen, setEditBussingOpen] = useState(false)
  const [positionLoading, setPositionLoading] = useState(false)

  const validationSchema = Yup.object({
    name: Yup.string().required(t('directory.bacentaForm.validation.nameRequired')),
    leaderId: Yup.string().required(
      t('directory.bacentaForm.validation.leaderRequired')
    ),
    adminId: Yup.string(),
    deputyLeaderId: Yup.string(),
    vacationStatus: Yup.string().required(
      t('directory.bacentaForm.validation.vacationStatusRequired')
    ),
    meetingDay: Yup.string().required(
      t('directory.bacentaForm.validation.meetingDayRequired')
    ),
    venueLatitude: Yup.string()
      .required(t('directory.bacentaForm.validation.locationRequired'))
      .test(
        'is-decimal',
        t('directory.bacentaForm.validation.invalidCoordinates'),
        (value) => !!(value + '').match(DECIMAL_NUM_REGEX)
      ),
    venueLongitude: Yup.string()
      .required(t('directory.bacentaForm.validation.locationRequired'))
      .test(
        'is-decimal',
        t('directory.bacentaForm.validation.invalidCoordinates'),
        (value) => !!(value + '').match(DECIMAL_NUM_REGEX)
      ),
  })

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        <p className="text-xs font-semibold uppercase tracking-wider text-members">
          {title}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          {initialValues.name ? (
            <>
              {initialValues.name}{' '}
              <span className="text-members">
                {t('shared.churchLevel.Bacenta')}
              </span>
            </>
          ) : (
            <span className="text-members">
              {t('directory.bacentaForm.newBacenta')}
            </span>
          )}
        </h1>
      </StickyPageHeader>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
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
                      title={t('directory.bacentaForm.detailsSectionTitle')}
                      description={t(
                        'directory.bacentaForm.detailsSectionDescription'
                      )}
                    />
                    <CardContent className="space-y-4 p-5">
                      <Input
                        name="name"
                        label={t('directory.bacentaForm.nameLabel')}
                        placeholder={t('directory.bacentaForm.namePlaceholder')}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Select
                          name="vacationStatus"
                          options={VACATION_OPTIONS}
                          defaultOption={t(
                            'directory.bacentaForm.vacationStatusDefaultOption'
                          )}
                          label={t('directory.bacentaForm.statusLabel')}
                        />
                        <Select
                          label={t('directory.bacentaForm.meetingDayLabel')}
                          name="meetingDay"
                          options={SERVICE_DAY_OPTIONS}
                          defaultOption={t(
                            'directory.streamForm.meetingDayDefaultOption'
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <RoleView roles={permitAdminArrivals('Governorship')}>
                    <Card className="overflow-hidden">
                      <SectionHeader
                        icon={<Users className="size-4" />}
                        title={t('directory.bacentaForm.leadershipSectionTitle')}
                        description={t(
                          'directory.bacentaForm.leadershipSectionDescription'
                        )}
                      />
                      <CardContent className="space-y-4 p-5">
                        <SearchMember
                          name="leaderId"
                          initialValue={initialValues?.leaderName}
                          placeholder={t('directory.bacentaForm.startTyping')}
                          label={t('directory.bacentaForm.selectALeader')}
                          setFieldValue={formik.setFieldValue}
                          aria-describedby="Member Search Box"
                          error={formik.errors.leaderId}
                        />
                        <SearchMember
                          name="adminId"
                          initialValue={initialValues?.adminName}
                          placeholder={t('directory.bacentaForm.startTyping')}
                          label={t('directory.bacentaForm.selectBacentaAdmin')}
                          setFieldValue={formik.setFieldValue}
                          aria-describedby="Admin Search Box"
                          error={formik.errors.adminId}
                        />
                        <SearchMember
                          name="deputyLeaderId"
                          initialValue={initialValues?.deputyLeaderName}
                          placeholder={t('directory.bacentaForm.startTyping')}
                          label={t('directory.bacentaForm.selectDeputyLeader')}
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
                      title={t('directory.bacentaForm.venueSectionTitle')}
                      description={t(
                        'directory.bacentaForm.venueSectionDescription'
                      )}
                    />
                    <CardContent className="space-y-4 p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          name="venueLatitude"
                          label={t('directory.bacentaForm.latitude')}
                          placeholder="0.000000"
                          inputMode="decimal"
                        />
                        <Input
                          name="venueLongitude"
                          label={t('directory.bacentaForm.longitude')}
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
                              {t('directory.bacentaForm.loading')}
                            </>
                          ) : (
                            <>
                              <LocateFixed className="size-4" />
                              {t('directory.bacentaForm.locateMeNow')}
                            </>
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                          {t('directory.bacentaForm.locateMeCaption')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center">
                    <SubmitButton formik={formik} />
                  </div>
                </Form>

                <aside className="space-y-3 lg:sticky lg:top-6">
                  {currentStatus && (
                    <Card>
                      <CardContent className="space-y-2 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('directory.bacentaForm.currentStatus')}
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
                            ? t('directory.bacentaForm.onVacationCaption')
                            : t('directory.bacentaForm.activeCaption')}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <RoleView roles={permitAdminArrivals('Stream')}>
                    <Card>
                      <CardContent className="space-y-3 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('directory.bacentaForm.quickActions')}
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => setEditBussingOpen(true)}
                        >
                          <Wallet className="size-4" />
                          {t('directory.bacentaForm.editBussingDetails')}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          {t('directory.bacentaForm.editBussingCaption')}
                        </p>
                      </CardContent>
                    </Card>
                  </RoleView>

                  <Card>
                    <CardContent className="space-y-2 p-5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('directory.bacentaForm.aboutThisForm')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('directory.bacentaForm.aboutThisFormDescription')}
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
