import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ServiceContext } from 'contexts/ServiceContext'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import React, { useContext, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import {
  BANKING_SLIP_SUBMISSION,
  COUNCIL_SERVICE_RECORDS,
} from 'pages/services/ServicesQueries'
import { useMutation, useQuery } from '@apollo/client'
import HeadingSecondary from 'components/HeadingSecondary'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { useRouter } from 'next/navigation'
import { getHumanReadableDate } from 'jd-date-utils'
import SubmitButton from 'components/formik/SubmitButton'
import usePopup from 'hooks/usePopup'
import ErrorPopup from 'components/Popup/ErrorPopup'
import ImageUpload from 'components/formik/ImageUpload'

type FormOptions = {
  bankingSlip: string
}

const CouncilBankingSlipSubmission = () => {
  const { serviceRecordId } = useContext(ServiceContext)
  const router = useRouter()
  const { togglePopup, isOpen } = usePopup()
  const [errorMessage, setErrorMessage] = useState('')

  const { data, loading, error } = useQuery(COUNCIL_SERVICE_RECORDS, {
    variables: { serviceId: serviceRecordId },
  })
  const council = data?.serviceRecords[0]?.serviceLog?.council[0]
  const initialValues: FormOptions = {
    bankingSlip: '',
  }
  const [SubmitBankingSlip] = useMutation(BANKING_SLIP_SUBMISSION)

  const validationSchema = Yup.object({
    bankingSlip: Yup.string().required('You must upload a banking slip'),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await SubmitBankingSlip({
        variables: {
          serviceRecordId,
          bankingSlip: values.bankingSlip,
        },
      })
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()

      router.push(`/council/service-details`)
    } catch (error: any) {
      setErrorMessage(error.message)
      togglePopup()
    }
  }

  return (
    <div>
      {isOpen && (
        <ErrorPopup
          errorMessage={errorMessage}
          togglePopup={togglePopup}
          link="/services/council/banking-slips"
        />
      )}

      <ApolloWrapper loading={loading} error={error} data={data && council}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          validateOnMount
        >
          {(formik) => (
            <Container>
              <HeadingPrimary>Banking Slip Submission</HeadingPrimary>
              <HeadingSecondary>{council?.name}</HeadingSecondary>
              <p>
                Date of Joint Service :{' '}
                {getHumanReadableDate(
                  data.serviceRecords[0].serviceDate.date,
                  true
                )}
              </p>
              <p>Expected Income: {data.serviceRecords[0].cash}</p>
              <Form>
                <Row className="row-cols-1 row-cols-md-2 mt-5">
                  <Col className="mb-2">
                    <ImageUpload
                      label="Upload a Picture of Your Banking Slip"
                      name="bankingSlip"
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_BANKING}
                      placeholder="Choose"
                      setFieldValue={formik.setFieldValue}
                      aria-describedby="UploadBankingSlip"
                    />
                  </Col>
                  <Col className="mb-2 text-center">
                    <SubmitButton formik={formik} />
                  </Col>
                </Row>
              </Form>
            </Container>
          )}
        </Formik>
      </ApolloWrapper>
    </div>
  )
}

export default CouncilBankingSlipSubmission
