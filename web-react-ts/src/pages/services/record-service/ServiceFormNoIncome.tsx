import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import SubmitButton from 'components/formik/SubmitButton'
import { throwToSentry } from 'global-utils'
import { getMondayThisWeek } from 'jd-date-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import Input from 'components/formik/Input'
import { Church, ChurchLevel } from 'global-types'
import { MutationFunction } from '@apollo/client'
import ImageUpload from 'components/formik/ImageUpload'

type ServiceFormProps = {
  church: Church
  churchId: string
  churchType: ChurchLevel
  event?: string
  RecordServiceMutation: MutationFunction
}

type FormOptions = {
  serviceDate: string
  attendance: string
  familyPicture: string
}

const ServiceForm = ({
  church,
  churchId,
  churchType,
  event,
  RecordServiceMutation,
}: ServiceFormProps) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  const initialValues: FormOptions = {
    serviceDate: new Date().toISOString().slice(0, 10),
    attendance: '',
    familyPicture: '',
  }

  const today = new Date()

  const validationSchema = Yup.object({
    serviceDate: Yup.date()
      .max(new Date(), 'Service could not possibly have happened after today')
      .min(getMondayThisWeek(today), 'You can only fill forms for this week')
      .required('Date is a required field'),
    attendance: Yup.number()
      .typeError('Please enter a valid number')
      .positive()
      .integer('You cannot have attendance with decimals!')
      .required('You cannot submit this form without entering your attendance'),
    familyPicture: Yup.string().required(
      'Please submit a picture of your service'
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const { setSubmitting } = onSubmitProps
    setSubmitting(true)
    try {
      const res = await RecordServiceMutation({
        variables: {
          churchId: churchId,
          serviceDate: values.serviceDate,
          attendance: parseInt(values.attendance),
          familyPicture: values.familyPicture,
        },
      })

      clickCard(res.data.RecordServiceNoIncome)
      navigate(`/${churchType.toLowerCase()}/service-details`)
    } catch (error) {
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
          <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            <header className="mb-6 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {church?.name}{' '}
                <span className="text-churches">{event || 'Service'}</span>
              </h1>
              {church && (
                <p className="text-sm text-muted-foreground">
                  {church.__typename}
                </p>
              )}
            </header>

            <Form>
              {/* 2-column on lg+, stacked on mobile */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                {/* Left — primary data entry */}
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Service Details
                    </h2>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    <Input
                      name="serviceDate"
                      type="date"
                      label="Date of Service"
                    />
                    <Input name="attendance" label="Attendance" />
                  </div>
                </div>

                {/* Right — photo + submit (sticky on desktop) */}
                <div className="space-y-6 lg:sticky lg:top-6">
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-4 py-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Photos
                      </h2>
                    </div>
                    <div className="space-y-2 px-4 py-4">
                      <p className="text-sm font-medium text-foreground">
                        Service / Family Picture
                      </p>
                      <ImageUpload
                        name="familyPicture"
                        placeholder="Choose"
                        setFieldValue={formik.setFieldValue}
                      />
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
