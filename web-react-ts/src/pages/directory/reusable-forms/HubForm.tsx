import { useMutation, useQuery } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import {
  DECIMAL_NUM_REGEX,
  SERVICE_DAY_OPTIONS,
  VACATION_ONLINE_OPTIONS,
  VACATION_OPTIONS,
  isAuthorised,
  makeSelectOptions,
  throwToSentry,
} from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_HUB_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useNavigate } from 'react-router'
import {
  Button,
  Container,
  Row,
  Col,
  ButtonGroup,
  Modal,
  Spinner,
} from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import SubmitButton from 'components/formik/SubmitButton'
import SearchMember from 'components/formik/SearchMember'
import Input from 'components/formik/Input'
import { FormikInitialValues } from 'components/formik/formik-types'
import { DISPLAY_HUB } from '../display/ReadQueries'
import HeadingSecondary from 'components/HeadingSecondary'
import BtnSubmitText from 'components/formik/BtnSubmitText'
import { permitAdmin, permitMe } from 'permission-utils'
import { MemberContext } from 'contexts/MemberContext'
import RoleView from 'auth/RoleView'
import Select from 'components/formik/Select'
import VerifyNotMe from 'auth/VerifyNotMe'
import { GET_HUBCOUNCIL_GOVERNORSHIPS } from './SontaListQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

export interface HubFormValues extends FormikInitialValues {
  name: string
  hubCouncil?: string
  governorship?: string
  meetingDay: string
  vacationStatus: 'Active' | 'Vacation'
  venueLatitude: string | number
  venueLongitude: string | number
}

type HubFormProps = {
  initialValues: HubFormValues
  onSubmit: (
    values: HubFormValues,
    onSubmitProps: FormikHelpers<HubFormValues>
  ) => void
  title: string
  newHub: boolean
}

const HubForm = ({ initialValues, onSubmit, title, newHub }: HubFormProps) => {
  const { clickCard, hubId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const [closeDown, setCloseDown] = useState(false)
  const navigate = useNavigate()

  const [buttonLoading, setButtonLoading] = useState(false)
  const { data, loading, error } = useQuery(GET_HUBCOUNCIL_GOVERNORSHIPS, {
    variables: { hubCouncilId: initialValues.hubCouncil },
  })
  const [CloseDownHub] = useMutation(MAKE_HUB_INACTIVE, {
    refetchQueries: [
      {
        query: DISPLAY_HUB,
        variables: { id: hubId },
      },
    ],
  })

  const governorshipOptions = makeSelectOptions(
    data?.hubCouncils[0].governorships
  )

  const validationSchema = Yup.object({
    governorship: Yup.string().required(
      'Please choose a governorship from the drop down'
    ),
    name: Yup.string().required(`Hub Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
    meetingDay: Yup.string().required('Meeting Day is a required field'),
    vacationStatus: Yup.string().required(
      'Vacation Status is a required field'
    ),
    venueLatitude: Yup.string()
      .required('Please fill in your location info')
      .test(
        'is-decimal',
        'Please enter valid coordinates',
        (value) => !!(value + '').match(DECIMAL_NUM_REGEX)
      ),
    venueLongitude: Yup.string()
      .required('Please fill in your location info')
      .test(
        'is-decimal',
        'Please enter valid coordinates',
        (value) => !!(value + '').match(DECIMAL_NUM_REGEX)
      ),
  })

  const [positionLoading, setPositionLoading] = useState(false)

  const vacationOptions = isAuthorised(
    permitMe('Denomination'),
    currentUser.roles
  )
    ? VACATION_ONLINE_OPTIONS
    : VACATION_OPTIONS

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>{title}</HeadingPrimary>
        <HeadingSecondary>{initialValues.name + ' Hub'}</HeadingSecondary>
        <ButtonGroup className="mt-3">
          {!newHub && (
            <>
              <Button variant="success" onClick={() => setCloseDown(true)}>
                {`Close Down Hub`}
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
                      <Row className="form-row">
                        {newHub && (
                          <Col sm={12}>
                            <Select
                              name="governorship"
                              label="Select a Governorship"
                              options={governorshipOptions}
                              defaultOption="Select a Governorship"
                            />
                          </Col>
                        )}

                        <RoleView
                          roles={[
                            ...permitAdmin('Stream'),
                            ...permitAdmin('Ministry'),
                          ]}
                        >
                          <VerifyNotMe leaderId={initialValues.leaderId}>
                            <>
                              <Col sm={12}>
                                <Input
                                  name="name"
                                  label="Name of Hub"
                                  placeholder="Name of Hub"
                                />
                              </Col>

                              <Col sm={12}>
                                <Select
                                  label="Meeting Day"
                                  name="meetingDay"
                                  options={SERVICE_DAY_OPTIONS}
                                  defaultOption="Pick a Service Day"
                                />
                              </Col>

                              <Col sm={12}>
                                <Select
                                  label="Vacation Status"
                                  name="vacationStatus"
                                  options={vacationOptions}
                                  defaultOption="Select Vacation Status"
                                />
                              </Col>
                            </>
                          </VerifyNotMe>
                        </RoleView>
                        <RoleView
                          roles={[
                            ...permitAdmin('Stream'),
                            ...permitAdmin('Ministry'),
                          ]}
                        >
                          <VerifyNotMe leaderId={initialValues.leaderId}>
                            <Col sm={12}>
                              <SearchMember
                                name="leaderId"
                                label="Hub Leader"
                                initialValue={initialValues.leaderName}
                                placeholder="Select a Leader"
                                setFieldValue={formik.setFieldValue}
                                aria-describedby="Member Search Box"
                                error={formik.errors.leaderId}
                                creativeArts={true}
                              />
                            </Col>
                          </VerifyNotMe>
                        </RoleView>
                      </Row>
                      <small className="text-muted">
                        Enter The Coordinates for the Service Venue
                      </small>

                      <Row className="row-cols-2 d-flex align-items-center">
                        <Col>
                          <Input name="venueLatitude" placeholder="Latitude" />
                        </Col>
                        <Col>
                          <Input
                            name="venueLongitude"
                            placeholder="Longitude"
                          />
                        </Col>
                        <Col className="my-2">
                          <Button
                            variant="primary"
                            className="btn-loading"
                            disabled={positionLoading}
                            onClick={() => {
                              setPositionLoading(true)

                              window.navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  formik.setFieldValue(
                                    'venueLatitude',
                                    position.coords.latitude
                                  )
                                  formik.setFieldValue(
                                    'venueLongitude',
                                    position.coords.longitude
                                  )
                                  document
                                    .getElementById('venueLongitude')
                                    ?.focus()
                                  document
                                    .getElementById('venueLatitude')
                                    ?.focus()
                                  document
                                    .getElementById('venueLatitude')
                                    ?.blur()
                                  setPositionLoading(false)
                                }
                              )
                            }}
                          >
                            {positionLoading ? (
                              <>
                                <Spinner animation="grow" size="sm" />
                                <span> Loading</span>
                              </>
                            ) : (
                              'Locate Me Now'
                            )}
                          </Button>
                        </Col>
                      </Row>
                      <small className="text-muted">
                        Click this button if you are currently at your
                        fellowship service venue
                      </small>
                    </Col>
                  </Row>
                </div>

                <div className="text-center">
                  <SubmitButton formik={formik} />
                </div>
              </Form>

              <Modal
                show={closeDown}
                onHide={() => setCloseDown(false)}
                centered
              >
                <Modal.Header closeButton>Close Down Hub</Modal.Header>
                <Modal.Body>
                  <p className="text-info">
                    Are you sure you want to close down this hub?
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
                        const res = await CloseDownHub({
                          variables: {
                            hubId,
                            leaderId: initialValues.leaderId,
                          },
                        })

                        setButtonLoading(false)
                        clickCard(res.data.CloseDownHub)
                        setCloseDown(false)
                        navigate(`/hub/displayall`)
                      } catch (error) {
                        setButtonLoading(false)
                        throwToSentry(
                          `There was an error closing down this hub`,
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
    </ApolloWrapper>
  )
}

export default HubForm
