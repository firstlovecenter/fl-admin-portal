import { useQuery } from '@apollo/client'
import { Col, Container, Row } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderCustom from 'components/Placeholder'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Card } from 'react-bootstrap'
import { GET_CHECKIN_DASHBOARD } from './checkinsQueries'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { useParams, useSearchParams } from 'react-router-dom'
import ScopeBreakdownCard from './ScopeBreakdownCard'

const CheckInScopeBreakdown = () => {
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  // If parentScopeId is set, fetch the dashboard scoped to that parent
  // so childScopeFilters returns its direct children
  const parentScopeId = searchParams.get('parentScopeId') ?? undefined

  const { data, loading, error, refetch } = useQuery(GET_CHECKIN_DASHBOARD, {
    pollInterval: SHORT_POLL_INTERVAL,
    variables: { eventId, filterScopeId: parentScopeId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const dashboard = data?.GetCheckInDashboard
  const event = dashboard?.event
  // When parentScopeId is set, use childScopeFilters (children of that parent)
  // Otherwise use all non-event-scope scopeFilters (top-level children of event scope)
  const scopesToShow = parentScopeId
    ? (dashboard?.childScopeFilters ?? [])
    : (dashboard?.scopeFilters ?? []).filter(
        (f: any) => f.level !== event?.scopeLevel
      )

  const heading = parentScopeId
    ? (dashboard?.appliedFilterName ?? event?.name)
    : event?.name

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container>
          <HeadingPrimary loading={loading}>
            {heading}
          </HeadingPrimary>

          <Row>
            {scopesToShow.map((scope: any) => (
              <ScopeBreakdownCard
                key={scope.id}
                eventId={eventId!}
                scopeId={scope.id}
                scopeName={scope.name}
                scopeLevel={scope.level}
              />
            ))}

            {(loading || !data) &&
              [1, 2, 3].map((_, i) => (
                <Col key={i} xs={12} className="mb-3">
                  <Card>
                    <Card.Header className="fw-bold">
                      <PlaceholderCustom loading className="fw-bold" />
                    </Card.Header>
                    <Card.Body>
                      <PlaceholderCustom loading as="div" />
                      <PlaceholderCustom loading as="div" />
                      <PlaceholderCustom loading as="div" />
                      <PlaceholderCustom loading as="div" />
                    </Card.Body>
                  </Card>
                </Col>
              ))}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CheckInScopeBreakdown
