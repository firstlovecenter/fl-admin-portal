import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import {
  CAMPUS_SERVICES_COUNCIL_JOINT_BANKED_LIST,
  STREAM_COUNCIL_JOINT_BANKED_LIST,
} from './DefaultersQueries'
import useChurchLevel from 'hooks/useChurchLevel'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import JointServiceDefaulterCard from './JointServiceDefaultersCard'

const CouncilBankedThisWeek = () => {
  const [streamCouncilBankedThisWeek, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_COUNCIL_JOINT_BANKED_LIST)
  const [campusThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_SERVICES_COUNCIL_JOINT_BANKED_LIST
  )

  const data = useChurchLevel({
    councilFunction: streamCouncilBankedThisWeek,
    councilRefetch: streamRefetch,
    streamFunction: streamCouncilBankedThisWeek,
    streamRefetch,
    campusFunction: campusThisWeek,
    campusRefetch,
  })
  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div>
          <HeadingPrimary
            loading={!church}
          >{`${church?.name} ${church?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>{`Services Which Banked This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.councilBankedThisWeek.length}
          >
            <h6>{`Services Which Banked This Week: ${church?.councilBankedThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <div>
            {church?.councilBankedThisWeek.map((service, i) => (
              <div key={i} xs={12} className="mb-3">
                <JointServiceDefaulterCard
                  defaulter={service}
                  link="/council/service-details"
                />
              </div>
            ))}
            {!church && <PlaceholderDefaulterList />}
          </div>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CouncilBankedThisWeek
