import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import useChurchLevel from 'hooks/useChurchLevel'
import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import DefaulterCard from '../DefaulterCard'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { DefaultersUseChurchType } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { CAMPUS_STREAM_BANKED_LIST } from './StreamDefaultersQueries'

const StreamBanked = () => {
  const [campusBanked, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_STREAM_BANKED_LIST
  )

  const data = useChurchLevel({
    constituencyFunction: campusBanked,
    constituencyRefetch: campusRefetch,
    councilFunction: campusBanked,
    councilRefetch: campusRefetch,
    streamFunction: campusBanked,
    streamRefetch: campusRefetch,
    campusFunction: campusBanked,
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
          <HeadingSecondary>
            {`Churches That Have Banked This Week (Week ${getWeekNumber()})`}
          </HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.streamBankedThisWeek?.length}
          >
            <h6>{`Number Who Have Banked: ${church?.streamBankedThisWeek?.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.streamBankedThisWeek?.map((defaulter, i) => (
              <Col key={i} xs={12} className="mb-3">
                <DefaulterCard
                  defaulter={defaulter}
                  link="/stream/service-details"
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

export default StreamBanked
