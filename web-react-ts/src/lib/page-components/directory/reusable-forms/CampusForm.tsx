import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { CURRENCY_OPTIONS, YES_NO_OPTIONS, throwToSentry } from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_CAMPUS_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
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
import SearchStream from 'components/formik/SearchStream'
import { FormikInitialValues } from 'components/formik/formik-types'
import { CreativeArts, Oversight, Stream } from 'global-types'
import {
  MOVE_CREATIVEARTS_TO_CAMPUS,
  MOVE_STREAM_TO_CAMPUS,
} from '../update/UpdateMutations'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { DISPLAY_CAMPUS, DISPLAY_OVERSIGHT } from '../display/ReadQueries'
import Select from 'components/formik/Select'
import BtnSubmitText from 'components/formik/BtnSubmitText'
import SearchCreativeArts from 'components/formik/SearchCreativeArts'

export interface CampusFormValues extends FormikInitialValues {
  oversight?: Oversight
  streams?: Stream[]
  stream?: Stream
  creativeArt?: CreativeArts
  creativeArts?: CreativeArts[]
  incomeTracking: 'Yes' | 'No'
  currency: 'GHS' | 'USD' | 'GBP' | 'EUR'
  conversionRateToDollar: number
}

type CampusFormProps = {
  initialValues: CampusFormValues
  onSubmit: (
    values: CampusFormValues,
    onSubmitProps: FormikHelpers<CampusFormValues>
  ) => void
  title: string
  newCampus: boolean
}

const CampusForm = ({
  initialValues,
  onSubmit,
  title,
  newCampus,
}: CampusFormProps) => {
  const { clickCard, campusId } = useContext(ChurchContext)
  const [streamModal, setStreamModal] = useState(false)
  const [creativeArtModal, setCreativeArtModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)

  const router = useRouter()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownCampus] = useMutation(MAKE_CAMPUS_INACTIVE, {
    refetchQueries: [
      {
        query: DISPLAY_OVERSIGHT,
        variables: { id: initialValues?.oversight?.id },
      },
    ],
  })
  const [MoveStreamToCampus] = useMutation(MOVE_STREAM_TO_CAMPUS, {
    refetchQueries: [{ query: DISPLAY_CAMPUS, variables: { id: campusId } }],
  })
  const [MoveCreativeArtsToCampus] = useMutation(MOVE_CREATIVEARTS_TO_CAMPUS, {
    refetchQueries: [{ query: DISPLAY_CAMPUS, variables: { id: campusId } }],
  })

  const validationSchema = Yup.object({
    name: Yup.string().required(`Campus Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <Container>
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>{initialValues.name + ' Campus'}</HeadingSecondary>
      <ButtonGroup className="mt-3">
        {!newCampus && (
          <>
            <Button onClick={() => setStreamModal(true)}>Add Stream</Button>
            <Button variant="warning" onClick={() => setCreativeArtModal(true)}>
              Add Creative Arts
            </Button>
            <Button variant="success" onClick={() => setCloseDown(true)}>
              Close Down Campus
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
                      label="Name of Campus"
                      placeholder="Name of Campus"
                    />

                    <Select
                      name="incomeTracking"
                      label="Will you be tracking income for this Campus?"
                      options={YES_NO_OPTIONS}
                      defaultOption="Choose One"
                    />

                    <Select
                      name="currency"
                      label="Currency"
                      options={CURRENCY_OPTIONS}
                      defaultOption="Select a Currency"
                    />

                    <Input
                      name="conversionRateToDollar"
                      label="Dollar Conversion Rate (How Much Is $1 In Currency)"
                      placeholder="Dollar Conversion Rate"
                    />

                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdmin('Oversight')}>
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
                      {initialValues.streams?.length && (
                        <p className="fw-bold fs-5">Streams</p>
                      )}
                      {initialValues.streams?.map((stream, index) => {
                        if (!stream && !index)
                          return <NoDataComponent text="No Streams" />
                        return (
                          <Button variant="secondary" className="text-start">
                            {stream.name} Stream
                          </Button>
                        )
                      })}
                    </div>

                    <div className="d-grid gap-2 mt-3">
                      {initialValues.creativeArts?.length && (
                        <p className="fw-bold fs-5">Creative Arts</p>
                      )}

                      {initialValues.creativeArts?.map(
                        (creativeArts, index) => {
                          if (!creativeArts && !index)
                            return <NoDataComponent text="No Creative Arts" />
                          return (
                            <Button variant="secondary" className="text-start">
                              {creativeArts.name} Creative Arts
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
              show={streamModal}
              onHide={() => setStreamModal(false)}
              centered
            >
              <Modal.Header closeButton>Add A Stream</Modal.Header>
              <Modal.Body>
                <p>Choose a stream to move to this campus</p>
                <SearchStream
                  name="stream"
                  placeholder="Stream Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Stream Name"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="success"
                  type="submit"
                  disabled={buttonLoading || !formik.values.stream}
                  onClick={async () => {
                    try {
                      setButtonLoading(true)
                      const res = await MoveStreamToCampus({
                        variables: {
                          streamId: formik.values.stream?.id,
                          historyRecord: `${formik.values.stream?.name} Stream has been moved to ${formik.values.name} Campus from ${formik.values.stream?.campus.name} Campus`,
                          newCampusId: campusId,
                          oldCampusId: formik.values.stream?.campus.id,
                        },
                      })

                      clickCard(res.data.MoveStreamToCampus)
                      setStreamModal(false)
                    } catch (error) {
                      throwToSentry(
                        `There was an error moving this stream to this campus`,
                        error
                      )
                    } finally {
                      setButtonLoading(false)
                    }
                  }}
                >
                  <BtnSubmitText loading={buttonLoading} />
                </Button>
                <Button variant="primary" onClick={() => setStreamModal(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal
              show={creativeArtModal}
              onHide={() => setCreativeArtModal(false)}
              centered
            >
              <Modal.Header closeButton>Add A Creative Arts</Modal.Header>
              <Modal.Body>
                <p>Choose a creative arts to move to this campus</p>
                <SearchCreativeArts
                  name="creativeArt"
                  placeholder="Creative Arts Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Creative Arts Name"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="success"
                  type="submit"
                  disabled={buttonLoading || !formik.values.creativeArt}
                  onClick={async () => {
                    try {
                      setButtonLoading(true)
                      const res = await MoveCreativeArtsToCampus({
                        variables: {
                          creativeArtsId: formik.values.creativeArt?.id,
                          historyRecord: `${formik.values.creativeArt?.name} Creative Arts has been moved to ${formik.values.name} Campus from ${formik.values.creativeArt?.campus.name} Campus`,
                          newCampusId: campusId,
                          oldCampusId: formik.values.creativeArt?.campus.id,
                        },
                      })

                      clickCard(res.data.MoveCreativeArtsToCampus)
                      setCreativeArtModal(false)
                    } catch (error) {
                      throwToSentry(
                        `There was an error moving this creative arts to this campus`,
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
                  onClick={() => setCreativeArtModal(false)}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal show={closeDown} onHide={() => setCloseDown(false)} centered>
              <Modal.Header closeButton>Close Down Campus</Modal.Header>
              <Modal.Body>
                <p className="text-info">
                  Are you sure you want to close down this campus?
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
                      const res = await CloseDownCampus({
                        variables: {
                          id: campusId,
                          leaderId: initialValues.leaderId,
                          adminId: initialValues?.adminId,
                        },
                      })

                      setButtonLoading(false)
                      clickCard(res.data.CloseDownCampus)
                      setCloseDown(false)
                      router.push(`/stream/displayall`)
                    } catch (error) {
                      setButtonLoading(false)
                      throwToSentry(
                        `There was an error closing down this campus`,
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

export default CampusForm
