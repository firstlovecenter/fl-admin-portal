import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import {
  GOVERNORSHIP_CANCELLED_SERVICES_LIST,
  COUNCIL_CANCELLED_SERVICES_LIST,
  STREAM_CANCELLED_SERVICES_LIST,
  CAMPUS_CANCELLED_SERVICES_LIST,
} from './DefaultersQueries'
import DefaulterCard from './DefaulterCard'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CREATIVEARTS_CANCELLED_SERVICES_LIST,
  HUBCOUNCIL_CANCELLED_SERVICES_LIST,
  HUB_CANCELLED_SERVICES_LIST,
  MINISTRY_CANCELLED_SERVICES_LIST,
} from './creative-arts/SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const CancelledServicesThisWeek = () => {
  const [governorshipCancelledServices, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_CANCELLED_SERVICES_LIST)
  const [councilCancelledServices, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_CANCELLED_SERVICES_LIST
  )
  const [streamCancelledServices, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_CANCELLED_SERVICES_LIST
  )
  const [campusCancelledServices, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_CANCELLED_SERVICES_LIST
  )
  const [creativeArtsCancelledServices, { refetch: creativeArtsRefetch }] =
    useLazyQuery(CREATIVEARTS_CANCELLED_SERVICES_LIST)
  const [ministryCancelledServices, { refetch: ministryRefetch }] =
    useLazyQuery(MINISTRY_CANCELLED_SERVICES_LIST)
  const [hubCouncilCancelledServices, { refetch: hubCouncilRefetch }] =
    useLazyQuery(HUBCOUNCIL_CANCELLED_SERVICES_LIST)
  const [hubCancelledServices, { refetch: hubRefetch }] = useLazyQuery(
    HUB_CANCELLED_SERVICES_LIST
  )

  const data = useSontaLevel({
    governorshipFunction: governorshipCancelledServices,
    governorshipRefetch,
    councilFunction: councilCancelledServices,
    councilRefetch,
    streamFunction: streamCancelledServices,
    streamRefetch,
    campusFunction: campusCancelledServices,
    campusRefetch,
    creativeArtsFunction: creativeArtsCancelledServices,
    creativeArtsRefetch,
    ministryFunction: ministryCancelledServices,
    ministryRefetch,
    hubCouncilFunction: hubCouncilCancelledServices,
    hubCouncilRefetch,
    hubFunction: hubCancelledServices,
    hubRefetch,
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
