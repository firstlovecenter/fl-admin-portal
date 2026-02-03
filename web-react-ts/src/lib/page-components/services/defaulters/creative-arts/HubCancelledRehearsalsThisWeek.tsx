import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import DefaulterCard from '../DefaulterCard'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import {
  DefaultersUseChurchType,
  BacentaWithDefaulters,
} from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CAMPUS_CANCELLED_HUBREHEARSALS_LIST,
  CREATIVEARTS_CANCELLED_HUBREHEARSALS_LIST,
  HUBCOUNCIL_CANCELLED_HUBREHEARSALS_LIST,
  MINISTRY_CANCELLED_HUBREHEARSALS_LIST,
} from './SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const CancelledRehearsalssThisWeek = () => {
  const [
    hubCouncilCancelledRehearsalsThisWeeek,
    { refetch: hubCouncilRefetch },
  ] = useLazyQuery(HUBCOUNCIL_CANCELLED_HUBREHEARSALS_LIST)
  const [ministryCancelledRehearsalsThisWeek, { refetch: ministryRefetch }] =
    useLazyQuery(MINISTRY_CANCELLED_HUBREHEARSALS_LIST)
  const [
    creativeArtsCancelledRehearsalsThisWeek,
    { refetch: creativeArtsRefetch },
  ] = useLazyQuery(CREATIVEARTS_CANCELLED_HUBREHEARSALS_LIST)
  const [campusCancelledRehearsalsThisWeek, { refetch: campusRefetch }] =
    useLazyQuery(CAMPUS_CANCELLED_HUBREHEARSALS_LIST)

  const data = useSontaLevel({
    hubRefetch: hubCouncilRefetch,
    hubCouncilFunction: hubCouncilCancelledRehearsalsThisWeeek,
    hubCouncilRefetch,
    ministryFunction: ministryCancelledRehearsalsThisWeek,
    ministryRefetch,
    creativeArtsFunction: creativeArtsCancelledRehearsalsThisWeek,
    creativeArtsRefetch,
    campusFunction: campusCancelledRehearsalsThisWeek,
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
          <HeadingSecondary>{`Cancelled Rehearsal This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.hubCancelledRehearsalsThisWeek.length}
          >
            <h6>{`Number of Cancelled Rehearsal: ${church?.hubCancelledRehearsalsThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.hubCancelledRehearsalsThisWeek.map(
              (service: BacentaWithDefaulters, i: number) => (
                <Col key={i} xs={12} className="mb-3">
                  <DefaulterCard defaulter={service} />
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

export default CancelledRehearsalssThisWeek
