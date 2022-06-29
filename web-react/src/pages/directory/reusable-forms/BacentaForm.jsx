import { useMutation, useQuery } from '@apollo/client'
import BaseComponent from 'components/base-component/BaseComponent'
import { FieldArray, Form, Formik } from 'formik'
import * as Yup from 'yup'
import {
  BUSSING_STATUS_OPTIONS,
  makeSelectOptions,
  throwErrorMsg,
  VACATION_OPTIONS,
} from 'global-utils'
import { permitAdmin, permitAdminArrivals } from 'permission-utils'
import { GET_COUNCIL_CONSTITUENCIES } from 'queries/ListQueries'
import React, { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import FormikControl from 'components/formik-components/FormikControl'
import PlusSign from 'components/buttons/PlusMinusSign/PlusSign'
import MinusSign from 'components/buttons/PlusMinusSign/MinusSign'
import { useNavigate } from 'react-router'
import { MAKE_BACENTA_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import Popup from 'components/Popup/Popup'
import RoleView from 'auth/RoleView'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { MemberContext } from 'contexts/MemberContext'
import SubmitButton from 'components/formik-components/SubmitButton'
import { DISPLAY_CONSTITUENCY } from 'pages/directory/display/ReadQueries'
import usePopup from 'hooks/usePopup'

const BacentaForm = ({ initialValues, onSubmit, title, newBacenta }) => {
  const { clickCard, bacentaId, councilId } = useContext(ChurchContext)
  const { togglePopup, isOpen } = usePopup()
  const { theme } = useContext(MemberContext)
  const navigate = useNavigate()

  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownBacenta] = useMutation(MAKE_BACENTA_INACTIVE, {
    refetchQueries: [
      {
        query: DISPLAY_CONSTITUENCY,
        variables: { id: initialValues.constituency },
      },
    ],
  })
  const { data, loading, error } = useQuery(GET_COUNCIL_CONSTITUENCIES, {
    variables: { id: councilId },
  })

  const constituencyOptions = makeSelectOptions(
    data?.councils[0]?.constituencies
  )

  const validationSchema = Yup.object({
    name: Yup.string().required('Bacenta Name is a required field'),
    leaderId: Yup.string().required('Please choose a leader from the dropdown'),
    fellowships: newBacenta
      ? null
      : Yup.array().of(
          Yup.object().required('Please pick a fellowship from the dropdown')
        ),
    graduationStatus: Yup.string().required(
      'Graduation Status is a required field'
    ),
    vacationStatus: Yup.string().required(
      'Vacation Status is a required field'
    ),
  })

  return (
    <BaseComponent loading={loading} error={error} data={data}>
      <Container>
        <HeadingPrimary>{title}</HeadingPrimary>
        <HeadingSecondary>{initialValues.name}</HeadingSecondary>
        <RoleView roles={permitAdminArrivals('Stream')}>
          <Button onClick={() => navigate('/bacenta/editbussing')}>
            Edit Bussing Details
          </Button>
        </RoleView>
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
                  {/* <!-- Basic Info Div --> */}
                  <Col className="mb-2">
                    <Row className="form-row">
                      <Col>
                        <RoleView roles={permitAdmin('Council')}>
                          <FormikControl
                            control="select"
                            label={`Select a Constituency`}
                            name="constituency"
                            options={constituencyOptions}
                            defaultOption={`Select a Constituency`}
                          />
                        </RoleView>
                        <FormikControl
                          control="input"
                          name="name"
                          label="Name of Bacenta"
                          placeholder="Enter Name Here"
                        />
                        <FormikControl
                          control="select"
                          name="graduationStatus"
                          options={BUSSING_STATUS_OPTIONS}
                          defaultOption="Choose Graduation Status"
                          label="Status"
                        />
                        <FormikControl
                          control="select"
                          name="vacationStatus"
                          options={VACATION_OPTIONS}
                          defaultOption="Choose Vacation Status"
                          label="Status"
                        />
                      </Col>
                    </Row>

                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdmin('Constituency')}>
                        <Col>
                          <FormikControl
                            control="memberSearch"
                            name="leaderId"
                            initialValue={initialValues?.leaderName}
                            placeholder="Start typing"
                            label="Select a Leader"
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Member Search Box"
                            error={formik.errors.leaderId}
                          />
                        </Col>
                      </RoleView>
                    </Row>

                    {!newBacenta && (
                      <>
                        <small>
                          List any Fellowships that are being moved to this
                          Bacenta
                        </small>
                        <FieldArray name="fellowships">
                          {(fieldArrayProps) => {
                            const { push, remove, form } = fieldArrayProps
                            const { values } = form
                            const { fellowships } = values

                            return (
                              <>
                                {fellowships.map((fellowship, index) => (
                                  <Row key={index} className="form-row">
                                    <Col>
                                      <FormikControl
                                        control="fellowshipSearch"
                                        name={`fellowships[${index}]`}
                                        initialValue={fellowship?.name}
                                        placeholder="Enter Fellowship Name"
                                        setFieldValue={formik.setFieldValue}
                                        aria-describedby="Fellowship Name"
                                        error={
                                          formik.errors.fellowships &&
                                          formik.errors.fellowships[index]
                                        }
                                      />
                                    </Col>
                                    <Col className="col-auto d-flex">
                                      <PlusSign onClick={() => push()} />
                                      {(index > 0 ||
                                        fellowships?.length !== 1) && (
                                        <MinusSign
                                          onClick={() => remove(index)}
                                        />
                                      )}
                                    </Col>
                                  </Row>
                                ))}
                              </>
                            )
                          }}
                        </FieldArray>
                      </>
                    )}
                  </Col>
                </Row>
              </div>

              <SubmitButton formik={formik} />
            </Form>
            {isOpen && (
              <Popup handleClose={togglePopup}>
                Are you sure you want to close down this bacenta?
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className={`btn-main ${theme}`}
                  onClick={() => {
                    setButtonLoading(true)
                    CloseDownBacenta({
                      variables: {
                        id: bacentaId,
                        leaderId: initialValues.leaderId,
                      },
                    })
                      .then((res) => {
                        clickCard(res.data.CloseDownBacenta)
                        setButtonLoading(false)
                        togglePopup()
                        navigate(`/constituency/displaydetails`)
                      })
                      .catch((error) => {
                        setButtonLoading(false)
                        throwErrorMsg(
                          'There was an error closing down this bacenta',
                          error
                        )
                      })
                  }}
                >
                  {buttonLoading ? `Submitting...` : `Yes, I'm sure`}
                </Button>
                <Button
                  variant="primary"
                  className={`btn-secondary mt-2 ${theme}`}
                  onClick={togglePopup}
                >
                  No, take me back
                </Button>
              </Popup>
            )}
            {!newBacenta && (
              <Button
                variant="primary"
                size="lg"
                disabled={formik.isSubmitting}
                className={`btn-secondary ${theme} mt-3`}
                onClick={togglePopup}
              >
                Close Down Bacenta
              </Button>
            )}
          </Container>
        )}
      </Formik>
    </BaseComponent>
  )
}

export default BacentaForm
