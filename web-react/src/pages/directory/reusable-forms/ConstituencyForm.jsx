import { useMutation, useQuery } from '@apollo/client'
import BaseComponent from 'components/base-component/BaseComponent'
import { FieldArray, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { makeSelectOptions } from 'global-utils'
import { GET_COUNCILS } from 'queries/ListQueries'
import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import FormikControl from 'components/formik-components/FormikControl'
import PlusSign from 'components/buttons/PlusMinusSign/PlusSign'
import MinusSign from 'components/buttons/PlusMinusSign/MinusSign'
import { MAKE_CONSTITUENCY_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useNavigate } from 'react-router'
import Popup from 'components/Popup/Popup'
import RoleView from 'auth/RoleView'
import { Button, Container, Row, Col } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik-components/SubmitButton'
import { permitAdmin } from 'permission-utils'
import usePopup from 'hooks/usePopup'

const ConstituencyForm = ({
  initialValues,
  onSubmit,
  title,
  newConstituency,
}) => {
  const { clickCard, constituencyId } = useContext(ChurchContext)
  const { togglePopup, isOpen } = usePopup()
  const { theme } = useContext(MemberContext)

  const navigate = useNavigate()
  const {
    data: councilData,
    loading: councilLoading,
    error: councilError,
  } = useQuery(GET_COUNCILS)
  const [CloseDownConstituency] = useMutation(MAKE_CONSTITUENCY_INACTIVE)

  const constituencyCouncilOptions = makeSelectOptions(councilData?.councils)

  const validationSchema = Yup.object({
    name: Yup.string().required(`Constituency Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
    bacentas: newConstituency
      ? null
      : Yup.array().of(
          Yup.object().required('Please pick a bacenta from the dropdown')
        ),
  })

  return (
    <BaseComponent
      loading={councilLoading}
      error={councilError}
      data={councilData}
    >
      <Container>
        <HeadingPrimary>{title}</HeadingPrimary>
        <HeadingSecondary>
          {initialValues.name + ' Constituency'}
        </HeadingSecondary>
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
                    <RoleView roles={permitAdmin('Stream')}>
                      <Row className="form-row">
                        <Col>
                          <FormikControl
                            control="select"
                            name="council"
                            label="Select a Council"
                            options={constituencyCouncilOptions}
                            defaultOption="Select a Council"
                          />
                        </Col>
                      </Row>
                    </RoleView>

                    <FormikControl
                      control="input"
                      name="name"
                      label={`Name of Constituency`}
                      placeholder={`Name of Constituency`}
                    />

                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdmin('Council')}>
                        <Col>
                          <FormikControl
                            control="memberSearch"
                            name="leaderId"
                            label="Choose a CO"
                            placeholder="Start typing..."
                            initialValue={initialValues?.leaderName}
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Member Search Box"
                            error={formik.errors.leaderId}
                          />
                        </Col>
                      </RoleView>
                    </Row>

                    <small className="pt-2">
                      {`Select any bacentas that are being moved to this Constituency`}
                    </small>
                    <FieldArray name="bacentas">
                      {(fieldArrayProps) => {
                        const { push, remove, form } = fieldArrayProps
                        const { values } = form
                        const { bacentas } = values

                        return (
                          <>
                            {bacentas.map((bacenta, index) => (
                              <Row key={index} className="form-row">
                                <Col>
                                  <FormikControl
                                    control="bacentaSearch"
                                    name={`bacentas[${index}]`}
                                    placeholder="Bacenta Name"
                                    initialValue={bacenta?.name}
                                    setFieldValue={formik.setFieldValue}
                                    aria-describedby="Bacenta Name"
                                    error={
                                      formik.errors.bacentas &&
                                      formik.errors.bacentas[index]
                                    }
                                  />
                                </Col>
                                <Col className="col-auto d-flex">
                                  <PlusSign onClick={() => push()} />
                                  {index > 0 && (
                                    <MinusSign onClick={() => remove(index)} />
                                  )}
                                </Col>
                              </Row>
                            ))}
                          </>
                        )
                      }}
                    </FieldArray>
                  </Col>
                </Row>
              </div>

              <SubmitButton formik={formik} />
            </Form>

            {isOpen && (
              <Popup handleClose={togglePopup}>
                Are you sure you want to close down this fellowship?
                <Button
                  variant="primary"
                  type="submit"
                  className={`btn-main ${theme}`}
                  onClick={() => {
                    CloseDownConstituency({
                      variables: {
                        constituencyId,
                      },
                    })
                      .then((res) => {
                        clickCard(res.data.CloseDownConstituency)
                        togglePopup()
                        navigate(`/constituency/displayall`)
                      })
                      .catch((error) => {
                        // eslint-disable-next-line no-console
                        console.error(error)
                        alert(
                          `There was an error closing down this constituency`,
                          error
                        )
                      })
                  }}
                >
                  {`Yes, I'm sure`}
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

            {!newConstituency && (
              <Button
                variant="primary"
                size="lg"
                disabled={formik.isSubmitting}
                className={`btn-secondary ${theme} mt-3`}
                onClick={togglePopup}
              >
                {`Close Down Constituency`}
              </Button>
            )}
          </Container>
        )}
      </Formik>
    </BaseComponent>
  )
}

export default ConstituencyForm
