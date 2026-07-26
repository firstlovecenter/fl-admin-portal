import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@apollo/client'
import { useTranslation } from 'react-i18next'
import { XCircle } from 'lucide-react'
import { getMondayThisWeek } from 'lib/date-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { Church } from 'global-types'
import { throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { formatChurchLevel } from 'lib/scope-display'
import { RECORD_CANCELLED_SERVICE } from './RecordServiceMutations'

type FormOptionsType = {
  serviceDate: string
  noServiceReason: string
}

type CancelledServiceFormProps = {
  church: Church
  churchId: string
  churchType: string
}

const CancelledServiceForm = ({
  church,
  churchId,
  churchType,
}: CancelledServiceFormProps) => {
  const { t } = useTranslation()
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  const [RecordCancelledService] = useMutation(RECORD_CANCELLED_SERVICE)

  const today = new Date()
  const mondayThisWeek = getMondayThisWeek(today)
  const todayIso = today.toISOString().slice(0, 10)
  const mondayThisWeekIso = mondayThisWeek.toISOString().slice(0, 10)

  const initialValues: FormOptionsType = {
    serviceDate: todayIso,
    noServiceReason: '',
  }

  const validationSchema = Yup.object({
    serviceDate: Yup.date()
      .max(today, t('services.form.dateAfterToday'))
      .min(mondayThisWeek, t('services.form.dateThisWeekOnly'))
      .required(t('services.form.dateRequired')),
    noServiceReason: Yup.string().required(
      t('services.cancelled.reasonRequired')
    ),
  })

  const onSubmit = async (
    values: FormOptionsType,
    onSubmitProps: FormikHelpers<FormOptionsType>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      const res = await RecordCancelledService({
        variables: {
          churchId,
          serviceDate: values.serviceDate,
          noServiceReason: values.noServiceReason,
        },
      })
      onSubmitProps.resetForm()
      clickCard(res.data.RecordCancelledService)
      navigate(`/${churchType}/service-details`)
    } catch (error) {
      throwToSentry(t('services.cancelled.submitError'), error)
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {(formik) => (
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <StickyPageHeader>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('services.cancelled.title')}{' '}
              <span className="text-churches">
                {t('services.cancelled.titleAccent')}
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
                {/* Left — cancellation details */}
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('services.cancelled.cancellationDetails')}
                    </h2>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    <Input
                      name="serviceDate"
                      type="date"
                      label={t('services.cancelled.dateOfService')}
                      placeholder={t('services.cancelled.datePlaceholder')}
                      aria-describedby="dateofservice"
                      min={mondayThisWeekIso}
                      max={todayIso}
                    />
                    <Input
                      name="noServiceReason"
                      label={t('services.cancelled.reasonLabel')}
                      placeholder={t('services.cancelled.reasonPlaceholder')}
                    />
                  </div>
                </div>

                {/* Right — context + submit */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {t('services.cancelled.noServiceTitle')}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t('services.cancelled.noServiceDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <SubmitButton formik={formik}>
                    {t('services.cancelled.submit')}
                  </SubmitButton>
                </div>
              </div>
            </Form>
          </main>
        </div>
      )}
    </Formik>
  )
}

export default CancelledServiceForm
