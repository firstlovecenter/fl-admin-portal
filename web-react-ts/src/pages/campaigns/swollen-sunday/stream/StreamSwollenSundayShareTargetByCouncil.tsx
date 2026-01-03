import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { Form, Formik, FormikHelpers } from 'formik'
import { Church } from 'global-types'
import { throwToSentry } from 'global-utils'
import React, { useContext, useEffect, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { COUNCIL_LIST, SHARE_TARGET_BY_COUNCIL } from '../SwollenSundayQueries'
import * as Yup from 'yup'
import { useNavigate } from 'react-router'

type FormOptions = {
  swellDate: string
  data: string
}

type CouncilWithTarget = {
  councilId: string
  name: string
  target: string | number
}

const StreamSwollenSundayShareTargetByCouncil = () => {
  const { currentUser } = useContext(MemberContext)
  const { streamId } = useContext(ChurchContext)
  const navigate = useNavigate()

  const [ShareTargetByCouncil] = useMutation(SHARE_TARGET_BY_COUNCIL)

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  const [councils, setCouncils] = useState([])

  const initialValues: FormOptions = {
    swellDate: new Date().toISOString().slice(0, 10),
    data: '',
  }

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    ShareTargetByCouncil({
      variables: {
        swellDate: values?.swellDate,
        data: JSON.stringify(councils),
      },
    })
      .then((res) => {
        onSubmitProps.setSubmitting(false)
        onSubmitProps.resetForm()
        alert('Targets Uploaded successfully')
        navigate(`/campaigns/${churchType.toLowerCase()}/swollen-sunday/target`)
      })
      .catch((error) => {
        onSubmitProps.setSubmitting(false)
        alert(error)
        throwToSentry('', error)
        navigate(`/campaigns/${churchType.toLowerCase()}/swollen-sunday/target`)
      })
  }

  const { data, loading, error } = useQuery(COUNCIL_LIST, {
    variables: {
      streamId: streamId,
    },
  })

  useEffect(() => {
    const newCouncilsDataWithTarget = data?.streams[0]?.councils?.map(
      (church: Church) => ({
        councilId: church.id,
        name: church.name,
        target: '',
      })
    )
    setCouncils(newCouncilsDataWithTarget)
  }, [data])

  const setCouncilTarget = (value: string, council: CouncilWithTarget) => {
    const newCouncilState: any = councils.map((church: CouncilWithTarget) => {
      if (church.councilId === council.councilId) {
        return {
          ...church,
          target: value,
        }
      }
      return church
    })
    setCouncils(newCouncilState)
  }

  const validationSchema = Yup.object({
    swellDate: Yup.date()
      .min(new Date(), "You can't select a Swell Date before today")
      .required('Swell Date is a required field'),
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        validateOnMount
      >
        {(formik) => (
          <Container>
            <div className="d-flex align-items-center justify-content-center ">
              <div className="text-center">
                <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
                <HeadingSecondary>Swollen Sunday Campaign</HeadingSecondary>
              </div>
            </div>
            <Form className="form-group">
              <Container className="mt-5">
                <small>Swell Date</small>
                <Input
                  name="swellDate"
                  type="date"
                  placeholder="dd/mm/yyyy"
                  aria-describedby="swellDate"
                />
                <hr />

                <div>
                  {' '}
                  {councils?.map((council: CouncilWithTarget) => (
                    <Row className="mb-2" key={council.councilId}>
                      <Col className="d-flex align-items-center">
                        {council.name} Council
                      </Col>
                      <Col>
                        <input
                          type="number"
                          value={council.target}
                          className="form-control"
                          onChange={(e) =>
                            setCouncilTarget(e.target.value, council)
                          }
                        />
                      </Col>
                    </Row>
                  ))}
                </div>
                <div className="d-flex justify-content-center mb-3">
                  <SubmitButton formik={formik} />
                </div>
              </Container>
            </Form>
          </Container>
        )}
      </Formik>
    </ApolloWrapper>
  )
}

export default StreamSwollenSundayShareTargetByCouncil
