import { useQuery } from '@apollo/client'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useContext, useMemo, useState } from 'react'
import { Accordion, Button, Card, Container } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { GET_CHECKIN_DASHBOARD, GET_CHECKIN_EVENT_HISTORY } from './checkinsQueries'
import { CheckInAdminControls } from './CheckInAdminControls'
import { ManualCheckInModal } from './ManualCheckInModal'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import { MemberContext } from 'contexts/MemberContext'
import PullToRefresh from 'react-simple-pull-to-refresh'
import MenuButton from 'components/buttons/MenuButton'
import DefaulterInfoCard from 'pages/services/defaulters/DefaulterInfoCard'

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

  // Pure bacenta leaders see only their personal check-in view, not the live dashboard
  const isBacentaLeaderOnly =
    !isAdmin &&
    currentUser?.roles?.includes('leaderBacenta') &&
    !currentUser?.roles?.some((role: string) =>
      [
        'leaderGovernorship',
        'leaderCouncil',
        'leaderStream',
        'leaderCampus',
        'leaderOversight',
        'leaderDenomination',
      ].includes(role)
    )

  const [searchParams] = useSearchParams()
  const filterScopeId = searchParams.get('filterScopeId') ?? undefined

  const { data, loading, error, refetch } = useQuery(GET_CHECKIN_DASHBOARD, {
    pollInterval: SHORT_POLL_INTERVAL,
    variables: { eventId, filterScopeId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const { data: historyData } = useQuery(GET_CHECKIN_EVENT_HISTORY, {
    variables: { eventId, limit: 5 },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const dashboard = data?.GetCheckInDashboard
  const event = dashboard?.event
  const historyEntries = historyData?.GetCheckInEventHistory ?? []

  // User can manage this event if they are an admin and created it
  const canManageEvent = isAdmin && event?.createdById === currentUser?.id

  // childScopeFilters = direct children of the applied filter scope (from API)
  const childFilters: any[] = useMemo(
    () => dashboard?.childScopeFilters ?? [],
    [dashboard]
  )
  const childLevel = childFilters[0]?.level

  // When a scope filter is active, show that scope's name in the heading
  const appliedFilterName = dashboard?.appliedFilterName
  const isFiltered =
    dashboard?.appliedFilterId &&
    dashboard.appliedFilterId !== event?.scopeId

  // Check if current user has already checked in
  const userCheckIn = useMemo(() => {
    if (!dashboard || !currentUser?.id) return null
    return (
      dashboard.checkedIn?.find(
        (m: any) => m.memberId === currentUser.id
      ) ?? null
    )
  }, [dashboard, currentUser])

  const isEligibleToCheckIn =
    event?.status === 'ACTIVE' &&
    !userCheckIn &&
    event?.allowedCheckInRoles?.some((role: string) =>
      currentUser?.roles?.includes(role)
    )

  const handleMutationComplete = () => {
    refetch()
  }

  const stats = dashboard?.stats

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <>
        <Container>
          <HeadingPrimary loading={loading}>
            {isFiltered && appliedFilterName
              ? `${appliedFilterName}`
              : (event?.name ?? 'Check-In Dashboard')}
          </HeadingPrimary>
          {isFiltered && (
            <p className="text-muted small text-center mb-1">{event?.name}</p>
          )}

          {event?.createdByName && (
            <>
              <hr className="m-2" />
              <div className="d-flex justify-content-between align-items-center ps-4 pe-2">
                <div>
                  <div className="text-warning">Check-In Admin</div>
                  <div>{event.createdByName}</div>
                </div>
                {canManageEvent && (
                  <CheckInAdminControls
                    eventId={event.id}
                    eventStatus={event.status}
                    eventEndsAt={event.endsAt}
                    event={event}
                    canEdit={canManageEvent}
                    onMutationComplete={handleMutationComplete}
                  />
                )}
              </div>
              <hr className="m-2" />
            </>
          )}

          {/* Bold Check-In button for eligible users */}
          {isEligibleToCheckIn && (
            <div className="d-grid my-3">
              <Button
                variant="success"
                size="lg"
                className="fw-bold py-3"
                onClick={() => navigate(`/checkins/checkin?eventId=${event.id}`)}
              >
                Check In Now
              </Button>
            </div>
          )}

          {/* Already checked in banner */}
          {userCheckIn && (
            <Card className="p-3 mb-3 border-success bg-light">
              <div className="d-flex align-items-center">
                <span className="badge bg-success me-2 fs-6">Checked In</span>
                <div>
                  <small className="text-muted">
                    via {userCheckIn.checkInMethod} •{' '}
                    {new Date(userCheckIn.checkedInAt).toLocaleString()}
                    {userCheckIn.isLate && (
                      <span className="badge bg-warning ms-2">Late</span>
                    )}
                  </small>
                </div>
              </div>
            </Card>
          )}

          <div className="d-grid gap-2">
            {/* Live dashboard — admins and higher-level leaders only */}
            {!isBacentaLeaderOnly && (
            <>
            {/* Scope filter — drill down to child scopes */}
            {childFilters.length > 0 && (
              <DefaulterInfoCard
                defaulter={{
                  title: childLevel
                    ? childLevel.charAt(0) +
                      childLevel.slice(1).toLowerCase() +
                      's'
                    : 'Governorships',
                  data: childFilters.length,
                  link: isFiltered
                    ? `/checkins/event/${eventId}/scopes?parentScopeId=${dashboard?.appliedFilterId}`
                    : `/checkins/event/${eventId}/scopes`,
                }}
              />
            )}

            {stats && (
              <p
                className="text-center fw-bold mb-0"
                style={{
                  color:
                    stats.percentage >= 75
                      ? '#28a745'
                      : stats.percentage >= 50
                      ? '#ffc107'
                      : '#dc3545',
                }}
              >
                Attendance: {stats.percentage}%
              </p>
            )}

            <Accordion defaultActiveKey="0">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Check-In Monitoring</Accordion.Header>
                <Accordion.Body>
                  <div className="d-grid gap-2">
                    <MenuButton
                      title="Checked In"
                      onClick={() =>
                        navigate(`/checkins/event/${eventId}/checked-in`)
                      }
                      number={(stats?.checkedInCount ?? 0).toString()}
                      color="green"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Defaulted"
                      onClick={() =>
                        navigate(`/checkins/event/${eventId}/defaulted`)
                      }
                      number={(stats?.defaultedCount ?? 0).toString()}
                      color="red"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Checked Out"
                      onClick={() =>
                        navigate(`/checkins/event/${eventId}/checked-out`)
                      }
                      number={(stats?.checkedOutCount ?? 0).toString()}
                      color="yellow"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Total Expected"
                      number={stats?.totalExpected?.toString() ?? '-'}
                      color="info"
                      iconBg
                      noCaption
                    />
                    {(stats?.flaggedCount ?? 0) > 0 && canManageEvent && (
                      <MenuButton
                        title="Flagged Check-Ins"
                        onClick={() =>
                          navigate(`/checkins/event/${eventId}/flagged`)
                        }
                        number={stats!.flaggedCount.toString()}
                        color="red"
                        iconBg
                        noCaption
                      />
                    )}
                    <Button
                      variant="outline-info"
                      className="mt-2"
                      onClick={() => navigate(`/checkins/event/${eventId}/report`)}
                    >
                      View Full Report
                    </Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              {(historyEntries.length > 0 ||
                (dashboard?.checkedIn?.length ?? 0) > 0) && (
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Recent Activity</Accordion.Header>
                  <Accordion.Body>
                    <div className="d-flex justify-content-end gap-2 mb-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          navigate(`/checkins/event/${eventId}/checked-in`)
                        }
                      >
                        View Check-Ins
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() =>
                          navigate(`/checkins/event/${eventId}/history`)
                        }
                      >
                        View All History
                      </Button>
                    </div>
                    {historyEntries.length > 0 ? (
                      <ul className="list-unstyled mb-0">
                        {historyEntries.map((entry: any) => (
                          <li
                            key={entry.id}
                            className="d-flex align-items-start mb-2 pb-2 border-bottom"
                          >
                            <span className="me-2 text-primary">●</span>
                            <div>
                              <strong>{entry.performedByName}</strong>{' '}
                              <span className="text-muted">
                                {entry.description}
                              </span>
                              <br />
                              <small className="text-muted">
                                {new Date(entry.timestamp).toLocaleString()}
                              </small>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="list-unstyled mb-0">
                        {[...dashboard.checkedIn]
                          .sort(
                            (a: any, b: any) =>
                              new Date(b.checkedInAt).getTime() -
                              new Date(a.checkedInAt).getTime()
                          )
                          .slice(0, 5)
                          .map((record: any) => (
                            <li
                              key={record.memberId}
                              className="d-flex align-items-start mb-2 pb-2 border-bottom"
                            >
                              <span className="me-2 text-success">●</span>
                              <div>
                                <strong>
                                  {record.firstName} {record.lastName}
                                </strong>{' '}
                                checked in via{' '}
                                <span className="badge bg-info">
                                  {record.checkInMethod}
                                </span>
                                {record.isLate && (
                                  <span className="badge bg-warning ms-1">
                                    Late
                                  </span>
                                )}
                                <br />
                                <small className="text-muted">
                                  {new Date(
                                    record.checkedInAt
                                  ).toLocaleString()}
                                </small>
                              </div>
                            </li>
                          ))}
                      </ul>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              )}
            </Accordion>
            </>
            )}
          </div>
        </Container>

        <ManualCheckInModal
          show={showManualCheckIn}
          onHide={() => setShowManualCheckIn(false)}
          defaultedAttendees={dashboard?.defaulted ?? []}
          eventId={eventId || ''}
          onMutationComplete={handleMutationComplete}
        />
        </>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CheckInEventDashboard
