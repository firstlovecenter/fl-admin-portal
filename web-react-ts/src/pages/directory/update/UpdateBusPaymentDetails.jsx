import { useMutation, useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext, useState } from 'react'
import {
  DISPLAY_BACENTA_BUSSING_DETAILS,
  SEND_MOBILE_VERIFICATION_NUMBER,
  UPDATE_BACENTA_BUSSING_DETAILS,
  UPDATE_BUS_PAYMENT_DETAILS,
} from './UpdateBacentaArrivals'
import * as Yup from 'yup'
import { useNavigate } from 'react-router'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Button, Col, Container, Row } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { Form, Formik } from 'formik'
import SubmitButton from 'components/formik/SubmitButton'
import {
  alertMsg,
  MOMO_NUM_REGEX,
  randomOTPGenerator,
  throwErrorMsg,
} from 'global-utils'
import { MOBILE_NETWORK_OPTIONS } from 'pages/arrivals/arrivals-utils'
import RoleView from 'auth/RoleView'
import { permitAdminArrivals } from 'permission-utils'
import useAuth from 'auth/useAuth'
import Popup from 'components/Popup/Popup'
import usePopup from 'hooks/usePopup'
import { MemberContext } from 'contexts/MemberContext'
import Input from 'components/formik/Input'
import Select from 'components/formik/Select'

const UpdateBusPayment = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { theme } = useContext(MemberContext)
  const { isOpen, togglePopup } = usePopup()
  const { isAuthorised } = useAuth()
  const [otp] = useState(randomOTPGenerator())
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const {
    data: bacentaData,
    loading: bacentaLoading,
    error: bacentaError,
  } = useQuery(DISPLAY_BACENTA_BUSSING_DETAILS, {
    variables: { id: bacentaId },
  })
  const [UpdateBacentaBussingDetails] = useMutation(
    UPDATE_BACENTA_BUSSING_DETAILS
  )
  const [UpdateBusPaymentDetails] = useMutation(UPDATE_BUS_PAYMENT_DETAILS)
  const [SendMobileVerificationNumber] = useMutation(
    SEND_MOBILE_VERIFICATION_NUMBER
  )
  const bacenta = bacentaData?.bacentas[0]

  const initialValues = {
    name: bacenta?.name,
    target: bacenta?.target ?? '',
    normalBussingCost: bacenta?.normalBussingCost ?? '',
    normalPersonalContribution: bacenta?.normalPersonalContribution ?? '',
    swellBussingCost: bacenta?.swellBussingCost ?? '',
    swellPersonalContribution: bacenta?.swellPersonalContribution ?? '',
    mobileNetwork: bacenta?.mobileNetwork ?? '',
    momoName: bacenta?.momoName ?? '',
    momoNumber: bacenta?.momoNumber ?? '',
    verificationCode: '',
  }

  const validationSchema = Yup.object({
    target: Yup.string().required('Bacenta Name is a required field'),
    normalBussingCost: Yup.string().required('This is a required field'),
    normalPersonalContribution: Yup.string().required(
      'This is a required field'
    ),
    swellBussingCost: Yup.string().required('This is a required field'),
    swellPersonalContribution: Yup.string().required(
      'This is a required field'
    ),
    momoNumber: Yup.string().matches(
      MOMO_NUM_REGEX,
      `Enter a valid MoMo Number without spaces. eg. (02XXXXXXXX)`
    ),
    momoName: Yup.string().when('momoNumber', {
      is: (momoNumber) => momoNumber && momoNumber.length > 0,
      then: Yup.string().required('Please enter the Momo Name'),
    }),
    mobileNetwork: Yup.string().when('momoNumber', {
      is: (momoNumber) => momoNumber && momoNumber.length > 0,
      then: Yup.string().required('Please enter the Mobile Network'),
    }),
  })

  const onSubmit = async (values, onSubmitProps) => {
    onSubmitProps.setSubmitting(true)
    if (isAuthorised(permitAdminArrivals('Stream'))) {
      await UpdateBacentaBussingDetails({
        variables: {
          bacentaId: bacentaId,
          target: parseInt(values.target),
          normalBussingCost: parseFloat(values.normalBussingCost),
          normalPersonalContribution: parseFloat(
            values.normalPersonalContribution
          ),
          swellBussingCost: parseFloat(values.swellBussingCost),
          swellPersonalContribution: parseFloat(
            values.swellPersonalContribution
          ),
        },
      })
      if (initialValues.momoNumber === values.momoNumber)
        navigate(`/bacenta/displaydetails`)
    }

    if (!values.mobileNetwork || !values.momoName || !values.momoNumber) {
      throwErrorMsg('No bussing details')
      return
    }

    if (initialValues.momoNumber !== values.momoNumber) {
      await SendMobileVerificationNumber({
        variables: {
          firstName: bacenta?.leader.firstName,
          phoneNumber: values.momoNumber,
          otp,
        },
      })
      togglePopup()
    }
  }

  return (
    <ApolloWrapper
      data={bacentaData}
      loading={bacentaLoading}
      error={bacentaError}
    >
      <Container>
        <HeadingPrimary>Bacenta Bussing Details Update</HeadingPrimary>
        <HeadingSecondary>{initialValues.name}</HeadingSecondary>
      </Container>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        validateOnMount
      >
        {(formik) => (
          <Container className="py-4">
            <Form>
              <div className="form-group">
                <Row className="row-cols-1 row-cols-md-2">
                  <Col className="mb-2">
                    <RoleView roles={permitAdminArrivals('Stream')}>
                      <Row className="form-row">
                        <Col>
                          <Input
                            name="target"
                            label="Attendance Target"
                            placeholder="Enter Target"
                          />
                          <Input
                            name="normalBussingCost"
                            label="Normal Bussing Cost"
                            placeholder="Enter Total Bussing Cost for Normal"
                          />
                          <Input
                            name="normalPersonalContribution"
                            label="Normal Personal Contribution"
                            placeholder="Enter Personal Contribution for Normal"
                          />
                          <Input
                            name="swellBussingCost"
                            label="Swell Bussing Cost"
                            placeholder="Enter Total Bussing Cost for Swell"
                          />
                          <Input
                            name="swellPersonalContribution"
                            label="Swell Personal Contribution"
                            placeholder="Enter Personal Contribution for Swell"
                          />
                        </Col>
                      </Row>
                    </RoleView>
                    <RoleView
                      roles={['leaderBacenta']}
                      verifyId={bacenta?.leader.id}
                    >
                      {isOpen && (
                        <Popup handleClose={togglePopup}>
                          <div className="my-2">
                            <p className="fw-bold">
                              Please verify your number before continuing
                            </p>
                            <p>
                              You will receive a text message with a code. Enter
                              that code in the box below
                            </p>
                          </div>
                          <Input
                            label="Enter your verification code"
                            name="verificationCode"
                          />
                          <div className="d-grid gap-2">
                            <Button
                              className={`${theme}`}
                              disabled={submitting}
                              onClick={async () => {
                                setSubmitting(true)

                                if (formik.values.verificationCode !== otp) {
                                  throwErrorMsg(
                                    'Your verification code is wrong! Try again 😡'
                                  )
                                  setSubmitting(false)
                                  return
                                }

                                try {
                                  await UpdateBusPaymentDetails({
                                    variables: {
                                      bacentaId,
                                      mobileNetwork:
                                        formik.values.mobileNetwork,
                                      momoName: formik.values.momoName.trim(),
                                      momoNumber: formik.values.momoNumber,
                                    },
                                  })

                                  alertMsg(
                                    'Your phone number has been successfully verified! 😃'
                                  )
                                  setSubmitting(false)
                                  navigate(`/bacenta/displaydetails`)
                                } catch (error) {
                                  setSubmitting(false)
                                  throwErrorMsg(
                                    'There was a problem updating your momo number 😔'
                                  )
                                }
                              }}
                            >
                              {submitting ? 'Verifying...' : 'Verify Number'}
                            </Button>
                          </div>
                        </Popup>
                      )}
                      <Row>
                        <Col>
                          <Select
                            name="mobileNetwork"
                            label="Mobile Network"
                            options={MOBILE_NETWORK_OPTIONS}
                          />
                          <Input
                            name="momoNumber"
                            label="MoMo Number"
                            placeholder="Enter a number"
                          />

                          <Input name="momoName" label="MoMo Name" />
                        </Col>
                      </Row>
                    </RoleView>
                  </Col>
                </Row>
              </div>
              <SubmitButton formik={formik} />
            </Form>
          </Container>
        )}
      </Formik>
    </ApolloWrapper>
  )
}

export default UpdateBusPayment
