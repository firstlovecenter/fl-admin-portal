import { useQuery } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'
import { useContext, useMemo } from 'react'
import { Button, Container, Badge } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { LIST_CHECKIN_EVENTS } from './checkinsQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import RoleView from 'auth/RoleView'
import { Link } from 'react-router-dom'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { SHORT_POLL_INTERVAL } from 'global-utils'

const CheckInEventsByChurch = () => {
  const { churchType } = useParams<{ churchType: string }>()
  const navigate = useNavigate()
  const { church } = useContext(ChurchContext)

  const { data, loading, error, refetch } = useQuery(LIST_CHECKIN_EVENTS, {
    variables: {
      scopeLevel: churchType?.toUpperCase(),
      scopeId: church?.id,
    },
    skip: !churchType || !church?.id,
    pollInterval: SHORT_POLL_INTERVAL,
  })

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

  if (!church) {
    return (
      <Container className="py-4">
        <p className="text-muted">Please select a church first.</p>
        <Button onClick={() => navigate('/checkins')} variant="primary">
          Back to Churches
        </Button>
      </Container>
    )
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <HeadingPrimary>{church.name}</HeadingPrimary>

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
              <Link to="/checkins/create" className="me-2">
                <Button variant="outline-secondary" size="sm">
                  Create Event
                </Button>
              </Link>
            </RoleView>
          </div>

          {activeEvents.length === 0 && pastEvents.length === 0 && (
            <p className="text-center text-muted mt-3">No events found for {church.name}.</p>
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

export default CheckInEventsByChurch
