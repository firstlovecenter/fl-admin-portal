import { useQuery } from '@apollo/client'
import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Container, Row, Badge } from 'react-bootstrap'
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

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

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <HeadingPrimary loading={loading}>
            {governorship?.name} Governorship Check-In Dashboard
          </HeadingPrimary>

          <HeadingSecondary>Check-In Events</HeadingSecondary>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === null ? 'secondary' : 'outline-secondary'}
                size="sm"
                onClick={() => setStatusFilter(null)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'secondary' : 'outline-secondary'}
                size="sm"
                onClick={() => setStatusFilter('ACTIVE')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'PAUSED' ? 'secondary' : 'outline-secondary'}
                size="sm"
                onClick={() => setStatusFilter('PAUSED')}
              >
                Paused
              </Button>
              <Button
                variant={statusFilter === 'ENDED' ? 'secondary' : 'outline-secondary'}
                size="sm"
                onClick={() => setStatusFilter('ENDED')}
              >
                Ended
              </Button>
            </div>
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

export default CheckInDashboardGovernorship
