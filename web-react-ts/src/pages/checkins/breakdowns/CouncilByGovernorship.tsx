import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import { useContext, useMemo } from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  GET_COUNCIL_GOVERNORSHIPS,
  GET_CHECKIN_AGGREGATE_BY_SCOPE,
} from '../checkinsQueries'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import useSetUserChurch from 'hooks/useSetUserChurch'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'

const CheckInCouncilByGovernorship = () => {
  const { clickCard, councilId } = useContext(ChurchContext)
  const navigate = useNavigate()
  const { setUserChurch } = useSetUserChurch()

  const { data, loading, error, refetch } = useQuery(
    GET_COUNCIL_GOVERNORSHIPS,
    {
      variables: { id: councilId },
      pollInterval: SHORT_POLL_INTERVAL,
    }
  )

  const { data: aggregateData } = useQuery(GET_CHECKIN_AGGREGATE_BY_SCOPE, {
    variables: { scopeLevel: 'COUNCIL', scopeId: councilId },
    skip: !councilId,
    pollInterval: SHORT_POLL_INTERVAL,
  })

  const aggregateMap = useMemo(() => {
    const map: Record<string, any> = {}
    for (const agg of aggregateData?.GetCheckInAggregateByScope ?? []) {
      map[agg.scopeId] = agg
    }
    return map
  }, [aggregateData])

  const council = data?.councils[0]

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary loading={!council} className="fw-bold pb-3">
            {council?.name} Council By Governorship
          </HeadingPrimary>
          <Row>
            {council?.governorships?.map((governorship: any, i: number) => {
              const agg = aggregateMap[governorship.id]
              const statsArray = [
                {
                  title: 'Total Events',
                  number: agg?.totalEvents ?? 0,
                  color: 'white',
                },
                {
                  title: 'Total Expected',
                  number: agg?.totalExpected ?? 0,
                  color: 'white',
                },
                {
                  title: 'Checked In',
                  number: agg?.checkedInCount ?? 0,
                  color: 'green',
                },
                {
                  title: 'Defaulted',
                  number: agg?.defaultedCount ?? 0,
                  color: 'red',
                },
                {
                  title: 'Attendance',
                  number: `${(agg?.attendancePercentage ?? 0).toFixed(1)}%`,
                  color: 'yellow',
                },
              ]

              return (
                <Col key={i} xs={12} className="mb-3">
                  <Card>
                    <Card.Header>
                      <div className="fw-bold">
                        {governorship.name} {governorship.__typename}
                      </div>
                      {governorship.leader && (
                        <div className="text-secondary">
                          <MemberAvatarWithName member={governorship.leader} />
                        </div>
                      )}
                    </Card.Header>
                    <Card.Body
                      onClick={() => {
                        clickCard(governorship)
                        setUserChurch(governorship)
                        navigate('/checkins/governorship')
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        {statsArray.map((col, index) => (
                          <div key={index} className={col.color}>
                            {`${col.title} - ${col.number}`}
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}

            {(loading || !data) &&
              [1, 2, 3].map((_, i) => (
                <Col key={i} xs={12} className="mb-3">
                  <Card>
                    <Card.Header className="fw-bold">
                      <PlaceholderCustom
                        loading={loading}
                        className="fw-bold"
                      />
                    </Card.Header>
                    <Card.Body>
                      <PlaceholderCustom loading={loading} as="div" />
                      <PlaceholderCustom loading={loading} as="div" />
                      <PlaceholderCustom loading={loading} as="div" />
                      <PlaceholderCustom loading={loading} as="div" />
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

export default CheckInCouncilByGovernorship
