import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import useChurchLevel from 'hooks/useChurchLevel'
import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import DefaulterCard from './DefaulterCard'
import {
  CONSTITUENCY_BANKING_DEFAULTERS_LIST,
  COUNCIL_BANKING_DEFAULTERS_LIST,
  STREAM_BANKING_DEFAULTERS_LIST,
  GATHERINGSERVICE_BANKING_DEFAULTERS_LIST,
} from './DefaultersQueries'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'

const BankingDefaulters = () => {
  const [constituencyBankingDefaulters] = useLazyQuery(
    CONSTITUENCY_BANKING_DEFAULTERS_LIST
  )
  const [councilBankingDefaulters] = useLazyQuery(
    COUNCIL_BANKING_DEFAULTERS_LIST
  )
  const [streamBankingDefaulters] = useLazyQuery(STREAM_BANKING_DEFAULTERS_LIST)
  const [gatheringServiceBankingDefaulters] = useLazyQuery(
    GATHERINGSERVICE_BANKING_DEFAULTERS_LIST
  )

  const data: DefaultersUseChurchType = useChurchLevel({
    constituencyFunction: constituencyBankingDefaulters,
    councilFunction: councilBankingDefaulters,
    streamFunction: streamBankingDefaulters,
    gatheringServiceFunction: gatheringServiceBankingDefaulters,
  })

  const { church, loading, error } = data

  return (
    <ApolloWrapper data={church} loading={loading} error={error} placeholder>
      <Container>
        <HeadingPrimary
          loading={!church}
        >{`${church?.name} ${church?.__typename}`}</HeadingPrimary>
        <HeadingSecondary>
          {`Fellowships That Have Not Banked This Week Despite Having Service (Week ${getWeekNumber()})`}
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
                link="/fellowship/service-details"
              />
            </Col>
          ))}
          {!church && <PlaceholderDefaulterList />}
        </Row>
      </Container>
    </ApolloWrapper>
  )
}

export default BankingDefaulters
