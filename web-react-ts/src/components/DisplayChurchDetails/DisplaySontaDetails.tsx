import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DetailsCard from '../card/DetailsCard'
import Timeline, { TimelineElement } from '../Timeline/Timeline'
import EditButton from '../buttons/EditButton'
import ChurchButton from '../buttons/ChurchButton/ChurchButton'
import './DisplayChurchDetails.css'
import RoleView from '../../auth/RoleView'
import Breadcrumb from './Breadcrumb'
import { Button, Col, Container, Modal, Row } from 'react-bootstrap'
import PlaceholderCustom from 'components/Placeholder'
import { BsFillBarChartFill } from 'react-icons/bs'
import { CgFileDocument } from 'react-icons/cg'
import ViewAll from 'components/buttons/ViewAll'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { Church, ChurchLevel, MemberWithoutBioData, Role } from 'global-types'
import { directoryLock, plural, throwToSentry } from 'global-utils'
import { useMutation } from '@apollo/client'
import {
  MAKE_CREATIVEARTS_ADMIN,
  MAKE_MINISTRY_ADMIN,
} from './CAAdminMutations'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import { permitAdmin } from 'permission-utils'
import { MemberContext } from 'contexts/MemberContext'
import { Geo, PencilSquare } from 'react-bootstrap-icons'
import useModal from 'hooks/useModal'
import SearchMember from 'components/formik/SearchMember'
import SubmitButton from 'components/formik/SubmitButton'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import { ChurchContext } from 'contexts/ChurchContext'
import Last3WeeksCard, {
  Last3WeeksCardProps,
  shouldFill,
} from 'components/Last3WeeksCard'
import { DetailsArray } from 'pages/directory/display/DetailsBacenta'

type DisplayChurchDetailsProps = {
  details: DetailsArray
  loading: boolean
  church: Church
  name: string
  leaderTitle: string
  leader: MemberWithoutBioData
  admin?: MemberWithoutBioData
  churchId: string
  churchType: ChurchLevel
  subLevel?: ChurchLevel
  editlink: string
  editPermitted: Role[]
  history: TimelineElement[]
  breadcrumb: Church[]
  buttons: { id: string; name: string; __typename: string }[]
  vacation?: 'Active' | 'Vacation'
  location?: {
    longitude: number
    latitude: number
  }
  last3Weeks?: Last3WeeksCardProps['last3Weeks']
}

const DisplaySontaDetails = (props: DisplayChurchDetailsProps) => {
  const { setUserChurch } = useSetUserChurch()
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  let needsAdmin

  let roles: Role[] = []

  switch (props.churchType) {
    case 'Hub':
      needsAdmin = false
      roles = permitAdmin('Hub')
      break
    case 'HubCouncil':
      needsAdmin = false
      roles = permitAdmin('HubCouncil')
      break
    case 'Ministry':
      needsAdmin = true
      roles = permitAdmin('Ministry')
      break
    case 'CreativeArts':
      needsAdmin = true
      roles = permitAdmin('CreativeArts')
      break

    default:
      needsAdmin = false
      break
  }

  const htmlElement = document.querySelector('html')
  const currentTheme = htmlElement?.getAttribute('data-bs-theme') || 'dark'
  const { currentUser } = useContext(MemberContext)
  const { show, handleShow, handleClose } = useModal()

  //Change Admin Initialised
  const [MakeMinistryAdmin] = useMutation(MAKE_MINISTRY_ADMIN)
  const [MakeCreativeArtsAdmin] = useMutation(MAKE_CREATIVEARTS_ADMIN)

  const initialValues = {
    adminName: props.admin
      ? `${props.admin?.firstName} ${props.admin?.lastName}`
      : '',
    adminSelect: props.admin?.id ?? '',
  }
  const validationSchema = Yup.object({
    adminSelect: Yup.string().required(
      'Please select an Admin from the dropdown'
    ),
  })

  const onSubmit = async (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      if (props.churchType === 'Ministry') {
        await MakeMinistryAdmin({
          variables: {
            ministryId: props.church.id,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })
      } else if (props.churchType === 'CreativeArts') {
        await MakeCreativeArtsAdmin({
          variables: {
            creativeArtsId: props.church.id,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })
      }
    } catch (error) {
      throwToSentry('', error)
    } finally {
      onSubmitProps.setSubmitting(false)
      handleClose()
    }
  }

  return (
    <>
      <div className="py-2 top-heading title-bar">
        <Container>
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
                <Row className="g-0 d-flex align-items-center">
                  <Col className="col-auto">
                    {!!props.admin && (
                      <MemberAvatarWithName
                        member={props.admin}
                        onClick={() => {
                          clickCard(props.admin)
                          navigate('/member/displaydetails')
                        }}
                      />
                    )}
                  </Col>
                  <Col>
                    <Button className="p-1 small ms-2" onClick={handleShow}>
                      <PencilSquare /> Change Admin
                    </Button>
                  </Col>
                </Row>
              </RoleView>
            )}
          </Container>
          <Modal show={show} onHide={handleClose} centered>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
            >
              {(formik) => (
                <Form>
                  <Modal.Header closeButton>
                    Change {`${props.churchType}`} Admin
                  </Modal.Header>
                  <Modal.Body>
                    <Row className="form-row">
                      <Col>
                        <SearchMember
                          name="adminSelect"
                          initialValue={initialValues?.adminName}
                          placeholder="Select an Admin"
                          setFieldValue={formik.setFieldValue}
                          aria-describedby="Member Search"
                          error={formik.errors.adminSelect}
                        />
                      </Col>
                    </Row>
                  </Modal.Body>
                  <Modal.Footer>
                    <SubmitButton formik={formik} />
                    <Button variant="primary" onClick={handleClose}>
                      Close
                    </Button>
                  </Modal.Footer>
                </Form>
              )}
            </Formik>
          </Modal>
        </Container>
      </div>
      <Container>
        <LeaderAvatar leader={props.leader} leaderTitle={props.leaderTitle} />
        {/* details section */}
        {props.details?.length && (
          <Row>
            {props.details.map((detail, i) => (
              <Col key={i} xs={detail.width ?? 6}>
                <DetailsCard
                  onClick={() => navigate(detail.link)}
                  heading={detail.title}
                  detail={
                    !props.loading ? detail?.number?.toString() || '0' : ''
                  }
                  vacationCount={
                    !props.loading
                      ? detail?.vacationCount?.toString() || '0'
                      : ''
                  }
                />
              </Col>
            ))}
          </Row>
        )}
        <hr />
        {/* Two buttons */}
        <div className="d-flex gap-2 text-center">
          <PlaceholderCustom
            loading={props.loading}
            className={`btn-sonta w-100`}
            button="button"
          >
            <Button
              variant="purple"
              onClick={() => {
                setUserChurch({
                  id: props.churchId,
                  name: props.name,
                  __typename: props.churchType,
                })
                navigate(`/trends`)
              }}
            >
              <BsFillBarChartFill /> View Trends
            </Button>
          </PlaceholderCustom>

          {['Hub', 'HubCouncil', 'Ministry'].includes(props.churchType) &&
            shouldFill({
              last3Weeks: props.last3Weeks ?? [],
              vacation: props.vacation ?? 'Active',
            }) && (
              <PlaceholderCustom
                loading={props.loading}
                className={`btn-sonta w-100`}
                button="button"
              >
                <Button
                  onClick={() => {
                    setUserChurch({
                      id: props.churchId,
                      name: props.name,
                      __typename: props.churchType,
                    })

                    navigate(`/services/${props.churchType.toLowerCase()}`)
                  }}
                >
                  <CgFileDocument /> Meeting Forms
                </Button>
              </PlaceholderCustom>
            )}
        </div>
        {/* End two buttons */}
        <hr className="hr-line" />
      </Container>

      {props?.location && props.location?.latitude !== 0 && (
        <Container className="my-4 text-center">
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

      {props.subLevel && props.buttons?.length ? (
        <>
          <Container>
            <div className="row justify-content-between">
              <div className="col">
                <p className="text-secondary">{`${props.subLevel} Locations`}</p>
              </div>
              <div className="col-auto">
                <Link
                  className="card text-secondary px-1"
                  to={`/${props?.subLevel.toLowerCase()}/displayall`}
                >
                  {`View All ${plural(props.subLevel)}`}
                </Link>
              </div>
            </div>
          </Container>

          <div className="container mb-4 card-button-row">
            <table>
              <tbody>
                <tr>
                  {props?.buttons?.map((church, index) => {
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

      {props.last3Weeks && props.details[2].number === 'Active' && (
        <Last3WeeksCard last3Weeks={props.last3Weeks} />
      )}
      {props.subLevel && !props.buttons?.length ? (
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
                    `/${props.subLevel?.toLowerCase()}/add${props.subLevel?.toLowerCase()}`
                  )
                }
              >
                {`Add New ${props.subLevel}`}
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

export default DisplaySontaDetails
