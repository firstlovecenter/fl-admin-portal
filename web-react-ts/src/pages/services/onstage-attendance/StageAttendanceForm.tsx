import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { Col, Container, Row } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import SubmitButton from 'components/formik/SubmitButton'
import { getMondayThisWeek } from 'jd-date-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import Input from 'components/formik/Input'
import { Church, ChurchLevel } from 'global-types'
import { MutationFunction } from '@apollo/client'
import MultiImageUpload from 'components/formik/MultiImageUpload'

type StageAttendanceFormProps = {
  church: Church
  churchId: string
  churchType: ChurchLevel
  event?: string
  RecordServiceMutation: MutationFunction
  recordType?: string
}

type FormOptions = {
  serviceDate: string
  attendance: string
  onStagePictures: string[]
}

const StageAttendanceForm = ({
  church,
  churchId,
  churchType,
  event,
  RecordServiceMutation,
  recordType,
}: StageAttendanceFormProps) => {
  const { clickCard } = useContext(ChurchContext)
  const router = useRouter()

  const initialValues: FormOptions = {
    serviceDate: new Date().toISOString().slice(0, 10),
    attendance: '',
    onStagePictures: [''],
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
    onStagePictures: Yup.array().min(
      1,
      'You must have at least two treasurers'
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
          onStagePictures: values.onStagePictures,
        },
      })

      clickCard(res.data.RecordMinistryOnStageAttendance)
      router.push(`/${churchType}/onstage-attendance-details`)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
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
        <Container>
          <HeadingPrimary>
            Record Your {event || 'Service'} Details
          </HeadingPrimary>
          <h5 className="text-secondary">{`${church?.name} ${church?.__typename}`}</h5>

          <Form className="form-group">
            <Row className="row-cols-1 row-cols-md-2">
              {/* <!-- Service Form--> */}
              <Col className="mb-2">
                <div className="form-row d-flex justify-content-center">
                  <Col>
                    <small className="form-text label">
                      Date of Service*
                      <i className="text-secondary">(Day/Month/Year)</i>
                    </small>
                    <Input
                      name="serviceDate"
                      type="date"
                      placeholder="dd/mm/yyyy"
                      aria-describedby="dateofservice"
                    />
                    <Input name="attendance" label="Attendance*" />

                    <Col>
                      <small className="mb-3 ">
                        Upload Your Stage Pictures*
                      </small>

                      <div className="text-secondary fst-italic">
                        <small>
                          You can upload multiple pictures (as many as needed)
                        </small>
                      </div>

                      <MultiImageUpload
                        name="onStagePictures"
                        uploadPreset={
                          process.env.NEXT_PUBLIC_CLOUDINARY_SERVICES
                        }
                        placeholder="Choose"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="upload pictures"
                        error={formik.errors.onStagePictures}
                      />
                    </Col>

                    <div className="d-flex justify-content-center mt-5">
                      <SubmitButton formik={formik} />
                    </div>
                  </Col>
                </div>
              </Col>
            </Row>
          </Form>
        </Container>
      )}
    </Formik>
  )
}

export default StageAttendanceForm
