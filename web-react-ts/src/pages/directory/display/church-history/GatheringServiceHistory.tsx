import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { GATHERING_SERVICE_HISTORY } from '../ReadQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import Timeline from 'components/Timeline/Timeline'

function GatheringServiceHistory() {
  const { gatheringServiceId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GATHERING_SERVICE_HISTORY, {
    variables: { id: gatheringServiceId },
  })

  const gatheringService = data?.gatheringServices[0]
  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${gatheringService?.name} ${gatheringService?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Gathering Service History</HeadingSecondary>
        </div>
        <Container>
          <Timeline record={gatheringService?.history} limit={10} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default GatheringServiceHistory