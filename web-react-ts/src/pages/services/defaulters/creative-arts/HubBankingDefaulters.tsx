import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import { Container, Row, Col } from 'react-bootstrap'
import DefaulterCard from '../DefaulterCard'

import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import {
  DefaultersUseChurchType,
  BacentaWithDefaulters,
} from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CAMPUS_BANKING_DEFAULTERS_LIST,
  CREATIVEARTS_BANKING_DEFAULTERS_LIST,
  HUBCOUNCIL_BANKING_DEFAULTERS_LIST,
  MINISTRY_BANKING_DEFAULTERS_LIST,
} from './SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const BankingDefaulters = () => {
  const [hubCouncilBankingDefaultersThisWeeek, { refetch: hubCouncilRefetch }] =
    useLazyQuery(HUBCOUNCIL_BANKING_DEFAULTERS_LIST)
  const [ministryBankingDefaultersThisWeek, { refetch: ministryRefetch }] =
    useLazyQuery(MINISTRY_BANKING_DEFAULTERS_LIST)
  const [
    creativeArtsBankingDefaultersThisWeek,
    { refetch: creativeArtsRefetch },
  ] = useLazyQuery(CREATIVEARTS_BANKING_DEFAULTERS_LIST)
  const [campusBankingDefaultersThisWeek, { refetch: campusRefetch }] =
    useLazyQuery(CAMPUS_BANKING_DEFAULTERS_LIST)

  const data = useSontaLevel({
    hubRefetch: hubCouncilRefetch,
    hubCouncilFunction: hubCouncilBankingDefaultersThisWeeek,
    hubCouncilRefetch,
    councilFunction: ministryBankingDefaultersThisWeek,
    ministryRefetch,
    creativeArtsFunction: creativeArtsBankingDefaultersThisWeek,
    creativeArtsRefetch,
    campusFunction: campusBankingDefaultersThisWeek,
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
            {`Hubs That Have Not Banked This Week Despite Having Rehearsal (Week ${getWeekNumber()})`}
          </HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.hubBankingDefaultersThisWeek.length}
          >
            <h6>{`Number of Defaulters: ${church?.hubBankingDefaultersThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.hubBankingDefaultersThisWeek.map(
              (defaulter: BacentaWithDefaulters, i: number) => (
                <Col key={i} xs={12} className="mb-3">
                  <DefaulterCard
                    defaulter={defaulter}
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

export default BankingDefaulters
