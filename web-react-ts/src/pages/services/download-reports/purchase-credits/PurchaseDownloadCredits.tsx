import { ApolloError, useMutation } from '@apollo/client'
import { Church } from '@jaedag/admin-portal-types'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import Input from 'components/formik/Input'
import Select from 'components/formik/Select'
import SubmitButton from 'components/formik/SubmitButton'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import ErrorPopup from 'components/Popup/ErrorPopup'
import { Form, Formik, FormikHelpers } from 'formik'
import { MOMO_NUM_REGEX, throwToSentry } from 'global-utils'
import useModal from 'hooks/useModal'
import usePopup from 'hooks/usePopup'
import { MOBILE_NETWORK_OPTIONS } from 'pages/arrivals/arrivals-utils'
import {
  CONFIRM_OFFERING_PAYMENT,
  SEND_PAYMENT_OTP,
} from 'pages/services/banking/self-banking/bankingQueries'
import React, { useState } from 'react'
import { Button, Col, Container, Modal, Row, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import * as Yup from 'yup'
import { PURCHASE_DOWNLOAD_CREDITS } from './PurchaseCredits.gql'

type PurchaseCreditsProps = {
  church: Church
  loading: boolean
  error: ApolloError | undefined
}

type FormOptions = {
  purchaseDate: string
  amount: number
  mobileNetwork: string
  mobileNumber: string
}

const PurchaseDownloadCredits = (props: PurchaseCreditsProps) => {
  const { church, loading, error } = props

  const [PurchaseCredits] = useMutation(PURCHASE_DOWNLOAD_CREDITS)
  const [SendPaymentOTP] = useMutation(SEND_PAYMENT_OTP)
  const [ConfirmOfferingPayment] = useMutation(CONFIRM_OFFERING_PAYMENT)
  const navigate = useNavigate()

  const { togglePopup, isOpen } = usePopup()
  const { show, handleClose, handleShow } = useModal()
  const [errorMessage, setErrorMessage] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const initialValues: FormOptions = {
    purchaseDate: new Date().toISOString().slice(0, 10),
    amount: 0,
    mobileNetwork: '',
    mobileNumber: '',
  }

  // useEffect(() => {
  //   if (purchase?.transactionStatus === 'send OTP') {
  //     handleShow()
  //   }
  // }, [service])

  const validationSchema = Yup.object({
    amount: Yup.number().required('Please enter the number of credits'),
    mobileNumber: Yup.string()
      .required('You must enter a mobile number')
      .matches(
        MOMO_NUM_REGEX,
        `Enter a valid MoMo Number without spaces. eg. (02XXXXXXXX)`
      ),
    mobileNetwork: Yup.string().when('mobileNumber', {
      is: (mobileNumber: string) => mobileNumber && mobileNumber.length > 0,
      then: Yup.string().required('Please enter the Mobile Network'),
    }),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const { setSubmitting } = onSubmitProps

    setSubmitting(true)

    try {
      const paymentRes = await PurchaseCredits({
        variables: {
          churchId: church.id,
          amount: parseFloat(values.amount.toString()),
          mobileNetwork: values.mobileNetwork,
          mobileNumber: values.mobileNumber,
        },
      })

      if (paymentRes.errors) {
        throw new Error(paymentRes.errors[0]?.message)
      } else if (
        paymentRes.data?.PurchaseDownloadCredits.transactionStatus ===
        'send_otp'
      ) {
        handleShow()
      } else {
        setSubmitting(false)
        navigate(
          `/download-reports/${church.__typename.toLowerCase()}/confirm-payment-delay`
        )
      }
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
          link={`/download-reports/${church.__typename}`}
        />
      )}

      <ApolloWrapper data={church} loading={loading} error={error}>
        <Container>
          <HeadingPrimary loading={loading}>
            Purchase Download Credits
          </HeadingPrimary>
          <HeadingSecondary loading={loading}>
            {church?.name} {church?.__typename}
          </HeadingSecondary>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {(formik) => (
              <Form>
                <Modal show={show} onHide={handleClose}>
                  <Modal.Body>
                    <div className="p-4">
                      A registration token has just been sent to your phone via
                      text message. Please enter it here 👇🏾
                    </div>
                    <input
                      onChange={(e) => setOtp(e.target.value)}
                      className="form-control bg-dark"
                    ></input>
                    <div className="text-center pt-4">
                      <Button
                        disabled={otpSent}
                        onClick={() => {
                          setOtpSent(true)
                          SendPaymentOTP({
                            variables: {
                              // reference: purchase?.transactionReference,
                              otp: otp,
                            },
                          }).then(() =>
                            navigate(
                              '/download-reports/council/confirm-payment-delay'
                            )
                          )
                        }}
                      >
                        {otpSent ? (
                          <>
                            <span className="me-2">Sending</span>
                            <Spinner animation="border" size="sm" />
                          </>
                        ) : (
                          'Submit OTP'
                        )}
                      </Button>
                      <p
                        className="text-secondary mt-2"
                        onClick={() => {
                          setOtpSent(true)
                          ConfirmOfferingPayment({
                            variables: {
                              // serviceRecordId: service.id,
                              // stream_name: service.stream_name,
                            },
                          })
                            .then(() => {
                              setOtpSent(false)
                              navigate(
                                '/download-reports/council/confirm-payment-delay'
                              )
                            })
                            .catch((error: any) => {
                              setOtpSent(false)
                              setErrorMessage(error.message)
                              throwToSentry(
                                'Error Confirming Offering Payment',
                                error
                              )
                            })
                        }}
                      >
                        Didn't receive a token? Click <u>here</u> to resend
                      </p>
                    </div>
                  </Modal.Body>
                </Modal>
                <Row className="row-cols-1 row-cols-md-2 mt-2">
                  <Col className="mb-2">
                    <Input name="amount" label="Credits (GHS 20 per credit)" />
                    <Select
                      name="mobileNetwork"
                      label="Mobile Network"
                      options={MOBILE_NETWORK_OPTIONS}
                    />
                    <Input name="mobileNumber" label="MoMo Number" />
                  </Col>
                </Row>

                <div className="text-warning mt-5 text-center">
                  <p className="card fs-4">{formik.values.amount * 20} GHS </p>
                  Above is the amount you have to pay. Click the button below to
                  confirm
                </div>
                <div className="d-flex justify-content-center">
                  <SubmitButton formik={formik}>
                    <>Make Payment</>
                  </SubmitButton>
                </div>
              </Form>
            )}
          </Formik>
        </Container>
      </ApolloWrapper>
    </div>
  )
}

export default PurchaseDownloadCredits
