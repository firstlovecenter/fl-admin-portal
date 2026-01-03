import React, { useContext } from 'react'
import { Formik, Form, FormikHelpers } from 'formik'
import { Col, Container, Row } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useMutation } from '@apollo/client'
import { SET_EQUIPMENT_DEADLINE } from '../../CampaignQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import { throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import HeadingSecondary from 'components/HeadingSecondary'

type FormOptions = {
  startDate: string
  endDate: string
}

const CampusEquipmentDeadline = () => {
  const { campusId } = useContext(ChurchContext)

  const [SetEquipmentDealine] = useMutation(SET_EQUIPMENT_DEADLINE)
  const navigate = useNavigate()

  const initialValues: FormOptions = {
    startDate: '',
    endDate: '',
  }

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    SetEquipmentDealine({
      variables: {
        startDate: values.startDate,
        endDate: values.endDate,
        campusId: campusId,
      },
    })
      .then(() => {
        onSubmitProps.setSubmitting(false)
        onSubmitProps.resetForm()
        navigate('/campaigns/campus')
        alert('The equipment deadline has been set')
      })
      .catch((error) => {
        throwToSentry(error)
      })
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validateOnMount={true}
    >
      {(formik) => (
        <Container>
          <div className="text-center">
            <HeadingPrimary>Equipment Campaign Form</HeadingPrimary>
            <HeadingSecondary>Deadline Dates</HeadingSecondary>
          </div>
          <Form>
            <Row className="row-cols-1 row-cols-md-2 mt-4">
              <Col className="mb-2">
                <small className="form-text">Start Date* </small>
                <Input
                  className="form-control"
                  name="startDate"
                  type="date"
                  placeholder="dd/mm/yyyy"
                />
                <small className="form-text">End Date* </small>
                <Input
                  className="form-control"
                  name="endDate"
                  type="date"
                  placeholder="dd/mm/yyyy"
                />
                <div className="d-flex justify-content-center pt-4">
                  <SubmitButton formik={formik} />
                </div>
              </Col>
            </Row>
          </Form>
        </Container>
      )}
    </Formik>
  )
}

export default CampusEquipmentDeadline
