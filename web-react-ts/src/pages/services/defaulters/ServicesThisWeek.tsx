import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import {
  GOVERNORSHIP_SERVICES_LIST,
  COUNCIL_SERVICES_LIST,
  STREAM_SERVICES_LIST,
  CAMPUS_SERVICES_LIST,
} from './DefaultersQueries'
import DefaulterCard from './DefaulterCard'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CREATIVE_ARTS_SERVICES_LIST,
  HUBCOUNCIL_SERVICES_LIST,
  HUB_SERVICES_LIST,
  MINISTRY_SERVICES_LIST,
} from './creative-arts/SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const ServicesThisWeek = () => {
  const [governorshipServicesThisWeek, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_SERVICES_LIST)
  const [councilServicesThisWeek, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_SERVICES_LIST
  )
  const [streamServicesThisWeek, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_SERVICES_LIST)
  const [campusThisWeek, { refetch: campusRefetch }] =
    useLazyQuery(CAMPUS_SERVICES_LIST)
  const [creativeArtsServicesThisWeek, { refetch: creativeArtsRefetch }] =
    useLazyQuery(CREATIVE_ARTS_SERVICES_LIST)
  const [ministryServicesThisWeek, { refetch: ministryRefetch }] = useLazyQuery(
    MINISTRY_SERVICES_LIST
  )
  const [hubCouncilServicesThisWeek, { refetch: hubCouncilRefetch }] =
    useLazyQuery(HUBCOUNCIL_SERVICES_LIST)
  const [hubServicesThisWeek, { refetch: hubRefetch }] =
    useLazyQuery(HUB_SERVICES_LIST)

  const data = useSontaLevel({
    governorshipFunction: governorshipServicesThisWeek,
    governorshipRefetch,
    councilFunction: councilServicesThisWeek,
    councilRefetch,
    streamFunction: streamServicesThisWeek,
    streamRefetch,
    campusFunction: campusThisWeek,
    campusRefetch,
    creativeArtsFunction: creativeArtsServicesThisWeek,
    creativeArtsRefetch,
    ministryFunction: ministryServicesThisWeek,
    ministryRefetch,
    hubCouncilFunction: hubCouncilServicesThisWeek,
    hubCouncilRefetch,
    hubFunction: hubServicesThisWeek,
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
          <HeadingSecondary>{`Forms Filled This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom as="h6" loading={!church?.servicesThisWeek.length}>
            <h6>{`Forms Filled This Week: ${church?.servicesThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.servicesThisWeek.map((service, i) => (
              <Col key={i} xs={12} className="mb-3">
                <DefaulterCard
                  defaulter={service}
                  link="/bacenta/service-details"
                />
              </Col>
            ))}
            {!church && <PlaceholderDefaulterList />}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default ServicesThisWeek
