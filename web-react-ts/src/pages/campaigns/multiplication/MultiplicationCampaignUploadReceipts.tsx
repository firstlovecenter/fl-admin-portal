import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ServiceContext } from 'contexts/ServiceContext'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { useMutation } from '@apollo/client'
import HeadingSecondary from 'components/HeadingSecondary'
import { useNavigate } from 'react-router'
import { getHumanReadableDate } from 'jd-date-utils'
import SubmitButton from 'components/formik/SubmitButton'
import usePopup from 'hooks/usePopup'
import ErrorPopup from 'components/Popup/ErrorPopup'
import ImageUpload from 'components/formik/ImageUpload'
import { MemberContext } from 'contexts/MemberContext'
import { MultiplicationServiceRecord } from './MultiplicationCampaignServiceDetails'
import { MULTIPLICATION_BANKING_SLIP_SUBMISSION } from './MultiplicationQueries'

type FormOptions = {
  bankingSlip: string
}

type UploadReceiptProp = {
  serviceRecord: MultiplicationServiceRecord
}

const MultiplicationCampaignUploadReceipts = ({
  serviceRecord,
}: UploadReceiptProp) => {
  const { multiplicationRecordId } = useContext(ServiceContext)
  const navigate = useNavigate()
  const { togglePopup, isOpen } = usePopup()
  const [errorMessage, setErrorMessage] = useState('')
  const { currentUser } = useContext(MemberContext)

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  const initialValues: FormOptions = {
    bankingSlip: '',
  }
  const [SubmitBankingSlip] = useMutation(
    MULTIPLICATION_BANKING_SLIP_SUBMISSION
  )

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
          multiplicationRecordId: multiplicationRecordId,
          bankingSlip: values.bankingSlip,
        },
      })
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()

      navigate(
        `/campaigns/${churchType.toLowerCase()}/multiplication/service-details`
      )
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

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        validateOnMount={true}
      >
        {(formik) => (
          <Container>
            <HeadingPrimary>Banking Slip Submission</HeadingPrimary>
            <HeadingSecondary>
              {church?.name} {churchType}
            </HeadingSecondary>
            <p>
              Date of Multiplication Event :{' '}
              {getHumanReadableDate(serviceRecord?.crusadeDate.date, true)}
            </p>
            <p>Expected Income: {serviceRecord?.income}</p>
            <Form>
              <Row className="row-cols-1 row-cols-md-2 mt-5">
                <Col className="mb-2">
                  <ImageUpload
                    label="Upload a Picture of Your Banking Slip"
                    name="bankingSlip"
                    uploadPreset={import.meta.env.VITE_CLOUDINARY_BANKING}
                    placeholder="Choose"
                    setFieldValue={formik.setFieldValue}
                    aria-describedby="UploadBankingSlip"
                  />
                </Col>
                <Col className="mb-2">
                  <SubmitButton formik={formik} />
                </Col>
              </Row>
            </Form>
          </Container>
        )}
      </Formik>
    </div>
  )
}

export default MultiplicationCampaignUploadReceipts
