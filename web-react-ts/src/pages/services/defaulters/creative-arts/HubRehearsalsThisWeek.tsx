import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import {} from '../DefaultersQueries'
import DefaulterCard from '../DefaulterCard'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import {
  DefaultersUseChurchType,
  BacentaWithDefaulters,
} from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CAMPUS_HUBREHEARSALS_LIST,
  CREATIVEARTS_HUBREHEARSALS_LIST,
  HUBCOUNCIL_HUBREHEARSALS_LIST,
  MINISTRY_HUBREHEARSALS_LIST,
} from './SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const ServicesThisWeek = () => {
  const [hubCouncilRehearsalsThisWeeek, { refetch: hubCouncilRefetch }] =
    useLazyQuery(HUBCOUNCIL_HUBREHEARSALS_LIST)
  const [ministryRehearsalsThisWeek, { refetch: ministryRefetch }] =
    useLazyQuery(MINISTRY_HUBREHEARSALS_LIST)
  const [creativeArtsRehearsalsThisWeek, { refetch: creativeArtsRefetch }] =
    useLazyQuery(CREATIVEARTS_HUBREHEARSALS_LIST)
  const [campusRehearsalsThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_HUBREHEARSALS_LIST
  )

  const data = useSontaLevel({
    hubRefetch: hubCouncilRefetch,
    hubCouncilFunction: hubCouncilRehearsalsThisWeeek,
    hubCouncilRefetch,
    councilFunction: ministryRehearsalsThisWeek,
    ministryRefetch,
    creativeArtsFunction: creativeArtsRehearsalsThisWeek,
    creativeArtsRefetch,
    campusFunction: campusRehearsalsThisWeek,
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
          <HeadingSecondary>{`Forms Filled This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.hubRehearsalsThisWeek.length}
          >
            <h6>{`Forms Filled This Week: ${church?.hubRehearsalsThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.hubRehearsalsThisWeek.map(
              (service: BacentaWithDefaulters, i: number) => (
                <Col key={i} xs={12} className="mb-3">
                  <DefaulterCard
                    defaulter={service}
                    link="/hub/service-details"
                  />
                </Col>
              )
            )}
            {!church && <PlaceholderDefaulterList />}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default ServicesThisWeek
