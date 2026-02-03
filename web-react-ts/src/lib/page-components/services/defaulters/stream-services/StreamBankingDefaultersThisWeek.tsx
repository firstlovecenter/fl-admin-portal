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
import {
  CAMPUS_STREAM_BANKING_DEFAULTERS_LIST,
  DENOMINATION_STREAM_BANKING_DEFAULTERS_LIST,
  OVERSIGHT_STREAM_BANKING_DEFAULTERS_LIST,
} from './StreamDefaultersQueries'

const StreamBankingDefaulters = () => {
  const [campusBankingDefaulters, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_STREAM_BANKING_DEFAULTERS_LIST
  )
  const [oversightBankingDefaulters, { refetch: oversightRefetch }] =
    useLazyQuery(OVERSIGHT_STREAM_BANKING_DEFAULTERS_LIST)
  const [denominationBankingDefaulters, { refetch: denominationRefetch }] =
    useLazyQuery(DENOMINATION_STREAM_BANKING_DEFAULTERS_LIST)

  const data = useChurchLevel({
    governorshipFunction: campusBankingDefaulters,
    governorshipRefetch: campusRefetch,
    councilFunction: campusBankingDefaulters,
    councilRefetch: campusRefetch,
    streamFunction: campusBankingDefaulters,
    streamRefetch: campusRefetch,
    campusFunction: campusBankingDefaulters,
    campusRefetch,
    oversightFunction: oversightBankingDefaulters,
    oversightRefetch,
    denominationFunction: denominationBankingDefaulters,
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
          <HeadingSecondary>
            {`Churches That Have Not Banked This Week Despite Having Service (Week ${getWeekNumber()})`}
          </HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.streamBankingDefaultersThisWeek?.length}
          >
            <h6>{`Number of Defaulters: ${church?.streamBankingDefaultersThisWeek?.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.streamBankingDefaultersThisWeek?.map((defaulter, i) => (
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

export default StreamBankingDefaulters
