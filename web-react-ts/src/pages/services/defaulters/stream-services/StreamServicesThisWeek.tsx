import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'lib/date-utils'
import React from 'react'
import DefaulterCard from '../DefaulterCard'
import useChurchLevel from 'hooks/useChurchLevel'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { DefaultersUseChurchType } from '../defaulters-types'
import {
  CAMPUS_STREAM_SERVICES_LIST,
  DENOMINATION_STREAM_SERVICES_LIST,
  OVERSIGHT_STREAM_SERVICES_LIST,
} from './StreamDefaultersQueries'

const StreamServicesThisWeek = () => {
  const [campusThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_STREAM_SERVICES_LIST
  )
  const [oversightThisWeek, { refetch: oversightRefetch }] = useLazyQuery(
    OVERSIGHT_STREAM_SERVICES_LIST
  )
  const [denominationThisWeek, { refetch: denominationRefetch }] = useLazyQuery(
    DENOMINATION_STREAM_SERVICES_LIST
  )

  const data = useChurchLevel({
    governorshipFunction: campusThisWeek,
    governorshipRefetch: campusRefetch,
    councilFunction: campusThisWeek,
    councilRefetch: campusRefetch,
    streamFunction: campusThisWeek,
    streamRefetch: campusRefetch,
    campusFunction: campusThisWeek,
    campusRefetch,
    oversightFunction: oversightThisWeek,
    oversightRefetch,
    denominationFunction: denominationThisWeek,
    denominationRefetch,
  })
  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div className="mx-auto w-full max-w-screen-md px-4">
          <HeadingPrimary
            loading={!church}
          >{`${church?.name} ${church?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>{`Forms Filled This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.streamServicesThisWeek?.length}
          >
            <h6>{`Forms Filled This Week: ${church?.streamServicesThisWeek?.length}`}</h6>
          </PlaceholderCustom>

          <div className="grid gap-3">
            {church?.streamServicesThisWeek?.map((service, i) => (
              <DefaulterCard
                key={i}
                defaulter={service}
                link="/stream/service-details"
              />
            ))}
            {!church && <PlaceholderDefaulterList />}
          </div>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StreamServicesThisWeek
