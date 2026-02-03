import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { getWeekNumber } from 'jd-date-utils'
import { Col, Container, Row } from 'react-bootstrap'
import DefaulterCard from '../DefaulterCard'
import useChurchLevel from 'hooks/useChurchLevel'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { DefaultersUseChurchType } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CAMPUS_STREAM_FORM_DEFAULTERS_LIST,
  DENOMINATION_STREAM_FORM_DEFAULTERS_LIST,
  OVERSIGHT_STREAM_FORM_DEFAULTERS_LIST,
} from './StreamDefaultersQueries'

const StreamFormDefaulters = () => {
  const [campusStreamFormDefaulters, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_STREAM_FORM_DEFAULTERS_LIST
  )
  const [oversightStreamFormDefaulters, { refetch: oversightRefetch }] =
    useLazyQuery(OVERSIGHT_STREAM_FORM_DEFAULTERS_LIST)
  const [denominationStreamFormDefaulters, { refetch: denominationRefetch }] =
    useLazyQuery(DENOMINATION_STREAM_FORM_DEFAULTERS_LIST)

  const data = useChurchLevel({
    governorshipFunction: campusStreamFormDefaulters,
    governorshipRefetch: campusRefetch,
    councilFunction: campusStreamFormDefaulters,
    councilRefetch: campusRefetch,
    streamFunction: campusStreamFormDefaulters,
    streamRefetch: campusRefetch,
    campusFunction: campusStreamFormDefaulters,
    campusRefetch,
    oversightFunction: oversightStreamFormDefaulters,
    oversightRefetch,
    denominationFunction: denominationStreamFormDefaulters,
    denominationRefetch,
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
            {`Churches That Have Not Filled The Form This Week (Week ${getWeekNumber()})`}
          </HeadingSecondary>

          <PlaceholderCustom
            as="h6"
            loading={!church?.streamFormDefaultersThisWeek?.length}
          >
            <h6>{`Number of Defaulters: ${church?.streamFormDefaultersThisWeek?.length}`}</h6>
          </PlaceholderCustom>

          <Row>
            {church?.streamFormDefaultersThisWeek?.map((defaulter, i) => (
              <Col key={i} xs={12} className="mb-3">
                <DefaulterCard defaulter={defaulter} />
              </Col>
            ))}
            {!church && <PlaceholderDefaulterList />}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StreamFormDefaulters
