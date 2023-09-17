import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { throwToSentry } from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_COUNCIL_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
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
import SearchConstituency from 'components/formik/SearchConstituency'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Constituency } from 'global-types'
import { MOVE_CONSTITUENCY_TO_COUNCIL } from '../update/UpdateMutations'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { DISPLAY_COUNCIL, DISPLAY_STREAM } from '../display/ReadQueries'
import { Stream } from '@jaedag/admin-portal-types'

export interface CouncilFormValues extends FormikInitialValues {
  stream?: Stream
  constituencies?: Constituency[]
  constituency?: Constituency
}

type CouncilFormProps = {
  initialValues: CouncilFormValues
  onSubmit: (
    values: CouncilFormValues,
    onSubmitProps: FormikHelpers<CouncilFormValues>
  ) => void
  title: string
  newCouncil: boolean
}

const CouncilForm = ({
  initialValues,
  onSubmit,
  title,
  newCouncil,
}: CouncilFormProps) => {
  const { clickCard, councilId } = useContext(ChurchContext)
  const [constituencyModal, setConstituencyModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)

  const navigate = useNavigate()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownCouncil] = useMutation(MAKE_COUNCIL_INACTIVE, {
    refetchQueries: [
      { query: DISPLAY_STREAM, variables: { id: initialValues.stream } },
    ],
  })
  const [MoveConstituencyToCouncil] = useMutation(
    MOVE_CONSTITUENCY_TO_COUNCIL,
    {
      refetchQueries: [
        { query: DISPLAY_COUNCIL, variables: { id: councilId } },
      ],
    }
  )

  const validationSchema = Yup.object({
    name: Yup.string().required(`Council Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <Container>
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>{initialValues.name + ' Council'}</HeadingSecondary>
      <ButtonGroup className="mt-3">
        {!newCouncil && (
          <>
            <Button onClick={() => setConstituencyModal(true)}>
              Add Constituency
            </Button>
            <Button variant="success" onClick={() => setCloseDown(true)}>
              {`Close Down Council`}
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
                      label={`Name of Council`}
                      placeholder={`Name of Council`}
                    />

                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdmin('Stream')}>
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
                      <p className="fw-bold fs-5">Constituencies</p>
                      {initialValues.constituencies?.map(
                        (constituency, index) => {
                          if (!constituency && !index)
                            return <NoDataComponent text="No Constituencies" />
                          return (
                            <Button variant="secondary" className="text-start">
                              {constituency.name} Constituency
                            </Button>
                          )
                        }
                      )}
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="text-center mt-5">
                <SubmitButton formik={formik} />
              </div>
            </Form>

            <Modal
              show={constituencyModal}
              onHide={() => setConstituencyModal(false)}
              centered
            >
              <Modal.Header closeButton>Add A Constituency</Modal.Header>
              <Modal.Body>
                <p>Choose a constituency to move to this council</p>
                <SearchConstituency
                  name={`constituency`}
                  placeholder="Constituency Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Constituency Name"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="success"
                  type="submit"
                  disabled={buttonLoading || !formik.values.constituency}
                  onClick={async () => {
                    try {
                      setButtonLoading(true)
                      const res = await MoveConstituencyToCouncil({
                        variables: {
                          constituencyId: formik.values.constituency?.id,
                          historyRecord: `${formik.values.constituency?.name} Constituency has been moved to ${formik.values.name} Council from ${formik.values.constituency?.council.name} Council`,
                          newCouncilId: councilId,
                          oldCouncilId: formik.values.constituency?.council.id,
                        },
                      })

                      clickCard(res.data.MoveConstituencyToCouncil)
                      setConstituencyModal(false)
                    } catch (error) {
                      throwToSentry(
                        `There was an error moving this constituency to this council`,
                        error
                      )
                    } finally {
                      setButtonLoading(false)
                    }
                  }}
                >
                  {buttonLoading ? `Submitting...` : `Yes, I'm sure`}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setConstituencyModal(false)}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal show={closeDown} onHide={() => setCloseDown(false)} centered>
              <Modal.Header closeButton>Close Down Council</Modal.Header>
              <Modal.Body>
                <p className="text-info">
                  Are you sure you want to close down this council?
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
                      const res = await CloseDownCouncil({
                        variables: {
                          id: councilId,
                          leaderId: initialValues.leaderId,
                        },
                      })

                      setButtonLoading(false)
                      clickCard(res.data.CloseDownCouncil)
                      setCloseDown(false)
                      navigate(`/constituency/displayall`)
                    } catch (error) {
                      setButtonLoading(false)
                      throwToSentry(
                        `There was an error closing down this council`,
                        error
                      )
                    }
                  }}
                >
                  {buttonLoading ? `Submitting...` : `Yes, I'm sure`}
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

export default CouncilForm
