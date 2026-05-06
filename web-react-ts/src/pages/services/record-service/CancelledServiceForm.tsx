import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@apollo/client'
import { XCircle } from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import { Church } from 'global-types'
import { throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
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
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  const [RecordCancelledService] = useMutation(RECORD_CANCELLED_SERVICE)

  const initialValues: FormOptionsType = {
    serviceDate: new Date().toISOString().slice(0, 10),
    noServiceReason: '',
  }

  const validationSchema = Yup.object({
    serviceDate: Yup.date()
      .max(new Date(), 'Service could not possibly have happened after today')
      .required('Date is a required field'),
    noServiceReason: Yup.string().required('You must give a reason'),
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
      throwToSentry('There was a problem submitting your form', error)
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
          <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            <header className="mb-6 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                I Cancelled My Service
              </h1>
              {church && (
                <p className="text-sm text-muted-foreground">
                  {church.name} · {church.__typename}
                </p>
              )}
            </header>

            <Form>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                {/* Left — cancellation details */}
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Cancellation Details
                    </h2>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    <Input
                      name="serviceDate"
                      type="date"
                      label="Date of Service"
                      placeholder="dd/mm/yyyy"
                      aria-describedby="dateofservice"
                    />
                    <Input
                      name="noServiceReason"
                      label="Reason for Cancellation"
                      placeholder="e.g. Joint service with Council"
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
                          No Service This Week
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Use this form when no service took place. The reason
                          will be saved to the church&apos;s history.
                        </p>
                      </div>
                    </div>
                  </div>
                  <SubmitButton formik={formik}>Submit Cancellation</SubmitButton>
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
