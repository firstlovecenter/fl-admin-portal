import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DetailsCard from '../card/DetailsCard'
import { MemberContext } from '../../contexts/MemberContext'
import { ChurchContext } from '../../contexts/ChurchContext'
import Timeline, { TimelineElement } from '../Timeline/Timeline'
import EditButton from '../buttons/EditButton'
import ChurchButton from '../buttons/ChurchButton/ChurchButton'
import './DisplayChurchDetails.css'
import RoleView from '../../auth/RoleView'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useMutation } from '@apollo/client'
import {
  ADD_GOVERNORSHIP_ADMIN,
  REMOVE_GOVERNORSHIP_ADMIN,
  ADD_COUNCIL_ADMIN,
  REMOVE_COUNCIL_ADMIN,
  ADD_STREAM_ADMIN,
  REMOVE_STREAM_ADMIN,
  ADD_CAMPUS_ADMIN,
  REMOVE_CAMPUS_ADMIN,
  ADD_OVERSIGHT_ADMIN,
  REMOVE_OVERSIGHT_ADMIN,
  ADD_BACENTA_ADMIN,
  REMOVE_BACENTA_ADMIN,
} from './AdminMutations'
import {
  alertMsg,
  directoryLock,
  plural,
  throwToSentry,
} from '../../global-utils'
import Breadcrumb from './Breadcrumb'
import { Button, Col, Container, Modal, Row } from 'react-bootstrap'
import PlaceholderCustom from 'components/Placeholder'
import { Geo } from 'react-bootstrap-icons'
import ViewAll from 'components/buttons/ViewAll'
import { permitAdmin } from 'permission-utils'
import useSetUserChurch from 'hooks/useSetUserChurch'
import {
  Church,
  ChurchLevel,
  MemberWithoutBioData,
  Role,
  VacationStatusOptions,
} from 'global-types'
import { BacentaWithArrivals } from 'pages/arrivals/arrivals-types'
import SearchMember from 'components/formik/SearchMember'
import useModal from 'hooks/useModal'
import SubmitButton from 'components/formik/SubmitButton'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import Last3WeeksCard, {
  Last3WeeksCardProps,
  shouldFill,
} from 'components/Last3WeeksCard'
import { DetailsArray } from 'pages/directory/display/DetailsBacenta'

type DisplayChurchDetailsProps = {
  details: DetailsArray
  loading: boolean
  church?: BacentaWithArrivals
  name: string
  leaderTitle: string
  leader: MemberWithoutBioData
  admins?: MemberWithoutBioData[]
  deputyLeader?: MemberWithoutBioData
  churchId: string
  churchType: ChurchLevel
  subChurch?: ChurchLevel
  editlink: string
  editPermitted: Role[]
  history: TimelineElement[]
  breadcrumb: Church[]
  buttons: Church[]
  vacation?: VacationStatusOptions
  vacationCount?: number

  buttonsSecondRow?: Church[]
  subChurchBasonta?: string
  basontaLeaders?: MemberWithoutBioData[]
  momoNumber?: string
  //Fellowships
  location?: {
    longitude: number
    latitude: number
  }
  last3Weeks?: Last3WeeksCardProps['last3Weeks']
}

type FormOptions = {
  adminSelect: string
}

const DisplayChurchDetails = (props: DisplayChurchDetailsProps) => {
  const { setUserChurch } = useSetUserChurch()
  const navigate = useNavigate()
  let needsAdmin

  let roles: Role[] = []

  switch (props.churchType) {
    case 'Governorship':
      needsAdmin = true
      roles = permitAdmin('Council')
      break
    case 'Council':
      needsAdmin = true
      roles = permitAdmin('Stream')
      break
    case 'Stream':
      needsAdmin = true
      roles = permitAdmin('Campus')
      break
    case 'Campus':
      needsAdmin = true
      roles = permitAdmin('Oversight')
      break
    case 'Oversight':
      needsAdmin = true
      roles = permitAdmin('Denomination')
      break
    case 'Denomination':
      needsAdmin = true
      roles = []
      break
    default:
      needsAdmin = false
      break
  }

  const { currentUser } = useContext(MemberContext)
  const { show, handleShow, handleClose } = useModal()
  const { governorshipId, councilId, streamId, campusId, clickCard } =
    useContext(ChurchContext)

  const htmlElement = document.querySelector('html')
  const currentTheme = htmlElement?.getAttribute('data-bs-theme') || 'dark'

  // Multi-Admin Management
  const [AddGovernorshipAdmin] = useMutation(ADD_GOVERNORSHIP_ADMIN)
  const [RemoveGovernorshipAdmin] = useMutation(REMOVE_GOVERNORSHIP_ADMIN)
  const [AddCouncilAdmin] = useMutation(ADD_COUNCIL_ADMIN)
  const [RemoveCouncilAdmin] = useMutation(REMOVE_COUNCIL_ADMIN)
  const [AddStreamAdmin] = useMutation(ADD_STREAM_ADMIN)
  const [RemoveStreamAdmin] = useMutation(REMOVE_STREAM_ADMIN)
  const [AddCampusAdmin] = useMutation(ADD_CAMPUS_ADMIN)
  const [RemoveCampusAdmin] = useMutation(REMOVE_CAMPUS_ADMIN)
  const [AddOversightAdmin] = useMutation(ADD_OVERSIGHT_ADMIN)
  const [RemoveOversightAdmin] = useMutation(REMOVE_OVERSIGHT_ADMIN)
  const [AddBacentaAdmin] = useMutation(ADD_BACENTA_ADMIN)
  const [RemoveBacentaAdmin] = useMutation(REMOVE_BACENTA_ADMIN)

  const initialValues: FormOptions = {
    adminSelect: '',
  }
  const validationSchema = Yup.object({
    adminSelect: Yup.string().required(
      'Please select an Admin from the dropdown'
    ),
  })

  const addAdmin = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    try {
      const variables = {
        adminId: values.adminSelect,
        ...(props.churchType === 'Oversight' && { oversightId: props.churchId }),
        ...(props.churchType === 'Campus' && { campusId }),
        ...(props.churchType === 'Stream' && { streamId }),
        ...(props.churchType === 'Council' && { councilId }),
        ...(props.churchType === 'Governorship' && { governorshipId }),
        ...(props.churchType === 'Bacenta' && { bacentaId: props.churchId }),
      }

      if (props.churchType === 'Oversight') {
        await AddOversightAdmin({ variables })
      } else if (props.churchType === 'Campus') {
        await AddCampusAdmin({ variables })
      } else if (props.churchType === 'Stream') {
        await AddStreamAdmin({ variables })
      } else if (props.churchType === 'Council') {
        await AddCouncilAdmin({ variables })
      } else if (props.churchType === 'Governorship') {
        await AddGovernorshipAdmin({ variables })
      } else if (props.churchType === 'Bacenta') {
        await AddBacentaAdmin({ variables })
      }

      alertMsg(`Admin added successfully to ${props.churchType}`)
      onSubmitProps.resetForm()
      handleClose()
      window.location.reload() // Refresh to show new admin
    } catch (e) {
      throwToSentry('Error adding admin', e)
      alertMsg('Failed to add admin. Please try again.')
    }
  }

  const removeAdmin = async (adminId: string) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) {
      return
    }

    try {
      const variables = {
        adminId,
        ...(props.churchType === 'Oversight' && { oversightId: props.churchId }),
        ...(props.churchType === 'Campus' && { campusId }),
        ...(props.churchType === 'Stream' && { streamId }),
        ...(props.churchType === 'Council' && { councilId }),
        ...(props.churchType === 'Governorship' && { governorshipId }),
        ...(props.churchType === 'Bacenta' && { bacentaId: props.churchId }),
      }

      if (props.churchType === 'Oversight') {
        await RemoveOversightAdmin({ variables })
      } else if (props.churchType === 'Campus') {
        await RemoveCampusAdmin({ variables })
      } else if (props.churchType === 'Stream') {
        await RemoveStreamAdmin({ variables })
      } else if (props.churchType === 'Council') {
        await RemoveCouncilAdmin({ variables })
      } else if (props.churchType === 'Governorship') {
        await RemoveGovernorshipAdmin({ variables })
      } else if (props.churchType === 'Bacenta') {
        await RemoveBacentaAdmin({ variables })
      }

      alertMsg('Admin removed successfully')
      window.location.reload() // Refresh to update admin list
    } catch (e) {
      throwToSentry('Error removing admin', e)
      alertMsg('Failed to remove admin. Please try again.')
    }
  }
  //End of Admin Change

  return (
    <>
      <div className="py-2 top-heading title-bar">
        <Breadcrumb breadcrumb={props.breadcrumb} />
        <hr />
        <Container>
          <PlaceholderCustom as="h3" loading={!props.name} xs={12}>
            <h3 className="mt-3 font-weight-bold">
              {`${props.name} ${props.churchType}`}

              {directoryLock(currentUser, props.churchType) && (
                <RoleView roles={props.editPermitted} directoryLock>
                  <EditButton link={props.editlink} />
                </RoleView>
              )}
            </h3>
          </PlaceholderCustom>

          {needsAdmin && (
            <RoleView roles={roles}>
              <div className="mb-3">
                <h6>Administrators ({props.admins?.length || 0})</h6>
                {props.admins && props.admins.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {props.admins.map((admin) => (
                      <Row key={admin.id} className="g-0 d-flex align-items-center">
                        <Col className="col-auto">
                          <MemberAvatarWithName
                            member={admin}
                            onClick={() => {
                              clickCard(admin)
                              navigate('/member/displaydetails')
                            }}
                          />
                        </Col>
                        <Col>
                          <Button
                            variant="danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => removeAdmin(admin.id)}
                          >
                            Remove
                          </Button>
                        </Col>
                      </Row>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No admins assigned</p>
                )}
                <Button className="btn-secondary mt-2" size="sm" onClick={handleShow}>
                  + Add Admin
                </Button>
              </div>
            </RoleView>
          )}
        </Container>
        <Modal show={show} onHide={handleClose} centered>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={addAdmin}
          >
            {(formik) => (
              <Form>
                <Modal.Header closeButton>
                  Add Admin to {`${props.churchType}`}
                </Modal.Header>
                <Modal.Body>
                  <Row className="form-row">
                    <Col>
                      <SearchMember
                        name="adminSelect"
                        placeholder="Search for a member to add as admin"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Member Search"
                        error={formik.errors.adminSelect}
                      />
                    </Col>
                  </Row>
                </Modal.Body>
                <Modal.Footer>
                  <SubmitButton formik={formik} />
                  <Button variant="secondary" onClick={handleClose}>
                    Close
                  </Button>
                </Modal.Footer>
              </Form>
            )}
          </Formik>
        </Modal>
      </div>
      <Container>
        <LeaderAvatar leader={props.leader} leaderTitle={props.leaderTitle} />
        {/* Bacenta Admin and Deputy Leader display */}
        {props.churchType === 'Bacenta' && (
          <div className="d-flex flex-column align-items-start mb-3">
            {props.deputyLeader && (
              <div
                className="d-flex flex-row align-items-center gap-2 mb-1"
                style={{ fontSize: '0.95em' }}
              >
                <span className="fw-semibold text-muted">Deputy Leader</span>
                <MemberAvatarWithName member={props.deputyLeader} size={32} />
              </div>
            )}
            {props.admins && props.admins.length > 0 && (
              <div
                className="d-flex flex-row align-items-center gap-2 mb-1"
                style={{ fontSize: '0.95em' }}
              >
                <span className="fw-semibold text-muted">Bacenta Admin</span>
                <MemberAvatarWithName member={props.admins[0]} size={32} />
                {props.admins.length > 1 && (
                  <span className="text-muted small">(+{props.admins.length - 1} more)</span>
                )}
              </div>
            )}
          </div>
        )}
        {props.details?.length && (
          <Row>
            {props.details.map((detail, i) => (
              <Col key={i} xs={detail.width ?? 6}>
                <DetailsCard
                  onClick={() => navigate(detail.link)}
                  heading={detail.title}
                  creativearts={detail?.creativearts}
                  detail={
                    !props.loading ? detail?.number?.toString() || '0' : ''
                  }
                  vacationCount={
                    !props.loading
                      ? detail?.vacationCount?.toString() || '0'
                      : ''
                  }
                  vacationIcBacentaCount={
                    !props.loading
                      ? detail?.vacationIcBacentaCount?.toString() || '0'
                      : ''
                  }
                />
              </Col>
            ))}
          </Row>
        )}

        {props.churchType === 'Bacenta' &&
        (props.church?.sprinterTopUp !== 0 ||
          props.church?.urvanTopUp !== 0) ? (
          <RoleView roles={['leaderBacenta']} verifyId={props?.leader?.id}>
            {!props.momoNumber && !props.loading && (
              <p className="my-1 bad fw-bold text-center">
                There is no valid Mobile Money Number! Please update!
              </p>
            )}
            <div className="d-grid gap-2 mt-2">
              <PlaceholderCustom
                loading={props.loading}
                className={`btn-graphs`}
                button="true"
              >
                <Button
                  onClick={() => {
                    navigate(`/${props.churchType.toLowerCase()}/editbussing`)
                  }}
                >
                  Bus Payment Details
                </Button>
              </PlaceholderCustom>
            </div>
          </RoleView>
        ) : null}
        <hr />
        <div className="d-grid gap-2">
          <PlaceholderCustom
            loading={props.loading}
            className="btn-graphs"
            variant="brand"
            button="button"
          >
            <Button
              variant="brand"
              size="lg"
              onClick={() => {
                setUserChurch({
                  id: props.churchId,
                  name: props.name,
                  __typename: props.churchType,
                })
                navigate(`/trends`)
              }}
            >
              View Trends
            </Button>
          </PlaceholderCustom>

          {shouldFill({
            last3Weeks: props.last3Weeks ?? [],
            vacation: props.vacation ?? 'Active',
          }) && (
            <PlaceholderCustom
              loading={props.loading}
              className="btn-graphs"
              size="lg"
              button="button"
            >
              <Button
                variant="brand"
                size="lg"
                onClick={() => {
                  setUserChurch({
                    id: props.churchId,
                    name: props.name,
                    __typename: props.churchType,
                  })

                  navigate(`/services/${props.churchType.toLowerCase()}`)
                }}
              >
                Service Forms
              </Button>
            </PlaceholderCustom>
          )}
        </div>
        {props?.location && props.location?.latitude !== 0 && (
          <Container className="mt-4 text-center">
            <h3>LOCATION</h3>
            <p>Click here for directions</p>
            <a
              className="btn p-3"
              href={`https://www.google.com/maps/search/?api=1&query=${props?.location?.latitude}%2C${props?.location?.longitude}`}
            >
              <Geo size="75" />
            </a>
          </Container>
        )}

        {props.last3Weeks && props.details[2].number === 'Active' && (
          <Last3WeeksCard last3Weeks={props.last3Weeks} />
        )}
      </Container>

      {props.subChurch && props.buttons?.length ? (
        <>
          <Container>
            <hr className="hr-line" />

            <div className="row justify-content-between">
              <div className="col">
                <p className="text-secondary">{`${props.subChurch} Locations`}</p>
              </div>
              <div className="col-auto">
                <Link
                  className="card text-secondary px-1"
                  to={`/${props.subChurch.toLowerCase()}/displayall`}
                >
                  {`View All ${plural(props.subChurch)}`}
                </Link>
              </div>
            </div>
          </Container>

          <div className="container mb-4 card-button-row">
            <table>
              <tbody>
                <tr>
                  {props.buttons.map((church, index) => {
                    if (index > 4) {
                      return null
                    }
                    return (
                      <td className="col-auto" key={index}>
                        <ChurchButton church={church} />{' '}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      {props.subChurch && !props.buttons?.length ? (
        <Container className="d-grid gap-2 mt-2">
          <RoleView roles={props.editPermitted}>
            <PlaceholderCustom
              loading={props.loading}
              className="btn-graphs"
              variant={currentTheme as 'dark' | 'light'}
              button="button"
            >
              <Button
                className="btn-graphs"
                variant={currentTheme as 'dark' | 'light'}
                onClick={() =>
                  navigate(
                    `/${props.subChurch?.toLowerCase()}/add${props.subChurch?.toLowerCase()}`
                  )
                }
              >
                {`Add New ${props.subChurch}`}
              </Button>
            </PlaceholderCustom>
          </RoleView>
        </Container>
      ) : null}

      {props.history?.length && (
        <Container className="mt-5">
          <Row>
            <Col>
              <h3 className="mb-0">CHURCH HISTORY</h3>
            </Col>
            <Col className="col-auto">
              <ViewAll to={`/${props.churchType.toLowerCase()}/history`} />
            </Col>
          </Row>

          <Timeline record={props.history} modifier="church" limit={5} />
        </Container>
      )}
    </>
  )
}

export default DisplayChurchDetails
