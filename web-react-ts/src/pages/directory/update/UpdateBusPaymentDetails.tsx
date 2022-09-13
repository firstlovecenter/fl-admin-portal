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
import { Form, Formik, FormikHelpers } from 'formik'
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
import Select from 'components/formik/Select'
import Input from 'components/formik/Input'

type FormOptions = {
  name: string
  target: string
  urvanCost: string
  sprinterCost: string
  mobileNetwork: string
  momoName: string
  momoNumber: string
  verificationCode: string
}

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

  const initialValues: FormOptions = {
    name: bacenta?.name,
    target: bacenta?.target ?? '',
    urvanCost: bacenta?.urvanCost ?? '',
    sprinterCost: bacenta?.sprinterCost ?? '',

    mobileNetwork: bacenta?.mobileNetwork ?? '',
    momoName: bacenta?.momoName ?? '',
    momoNumber: bacenta?.momoNumber ?? '',
    verificationCode: '',
  }

  const validationSchema = Yup.object({
    target: Yup.string().required('Bacenta Target is a required field'),

    momoNumber: Yup.string().matches(
      MOMO_NUM_REGEX,
      `Enter a valid MoMo Number without spaces. eg. (02XXXXXXXX)`
    ),
    momoName: Yup.string().when('momoNumber', {
      is: (momoNumber: string) => momoNumber && momoNumber.length > 0,
      then: Yup.string().required('Please enter the Momo Name'),
    }),
    mobileNetwork: Yup.string().when('momoNumber', {
      is: (momoNumber: string) => momoNumber && momoNumber.length > 0,
      then: Yup.string().required('Please enter the Mobile Network'),
    }),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)

    if (isAuthorised(permitAdminArrivals('Stream'))) {
      try {
        await UpdateBacentaBussingDetails({
          variables: {
            bacentaId,
            sprinterCost: parseFloat(values.sprinterCost),
            urvanCost: parseFloat(values.urvanCost),
            target: parseInt(values.target),
          },
        })
      } catch (error: any) {
        throwErrorMsg('', error)
      }

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

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          validateOnMount
        >
          {(formik) => (
            <div className="py-4">
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
                          </Col>
                          <Input
                            name="urvanCost"
                            label="Cost of Urvan Bus (One Way)"
                            placeholder="Enter Amount in GHS"
                          />
                          <Input
                            name="sprinterCost"
                            label="Cost Of Sprinter Bus (One Way)"
                            placeholder="Enter Amount in GHS"
                          />
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
                                You will receive a text message with a code.
                                Enter that code in the box below
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
            </div>
          )}
        </Formik>
      </Container>
    </ApolloWrapper>
  )
}

export default UpdateBusPayment
