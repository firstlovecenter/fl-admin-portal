import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { useContext } from 'react'
import { Container } from 'react-bootstrap'
import {
  GOVERNORSHIP_BACENTAS_BELOW_8,
  COUNCIL_BACENTAS_BELOW_8,
  CAMPUS_BACENTAS_BELOW_8,
  STREAM_BACENTAS_BELOW_8,
} from '../bussingStatusQueries'
import useChurchLevel from 'hooks/useChurchLevel'
import NoData from '../CompNoData'
import PlaceholderDefaulterList from 'pages/services/defaulters/PlaceholderDefaulterList'
import { useNavigate } from 'react-router'
import { ChurchContext } from 'contexts/ChurchContext'
import { ArrivalsUseChurchType } from '../arrivals-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { LONG_POLL_INTERVAL } from 'global-utils'

const BacentasBelow8 = () => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const [governorshipBacentasBelow8, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_BACENTAS_BELOW_8, {
      pollInterval: LONG_POLL_INTERVAL,
    })
  const [councilBacentasBelow8, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_BACENTAS_BELOW_8,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )
  const [streamBacentasBelow8, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_BACENTAS_BELOW_8,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )
  const [campusBacentasBelow8, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_BACENTAS_BELOW_8,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )

  const data = useChurchLevel({
    governorshipFunction: governorshipBacentasBelow8,
    governorshipRefetch,
    councilFunction: councilBacentasBelow8,
    councilRefetch,
    streamFunction: streamBacentasBelow8,
    streamRefetch,
    campusFunction: campusBacentasBelow8,
    campusRefetch,
  })
  const { church, loading, error, refetch } = data as ArrivalsUseChurchType

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary loading={loading}>
            Bacentas That Didn't Bus
          </HeadingPrimary>
          <HeadingSecondary loading={!church?.name}>
            {church?.name} {church?.__typename}
          </HeadingSecondary>

          {church && !church?.bacentasBelow8.length && (
            <NoData text="There are no bacentas that didn't bus" />
          )}

          {church?.bacentasBelow8.map((bacenta, i: number) => (
            <MemberDisplayCard
              key={i}
              member={bacenta}
              leader={bacenta.leader}
              contact
              onClick={() => {
                clickCard(bacenta)
                clickCard(bacenta.bussingThisWeek)
                navigate('/bacenta/bussing-details')
              }}
            >
              <span className="fw-bold">
                Attendance: {bacenta.bussingThisWeek.attendance}
              </span>
            </MemberDisplayCard>
          ))}

          {!church?.bacentasBelow8.length && loading && (
            <PlaceholderDefaulterList />
          )}
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BacentasBelow8
