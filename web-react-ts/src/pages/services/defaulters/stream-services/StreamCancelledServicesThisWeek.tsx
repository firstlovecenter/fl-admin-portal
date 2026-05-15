import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import React from 'react'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import useChurchLevel from 'hooks/useChurchLevel'
import PullToRefresh from 'components/base-component/PullToRefresh'
import DefaulterCard from '../DefaulterCard'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { DefaultersUseChurchType } from '../defaulters-types'
import {
  CAMPUS_STREAM_CANCELLED_SERVICES_LIST,
  DENOMINATION_STREAM_CANCELLED_SERVICES_LIST,
  OVERSIGHT_STREAM_CANCELLED_SERVICES_LIST,
} from './StreamDefaultersQueries'

const StreamCancelledServicesThisWeek = () => {
  const [campusCancelledServices, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_STREAM_CANCELLED_SERVICES_LIST
  )
  const [oversightCancelledServices, { refetch: oversightRefetch }] =
    useLazyQuery(OVERSIGHT_STREAM_CANCELLED_SERVICES_LIST)
  const [denominationCancelledServices, { refetch: denominationRefetch }] =
    useLazyQuery(DENOMINATION_STREAM_CANCELLED_SERVICES_LIST)

  const data = useChurchLevel({
    governorshipFunction: campusCancelledServices,
    governorshipRefetch: campusRefetch,
    councilFunction: campusCancelledServices,
    councilRefetch: campusRefetch,
    streamFunction: campusCancelledServices,
    streamRefetch: campusRefetch,
    campusFunction: campusCancelledServices,
    campusRefetch,
    oversightFunction: oversightCancelledServices,
    oversightRefetch,
    denominationFunction: denominationCancelledServices,
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
          <HeadingSecondary>{`Cancelled Services This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.streamCancelledServicesThisWeek?.length}
          >
            <h6>{`Number of Cancelled Services: ${church?.streamCancelledServicesThisWeek?.length}`}</h6>
          </PlaceholderCustom>

          <div className="grid gap-3">
            {church?.streamCancelledServicesThisWeek?.map((service, i) => (
              <DefaulterCard key={i} defaulter={service} />
            ))}
            {!church && <PlaceholderDefaulterList />}
          </div>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StreamCancelledServicesThisWeek
