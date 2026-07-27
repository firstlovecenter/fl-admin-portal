import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'lib/date-utils'
import { formatChurchLevel } from 'lib/scope-display'
import useChurchLevel from 'hooks/useChurchLevel'
import React from 'react'
import { useTranslation } from 'react-i18next'
import PullToRefresh from 'components/base-component/PullToRefresh'
import DefaulterCard from '../DefaulterCard'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { DefaultersUseChurchType } from '../defaulters-types'
import {
  CAMPUS_STREAM_BANKED_LIST,
  DENOMINATION_STREAM_BANKED_LIST,
  OVERSIGHT_STREAM_BANKED_LIST,
} from './StreamDefaultersQueries'

const StreamBanked = () => {
  const { t } = useTranslation()
  const [campusBanked, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_STREAM_BANKED_LIST
  )
  const [oversightBanked, { refetch: oversightRefetch }] = useLazyQuery(
    OVERSIGHT_STREAM_BANKED_LIST
  )
  const [denomination, { refetch: denominationRefetch }] = useLazyQuery(
    DENOMINATION_STREAM_BANKED_LIST
  )

  const data = useChurchLevel({
    governorshipFunction: campusBanked,
    governorshipRefetch: campusRefetch,
    councilFunction: campusBanked,
    councilRefetch: campusRefetch,
    streamFunction: campusBanked,
    streamRefetch: campusRefetch,
    campusFunction: campusBanked,
    campusRefetch,
    oversightFunction: oversightBanked,
    oversightRefetch,
    denominationFunction: denomination,
    denominationRefetch,
  })

  const { church, loading, error, refetch } = data as DefaultersUseChurchType
  const week = getWeekNumber()
  const count = church?.streamBankedThisWeek?.length ?? 0

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div className="mx-auto w-full max-w-screen-md px-4">
          <HeadingPrimary loading={!church}>
            {`${church?.name} ${formatChurchLevel(church?.__typename, t)}`}
          </HeadingPrimary>
          <HeadingSecondary>
            {t('services.defaulters.streamBanked', { week })}
          </HeadingSecondary>

          <PlaceholderCustom as="h6" loading={!church}>
            <h6>{t('services.defaulters.streamBankedCount', { count })}</h6>
          </PlaceholderCustom>

          <div className="grid gap-3">
            {church?.streamBankedThisWeek?.map((defaulter, i) => (
              <DefaulterCard
                key={i}
                defaulter={defaulter}
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

export default StreamBanked
