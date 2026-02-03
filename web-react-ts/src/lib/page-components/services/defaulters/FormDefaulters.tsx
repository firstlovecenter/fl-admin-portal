import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import {
  GOVERNORSHIP_FORM_DEFAULTERS_LIST,
  COUNCIL_FORM_DEFAULTERS_LIST,
  STREAM_FORM_DEFAULTERS_LIST,
  CAMPUS_FORM_DEFAULTERS_LIST,
} from './DefaultersQueries'
import DefaulterCard from './DefaulterCard'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CREATIVEARTS_FORM_DEFAULTERS_LIST,
  HUBCOUNCIL_FORM_DEFAULTERS_LIST,
  HUB_FORM_DEFAULTERS_LIST,
  MINISTRY_FORM_DEFAULTERS_LIST,
} from './creative-arts/SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const FormDefaulters = () => {
  const [governorshipFormDefaulters, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_FORM_DEFAULTERS_LIST)
  const [councilFormDefaulters, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_FORM_DEFAULTERS_LIST
  )
  const [streamFormDefaulters, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_FORM_DEFAULTERS_LIST
  )
  const [campusFormDefaulters, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_FORM_DEFAULTERS_LIST
  )
  const [creativeArtsFormDefaulters, { refetch: creativeArtsRefetch }] =
    useLazyQuery(CREATIVEARTS_FORM_DEFAULTERS_LIST)
  const [ministryFormDefaulters, { refetch: ministryRefetch }] = useLazyQuery(
    MINISTRY_FORM_DEFAULTERS_LIST
  )
  const [hubCouncilFormDefaulters, { refetch: hubCouncilRefetch }] =
    useLazyQuery(HUBCOUNCIL_FORM_DEFAULTERS_LIST)
  const [hubFormDefaulters, { refetch: hubRefetch }] = useLazyQuery(
    HUB_FORM_DEFAULTERS_LIST
  )

  const data = useSontaLevel({
    governorshipFunction: governorshipFormDefaulters,
    governorshipRefetch,
    councilFunction: councilFormDefaulters,
    councilRefetch,
    streamFunction: streamFormDefaulters,
    streamRefetch,
    campusFunction: campusFormDefaulters,
    campusRefetch,
    creativeArtsFunction: creativeArtsFormDefaulters,
    creativeArtsRefetch,
    ministryFunction: ministryFormDefaulters,
    ministryRefetch,
    hubCouncilFunction: hubCouncilFormDefaulters,
    hubCouncilRefetch,
    hubFunction: hubFormDefaulters,
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
            {`Fellowships That Have Not Filled The Form This Week (Week ${getWeekNumber()})`}
          </HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.formDefaultersThisWeek.length}
          >
            <h6>{`Number of Defaulters: ${church?.formDefaultersThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.formDefaultersThisWeek.map((defaulter, i) => (
              <Col key={i} xs={12} className="mb-3">
                <DefaulterCard defaulter={defaulter} />
              </Col>
            ))}
            {!church && <PlaceholderDefaulterList />}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default FormDefaulters
