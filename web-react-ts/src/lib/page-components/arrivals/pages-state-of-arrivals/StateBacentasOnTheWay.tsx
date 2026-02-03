import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { LONG_POLL_INTERVAL } from 'global-utils'
import useChurchLevel from 'hooks/useChurchLevel'
import PlaceholderDefaulterList from 'pages/services/defaulters/PlaceholderDefaulterList'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { ArrivalsUseChurchType } from '../arrivals-types'
import {
  GOVERNORSHIP_BACENTAS_ON_THE_WAY,
  COUNCIL_BACENTAS_ON_THE_WAY,
  CAMPUS_BACENTAS_ON_THE_WAY,
  STREAM_BACENTAS_ON_THE_WAY,
} from '../bussingStatusQueries'
import NoData from '../CompNoData'

const BacentasOnTheWay = () => {
  const { clickCard } = useContext(ChurchContext)
  const router = useRouter()
  const [governorshipOnTheWay, { refetch: governorshipRefetch }] = useLazyQuery(
    GOVERNORSHIP_BACENTAS_ON_THE_WAY,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )
  const [councilOnTheWay, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_BACENTAS_ON_THE_WAY,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )
  const [streamOnTheWay, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_BACENTAS_ON_THE_WAY,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )
  const [campusOnTheWay, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_BACENTAS_ON_THE_WAY,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )

  const data = useChurchLevel({
    governorshipFunction: governorshipOnTheWay,
    governorshipRefetch,
    councilFunction: councilOnTheWay,
    councilRefetch,
    streamFunction: streamOnTheWay,
    streamRefetch,
    campusFunction: campusOnTheWay,
    campusRefetch,
  })
  const { church, loading, error, refetch } = data as ArrivalsUseChurchType

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary loading={loading}>Bacentas On The Way</HeadingPrimary>
          <HeadingSecondary loading={!church?.name}>
            {church?.name} {church?.__typename}
          </HeadingSecondary>

          {church && !church?.bacentasOnTheWay.length && (
            <NoData text="There are no bacentas on the way" />
          )}

          {church?.bacentasOnTheWay?.map((bacenta, i) => (
            <MemberDisplayCard
              key={i}
              member={bacenta}
              leader={bacenta.leader}
              contact
              onClick={() => {
                clickCard(bacenta)
                clickCard(bacenta.bussingThisWeek)
                router.push('/bacenta/bussing-details')
              }}
            />
          ))}

          {!church?.bacentasOnTheWay.length && loading && (
            <PlaceholderDefaulterList />
          )}
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BacentasOnTheWay
