import {
  FieldArray,
  FieldArrayRenderProps,
  Form,
  Formik,
  FormikHelpers,
} from 'formik'
import * as Yup from 'yup'
import React, { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import SubmitButton from 'components/formik/SubmitButton'
import {
  checkIfArrayHasRepeatingValues,
  parseForeignCurrency,
  throwToSentry,
} from 'global-utils'
import { getMondayThisWeek } from 'lib/date-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { Church, ChurchLevel } from 'global-types'
import { MutationFunction } from '@apollo/client'
import Input from 'components/formik/Input'
import ImageUpload from 'components/formik/ImageUpload'
import { MemberContext } from 'contexts/MemberContext'
import SearchMember from 'components/formik/SearchMember'
import Textarea from 'components/formik/Textarea'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import useModal from 'hooks/useModal'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { formatChurchLevel } from 'lib/scope-display'

type ServiceFormProps = {
  church: Church
  churchId: string
  churchType: ChurchLevel
  recordType?: 'ServiceRecord'
  event?: string
  RecordServiceMutation: MutationFunction
}

type FormOptions = {
  serviceDate: string
  cediIncome: string
  foreignCurrency: string
  numberOfTithers: string
  attendance: string
  treasurers: string[]
  treasurerSelfie: string
  familyPicture: string
  serviceName: string
  serviceDescription: string
}

const ReviewRow = ({
  label,
  value,
}: {
  label: string
  value: string | number
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium tabular-nums text-foreground">{value}</span>
  </div>
)

const SpecialServiceForm = ({
  church,
  churchId,
  churchType,
  RecordServiceMutation,
}: ServiceFormProps) => {
  const { t } = useTranslation()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()
  const { show, handleClose, handleShow } = useModal()

  const today = new Date()
  const mondayThisWeek = getMondayThisWeek(today)
  const todayIso = today.toISOString().slice(0, 10)
  const mondayThisWeekIso = mondayThisWeek.toISOString().slice(0, 10)

  const initialValues: FormOptions = {
    serviceDate: todayIso,
    cediIncome: '',
    foreignCurrency: '',
    numberOfTithers: '',
    attendance: '',
    treasurers: [''],
    treasurerSelfie: '',
    familyPicture: '',
    serviceName: '',
    serviceDescription: '',
  }

  const validationSchema = useMemo(
    () =>
      Yup.object({
        serviceName: Yup.string().required(
          t('services.specialService.serviceNameRequired')
        ),
        serviceDescription: Yup.string().required(
          t('services.specialService.serviceDescriptionRequired')
        ),
        serviceDate: Yup.date()
          .max(today, t('services.form.dateAfterToday'))
          .min(mondayThisWeek, t('services.form.dateThisWeekOnly'))
          .required(t('services.form.dateRequired')),
        cediIncome: Yup.number()
          .typeError(t('services.form.validNumber'))
          .positive(t('services.form.negativeIncome'))
          .required(t('services.form.incomeRequired')),
        foreignCurrency: Yup.string(),
        numberOfTithers: Yup.number()
          .typeError(t('services.form.validNumber'))
          .integer(t('services.form.tithersInteger'))
          .required(t('services.form.tithersRequired')),
        attendance: Yup.number()
          .typeError(t('services.form.validNumber'))
          .positive()
          .integer(t('services.form.attendanceDecimals'))
          .required(t('services.form.attendanceRequired')),
        treasurerSelfie: Yup.string().required(
          t('services.form.treasurerSelfieRequired')
        ),
        familyPicture: Yup.string().required(
          t('services.form.familyPictureRequired')
        ),
        treasurers: Yup.array()
          .min(2, t('services.form.minTreasurers'))
          .of(Yup.string().required(t('services.form.pickName'))),
      }),
    [mondayThisWeek, t, today]
  )

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const { setSubmitting } = onSubmitProps
    setSubmitting(true)
    if (checkIfArrayHasRepeatingValues(values.treasurers)) {
      throwToSentry(t('services.form.duplicateTreasurer'))
      setSubmitting(false)
      return
    }
    try {
      const res = await RecordServiceMutation({
        variables: {
          ...values,
          churchId,
          attendance: parseInt(values.attendance, 10),
          income: parseFloat(values.cediIncome),
          foreignCurrency: parseForeignCurrency(values.foreignCurrency),
          numberOfTithers: parseInt(values.numberOfTithers, 10),
        },
      })

      clickCard(res.data?.RecordSpecialService)
      navigate(`/${churchType.toLowerCase()}/service-details`)
    } catch (error) {
      setSubmitting(false)
      throwToSentry('', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnMount
    >
      {(formik) => (
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <StickyPageHeader>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('services.specialService.title')}{' '}
              <span className="text-churches">
                {t('services.specialService.titleAccent')}
              </span>
            </h1>
            {church && (
              <p className="text-sm text-muted-foreground">
                {church.name} · {formatChurchLevel(church.__typename, t)}
              </p>
            )}
          </StickyPageHeader>

          <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            <Form>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                {/* Left — primary data entry */}
                <div className="space-y-6">
                  {/* Event identity */}
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-4 py-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('services.specialService.eventDetails')}
                      </h2>
                    </div>
                    <div className="space-y-4 px-4 py-4">
                      <Input
                        name="serviceName"
                        label={t('services.specialService.serviceName')}
                        placeholder={t(
                          'services.specialService.serviceNamePlaceholder'
                        )}
                      />
                      <Textarea
                        name="serviceDescription"
                        label={t('services.specialService.serviceDescription')}
                        placeholder={t(
                          'services.specialService.serviceDescriptionPlaceholder'
                        )}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Service stats */}
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-4 py-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('services.form.serviceDetails')}
                      </h2>
                    </div>
                    <div className="space-y-4 px-4 py-4">
                      <Input
                        name="serviceDate"
                        type="date"
                        label={t('services.form.dateOfService')}
                        min={mondayThisWeekIso}
                        max={todayIso}
                      />
                      <Input
                        name="attendance"
                        label={t('services.specialService.attendance')}
                      />
                      <Input
                        name="cediIncome"
                        label={t('services.specialService.income', {
                          currency: currentUser.currency,
                        })}
                      />
                      <Textarea
                        name="foreignCurrency"
                        label={t('services.specialService.foreignCurrency')}
                        rows={2}
                      />
                      <Input
                        name="numberOfTithers"
                        label={t('services.specialService.numberOfTithers')}
                      />
                    </div>
                  </div>

                  {/* Treasurers */}
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-4 py-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('services.form.treasurers')}
                      </h2>
                    </div>
                    <div className="space-y-3 px-4 py-4">
                      <p className="text-xs text-muted-foreground">
                        {t('services.form.treasurersHint')}
                      </p>
                      <FieldArray name="treasurers">
                        {(fieldArrayProps: FieldArrayRenderProps) => {
                          const { push, remove, form } = fieldArrayProps
                          const { values } = form
                          const { treasurers }: { treasurers: string[] } =
                            values

                          return (
                            <div className="space-y-3">
                              {treasurers.map((_, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <div className="flex-1">
                                    <SearchMember
                                      name={`treasurers[${index}]`}
                                      placeholder={t(
                                        'services.specialService.startTyping'
                                      )}
                                      setFieldValue={formik.setFieldValue}
                                      aria-describedby="Member List"
                                      error={
                                        !Array.isArray(
                                          formik.errors.treasurers
                                        )
                                          ? formik.errors.treasurers
                                          : formik.errors.treasurers &&
                                            formik.errors.treasurers[index]
                                      }
                                    />
                                  </div>
                                  <div className="flex shrink-0 gap-1 pt-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-11 w-11"
                                      onClick={() => push('')}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                    {index > 0 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-11 w-11"
                                        onClick={() => remove(index)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }}
                      </FieldArray>
                    </div>
                  </div>
                </div>

                {/* Right — photos + submit */}
                <div className="space-y-6 lg:sticky lg:top-6">
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-4 py-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('services.form.photos')}
                      </h2>
                    </div>
                    <div className="space-y-5 px-4 py-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {t('services.specialService.uploadTreasurerSelfie')}
                        </p>
                        <ImageUpload
                          name="treasurerSelfie"
                          placeholder={t('services.specialService.choose')}
                          setFieldValue={formik.setFieldValue}
                          aria-describedby="ImageUpload"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {t('services.specialService.uploadFamilyPicture')}
                        </p>
                        <ImageUpload
                          name="familyPicture"
                          placeholder={t('services.specialService.choose')}
                          setFieldValue={formik.setFieldValue}
                          aria-describedby="UploadfamilyPicture"
                        />
                      </div>
                    </div>
                  </div>

                  <Dialog
                    open={show}
                    onOpenChange={(open) => !open && handleClose()}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t('services.form.confirmTitle')}
                        </DialogTitle>
                        <DialogDescription>
                          {t('shared.confirmDialog.reviewDetails')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-1 text-sm">
                        <ReviewRow
                          label={t('services.specialService.serviceName')}
                          value={formik.values.serviceName}
                        />
                        <ReviewRow
                          label={t('services.form.church')}
                          value={`${church?.name} · ${formatChurchLevel(church?.__typename, t)}`}
                        />
                        <ReviewRow
                          label={t('services.form.dateOfService')}
                          value={formik.values.serviceDate}
                        />
                        <ReviewRow
                          label={t('services.specialService.attendance')}
                          value={formik.values.attendance}
                        />
                        <ReviewRow
                          label={t('services.specialService.income', {
                            currency: currentUser.currency,
                          })}
                          value={formik.values.cediIncome}
                        />
                        <ReviewRow
                          label={t('services.specialService.numberOfTithers')}
                          value={formik.values.numberOfTithers}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                          {t('shared.actions.edit')}
                        </Button>
                        <SubmitButton
                          onClick={formik.handleSubmit}
                          formik={formik}
                        />
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleShow}
                    disabled={!formik.isValid || formik.isSubmitting}
                  >
                    {t('services.form.reviewAndSubmit')}
                  </Button>
                </div>
              </div>
            </Form>
          </main>
        </div>
      )}
    </Formik>
  )
}

export default SpecialServiceForm
