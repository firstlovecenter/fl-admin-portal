import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import { Container, Row, Col } from 'react-bootstrap'
import DefaulterCard from '../DefaulterCard'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import {
  DefaultersUseChurchType,
  BacentaWithDefaulters,
} from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CREATIVEARTS_HUB_BANKED_LIST,
  HUBCOUNCIL_HUB_BANKED_LIST,
  MINISTRY_HUB_BANKED_LIST,
  CAMPUS_HUB_BANKED_LIST,
} from './SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const Banked = () => {
  const [hubCouncilBankedThisWeeek, { refetch: hubCouncilRefetch }] =
    useLazyQuery(HUBCOUNCIL_HUB_BANKED_LIST)
  const [ministryBankedThisWeek, { refetch: ministryRefetch }] = useLazyQuery(
    MINISTRY_HUB_BANKED_LIST
  )
  const [creativeArtsBankedThisWeek, { refetch: creativeArtsRefetch }] =
    useLazyQuery(CREATIVEARTS_HUB_BANKED_LIST)
  const [campusBankedThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_HUB_BANKED_LIST
  )

  const data = useSontaLevel({
    hubRefetch: hubCouncilRefetch,
    hubCouncilFunction: hubCouncilBankedThisWeeek,
    hubCouncilRefetch,
    councilFunction: ministryBankedThisWeek,
    ministryRefetch,
    creativeArtsFunction: creativeArtsBankedThisWeek,
    creativeArtsRefetch,
    campusFunction: campusBankedThisWeek,
    campusRefetch,
  })

  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary
            loading={!church}
          >{`${church?.name} ${church?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>
            {`Hubs That Have Banked This Week (Week ${getWeekNumber()})`}
          </HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.hubsBankedThisWeek.length}
          >
            <h6>{`Number Who Have Banked: ${church?.hubsBankedThisWeek.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.hubsBankedThisWeek.map(
              (defaulter: BacentaWithDefaulters, i: number) => (
                <Col key={i} xs={12} className="mb-3">
                  <DefaulterCard
                    defaulter={defaulter}
                    link="/hub/service-details"
                  />
                </Col>
              )
            )}
            {!church && <PlaceholderDefaulterList />}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default Banked
