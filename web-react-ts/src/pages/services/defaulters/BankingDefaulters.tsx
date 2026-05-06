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
  GOVERNORSHIP_BANKING_DEFAULTERS_LIST,
  COUNCIL_BANKING_DEFAULTERS_LIST,
  STREAM_BANKING_DEFAULTERS_LIST,
  CAMPUS_BANKING_DEFAULTERS_LIST,
} from './DefaultersQueries'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import useSontaLevel from 'hooks/useSontaLevel'

const BankingDefaulters = () => {
  const [governorshipBankingDefaulters, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_BANKING_DEFAULTERS_LIST)
  const [councilBankingDefaulters, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_BANKING_DEFAULTERS_LIST
  )
  const [streamBankingDefaulters, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_BANKING_DEFAULTERS_LIST
  )
  const [campusBankingDefaulters, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_BANKING_DEFAULTERS_LIST
  )

  const data = useSontaLevel({
    governorshipFunction: governorshipBankingDefaulters,
    governorshipRefetch,
    councilFunction: councilBankingDefaulters,
    councilRefetch,
    streamFunction: streamBankingDefaulters,
    streamRefetch,
    campusFunction: campusBankingDefaulters,
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
            {`Bacentas That Have Not Banked This Week Despite Having Service (Week ${getWeekNumber()})`}
          </HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.bankingDefaultersThisWeek.length}
          >
            <h6>{`Number of Defaulters: ${church?.bankingDefaultersThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.bankingDefaultersThisWeek.map((defaulter, i) => (
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

export default BankingDefaulters
