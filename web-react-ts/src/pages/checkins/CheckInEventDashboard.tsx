import { useQuery } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'
import { useContext, useMemo, useState } from 'react'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { GET_CHECKIN_DASHBOARD } from './checkinsQueries'
import { CheckInAdminControls } from './CheckInAdminControls'
import { ManualCheckInModal } from './ManualCheckInModal'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import { QRCodeCanvas } from 'qrcode.react'
import { MemberContext } from 'contexts/MemberContext'
import PullToRefresh from 'react-simple-pull-to-refresh'
import MenuButton from 'components/buttons/MenuButton'

const CheckInEventDashboard = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useContext(MemberContext)
  const [showManualCheckIn, setShowManualCheckIn] = useState(false)

  // Check if user is an admin at Governorship level or higher (can create and manage events)
  const isAdmin = currentUser?.roles?.some((role: string) =>
    [
      'adminGovernorship',
      'adminCouncil',
      'adminStream',
      'adminCampus',
      'adminOversight',
      'adminDenomination',
    ].includes(role)
  )

  const { data, loading, error, refetch } = useQuery(GET_CHECKIN_DASHBOARD, {
    pollInterval: SHORT_POLL_INTERVAL,
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const dashboard = data?.GetCheckInDashboard
  const event = dashboard?.event

  // User can manage this event if they are an admin and created it
  const canManageEvent = isAdmin && event?.createdById === currentUser?.id

  const qrPayload =
    event?.id && event?.qrToken ? `${event.id}:${event.qrToken}` : ''
  const attendanceLabel =
    event?.attendanceType === 'LEADERS_ONLY'
      ? 'Leaders Only'
      : 'Leaders + Members'
  const statusLabel = event?.status ?? ''

  const filters = useMemo(() => dashboard?.scopeFilters ?? [], [dashboard])

  const handleMutationComplete = () => {
    refetch()
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <div>
          <Container>
          <HeadingPrimary className="mb-3" loading={loading}>
            {event?.name ?? 'Check-In Dashboard'}
          </HeadingPrimary>

          {event?.createdByName && (
            <>
              <hr className="m-2" />
              <div className="ps-4">
                <div className="text-warning">Check-In Admin</div>
                <div>
                  {event.createdByName}
                  {event.createdByRole ? ` (${event.createdByRole})` : ''}
                </div>
              </div>
              <hr className="m-2" />
            </>
          )}

          <div className="d-grid gap-2">
            {event && canManageEvent && (
              <CheckInAdminControls
                eventId={event.id}
                eventStatus={event.status}
                eventEndsAt={event.endsAt}
                onMutationComplete={handleMutationComplete}
              />
            )}

            {event && !canManageEvent && (
              <Card className="p-3 mb-3 bg-light">
                <p className="text-muted mb-0">
                  📖 <strong>Read-Only Mode:</strong> You are viewing check-in
                  data for your scope.
                  {event.createdByName && ` Created by ${event.createdByName}.`}
                </p>
              </Card>
            )}
          </div>

          {event && (
            <Card className="p-3 mb-3">
              <Row className="g-3">
                <Col md={6}>
                  <div>
                    <strong>Scope:</strong> {event.scopeLevel}
                  </div>
                  <div>
                    <strong>Attendance:</strong> {attendanceLabel}
                  </div>
                  <div>
                    <strong>Status:</strong> {statusLabel}
                  </div>
                  <div>
                    <strong>Starts:</strong>{' '}
                    {new Date(event.startsAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>Ends:</strong>{' '}
                    {new Date(event.endsAt).toLocaleString()}
                  </div>
                  <div className="mt-2">
                    <strong>Can Check In:</strong>{' '}
                    <span className="badge bg-info">
                      {event.allowedCheckInRoles
                        ?.map(
                          (role: string) =>
                            role.replace('leader', '').charAt(0).toUpperCase() +
                            role.replace('leader', '').slice(1)
                        )
                        .join(', ')}
                    </span>
                  </div>
                  {/* Verification features badges */}
                  <div className="mt-2 d-flex flex-wrap gap-1">
                    {event.geoVerifyEnabled && (
                      <span className="badge bg-success">
                        📍 Geo-Verify ({event.geoFenceType || 'CIRCLE'}
                        {event.geoRadius ? `, ${event.geoRadius}m` : ''})
                      </span>
                    )}
                    {event.selfieRequired && (
                      <span className="badge bg-warning text-dark">
                        📸 Selfie Required
                      </span>
                    )}
                  </div>
                </Col>
                <Col md={6} className="text-md-end">
                  <div>
                    <strong>PIN:</strong> {event.pinCode}
                  </div>
                  {qrPayload && (
                    <div className="d-flex justify-content-md-end mt-2">
                      <QRCodeCanvas value={qrPayload} size={140} />
                    </div>
                  )}
                </Col>
              </Row>
            </Card>
          )}

          {/* Scope Hierarchy - Show clickable lower scopes */}
          {filters.length > 0 && (
            <div className="mb-3">
              <h6 className="mb-2">
                Available {filters[0]?.level}s ({filters.length})
              </h6>
              <div className="d-grid gap-2">
                <MenuButton
                  title={`View by ${filters[0]?.level}`}
                  onClick={() => navigate(`/checkins/event/${eventId}/scopes`)}
                  number={filters.length.toString()}
                  color="info"
                  iconBg
                  noCaption
                />
              </div>
            </div>
          )}

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Card className="p-3 h-100 border-primary">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="mb-0">Attendance</h5>
                    <div className="display-6 text-primary">
                      {dashboard?.stats?.percentage ?? 0}%
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="p-3 h-100 border-success">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="mb-0">✅ Checked In</h5>
                    <div className="display-6 text-success">
                      {dashboard?.stats?.checkedInCount ?? 0}
                    </div>
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="success"
                      onClick={() =>
                        navigate(`/checkins/event/${eventId}/checked-in`)
                      }
                    >
                      View List
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Card className="p-3 h-100 border-warning">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="mb-0">⏳ Defaulted</h5>
                    <div className="display-6 text-warning">
                      {dashboard?.stats?.defaultedCount ?? 0}
                    </div>
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="warning"
                      onClick={() =>
                        navigate(`/checkins/event/${eventId}/defaulted`)
                      }
                    >
                      View List
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="p-3 h-100 border-info">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="mb-0">Total Expected</h5>
                    <div className="display-6 text-info">
                      {dashboard?.stats?.totalExpected ?? 0}
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Flagged Records Section */}
          {(dashboard?.stats?.flaggedCount ?? 0) > 0 && canManageEvent && (
            <Card className="p-3 mb-3 border-danger">
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">
                    🚩 Flagged Check-Ins
                  </h5>
                  <div className="display-6 text-danger">
                    {dashboard?.stats?.flaggedCount ?? 0}
                  </div>
                  <small className="text-muted">
                    Records flagged by face verification that need admin review
                  </small>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="danger"
                    onClick={() =>
                      navigate(`/checkins/event/${eventId}/flagged`)
                    }
                  >
                    Review Flagged
                  </Button>
                </Col>
              </Row>
            </Card>
          )}
        </Container>

        <ManualCheckInModal
          show={showManualCheckIn}
          onHide={() => setShowManualCheckIn(false)}
          defaultedAttendees={dashboard?.defaulted ?? []}
          eventId={eventId || ''}
          onMutationComplete={handleMutationComplete}
        />
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CheckInEventDashboard
