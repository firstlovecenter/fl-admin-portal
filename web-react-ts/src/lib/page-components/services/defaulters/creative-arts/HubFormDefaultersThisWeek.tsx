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
  CAMPUS_HUB_FORM_DEFAULTERS_LIST,
  CREATIVEARTS_HUB_FORM_DEFAULTERS_LIST,
  HUBCOUNCIL_HUB_FORM_DEFAULTERS_LIST,
  MINISTRY_HUB_FORM_DEFAULTERS_LIST,
} from './SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const ServicesThisWeek = () => {
  const [hubCouncilRehearsalsThisWeeek, { refetch: hubCouncilRefetch }] =
    useLazyQuery(HUBCOUNCIL_HUB_FORM_DEFAULTERS_LIST)
  const [ministryRehearsalsThisWeek, { refetch: ministryRefetch }] =
    useLazyQuery(MINISTRY_HUB_FORM_DEFAULTERS_LIST)
  const [creativeArtsRehearsalsThisWeek, { refetch: creativeArtsRefetch }] =
    useLazyQuery(CREATIVEARTS_HUB_FORM_DEFAULTERS_LIST)
  const [campusRehearsalsThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_HUB_FORM_DEFAULTERS_LIST
  )

  const data = useSontaLevel({
    hubRefetch: hubCouncilRefetch,
    hubCouncilFunction: hubCouncilRehearsalsThisWeeek,
    hubCouncilRefetch,
    ministryFunction: ministryRehearsalsThisWeek,
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
          <HeadingSecondary>{`Hubs That Have Not Filled The Form This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.hubFormDefaultersThisWeek.length}
          >
            <h6>{`Number of Defaulters: ${church?.hubFormDefaultersThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.hubFormDefaultersThisWeek.map(
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
