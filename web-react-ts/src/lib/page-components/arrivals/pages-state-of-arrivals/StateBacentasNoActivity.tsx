import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import React from 'react'
import { Container } from 'react-bootstrap'
import {
  GOVERNORSHIP_BACENTAS_NO_ACTIVITY,
  COUNCIL_BACENTAS_NO_ACTIVITY,
  CAMPUS_BACENTAS_NO_ACTIVITY,
  STREAM_BACENTAS_NO_ACTIVITY,
} from '../bussingStatusQueries'
import useChurchLevel from 'hooks/useChurchLevel'
import NoData from '../CompNoData'
import PlaceholderDefaulterList from 'pages/services/defaulters/PlaceholderDefaulterList'
import { ArrivalsUseChurchType } from '../arrivals-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { LONG_POLL_INTERVAL } from 'global-utils'

const BacentasNoActiviity = () => {
  const [governorshipBacentasNoActivity, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_BACENTAS_NO_ACTIVITY, {
      pollInterval: LONG_POLL_INTERVAL,
    })
  const [councilBacentasNoActivity, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_BACENTAS_NO_ACTIVITY,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )
  const [streamBacentasNoActivity, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_BACENTAS_NO_ACTIVITY,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )
  const [campusBacentasNoActivity, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_BACENTAS_NO_ACTIVITY,
    {
      pollInterval: LONG_POLL_INTERVAL,
    }
  )

  const data = useChurchLevel({
    governorshipFunction: governorshipBacentasNoActivity,
    governorshipRefetch,
    councilFunction: councilBacentasNoActivity,
    councilRefetch,
    streamFunction: streamBacentasNoActivity,
    streamRefetch,
    campusFunction: campusBacentasNoActivity,
    campusRefetch,
  })
  const { church, loading, error, refetch } = data as ArrivalsUseChurchType

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary loading={loading}>
            Bacentas With No Activity
          </HeadingPrimary>
          <HeadingSecondary loading={!church?.name}>
            {church?.name} {church?.__typename}
          </HeadingSecondary>

          {church && !church?.bacentasNoActivity.length && (
            <NoData text="There are no bacentas without activity" />
          )}

          {church?.bacentasNoActivity.map((bacenta, i) => (
            <MemberDisplayCard
              key={i}
              member={bacenta}
              leader={bacenta.leader}
              contact
            />
          ))}

          {!church?.bacentasNoActivity.length && loading && (
            <PlaceholderDefaulterList />
          )}
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BacentasNoActiviity
