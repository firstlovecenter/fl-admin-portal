import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import { getWeekNumber, isAuthorised } from 'global-utils'
import React, { useContext, useEffect, useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import DefaulterCard from './DefaulterCard'
import {
  CONSTITUENCY_BANKED_LIST,
  COUNCIL_BANKED_LIST,
  STREAM_BANKED_LIST,
  GATHERINGSERVICE_BANKED_LIST,
} from './DefaultersQueries'
import PlaceholderDefaulter from './PlaceholderDefaulter'

const Banked = () => {
  const { currentUser } = useContext(MemberContext)
  const [church, setChurch] = useState(null)
  const [constituencyBanked, { data: constituencyData }] = useLazyQuery(
    CONSTITUENCY_BANKED_LIST
  )
  const [councilBanked, { data: councilData }] =
    useLazyQuery(COUNCIL_BANKED_LIST)
  const [streamBanked, { data: streamData }] = useLazyQuery(STREAM_BANKED_LIST)
  const [gatheringServiceBanked, { data: gatheringServiceData }] = useLazyQuery(
    GATHERINGSERVICE_BANKED_LIST
  )

  useEffect(() => {
    if (
      isAuthorised(
        ['adminConstituency', 'leaderConstituency'],
        currentUser.roles
      )
    ) {
      constituencyBanked({
        variables: {
          id: currentUser.constituency,
        },
      })
      setChurch(constituencyData?.constituencies[0])
    }
    if (isAuthorised(['adminCouncil', 'leaderCouncil'], currentUser.roles)) {
      councilBanked({
        variables: {
          id: currentUser.council,
        },
      })
      setChurch(councilData?.councils[0])
    }
    if (isAuthorised(['adminStream', 'leaderStream'], currentUser.roles)) {
      streamBanked({
        variables: {
          id: currentUser.stream,
        },
      })
      setChurch(streamData?.streams[0])
    }
    if (
      isAuthorised(
        ['adminGatheringService', 'leaderGatheringService'],
        currentUser.roles
      )
    ) {
      gatheringServiceBanked({
        variables: {
          id: currentUser.gatheringService,
        },
      })
      setChurch(gatheringServiceData?.gatheringServices[0])
    }
  }, [
    currentUser.constituency,
    constituencyData,
    councilData,
    streamData,
    gatheringServiceData,
  ])

  return (
    <Container>
      <HeadingPrimary
        loading={!church}
      >{`${church?.name} ${church?.__typename}`}</HeadingPrimary>
      <HeadingSecondary>
        {`Fellowships That Have Banked This Week (Week ${getWeekNumber()})`}
      </HeadingSecondary>

      <PlaceholderCustom as="h6" loading={!church?.bankedThisWeek.length}>
        <h6>{`Number Who Have Banked: ${church?.bankedThisWeek.length}`}</h6>
      </PlaceholderCustom>

      <Row>
        {church?.bankedThisWeek.map((defaulter, i) => (
          <Col key={i} xs={12} className="mb-3">
            <DefaulterCard
              defaulter={defaulter}
              link="/fellowship/service-details"
            />
          </Col>
        ))}
        {!church && <PlaceholderDefaulter />}
      </Row>
    </Container>
  )
}

export default Banked
