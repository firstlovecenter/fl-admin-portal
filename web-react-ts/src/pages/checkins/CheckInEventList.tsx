import { useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { LIST_CHECKIN_EVENTS } from './checkinsQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'

const CheckInEventList = () => {
  const navigate = useNavigate()
  const { data, loading, error } = useQuery(LIST_CHECKIN_EVENTS)

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container>
        <Row className="align-items-center mb-3">
          <Col>
            <HeadingPrimary>Check-In Events</HeadingPrimary>
          </Col>
          <Col className="col-auto d-flex gap-2">
            <Button
              onClick={() => navigate('/checkins/reports')}
              variant="outline-secondary"
            >
              📊 Reports
            </Button>
            <Button
              onClick={() => navigate('/checkins/create')}
              variant="primary"
            >
              Create Event
            </Button>
          </Col>
        </Row>

        <Row className="g-3">
          {data?.ListCheckInEvents?.length ? (
            data.ListCheckInEvents.map((event: any) => (
              <Col key={event.id} md={6} lg={4}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>{event.name}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {event.type}
                    </Card.Subtitle>
                    <Card.Text>
                      Scope: {event.scopeLevel}
                      <br />
                      Status:{' '}
                      <span
                        className={`badge bg-${
                          event.status === 'ACTIVE'
                            ? 'success'
                            : event.status === 'PAUSED'
                            ? 'warning'
                            : 'danger'
                        }`}
                      >
                        {event.status}
                      </span>
                      <br />
                      Starts: {new Date(event.startsAt).toLocaleString()}
                    </Card.Text>
                    <Button
                      variant="outline-primary"
                      onClick={() => navigate(`/checkins/event/${event.id}`)}
                    >
                      View Dashboard
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col>
              <Card>
                <Card.Body>No check-in events yet.</Card.Body>
              </Card>{' '}
            </Col>
          )}
        </Row>
      </Container>
    </ApolloWrapper>
  )
}

export default CheckInEventList
