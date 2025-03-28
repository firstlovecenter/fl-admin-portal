import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import { Col, Container, Row } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
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
  recordType?: string
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
  recordType,
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

      if (recordType === 'MinistryAttendanceRecord') {
        if (res.errors) throw new Error(res.errors[0].message)
        clickCard(res.data.RecordHubCouncilSundayAttendance)
        navigate(`/hub/sunday-meeting-details`)
      } else {
        clickCard(res.data.RecordServiceNoIncome)
        navigate(`/${churchType}/service-details`)
      }
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

                    <Col className="my-2">
                      <small className="mb-3">
                        Upload Your Family Picture*
                      </small>
                      <ImageUpload
                        name="familyPicture"
                        uploadPreset={import.meta.env.VITE_CLOUDINARY_SERVICES}
                        placeholder="Choose"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="UploadfamilyPicture"
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

export default ServiceForm
