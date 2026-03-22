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
  GET_STREAM_COUNCILS,
  GET_CHECKIN_AGGREGATE_BY_SCOPE,
} from '../checkinsQueries'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import useSetUserChurch from 'hooks/useSetUserChurch'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'

const CheckInStreamByCouncil = () => {
  const { clickCard, streamId } = useContext(ChurchContext)
  const navigate = useNavigate()
  const { setUserChurch } = useSetUserChurch()

  const { data, loading, error, refetch } = useQuery(GET_STREAM_COUNCILS, {
    variables: { id: streamId },
    pollInterval: SHORT_POLL_INTERVAL,
  })

  const { data: aggregateData } = useQuery(GET_CHECKIN_AGGREGATE_BY_SCOPE, {
    variables: { scopeLevel: 'STREAM', scopeId: streamId },
    skip: !streamId,
    pollInterval: SHORT_POLL_INTERVAL,
  })

  const aggregateMap = useMemo(() => {
    const map: Record<string, any> = {}
    for (const agg of aggregateData?.GetCheckInAggregateByScope ?? []) {
      map[agg.scopeId] = agg
    }
    return map
  }, [aggregateData])

  const stream = data?.streams[0]

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary loading={!stream} className="fw-bold pb-3">
            {stream?.name} Stream By Council
          </HeadingPrimary>
          <Row>
            {stream?.councils?.map((council: any, i: number) => {
              const agg = aggregateMap[council.id]
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
                        {council.name} {council.__typename}
                      </div>
                      {council.leader && (
                        <div className="text-secondary">
                          <MemberAvatarWithName member={council.leader} />
                        </div>
                      )}
                    </Card.Header>
                    <Card.Body
                      onClick={() => {
                        clickCard(council)
                        setUserChurch(council)
                        navigate('/checkins/council')
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

export default CheckInStreamByCouncil
