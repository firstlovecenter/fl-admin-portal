import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import {
  CONSTITUENCY_FORM_DEFAULTERS_LIST,
  COUNCIL_FORM_DEFAULTERS_LIST,
  STREAM_FORM_DEFAULTERS_LIST,
  GATHERINGSERVICE_FORM_DEFAULTERS_LIST,
} from './DefaultersQueries'
import DefaulterCard from './DefaulterCard'
import useChurchLevel from 'hooks/useChurchLevel'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'

const FormDefaulters = () => {
  const [constituencyFormDefaulters, { refetch: constituencyRefetch }] =
    useLazyQuery(CONSTITUENCY_FORM_DEFAULTERS_LIST)
  const [councilFormDefaulters, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_FORM_DEFAULTERS_LIST
  )
  const [streamFormDefaulters, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_FORM_DEFAULTERS_LIST
  )
  const [gatheringServiceFormDefaulters, { refetch: gatheringServiceRefetch }] =
    useLazyQuery(GATHERINGSERVICE_FORM_DEFAULTERS_LIST)

  const data: DefaultersUseChurchType = useChurchLevel({
    constituencyFunction: constituencyFormDefaulters,
    constituencyRefetch,
    councilFunction: councilFormDefaulters,
    councilRefetch,
    streamFunction: streamFormDefaulters,
    streamRefetch,
    gatheringServiceFunction: gatheringServiceFormDefaulters,
    gatheringServiceRefetch,
  })

  const { church, loading, error, refetch } = data

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
