import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import DefaulterCard from './DefaulterCard'
import {
  GOVERNORSHIP_BANKED_LIST,
  COUNCIL_BANKED_LIST,
  STREAM_BANKED_LIST,
  CAMPUS_BANKED_LIST,
} from './DefaultersQueries'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CREATIVEARTS_BANKED_LIST,
  HUBCOUNCIL_BANKED_LIST,
  HUB_BANKED_LIST,
  MINISTRY_BANKED_LIST,
} from './creative-arts/SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const Banked = () => {
  const [governorshipBanked, { refetch: governorshipRefetch }] = useLazyQuery(
    GOVERNORSHIP_BANKED_LIST
  )
  const [councilBanked, { refetch: councilRefetch }] =
    useLazyQuery(COUNCIL_BANKED_LIST)
  const [streamBanked, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_BANKED_LIST)
  const [campusBanked, { refetch: campusRefetch }] =
    useLazyQuery(CAMPUS_BANKED_LIST)
  const [creativeArtsBanked, { refetch: creativeArtsRefetch }] = useLazyQuery(
    CREATIVEARTS_BANKED_LIST
  )
  const [ministryBanked, { refetch: ministryRefetch }] =
    useLazyQuery(MINISTRY_BANKED_LIST)
  const [hubCouncilBanked, { refetch: hubCouncilRefetch }] = useLazyQuery(
    HUBCOUNCIL_BANKED_LIST
  )
  const [hubBanked, { refetch: hubRefetch }] = useLazyQuery(HUB_BANKED_LIST)

  const data = useSontaLevel({
    governorshipFunction: governorshipBanked,
    governorshipRefetch,
    councilFunction: councilBanked,
    councilRefetch,
    streamFunction: streamBanked,
    streamRefetch,
    campusFunction: campusBanked,
    campusRefetch,
    creativeArtsFunction: creativeArtsBanked,
    creativeArtsRefetch,
    ministryFunction: ministryBanked,
    ministryRefetch,
    hubCouncilFunction: hubCouncilBanked,
    hubCouncilRefetch,
    hubFunction: hubBanked,
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
          <HeadingSecondary>
            {`Fellowships That Have Banked This Week (Week ${getWeekNumber()})`}
          </HeadingSecondary>

          <PlaceholderCustom as="h6" loading={!church?.bankedThisWeek.length}>
            <h6>{`Number Who Have Banked: ${church?.bankedThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.bankedThisWeek.map((defaulter, i) => (
              <Col key={i} xs={12} className="mb-3">
                <DefaulterCard
                  defaulter={defaulter}
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

export default Banked
