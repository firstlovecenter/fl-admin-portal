import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { FunctionReturnsVoid, Member, Stream } from 'global-types'
import React, { useContext, useState } from 'react'
import { Button, Col, Container, Modal, Row, Spinner } from 'react-bootstrap'
import {
  STREAM_SHEEP_SEEKERS,
  MAKE_STREAM_SHEEP_SEEKER,
  REMOVE_STREAM_SHEEP_SEEKER,
} from './SheepSeeking.gql'
import '../../../services/banking/anagkazo/TellerSelect.css'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import { alertMsg, throwToSentry } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import SearchMember from 'components/formik/SearchMember'
import ModalSubmitButton from './ModalSubmitButton'

interface StreamWithSheepSeeker extends Stream {
  sheepseekers: Member[]
  activeBacentaCount: number
}

type FormOptions = {
  sheepseekerName: string
  sheepseekerSelect: string
}

const SheepSeekerSelect = () => {
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(STREAM_SHEEP_SEEKERS, {
    variables: { id: streamId },
  })
  const [submitting, setSubmitting] = useState(false)
  const [show, setShow] = useState(false)
  const handleOpen: FunctionReturnsVoid = () => setShow(true)
  const handleClose: FunctionReturnsVoid = () => setShow(false)

  const stream: StreamWithSheepSeeker = data?.streams[0]

  const [MakeSheepSeeker] = useMutation(MAKE_STREAM_SHEEP_SEEKER, {
    refetchQueries: [
      {
        query: STREAM_SHEEP_SEEKERS,
        variables: { id: streamId },
      },
    ],
  })

  const [RemoveStreamSheepSeeker] = useMutation(REMOVE_STREAM_SHEEP_SEEKER, {
    refetchQueries: [
      {
        query: STREAM_SHEEP_SEEKERS,
        variables: { id: streamId },
      },
    ],
  })

  const initialValues: FormOptions = {
    sheepseekerName: '',
    sheepseekerSelect: '',
  }

  const validationSchema = Yup.object({
    sheepseekerSelect: Yup.string().required(
      'Please select a Sheep seeker from the dropdown'
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await MakeSheepSeeker({
        variables: {
          streamId: streamId,
          sheepseekerId: values.sheepseekerSelect,
        },
      })

      handleClose()
      onSubmitProps.setSubmitting(false)
      alert('Sheep Seeker has been added successfully')
    } catch (e: any) {
      onSubmitProps.setSubmitting(false)
      throwToSentry(e)
    }
    onSubmitProps.setSubmitting(false)
    return
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>{`Select ${stream?.name} Sheep Seekers`}</HeadingPrimary>
        <HeadingSecondary>
          Use the buttons below to choose a sheep seeker
        </HeadingSecondary>
        <div>{`Number of Active Fellowships: ${stream?.activeBacentaCount}`}</div>

        <Modal
          contentClassName="dark"
          show={show}
          onHide={handleClose}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Choose a Sheep Seeker</Modal.Title>
          </Modal.Header>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {(formik) => (
              <Form>
                <Modal.Body>
                  <Row className="form-row">
                    <Col>
                      <SearchMember
                        name="sheepseekerSelect"
                        initialValue={initialValues?.sheepseekerName}
                        placeholder="Select a Name"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Member Search"
                        error={formik.errors.sheepseekerSelect}
                      />
                    </Col>
                  </Row>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleClose}>
                    Close
                  </Button>
                  <ModalSubmitButton formik={formik} onClick={handleClose} />
                </Modal.Footer>
              </Form>
            )}
          </Formik>
        </Modal>

        <div className="d-grid gap-2 mt-5">
          <Button variant="success" size="lg" onClick={handleOpen}>
            Choose Sheep Seeker
          </Button>
        </div>

        {stream?.sheepseekers?.map((sheepseeker: Member) => (
          <div key={sheepseeker.id}>
            <MemberDisplayCard member={sheepseeker} />
            <div className="d-grid gap-2">
              <Button
                disabled={submitting}
                variant="danger"
                onClick={async () => {
                  const confirmBox = window.confirm(
                    `Do you want to delete ${sheepseeker.fullName} as a Sheep Seeker`
                  )

                  if (confirmBox === true) {
                    setSubmitting(true)
                    try {
                      await RemoveStreamSheepSeeker({
                        variables: {
                          streamId: streamId,
                          sheepseekerId: sheepseeker.id,
                        },
                      })
                      setSubmitting(false)
                      alertMsg(`${sheepseeker.fullName} Deleted Successfully`)
                    } catch (error: any) {
                      throwToSentry('', error)
                    }
                  }
                }}
              >
                {submitting ? (
                  <>
                    <Spinner animation="grow" size="sm" />
                    <span> Submitting</span>
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        ))}

        {!stream?.sheepseekers?.length && (
          <NoDataComponent text="You have no Sheep Seekers at this time" />
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default SheepSeekerSelect
