import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import DefaulterCard from '../DefaulterCard'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import useChurchLevel from 'hooks/useChurchLevel'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { DefaultersUseChurchType } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CAMPUS_STREAM_CANCELLED_SERVICES_LIST,
  DENOMINATION_STREAM_CANCELLED_SERVICES_LIST,
  OVERSIGHT_STREAM_CANCELLED_SERVICES_LIST,
} from './StreamDefaultersQueries'

const StreamCancelledServicesThisWeek = () => {
  const [campusCancelledServices, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_STREAM_CANCELLED_SERVICES_LIST
  )
  const [oversightCancelledServices, { refetch: oversightRefetch }] =
    useLazyQuery(OVERSIGHT_STREAM_CANCELLED_SERVICES_LIST)
  const [denominationCancelledServices, { refetch: denominationRefetch }] =
    useLazyQuery(DENOMINATION_STREAM_CANCELLED_SERVICES_LIST)

  const data = useChurchLevel({
    governorshipFunction: campusCancelledServices,
    governorshipRefetch: campusRefetch,
    councilFunction: campusCancelledServices,
    councilRefetch: campusRefetch,
    streamFunction: campusCancelledServices,
    streamRefetch: campusRefetch,
    campusFunction: campusCancelledServices,
    campusRefetch,
    oversightFunction: oversightCancelledServices,
    oversightRefetch,
    denominationFunction: denominationCancelledServices,
    denominationRefetch,
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
            loading={!church?.streamCancelledServicesThisWeek?.length}
          >
            <h6>{`Number of Cancelled Services: ${church?.streamCancelledServicesThisWeek?.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.streamCancelledServicesThisWeek?.map((service, i) => (
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

export default StreamCancelledServicesThisWeek
