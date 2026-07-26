import MinusSign from 'components/buttons/PlusMinusSign/MinusSign'
import PlusSign from 'components/buttons/PlusMinusSign/PlusSign'
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
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
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
        <div className="mx-auto w-full max-w-screen-md px-4">
          <HeadingPrimary>{t('services.specialService.title')}</HeadingPrimary>
          <h5 className="text-sm text-muted-foreground">{`${church?.name} ${formatChurchLevel(church?.__typename, t)}`}</h5>

          <Form className="form-group">
            <div className="mb-2 space-y-3">
              <div className="form-row flex flex-col gap-3">
                <hr className="border-border" />
                <Input
                  name="serviceName"
                  label={t('services.specialService.serviceName')}
                  placeholder={t('services.specialService.serviceNamePlaceholder')}
                />
                <Textarea
                  name="serviceDescription"
                  label={t('services.specialService.serviceDescription')}
                  placeholder={t(
                    'services.specialService.serviceDescriptionPlaceholder'
                  )}
                  rows={3}
                />
                <hr className="border-border" />
                <small className="form-text label">
                  {t('services.specialService.dateOfService')}
                  <i className="text-muted-foreground">
                    {t('services.specialService.dateHint')}
                  </i>
                </small>
                <Input
                  name="serviceDate"
                  type="date"
                  placeholder={t('services.specialService.datePlaceholder')}
                  aria-describedby="dateofservice"
                  min={mondayThisWeekIso}
                  max={todayIso}
                />
                <Input name="attendance" label={t('services.specialService.attendance')} />
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
                <small className="label">
                  {t('services.specialService.treasurers')}
                </small>
                <FieldArray name="treasurers">
                  {(fieldArrayProps: FieldArrayRenderProps) => {
                    const { push, remove, form } = fieldArrayProps
                    const { values } = form
                    const { treasurers }: { treasurers: string[] } = values

                    return (
                      <>
                        {treasurers.map((treasurer, index) => (
                          <div key={index} className="form-row flex gap-2">
                            <div className="flex-1">
                              <SearchMember
                                name={`treasurers[${index}]`}
                                placeholder={t('services.specialService.startTyping')}
                                setFieldValue={formik.setFieldValue}
                                aria-describedby="Member List"
                                error={
                                  !Array.isArray(formik.errors.treasurers)
                                    ? formik.errors.treasurers
                                    : formik.errors.treasurers &&
                                      formik.errors.treasurers[index]
                                }
                              />
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <PlusSign onClick={() => push('')} />
                              {index > 0 && (
                                <MinusSign onClick={() => remove(index)} />
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )
                  }}
                </FieldArray>
                <div className="my-2 mt-2">
                  <small>{t('services.specialService.uploadTreasurerSelfie')}</small>
                  <ImageUpload
                    name="treasurerSelfie"
                    placeholder={t('services.specialService.choose')}
                    setFieldValue={formik.setFieldValue}
                    aria-describedby="ImageUpload"
                  />
                </div>
                <div className="my-2">
                  <small className="mb-3">
                    {t('services.specialService.uploadFamilyPicture')}
                  </small>
                  <ImageUpload
                    name="familyPicture"
                    placeholder={t('services.specialService.choose')}
                    setFieldValue={formik.setFieldValue}
                    aria-describedby="UploadfamilyPicture"
                  />
                </div>
                <div className="mt-3 flex justify-center">
                  <SubmitButton formik={formik} />
                </div>
              </div>
            </div>
          </Form>
        </div>
      )}
    </Formik>
  )
}

export default SpecialServiceForm
