import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { throwToSentry } from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_GOVERNORSHIP_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useNavigate } from 'react-router'
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
import SearchBacenta from 'components/formik/SearchBacenta'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Bacenta, Council, Hub } from 'global-types'
import {
  MOVE_BACENTA_TO_GOVERNORSHIP,
  MOVE_HUB_TO_GOVERNORSHIP,
} from '../update/UpdateMutations'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { DISPLAY_GOVERNORSHIP, DISPLAY_COUNCIL } from '../display/ReadQueries'
import BtnSubmitText from 'components/formik/BtnSubmitText'
import SearchHub from 'components/formik/SearchHub'

export interface GovernorshipFormValues extends FormikInitialValues {
  council?: Council
  bacentas?: Bacenta[]
  hubs?: Hub[]
  hub?: Hub
  bacenta?: Bacenta
}

type GovernorshipFormProps = {
  initialValues: GovernorshipFormValues
  onSubmit: (
    values: GovernorshipFormValues,
    onSubmitProps: FormikHelpers<GovernorshipFormValues>
  ) => void
  title: string
  newGovernorship: boolean
}

const GovernorshipForm = ({
  initialValues,
  onSubmit,
  title,
  newGovernorship,
}: GovernorshipFormProps) => {
  const { clickCard, governorshipId } = useContext(ChurchContext)
  const [bacentaModal, setBacentaModal] = useState(false)
  const [hubModal, setHubModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)

  const navigate = useNavigate()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownGovernorship] = useMutation(MAKE_GOVERNORSHIP_INACTIVE, {
    refetchQueries: [
      { query: DISPLAY_COUNCIL, variables: { id: initialValues.council?.id } },
    ],
  })
  const [MoveBacentaToGovernorship] = useMutation(
    MOVE_BACENTA_TO_GOVERNORSHIP,
    {
      refetchQueries: [
        { query: DISPLAY_GOVERNORSHIP, variables: { id: governorshipId } },
      ],
    }
  )
  const [MoveHubToGovernorship] = useMutation(MOVE_HUB_TO_GOVERNORSHIP, {
    refetchQueries: [
      { query: DISPLAY_GOVERNORSHIP, variables: { id: governorshipId } },
    ],
  })

  const validationSchema = Yup.object({
    name: Yup.string().required(`Governorship Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <Container>
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>
        {initialValues.name + ' Governorship'}
      </HeadingSecondary>

      <ButtonGroup className="mt-3">
        {!newGovernorship && (
          <>
            <Button onClick={() => setBacentaModal(true)}>Add Bacenta</Button>
            <Button variant="warning" onClick={() => setHubModal(true)}>
              Add Hub
            </Button>
            <Button variant="success" onClick={() => setCloseDown(true)}>
              {`Close Down Governorship`}
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
                      label={`Name of Governorship`}
                      placeholder={`Name of Governorship`}
                    />

                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdmin('Council')}>
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
                      {initialValues.bacentas?.length && (
                        <p className="fw-bold fs-5">Bacentas</p>
                      )}
                      {initialValues.bacentas?.map((bacenta, index) => {
                        if (!bacenta && !index)
                          return <NoDataComponent text="No Bacentas" />
                        return (
                          <Button variant="secondary" className="text-start">
                            {bacenta.name} {bacenta.__typename}
                          </Button>
                        )
                      })}
                    </div>

                    <div className="d-grid gap-2 mt-3">
                      {initialValues.hubs?.length && (
                        <p className="fw-bold fs-5">Hubs</p>
                      )}
                      {initialValues.hubs?.map((hub, index) => {
                        if (!hub && !index)
                          return <NoDataComponent text="No Hubs" />
                        return (
                          <Button variant="secondary" className="text-start">
                            {hub.name} {hub.__typename}
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
              show={bacentaModal}
              onHide={() => setBacentaModal(false)}
              centered
            >
              <Modal.Header closeButton>Add A Bacenta</Modal.Header>
              <Modal.Body>
                <p>Choose a bacenta to move to this governorship</p>
                <SearchBacenta
                  name={`bacenta`}
                  placeholder="Bacenta Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Bacenta Name"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="success"
                  type="submit"
                  disabled={buttonLoading || !formik.values.bacenta}
                  onClick={async () => {
                    try {
                      setButtonLoading(true)
                      const res = await MoveBacentaToGovernorship({
                        variables: {
                          bacentaId: formik.values.bacenta?.id,
                          historyRecord: `${formik.values.bacenta?.name} Bacenta has been moved to ${formik.values.name} Governorship from ${formik.values.bacenta?.governorship.name} Governorship`,
                          newGovernorshipId: governorshipId,
                          oldGovernorshipId:
                            formik.values.bacenta?.governorship.id,
                        },
                      })

                      clickCard(res.data.MoveBacentaToGovernorship)
                      setBacentaModal(false)
                    } catch (error) {
                      throwToSentry(
                        `There was an error moving this bacenta to this governorship`,
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
                  onClick={() => setBacentaModal(false)}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal show={hubModal} onHide={() => setHubModal(false)} centered>
              <Modal.Header closeButton>Add A Hub</Modal.Header>
              <Modal.Body>
                <p>Choose a hub to move to this governorship</p>
                <SearchHub
                  name={`hub`}
                  placeholder="Hub Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Hub Name"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="success"
                  type="submit"
                  disabled={buttonLoading || !formik.values.hub}
                  onClick={async () => {
                    try {
                      setButtonLoading(true)
                      const res = await MoveHubToGovernorship({
                        variables: {
                          hubId: formik.values.hub?.id,
                          historyRecord: `${formik.values.hub?.name} Hub has been moved to ${formik.values.name} Governorship from ${formik.values.hub?.governorship.name} Governorship`,
                          newGovernorshipId: governorshipId,
                          oldGovernorshipId: formik.values.hub?.governorship.id,
                        },
                      })

                      clickCard(res.data.MoveHubToGovernorship)
                      setHubModal(false)
                    } catch (error) {
                      throwToSentry(
                        `There was an error moving this hub to this governorship`,
                        error
                      )
                    } finally {
                      setButtonLoading(false)
                    }
                  }}
                >
                  <BtnSubmitText loading={buttonLoading} />
                </Button>
                <Button variant="primary" onClick={() => setHubModal(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal show={closeDown} onHide={() => setCloseDown(false)} centered>
              <Modal.Header closeButton>Close Down Governorship</Modal.Header>
              <Modal.Body>
                <p className="text-info">
                  Are you sure you want to close down this governorship?
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
                      const res = await CloseDownGovernorship({
                        variables: {
                          id: governorshipId,
                          leaderId: initialValues.leaderId,
                          adminId: initialValues?.adminId,
                        },
                      })

                      setButtonLoading(false)
                      clickCard(res.data.CloseDownGovernorship)
                      setCloseDown(false)
                      navigate(`/governorship/displayall`)
                    } catch (error) {
                      setButtonLoading(false)
                      throwToSentry(
                        `There was an error closing down this governorship`,
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

export default GovernorshipForm
