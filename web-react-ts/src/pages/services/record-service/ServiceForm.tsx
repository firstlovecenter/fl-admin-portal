import {
  FieldArray,
  FieldArrayRenderProps,
  Form,
  Formik,
  FormikHelpers,
} from 'formik'
import * as Yup from 'yup'
import React, { useContext } from 'react'
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
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { formatChurchLevel } from 'lib/scope-display'

type ServiceFormProps = {
  church: Church
  churchId: string
  churchType: ChurchLevel
  recordType?: 'RehearsalRecord' | 'MinistryAttendanceRecord' | 'ServiceRecord'
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
}

const ServiceForm = ({
  church,
  churchId,
  churchType,
  event,
  RecordServiceMutation,
  recordType,
}: ServiceFormProps) => {
  const { t } = useTranslation()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

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
  }

  const validationSchema = Yup.object({
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
  })

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
    } else {
      try {
        const res = await RecordServiceMutation({
          variables: {
            churchId: churchId,
            serviceDate: values.serviceDate,
            attendance: parseInt(values.attendance),
            income: parseFloat(values.cediIncome),
            foreignCurrency: parseForeignCurrency(values.foreignCurrency),
            numberOfTithers: parseInt(values.numberOfTithers),
            treasurers: values?.treasurers,
            treasurerSelfie: values.treasurerSelfie,
            familyPicture: values.familyPicture,
          },
        })
        if (res?.errors?.length) throw new Error(res.errors[0].message)

        if (recordType === 'RehearsalRecord') {
          clickCard(res.data?.RecordRehearsalMeeting)
          navigate(`/${churchType.toLowerCase()}/service-details`)
        } else {
          clickCard(res.data?.RecordService)
          navigate(`/${churchType.toLowerCase()}/service-details`)
        }
      } catch (error) {
        setSubmitting(false)
        throwToSentry('', error)
      } finally {
        setSubmitting(false)
      }
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
              {church?.name}{' '}
              <span className="text-churches">
                {event || t('services.form.service')}
              </span>
            </h1>
            {church && (
              <p className="text-sm text-muted-foreground">
                {formatChurchLevel(church.__typename, t)}
              </p>
            )}
          </StickyPageHeader>
          <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            <Form>
              {/* 2-column on lg+, stacked on mobile */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                {/* Left — primary data entry */}
                <div className="space-y-6">
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
                        label={t('services.form.attendance')}
                      />
                      <Input
                        name="cediIncome"
                        label={t('services.form.income', {
                          currency: currentUser.currency,
                        })}
                      />
                      <Textarea
                        name="foreignCurrency"
                        label={t('services.form.foreignCurrency')}
                        rows={2}
                      />
                      <Input
                        name="numberOfTithers"
                        label={t('services.form.numberOfTithers')}
                      />
                    </div>
                  </div>

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
                              {treasurers.map((treasurer, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <div className="flex-1">
                                    <SearchMember
                                      name={`treasurers[${index}]`}
                                      placeholder={t(
                                        'services.form.startTyping'
                                      )}
                                      setFieldValue={formik.setFieldValue}
                                      aria-describedby="treasurers-member-list"
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

                {/* Right — photos + submit (sticky on desktop) */}
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
                          {t('services.form.treasurerSelfie')}
                        </p>
                        <ImageUpload
                          name="treasurerSelfie"
                          placeholder={t('services.form.choose')}
                          setFieldValue={formik.setFieldValue}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {t('services.form.familyPicture')}
                        </p>
                        <ImageUpload
                          name="familyPicture"
                          placeholder={t('services.form.choose')}
                          setFieldValue={formik.setFieldValue}
                        />
                      </div>
                    </div>
                  </div>

                  <SubmitButton formik={formik} />
                </div>
              </div>
            </Form>
          </main>
        </div>
      )}
    </Formik>
  )
}

export default ServiceForm
