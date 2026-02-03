'use client'

import React, { useContext } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  MAKE_CAMPUS_ADMIN,
  MAKE_GOVERNORSHIP_ADMIN,
  MAKE_COUNCIL_ADMIN,
  MAKE_OVERSIGHT_ADMIN,
  MAKE_STREAM_ADMIN,
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
import { Geo, PencilSquare } from 'react-bootstrap-icons'
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
  admin?: MemberWithoutBioData
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
  adminName: string
  adminSelect: string
}

const DisplayChurchDetails = (props: DisplayChurchDetailsProps) => {
  const { setUserChurch } = useSetUserChurch()
  const router = useRouter()
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

  //Change Admin Initialised
  const [MakeGovernorshipAdmin] = useMutation(MAKE_GOVERNORSHIP_ADMIN)
  const [MakeCouncilAdmin] = useMutation(MAKE_COUNCIL_ADMIN)
  const [MakeStreamAdmin] = useMutation(MAKE_STREAM_ADMIN)
  const [MakeCampusAdmin] = useMutation(MAKE_CAMPUS_ADMIN)
  const [MakeOversightAdmin] = useMutation(MAKE_OVERSIGHT_ADMIN)

  const initialValues: FormOptions = {
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
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    if (initialValues.adminSelect === values.adminSelect) {
      return
    }

    try {
      if (props.churchType === 'Oversight') {
        await MakeOversightAdmin({
          variables: {
            oversightId: props.churchId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })
        alertMsg('Oversight Admin has been changed successfully')
      }

      if (props.churchType === 'Campus') {
        await MakeCampusAdmin({
          variables: {
            campusId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })

        alertMsg('Campus Admin has been changed successfully')
      }

      if (props.churchType === 'Stream') {
        await MakeStreamAdmin({
          variables: {
            streamId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })

        alertMsg('Stream Admin has been changed successfully')
      }

      if (props.churchType === 'Council') {
        await MakeCouncilAdmin({
          variables: {
            councilId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })

        alertMsg('Council Admin has been changed successfully')
      }

      if (props.churchType === 'Governorship') {
        await MakeGovernorshipAdmin({
          variables: {
            governorshipId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })
        alertMsg('Governorship Admin has been changed successfully')
      }
    } catch (e) {
      throwToSentry('', e)
    } finally {
      handleClose()
    }

    onSubmitProps.resetForm()
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
              <Row className="g-0 d-flex align-items-center">
                <Col className="col-auto">
                  {!!props.admin && (
                    <MemberAvatarWithName
                      member={props.admin}
                      onClick={() => {
                        clickCard(props.admin)
                        router.push('/member/displaydetails')
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
            {props.admin && (
              <div
                className="d-flex flex-row align-items-center gap-2 mb-1"
                style={{ fontSize: '0.95em' }}
              >
                <span className="fw-semibold text-muted">Bacenta Admin</span>
                <MemberAvatarWithName member={props.admin} size={32} />
              </div>
            )}
          </div>
        )}
        {props.details?.length && (
          <Row>
            {props.details.map((detail, i) => (
              <Col key={i} xs={detail.width ?? 6}>
                <DetailsCard
                  onClick={() => router.push(detail.link)}
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
                className="btn-graphs"
                button="true"
              >
                <Button
                  onClick={() => {
                    router.push(
                      `/${props.churchType.toLowerCase()}/editbussing`
                    )
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
                router.push(`/trends`)
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

                  router.push(`/services/${props.churchType.toLowerCase()}`)
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
                  href={`/${props.subChurch.toLowerCase()}/displayall`}
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
                  router.push(
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
              <ViewAll href={`/${props.churchType.toLowerCase()}/history`} />
            </Col>
          </Row>

          <Timeline record={props.history} modifier="church" limit={5} />
        </Container>
      )}
    </>
  )
}

export default DisplayChurchDetails
