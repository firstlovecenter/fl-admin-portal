import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import {
  CONSTITUENCY_CANCELLED_SERVICES_LIST,
  COUNCIL_CANCELLED_SERVICES_LIST,
  STREAM_CANCELLED_SERVICES_LIST,
  CAMPUS_CANCELLED_SERVICES_LIST,
} from './DefaultersQueries'
import DefaulterCard from './DefaulterCard'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import useChurchLevel from 'hooks/useChurchLevel'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'

const CancelledServicesThisWeek = () => {
  const [constituencyCancelledServices, { refetch: constituencyRefetch }] =
    useLazyQuery(CONSTITUENCY_CANCELLED_SERVICES_LIST)
  const [councilCancelledServices, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_CANCELLED_SERVICES_LIST
  )
  const [streamCancelledServices, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_CANCELLED_SERVICES_LIST
  )
  const [campusCancelledServices, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_CANCELLED_SERVICES_LIST
  )

  const data = useChurchLevel({
    constituencyFunction: constituencyCancelledServices,
    constituencyRefetch,
    councilFunction: councilCancelledServices,
    councilRefetch,
    streamFunction: streamCancelledServices,
    streamRefetch,
    campusFunction: campusCancelledServices,
    campusRefetch,
  })

  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary
            loading={!church}
          >{`${church?.name} ${church?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>{`Cancelled Services This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.cancelledServicesThisWeek.length}
          >
            <h6>{`Number of Cancelled Services: ${church?.cancelledServicesThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.cancelledServicesThisWeek.map((service, i) => (
              <Col key={i} xs={12} className="mb-3">
                <DefaulterCard defaulter={service} />
              </Col>
            ))}
            {!church && <PlaceholderDefaulterList />}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CancelledServicesThisWeek
