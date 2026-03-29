import { useQuery } from '@apollo/client'
import { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Container } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { LIST_CHECKIN_EVENTS } from '../checkinsQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { SHORT_POLL_INTERVAL } from 'global-utils'

const CheckInBacenta = () => {
  const navigate = useNavigate()
  const { church, bacentaId } = useContext(ChurchContext)

  const { data, loading, error, refetch } = useQuery(LIST_CHECKIN_EVENTS, {
    variables: {
      scopeId: bacentaId,
    },
    skip: !bacentaId,
    pollInterval: SHORT_POLL_INTERVAL,
  })

  const { activeEvents, pastEvents } = useMemo(() => {
    const allEvents: any[] = data?.ListCheckInEvents ?? []
    return {
      activeEvents: allEvents.filter((e) => e.status === 'ACTIVE' || e.status === 'PAUSED'),
      pastEvents: allEvents.filter((e) => e.status !== 'ACTIVE' && e.status !== 'PAUSED'),
    }
  }, [data])

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
            {church?.name} Check-In
          </HeadingPrimary>

          {activeEvents.length === 0 && pastEvents.length === 0 && (
            <Card className="p-4 text-center text-muted mt-3">
              <p className="mb-0">No check-in events yet.</p>
            </Card>
          )}

          {/* Upcoming / Current Events */}
          {(activeEvents.length > 0 || pastEvents.length === 0) && (
            <>
              <p className="text-uppercase fw-semibold text-muted small mb-2 mt-2" style={{ letterSpacing: '0.08em' }}>
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
                      <div>{event.name}</div>
                      <div className="fw-normal small mt-1" style={{ opacity: 0.85 }}>{formatEventMeta(event)}</div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted fst-italic small mb-0">No active events right now.</p>
              )}
            </>
          )}

          {/* Past Events */}
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

export default CheckInBacenta
