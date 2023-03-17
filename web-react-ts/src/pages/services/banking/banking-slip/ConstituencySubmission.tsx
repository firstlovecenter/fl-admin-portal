import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ServiceContext } from 'contexts/ServiceContext'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { useMutation, useQuery } from '@apollo/client'
import HeadingSecondary from 'components/HeadingSecondary'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { useNavigate } from 'react-router'
import { getHumanReadableDate } from 'jd-date-utils'
import SubmitButton from 'components/formik/SubmitButton'
import usePopup from 'hooks/usePopup'
import ErrorPopup from 'components/Popup/ErrorPopup'
import ImageUpload from 'components/formik/ImageUpload'
import {
  BANKING_SLIP_SUBMISSION,
  CONSTITUENCY_SERVICE_RECORDS,
} from 'pages/services/ServicesQueries'

type FormOptions = {
  bankingSlip: string
}

const ConstituencyBankingSlipSubmission = () => {
  const { serviceRecordId } = useContext(ServiceContext)
  const navigate = useNavigate()
  const { togglePopup, isOpen } = usePopup()
  const [errorMessage, setErrorMessage] = useState('')

  const { data, loading, error } = useQuery(CONSTITUENCY_SERVICE_RECORDS, {
    variables: { serviceId: serviceRecordId },
  })
  const constituency = data?.serviceRecords[0]?.serviceLog?.constituency[0]

  const initialValues = {
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

      navigate(`/constituency/service-details`)
    } catch (err: unknown) {
      setErrorMessage(err.message)
      togglePopup()
    }
  }

  return (
    <div>
      {isOpen && (
        <ErrorPopup
          errorMessage={errorMessage}
          togglePopup={togglePopup}
          link="/services/constituency/banking-slips"
        />
      )}

      <ApolloWrapper
        loading={loading}
        error={error}
        data={data && constituency}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          validateOnMount
        >
          {(formik) => (
            <Container>
              <HeadingPrimary>Banking Slip Submission</HeadingPrimary>
              <HeadingSecondary>{constituency?.name}</HeadingSecondary>
              <p>
                Date of Joint Service :{' '}
                {getHumanReadableDate(
                  data.serviceRecords[0].serviceDate.date,
                  true
                )}
              </p>
              <p>Expected Income: {data.serviceRecords[0].income}</p>
              <Form>
                <Row className="row-cols-1 row-cols-md-2 mt-5">
                  <Col className="mb-2">
                    <ImageUpload
                      label="Upload a Picture of Your Banking Slip"
                      name="bankingSlip"
                      error={formik.errors.bankingSlip}
                      uploadPreset={import.meta.env.VITE_CLOUDINARY_BANKING}
                      placeholder="Choose"
                      setFieldValue={formik.setFieldValue}
                      aria-describedby="UploadBankingSlip"
                    />
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

export default ConstituencyBankingSlipSubmission
