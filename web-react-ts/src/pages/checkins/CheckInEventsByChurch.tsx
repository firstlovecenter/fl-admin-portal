import { useQuery } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'
import { useContext, useMemo, useState } from 'react'
import { Button, Card, Col, Container, Row, Badge } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { LIST_CHECKIN_EVENTS } from './checkinsQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import RoleView from 'auth/RoleView'
import { Link } from 'react-router-dom'

const CheckInEventsByChurch = () => {
  const { churchType } = useParams<{ churchType: string }>()
  const navigate = useNavigate()
  const { clickedChurch } = useContext(ChurchContext)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { data, loading, error } = useQuery(LIST_CHECKIN_EVENTS, {
    variables: {
      scopeLevel: churchType?.toUpperCase(),
      scopeId: clickedChurch?.id,
    },
    skip: !churchType || !clickedChurch?.id,
  })

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

  if (!clickedChurch) {
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
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container className="py-4">
        <HeadingPrimary>{clickedChurch.name}</HeadingPrimary>
        <HeadingSecondary>Check-In Events</HeadingSecondary>

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
              <p>No events found for {clickedChurch.name}.</p>
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
  )
}

export default CheckInEventsByChurch
