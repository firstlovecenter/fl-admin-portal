import { useQuery } from '@apollo/client'
import { useContext, useMemo } from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { GET_CHECKIN_DASHBOARD } from './checkinsQueries'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { useParams, useNavigate } from 'react-router-dom'
import useSetUserChurch from 'hooks/useSetUserChurch'

const CheckInScopeBreakdown = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { clickCard, clickedChurch } = useContext(ChurchContext)
  const { setUserChurch } = useSetUserChurch()

  const { data, loading, error, refetch } = useQuery(GET_CHECKIN_DASHBOARD, {
    pollInterval: SHORT_POLL_INTERVAL,
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const dashboard = data?.GetCheckInDashboard
  const event = dashboard?.event
  const scopeFilters = useMemo(() => dashboard?.scopeFilters ?? [], [dashboard])

  const handleScopeClick = (scope: any) => {
    clickCard(scope)
    setUserChurch(scope)
    // Navigate back to dashboard but with the filterScopeId param
    // This would require passing filterScopeId through the dashboard query
    navigate(`/checkins/event/${eventId}?scopeId=${scope.id}`)
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <HeadingPrimary loading={loading}>
            {event?.name} - {event?.scopeLevel}s
          </HeadingPrimary>

          <Row className="g-3">
            {scopeFilters.map((scope: any) => (
              <Col key={scope.id} md={6} lg={4}>
                <Card
                  className="h-100 cursor-pointer"
                  onClick={() => handleScopeClick(scope)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Header className="fw-bold">
                    {scope.name}
                    <br />
                    <small className="text-muted">{scope.level}</small>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2">
                      <strong>Event:</strong> {event?.name}
                    </div>
                    <div>
                      <strong>Scope:</strong> {scope.level}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {scopeFilters.length === 0 && (
            <Card className="p-4 text-center text-muted">
              <p>No sub-scopes available for this event.</p>
            </Card>
          )}
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CheckInScopeBreakdown
