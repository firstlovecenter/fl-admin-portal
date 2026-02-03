import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import {
  GOVERNORSHIP_BACENTAS_MOBILISING,
  COUNCIL_BACENTAS_MOBILISING,
  CAMPUS_BACENTAS_MOBILISING,
  STREAM_BACENTAS_MOBILISING,
} from '../bussingStatusQueries'
import useChurchLevel from 'hooks/useChurchLevel'
import NoData from '../CompNoData'
import PlaceholderDefaulterList from 'pages/services/defaulters/PlaceholderDefaulterList'
import { ChurchContext } from 'contexts/ChurchContext'
import { useRouter } from 'next/navigation'
import { ArrivalsUseChurchType } from '../arrivals-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { LONG_POLL_INTERVAL } from 'global-utils'

const BacentasMobilising = () => {
  const { clickCard } = useContext(ChurchContext)
  const router = useRouter()
  const [governorshipBacentasMobilising, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_BACENTAS_MOBILISING, {
      pollInterval: LONG_POLL_INTERVAL,
    })
  const [councilBacentasMobilising, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_BACENTAS_MOBILISING,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )
  const [streamBacentasMobilising, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_BACENTAS_MOBILISING,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )
  const [campusBacentasMobilising, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_BACENTAS_MOBILISING,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )

  const data = useChurchLevel({
    governorshipFunction: governorshipBacentasMobilising,
    governorshipRefetch,
    councilFunction: councilBacentasMobilising,
    councilRefetch,
    streamFunction: streamBacentasMobilising,
    streamRefetch,
    campusFunction: campusBacentasMobilising,
    campusRefetch,
  })
  const { church, loading, error, refetch } = data as ArrivalsUseChurchType

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary loading={loading}>Bacentas Mobilising</HeadingPrimary>
          <HeadingSecondary loading={!church?.name}>
            {church?.name} {church?.__typename}
          </HeadingSecondary>

          {church && !church?.bacentasMobilising.length && (
            <NoData text="There are no mobilising bacentas" />
          )}

          {church?.bacentasMobilising.map((bacenta, i) => {
            return (
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
            )
          })}

          {!church?.bacentasMobilising.length && loading && (
            <PlaceholderDefaulterList />
          )}
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BacentasMobilising
