import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import { Col, Container, Row } from 'react-bootstrap'
import {
  GATHERINGSERVICE_SERVICES_COUNCIL_JOINT_LIST,
  STREAM_COUNCIL_JOINT_LIST,
} from './DefaultersQueries'
import useChurchLevel from 'hooks/useChurchLevel'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import JointServiceDefaulterCard from './JointServiceDefaultersCard'

const CouncilNotBankedThisWeek = () => {
  const [streamCouncilNotBankedThisWeek, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_COUNCIL_JOINT_LIST)
  const [gatheringServiceThisWeek, { refetch: gatheringServiceRefetch }] =
    useLazyQuery(GATHERINGSERVICE_SERVICES_COUNCIL_JOINT_LIST)

  const data: DefaultersUseChurchType = useChurchLevel({
    councilFunction: streamCouncilNotBankedThisWeek,
    councilRefetch: streamRefetch,
    streamFunction: streamCouncilNotBankedThisWeek,
    streamRefetch,
    gatheringServiceFunction: gatheringServiceThisWeek,
    gatheringServiceRefetch,
  })
  const { church, loading, error, refetch } = data

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary
            loading={!church}
          >{`${church?.name} ${church?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>{`Forms Filled This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.councilBankingDefaultersThisWeek.length}
          >
            <h6>{`Forms Filled This Week: ${church?.councilBankingDefaultersThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.councilBankingDefaultersThisWeek.map((service, i) => (
              <Col key={i} xs={12} className="mb-3">
                <JointServiceDefaulterCard
                  defaulter={service}
                  link="/council/service-details"
                />
              </Col>
            ))}
            {!church && <PlaceholderDefaulterList />}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CouncilNotBankedThisWeek
