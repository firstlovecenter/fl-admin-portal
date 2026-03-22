import { useQuery } from '@apollo/client'
import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Container, Row, Badge } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { LIST_CHECKIN_EVENTS } from '../checkinsQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { SHORT_POLL_INTERVAL } from 'global-utils'

const CheckInBacenta = () => {
  const navigate = useNavigate()
  const { church, bacentaId } = useContext(ChurchContext)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery(LIST_CHECKIN_EVENTS, {
    variables: {
      scopeLevel: 'BACENTA',
      scopeId: bacentaId,
    },
    skip: !bacentaId,
    pollInterval: SHORT_POLL_INTERVAL,
  })

  const events = useMemo(() => {
    const allEvents = data?.ListCheckInEvents ?? []
    if (!statusFilter) return allEvents
    return allEvents.filter((e: any) => e.status === statusFilter)
  }, [data, statusFilter])

  const activeEvents = useMemo(
    () => (data?.ListCheckInEvents ?? []).filter((e: any) => e.status === 'ACTIVE'),
    [data]
  )

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

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <HeadingPrimary loading={loading}>
            {church?.name} Check-In
          </HeadingPrimary>
          <HeadingSecondary>Your Check-In Events</HeadingSecondary>

          {/* Bold Check-In button for active events */}
          {activeEvents.length > 0 && (
            <div className="d-grid gap-2 mb-4">
              {activeEvents.map((event: any) => (
                <Button
                  key={event.id}
                  variant="success"
                  size="lg"
                  className="fw-bold"
                  onClick={() => navigate(`/checkins/checkin?eventId=${event.id}`)}
                >
                  Check In to {event.name}
                </Button>
              ))}
            </div>
          )}

          {/* Status filter */}
          <div className="d-flex gap-2 flex-wrap mb-3">
            <Button
              variant={statusFilter === null ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'success' : 'outline-success'}
              size="sm"
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'ENDED' ? 'danger' : 'outline-danger'}
              size="sm"
              onClick={() => setStatusFilter('ENDED')}
            >
              Ended
            </Button>
          </div>

          {/* Events list */}
          <div className="d-grid gap-3">
            {events.length === 0 ? (
              <Card className="p-4 text-center text-muted">
                <p>No events found.</p>
              </Card>
            ) : (
              events.map((event: any) => (
                <Card key={event.id} className="p-3">
                  <Row className="align-items-center">
                    <Col>
                      <h6 className="mb-1">
                        {event.name}
                        {getStatusBadge(event.status)}
                      </h6>
                      <small className="text-muted">
                        {new Date(event.startsAt).toLocaleString()}
                      </small>
                    </Col>
                    <Col xs="auto">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/checkins/event/${event.id}`)}
                      >
                        View
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))
            )}
          </div>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CheckInBacenta
