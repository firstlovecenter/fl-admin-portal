import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { FunctionReturnsVoid, Member, Council } from 'global-types'
import React, { useContext, useState } from 'react'
import { Button, Col, Container, Modal, Row, Spinner } from 'react-bootstrap'
import {
  MAKE_COUNCIL_ARRIVALSPAYER,
  REMOVE_COUNCIL_ARRIVALSPAYER,
  COUNCIL_ARRIVALSPAYERS,
} from './ArrivalsHelpersGQL'
import './ArrivalsHelpers.css'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import { alertMsg, throwToSentry } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import SearchMember from 'components/formik/SearchMember'
import ModalSubmitButton from 'pages/services/banking/anagkazo/ModalSubmitButton'

interface CouncilWithArrivalsPayers extends Council {
  arrivalsPayers: Member[]
  activeBacentaCount: number
}

type FormOptions = {
  arrivalsPayerName: string
  arrivalsPayerSelect: string
}

const ArrivalsPayerSelect = () => {
  const { councilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(COUNCIL_ARRIVALSPAYERS, {
    variables: { id: councilId },
  })
  const [submitting, setSubmitting] = useState(false)
  const [show, setShow] = useState(false)
  const handleOpen: FunctionReturnsVoid = () => setShow(true)
  const handleClose: FunctionReturnsVoid = () => setShow(false)

  const council: CouncilWithArrivalsPayers = data?.councils[0]

  const [MakeCouncilArrivalsPayer] = useMutation(MAKE_COUNCIL_ARRIVALSPAYER, {
    refetchQueries: [
      {
        query: COUNCIL_ARRIVALSPAYERS,
        variables: { id: councilId },
      },
    ],
  })

  const [RemoveCouncilArrivalsPayer] = useMutation(
    REMOVE_COUNCIL_ARRIVALSPAYER,
    {
      refetchQueries: [
        {
          query: COUNCIL_ARRIVALSPAYERS,
          variables: { id: councilId },
        },
      ],
    }
  )

  const initialValues: FormOptions = {
    arrivalsPayerName: '',
    arrivalsPayerSelect: '',
  }

  const validationSchema = Yup.object({
    arrivalsPayerSelect: Yup.string().required(
      'Please select a arrivals payment governorship member from the dropdown'
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await MakeCouncilArrivalsPayer({
        variables: {
          councilId,
          arrivalsPayerId: values.arrivalsPayerSelect,
        },
      })

      handleClose()
      onSubmitProps.setSubmitting(false)
      alert('Arrivals Payment Governorship Member has been added successfully!')
    } catch (e: any) {
      onSubmitProps.setSubmitting(false)
      throwToSentry(e)
    }
    onSubmitProps.setSubmitting(false)
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>{`Select ${council?.name} Council Arrivals Payment Governorship Members`}</HeadingPrimary>
        <HeadingSecondary>
          Use the buttons below to choose Arrivals Payment Governorship Members
        </HeadingSecondary>
        <div>{`Number of Active Bacentas: ${council?.activeBacentaCount}`}</div>

        <Modal
          contentClassName="dark"
          show={show}
          onHide={handleClose}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Choose an Arrivals Payment Governorship Member
            </Modal.Title>
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
                        name="arrivalsPayerSelect"
                        initialValue={initialValues?.arrivalsPayerName}
                        placeholder="Select a Name"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Member Search"
                        error={formik.errors.arrivalsPayerSelect}
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
          <Button variant="success" onClick={handleOpen}>
            Choose Arrivals Payment Governorship Members
          </Button>
        </div>

        {council?.arrivalsPayers?.map((arrivalsPayer: Member) => (
          <div key={arrivalsPayer.id}>
            <MemberDisplayCard member={arrivalsPayer} />
            <div className="d-grid gap-2">
              <Button
                disabled={submitting}
                variant="danger"
                onClick={async () => {
                  const confirmBox = window.confirm(
                    `Do you want to delete ${arrivalsPayer.fullName} as a arrivalsPayer`
                  )

                  if (confirmBox === true) {
                    setSubmitting(true)
                    try {
                      await RemoveCouncilArrivalsPayer({
                        variables: {
                          councilId,
                          arrivalsPayerId: arrivalsPayer.id,
                        },
                      })
                      setSubmitting(false)
                      alertMsg(`${arrivalsPayer.fullName} Deleted Successfully`)
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

        {!council?.arrivalsPayers?.length && (
          <NoDataComponent text="You have no Arrivals Payment Governorship Members at this time" />
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default ArrivalsPayerSelect
