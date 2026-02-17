import { useQuery } from '@apollo/client'
import { useMemo, useState } from 'react'
import { Button, Card, Col, Container, Row, Badge } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { LIST_CHECKIN_EVENTS } from './checkinsQueries'
import RoleView from 'auth/RoleView'

const CheckInEventHistory = () => {
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { data, loading, error } = useQuery(LIST_CHECKIN_EVENTS)

  const events = useMemo(() => {
    const allEvents = data?.ListCheckInEvents ?? []
    if (!statusFilter) return allEvents
    return allEvents.filter((e: any) => e.status === statusFilter)
  }, [data, statusFilter])

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

  const getAttendanceLabel = (type: string) => {
    return type === 'LEADERS_ONLY' ? 'Leaders Only' : 'Leaders + Members'
  }

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container className="py-4">
        <HeadingPrimary className="mb-3">Check-In Event History</HeadingPrimary>

        <Row className="g-3 mb-4">
          <Col md={6}>
            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === null ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setStatusFilter(null)}
              >
                All
              </Button>
              <Button
                variant={
                  statusFilter === 'ACTIVE' ? 'success' : 'outline-success'
                }
                size="sm"
                onClick={() => setStatusFilter('ACTIVE')}
              >
                Active
              </Button>
              <Button
                variant={
                  statusFilter === 'PAUSED' ? 'warning' : 'outline-warning'
                }
                size="sm"
                onClick={() => setStatusFilter('PAUSED')}
              >
                Paused
              </Button>
              <Button
                variant={statusFilter === 'ENDED' ? 'danger' : 'outline-danger'}
                size="sm"
                onClick={() => setStatusFilter('ENDED')}
              >
                Ended
              </Button>
            </div>
          </Col>
          <Col md={6} className="text-md-end">
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
                <Button variant="primary" size="sm">
                  ➕ Create Event
                </Button>
              </Link>
            </RoleView>
            <Link to="/checkins/reports">
              <Button variant="info" size="sm">
                📊 View Reports
              </Button>
            </Link>
          </Col>
        </Row>

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
                      {event.scopeLevel} •{' '}
                      {getAttendanceLabel(event.attendanceType)} •{' '}
                      {new Date(event.startsAt).toLocaleString()}
                    </small>
                  </Col>
                  <Col xs="auto">
                    <Link to={`/checkins/event/${event.id}`}>
                      <Button variant="outline-primary" size="sm">
                        View Dashboard
                      </Button>
                    </Link>
                  </Col>
                </Row>
              </Card>
            ))
          )}
        </div>
      </Container>
    </ApolloWrapper>
  )
}

export default CheckInEventHistory
