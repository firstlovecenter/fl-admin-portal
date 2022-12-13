import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import { Col, Container, Row } from 'react-bootstrap'
import {
  GATHERINGSERVICE_SERVICES_CONSTITUENCY_JOINT_BANKED_LIST,
  COUNCIL_CONSTITUENCY_JOINT_BANKED_LIST,
  STREAM_CONSTITUENCY_JOINT_BANKED_LIST,
} from './DefaultersQueries'
import useChurchLevel from 'hooks/useChurchLevel'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import { DefaultersUseChurchType } from './defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import JointServiceDefaulterCard from './JointServiceDefaultersCard'

const ConstituencyBankedThisWeek = () => {
  const [councilConstituencyBankedThisWeek, { refetch: councilRefetch }] =
    useLazyQuery(COUNCIL_CONSTITUENCY_JOINT_BANKED_LIST)
  const [streamConstituencyBankedThisWeek, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_CONSTITUENCY_JOINT_BANKED_LIST)
  const [gatheringServiceThisWeek, { refetch: gatheringServiceRefetch }] =
    useLazyQuery(GATHERINGSERVICE_SERVICES_CONSTITUENCY_JOINT_BANKED_LIST)

  const data: DefaultersUseChurchType = useChurchLevel({
    councilFunction: councilConstituencyBankedThisWeek,
    councilRefetch,
    streamFunction: streamConstituencyBankedThisWeek,
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
          <HeadingSecondary>{`Services Which Banked This Week (Week ${getWeekNumber()})`}</HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.constituencyBankedThisWeek.length}
          >
            <h6>{`Services Which Banked This Week: ${church?.constituencyBankedThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.constituencyBankedThisWeek.map((service, i) => (
              <Col key={i} xs={12} className="mb-3">
                <JointServiceDefaulterCard
                  defaulter={service}
                  link="/constituency/service-details"
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

export default ConstituencyBankedThisWeek
