import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import {
  STREAM_ACCOUNT_OPTIONS,
  STREAM_SERVICE_DAY_OPTIONS,
  VACATION_OPTIONS,
  throwToSentry,
} from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_STREAM_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useRouter } from 'next/navigation'
import RoleView from 'auth/RoleView'
import {
  Button,
  Container,
  Row,
  Col,
  ButtonGroup,
  Modal,
} from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik/SubmitButton'
import { permitAdmin } from 'permission-utils'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import SearchCouncil from 'components/formik/SearchCouncil'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Council, Campus, VacationStatusOptions, Ministry } from 'global-types'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { DISPLAY_STREAM, DISPLAY_CAMPUS } from '../display/ReadQueries'
import Select from 'components/formik/Select'
import {
  MOVE_COUNCIL_TO_STREAM,
  MOVE_MINISTRY_TO_STREAM,
} from '../update/UpdateMutations'
import BtnSubmitText from 'components/formik/BtnSubmitText'
import SearchMinistry from 'components/formik/SearchMinistry'

export interface StreamFormValues extends FormikInitialValues {
  campus?: Campus
  bankAccount:
    | 'manual'
    | 'aes_account'
    | 'fle_account'
    | 'acc_floc'
    | 'bjosh_special'
    | 'oa_kumasi'
    | 'oa_ghnorth'
    | 'oa_ghsouth'
    | 'oa_gheast'
    | 'oa_ghwest'
    | 'oa_tarkwa'
    | 'oa_sunyani'
  meetingDay: 'Friday' | 'Saturday' | 'Sunday'
  vacationStatus: VacationStatusOptions
  councils?: Council[]
  council?: Council
  ministry?: Ministry
  ministries?: Ministry[]
}

type StreamFormProps = {
  initialValues: StreamFormValues
  onSubmit: (
    values: StreamFormValues,
    onSubmitProps: FormikHelpers<StreamFormValues>
  ) => void
  title: string
  newStream: boolean
}

const StreamForm = ({
  initialValues,
  onSubmit,
  title,
  newStream,
}: StreamFormProps) => {
  const { clickCard, streamId } = useContext(ChurchContext)
  const [councilModal, setCouncilModal] = useState(false)
  const [ministryModal, setMinistryModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)

  const router = useRouter()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownStream] = useMutation(MAKE_STREAM_INACTIVE, {
    refetchQueries: [
      { query: DISPLAY_CAMPUS, variables: { id: initialValues?.campus?.id } },
    ],
  })
  const [MoveCouncilToStream] = useMutation(MOVE_COUNCIL_TO_STREAM, {
    refetchQueries: [{ query: DISPLAY_STREAM, variables: { id: streamId } }],
  })
  const [MoveMinistryToStream] = useMutation(MOVE_MINISTRY_TO_STREAM, {
    refetchQueries: [{ query: DISPLAY_STREAM, variables: { id: streamId } }],
  })

  const validationSchema = Yup.object({
    name: Yup.string().required(`Stream Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
    vacationStatus: Yup.string().required(
      'Vacation Status is a required field'
    ),
    meetingDay: Yup.string().required('Meeting Day is a required field'),
  })

  return (
    <Container>
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>{initialValues.name + ' Stream'}</HeadingSecondary>
      <ButtonGroup className="mt-3">
        {!newStream && (
          <>
            <Button onClick={() => setCouncilModal(true)}>Add Council</Button>
            <Button variant="warning" onClick={() => setMinistryModal(true)}>
              Add Ministry
            </Button>
            <Button variant="success" onClick={() => setCloseDown(true)}>
              {`Close Down Stream`}
            </Button>
          </>
        )}
      </ButtonGroup>

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
                    <Input
                      name="name"
                      label={`Name of Stream`}
                      placeholder={`Name of Stream`}
                    />

                    <Select
                      label="Meeting Day"
                      name="meetingDay"
                      options={STREAM_SERVICE_DAY_OPTIONS}
                      defaultOption="Pick a Service Day"
                    />
                    <Select
                      label="Vacation Status"
                      name="vacationStatus"
                      options={VACATION_OPTIONS}
                      defaultOption="Select Vacation Status"
                    />
                    <Select
                      label="Stream Account"
                      name="bankAccount"
                      options={STREAM_ACCOUNT_OPTIONS}
                    />

                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdmin('Campus')}>
                        <Col>
                          <SearchMember
                            name="leaderId"
                            label="Choose a Leader"
                            placeholder="Start typing..."
                            initialValue={initialValues?.leaderName}
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Member Search Box"
                            error={formik.errors.leaderId}
                          />
                        </Col>
                      </RoleView>
                    </Row>
                    <div className="d-grid gap-2">
                      {initialValues.councils?.length && (
                        <p className="fw-bold fs-5">Councils</p>
                      )}
                      {initialValues.councils?.map((council, index) => {
                        if (!council && !index)
                          return <NoDataComponent text="No Councils" />
                        return (
                          <Button variant="secondary" className="text-start">
                            {council.name} Council
                          </Button>
                        )
                      })}
                    </div>

                    <div className="d-grid gap-2 mt-3">
                      {initialValues.ministries?.length && (
                        <p className="fw-bold fs-5">Ministries</p>
                      )}

                      {initialValues.ministries?.map((ministry, index) => {
                        if (!ministry && !index)
                          return <NoDataComponent text="No Ministries" />
                        return (
                          <Button variant="secondary" className="text-start">
                            {ministry.name} Ministry
                          </Button>
                        )
                      })}
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="text-center mt-5">
                <SubmitButton formik={formik} />
              </div>
            </Form>

            <Modal
              show={councilModal}
              onHide={() => setCouncilModal(false)}
              centered
            >
              <Modal.Header closeButton>Add A Council</Modal.Header>
              <Modal.Body>
                <p>Choose a council to move to this stream</p>
                <SearchCouncil
                  name={`council`}
                  placeholder="Council Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Council Name"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="success"
                  type="submit"
                  disabled={buttonLoading || !formik.values.council}
                  onClick={async () => {
                    try {
                      setButtonLoading(true)
                      const res = await MoveCouncilToStream({
                        variables: {
                          councilId: formik.values.council?.id,
                          historyRecord: `${formik.values.council?.name} Council has been moved to ${formik.values.name} Stream from ${formik.values.council?.stream.name} Stream`,
                          newStreamId: streamId,
                          oldStreamId: formik.values.council?.stream.id,
                        },
                      })

                      clickCard(res.data.MoveCouncilToStream)
                      setCouncilModal(false)
                    } catch (error) {
                      throwToSentry(
                        `There was an error moving this council to this stream`,
                        error
                      )
                    } finally {
                      setButtonLoading(false)
                    }
                  }}
                >
                  <BtnSubmitText loading={buttonLoading} />
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setCouncilModal(false)}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal show={ministryModal} onHide={() => setMinistryModal(false)}>
              <Modal.Header closeButton>Add A Ministry</Modal.Header>
              <Modal.Body>
                <p>Choose a ministry to move to this stream</p>
                <SearchMinistry
                  name={`ministry`}
                  placeholder="Ministry Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Ministry Name"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="success"
                  type="submit"
                  disabled={buttonLoading || !formik.values.ministry}
                  onClick={async () => {
                    try {
                      setButtonLoading(true)
                      const res = await MoveMinistryToStream({
                        variables: {
                          ministryId: formik.values.ministry?.id,
                          historyRecord: `${formik.values.ministry?.name} Ministry has been moved to ${formik.values.name} Stream from ${formik.values.ministry?.stream.name} Stream`,
                          newStreamId: streamId,
                          oldStreamId: formik.values.ministry?.stream.id,
                        },
                      })

                      clickCard(res.data.MoveMinistryToStream)
                      setMinistryModal(false)
                    } catch (error) {
                      throwToSentry(
                        `There was an error moving this ministry to this stream`,
                        error
                      )
                    } finally {
                      setButtonLoading(false)
                    }
                  }}
                >
                  <BtnSubmitText loading={buttonLoading} />
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setMinistryModal(false)}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal show={closeDown} onHide={() => setCloseDown(false)} centered>
              <Modal.Header closeButton>Close Down Stream</Modal.Header>
              <Modal.Body>
                <p className="text-info">
                  Are you sure you want to close down this stream?
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="success"
                  type="submit"
                  disabled={buttonLoading}
                  onClick={async () => {
                    try {
                      setButtonLoading(true)
                      const res = await CloseDownStream({
                        variables: {
                          id: streamId,
                          leaderId: initialValues.leaderId,
                          adminId: initialValues?.adminId,
                        },
                      })

                      setButtonLoading(false)
                      clickCard(res.data.CloseDownStream)
                      setCloseDown(false)
                      router.push(`/council/displayall`)
                    } catch (error) {
                      setButtonLoading(false)
                      throwToSentry(
                        `There was an error closing down this stream`,
                        error
                      )
                    }
                  }}
                >
                  <BtnSubmitText loading={buttonLoading} />
                </Button>
                <Button variant="primary" onClick={() => setCloseDown(false)}>
                  No, take me back
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        )}
      </Formik>
    </Container>
  )
}

export default StreamForm
