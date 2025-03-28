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
  MAKE_STREAM_TELLER,
  REMOVE_STREAM_TELLER,
  STREAM_BANK_TELLERS,
} from './Treasury.gql'
import './TellerSelect.css'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import ModalSubmitButton from './ModalSubmitButton'
import { alertMsg, throwToSentry } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import SearchMember from 'components/formik/SearchMember'

interface StreamWithTellers extends Stream {
  tellers: Member[]
  activeBacentaCount: number
}

type FormOptions = {
  tellerName: string
  tellerSelect: string
}

const TellerSelect = () => {
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(STREAM_BANK_TELLERS, {
    variables: { id: streamId },
  })
  const [submitting, setSubmitting] = useState(false)
  const [show, setShow] = useState(false)
  const handleOpen: FunctionReturnsVoid = () => setShow(true)
  const handleClose: FunctionReturnsVoid = () => setShow(false)

  const stream: StreamWithTellers = data?.streams[0]

  const [MakeStreamTeller] = useMutation(MAKE_STREAM_TELLER, {
    refetchQueries: [
      {
        query: STREAM_BANK_TELLERS,
        variables: { id: streamId },
      },
    ],
  })

  const [RemoveStreamTeller] = useMutation(REMOVE_STREAM_TELLER, {
    refetchQueries: [
      {
        query: STREAM_BANK_TELLERS,
        variables: { id: streamId },
      },
    ],
  })

  const initialValues: FormOptions = {
    tellerName: '',
    tellerSelect: '',
  }

  const validationSchema = Yup.object({
    tellerSelect: Yup.string().required(
      'Please select a teller from the dropdown'
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await MakeStreamTeller({
        variables: {
          streamId: streamId,
          tellerId: values.tellerSelect,
        },
      })

      handleClose()
      onSubmitProps.setSubmitting(false)
      alert('Stream Teller has been added successfully')
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
        <HeadingPrimary>{`Select ${stream?.name} Tellers`}</HeadingPrimary>
        <HeadingSecondary>
          Use the buttons below to choose tellers
        </HeadingSecondary>
        <div>{`Number of Active Bacentas: ${stream?.activeBacentaCount}`}</div>

        <Modal
          contentClassName="dark"
          show={show}
          onHide={handleClose}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Choose a Treasurer</Modal.Title>
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
                        name="tellerSelect"
                        initialValue={initialValues?.tellerName}
                        placeholder="Select a Name"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Member Search"
                        error={formik.errors.tellerSelect}
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
            Choose Treasurers
          </Button>
        </div>

        {stream?.tellers?.map((teller: Member) => (
          <div key={teller.id}>
            <MemberDisplayCard member={teller} />
            <div className="d-grid gap-2">
              <Button
                disabled={submitting}
                variant="danger"
                onClick={async () => {
                  const confirmBox = window.confirm(
                    `Do you want to delete ${teller.fullName} as a teller`
                  )

                  if (confirmBox === true) {
                    setSubmitting(true)
                    try {
                      await RemoveStreamTeller({
                        variables: {
                          streamId: streamId,
                          tellerId: teller.id,
                        },
                      })
                      setSubmitting(false)
                      alertMsg(`${teller.fullName} Deleted Successfully`)
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

        {!stream?.tellers?.length && (
          <NoDataComponent text="You have no Bank Tellers at this time" />
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default TellerSelect
