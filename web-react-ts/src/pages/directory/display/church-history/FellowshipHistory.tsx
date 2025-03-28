import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { FELLOWSHIP_HISTORY } from './HistoryQueries'

function FellowshipHistory() {
  const { fellowshipId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(FELLOWSHIP_HISTORY, {
    variables: { id: fellowshipId },
  })
  const fellowship = data?.fellowships[0]
  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${fellowship?.name} ${fellowship?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Fellowship History</HeadingSecondary>
        </div>
        <Container>
          <Timeline record={fellowship?.history} limit={100} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default FellowshipHistory
