import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { RECORD_CANCELLED_SERVICE } from './RecordServiceMutations'
import { useMutation } from '@apollo/client'
import { Col, Container, Row } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'

type FormOptionsType = {
  serviceDate: string
  noServiceReason: string
}

const CancelledServiceForm = ({
  church,
  churchId,
  churchType,
}: {
  church: {
    id: string
    name: string
    __typename: string
  }
  churchId: string
  churchType: string
}) => {
  const { clickCard } = useContext(ChurchContext)
  const router = useRouter()

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

  const onSubmit = (
    values: FormOptionsType,
    onSubmitProps: FormikHelpers<FormOptionsType>
  ) => {
    onSubmitProps.setSubmitting(true)
    RecordCancelledService({
      variables: {
        churchId: churchId,
        serviceDate: values.serviceDate,
        noServiceReason: values.noServiceReason,
      },
    })
      .then((res) => {
        onSubmitProps.setSubmitting(false)
        onSubmitProps.resetForm()
        clickCard(res.data.RecordCancelledService)
        router.push(`/${churchType}/service-details`)
      })
      .catch((error) => throwToSentry(error))
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {(formik) => (
        <Container>
          <HeadingPrimary>I Cancelled My Service</HeadingPrimary>
          <HeadingSecondary>{`${church?.name} ${church?.__typename}`}</HeadingSecondary>

          <Form className="form-group mt-5">
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
                    <Input name="noServiceReason" label="Reason" />

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

export default CancelledServiceForm
