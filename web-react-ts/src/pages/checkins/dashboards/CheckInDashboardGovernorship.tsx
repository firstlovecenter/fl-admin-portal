import { useQuery } from '@apollo/client'
import { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Container, Badge } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { LIST_CHECKIN_EVENTS, GET_GOVERNORSHIP } from '../checkinsQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import RoleView from 'auth/RoleView'
import { Link } from 'react-router-dom'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import PullToRefresh from 'react-simple-pull-to-refresh'

const CheckInDashboardGovernorship = () => {
  const navigate = useNavigate()
  const { governorshipId } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(LIST_CHECKIN_EVENTS, {
    variables: {
      scopeLevel: 'GOVERNORSHIP',
      scopeId: governorshipId,
    },
    skip: !governorshipId,
    pollInterval: SHORT_POLL_INTERVAL,
  })

  const { data: govData } = useQuery(GET_GOVERNORSHIP, {
    variables: { id: governorshipId },
    skip: !governorshipId,
  })

  const governorship = govData?.governorships?.[0]

  const { activeEvents, pastEvents } = useMemo(() => {
    const allEvents = data?.ListCheckInEvents ?? []
    return {
      activeEvents: allEvents.filter((e: any) => e.status === 'ACTIVE' || e.status === 'PAUSED'),
      pastEvents: allEvents.filter((e: any) => e.status !== 'ACTIVE' && e.status !== 'PAUSED'),
    }
  }, [data])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: 'success',
      PAUSED: 'warning',
      ENDED: 'danger',
    }
    return (
      <Badge bg={variants[status] || 'secondary'} className="ms-2">
        {status}
      </Badge>
    )
  }

  const formatEventMeta = (event: any) => {
    const start = new Date(event.startsAt)
    const date = start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return `${event.location ? event.location + ' · ' : ''}${date} · ${startTime}`
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <HeadingPrimary loading={loading}>
            {governorship?.name} Governorship Check-In Dashboard
          </HeadingPrimary>

          <div className="d-flex justify-content-end mb-3">
            <RoleView
              roles={[
                'adminGovernorship',
                'adminCouncil',
                'adminStream',
                'adminCampus',
                'adminOversight',
                'adminDenomination',
              ]}
            >
              <Link to="/checkins/create">
                <Button variant="outline-secondary" size="sm">
                  Create Event
                </Button>
              </Link>
            </RoleView>
          </div>

          {activeEvents.length === 0 && pastEvents.length === 0 && (
            <p className="text-center text-muted mt-3">No events found.</p>
          )}

          <p className="text-uppercase fw-semibold text-muted small mb-2" style={{ letterSpacing: '0.08em' }}>
            Upcoming / Current Events
          </p>
          {activeEvents.length > 0 ? (
            <div className="d-grid gap-2">
              {activeEvents.map((event: any) => (
                <Button
                  key={event.id}
                  variant="success"
                  size="lg"
                  className="fw-bold py-3 text-start"
                  onClick={() => navigate(`/checkins/event/${event.id}`)}
                >
                  <div>{event.name} {getStatusBadge(event.status)}</div>
                  <div className="fw-normal small mt-1" style={{ opacity: 0.85 }}>{formatEventMeta(event)}</div>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted fst-italic small mb-0">No active events right now.</p>
          )}

          {pastEvents.length > 0 && (
            <>
              <hr className="my-3" />
              <p className="text-uppercase fw-semibold text-muted small mb-2" style={{ letterSpacing: '0.08em' }}>
                Past Events
              </p>
              <div className="d-grid gap-2" style={{ opacity: 0.5 }}>
                {pastEvents.map((event: any) => (
                  <Button
                    key={event.id}
                    variant="outline-secondary"
                    size="lg"
                    className="fw-semibold py-3 text-start"
                    onClick={() => navigate(`/checkins/event/${event.id}`)}
                  >
                    <div>
                      {event.name}
                      <span className="ms-2 badge bg-secondary fw-normal" style={{ fontSize: '0.7rem' }}>ENDED</span>
                    </div>
                    <div className="fw-normal small mt-1" style={{ opacity: 0.85 }}>{formatEventMeta(event)}</div>
                  </Button>
                ))}
              </div>
            </>
          )}
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CheckInDashboardGovernorship
