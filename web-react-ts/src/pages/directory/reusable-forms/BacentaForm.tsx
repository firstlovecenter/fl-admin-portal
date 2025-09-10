import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import {
  DECIMAL_NUM_REGEX,
  SERVICE_DAY_OPTIONS,
  VACATION_OPTIONS,
  throwToSentry,
} from 'global-utils'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Governorship } from 'global-types'
import { permitAdminArrivals } from 'permission-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import { MAKE_BACENTA_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import RoleView from 'auth/RoleView'
import {
  Container,
  Row,
  Col,
  Button,
  ButtonGroup,
  Modal,
  Spinner,
} from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik/SubmitButton'
import { DISPLAY_GOVERNORSHIP } from 'pages/directory/display/ReadQueries'
import Select from 'components/formik/Select'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import BtnSubmitText from 'components/formik/BtnSubmitText'

export interface BacentaFormValues extends FormikInitialValues {
  governorship?: Governorship
  meetingDay: string
  vacationStatus: string
  venueLatitude: string | number
  venueLongitude: string | number
  adminId?: string
  adminName?: string
  deputyLeaderId?: string
  deputyLeaderName?: string
}

type BacentaFormProps = {
  initialValues: BacentaFormValues
  onSubmit: (
    values: BacentaFormValues,
    onSubmitProps: FormikHelpers<BacentaFormValues>
  ) => void
  title: string
  newBacenta: boolean
}

const BacentaForm = ({
  initialValues,
  onSubmit,
  title,
  newBacenta,
}: BacentaFormProps) => {
  const { clickCard, bacentaId } = useContext(ChurchContext)
  const [closeDown, setCloseDown] = useState(false)

  const navigate = useNavigate()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [positionLoading, setPositionLoading] = useState(false)
  const [CloseDownBacenta] = useMutation(MAKE_BACENTA_INACTIVE, {
    refetchQueries: [
      {
        query: DISPLAY_GOVERNORSHIP,
        variables: { id: initialValues.governorship?.id },
      },
    ],
  })

  const validationSchema = Yup.object({
    name: Yup.string().required('Bacenta Name is a required field'),
    leaderId: Yup.string().required('Please choose a leader from the dropdown'),
    adminId: Yup.string(),
    deputyLeaderId: Yup.string(),
    vacationStatus: Yup.string().required(
      'Vacation Status is a required field'
    ),
    meetingDay: Yup.string().required('Meeting Day is a required field'),
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

  return (
    <Container>
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>{initialValues.name}</HeadingSecondary>
      <ButtonGroup className="mt-3">
        {!newBacenta && (
          <>
            <Button variant="danger" onClick={() => setCloseDown(true)}>
              {`Close Down Bacenta`}
            </Button>
          </>
        )}
      </ButtonGroup>

      <RoleView roles={permitAdminArrivals('Governorship')}>
        <Button
          variant="warning"
          className="mt-1"
          onClick={() => navigate('/bacenta/editbussing')}
        >
          Edit Bussing Details
        </Button>
      </RoleView>

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
                      <Col>
                        <Input
                          name="name"
                          label="Name of Bacenta"
                          placeholder="Enter Name Here"
                        />
                        <Select
                          name="vacationStatus"
                          options={VACATION_OPTIONS}
                          defaultOption="Choose Vacation Status"
                          label="Status"
                        />
                      </Col>
                    </Row>
                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdminArrivals('Governorship')}>
                        <Col>
                          <SearchMember
                            name="leaderId"
                            initialValue={initialValues?.leaderName}
                            placeholder="Start typing"
                            label="Select a Leader"
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Member Search Box"
                            error={formik.errors.leaderId}
                          />
                        </Col>
                      </RoleView>
                    </Row>
                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdminArrivals('Governorship')}>
                        <Col>
                          <SearchMember
                            name="adminId"
                            initialValue={initialValues?.adminName}
                            placeholder="Start typing"
                            label="Select Bacenta Admin"
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Admin Search Box"
                            error={formik.errors.adminId}
                          />
                        </Col>
                      </RoleView>
                    </Row>
                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdminArrivals('Governorship')}>
                        <Col>
                          <SearchMember
                            name="deputyLeaderId"
                            initialValue={initialValues?.deputyLeaderName}
                            placeholder="Start typing"
                            label="Select Deputy Bacenta Leader"
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Deputy Leader Search Box"
                            error={formik.errors.deputyLeaderId}
                          />
                        </Col>
                      </RoleView>
                    </Row>
                    <Col sm={12}>
                      <Select
                        label="Meeting Day"
                        name="meetingDay"
                        options={SERVICE_DAY_OPTIONS}
                        defaultOption="Pick a Service Day"
                      />
                    </Col>

                    <small className="text-muted">
                      Enter The Coordinates for the Service Venue
                    </small>
                    <Row className="row-cols-2 d-flex align-items-center">
                      <Col>
                        <Input name="venueLatitude" placeholder="Latitude" />
                      </Col>
                      <Col>
                        <Input name="venueLongitude" placeholder="Longitude" />
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
                                document.getElementById('venueLatitude')?.blur()
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
                      Click this button if you are currently at your bacenta
                      service venue
                    </small>
                  </Col>
                </Row>
              </div>

              <div className="text-center mt-5">
                <SubmitButton formik={formik} />
              </div>
            </Form>

            <Modal show={closeDown} onHide={() => setCloseDown(false)} centered>
              <Modal.Header closeButton>Close Down Bacenta</Modal.Header>
              <Modal.Body>
                <p className="text-info">
                  Are you sure you want to close down this bacenta?
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
                      const res = await CloseDownBacenta({
                        variables: {
                          id: bacentaId,
                          leaderId: initialValues.leaderId,
                        },
                      })

                      setButtonLoading(false)
                      clickCard(res.data.CloseDownBacenta)
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

export default BacentaForm
