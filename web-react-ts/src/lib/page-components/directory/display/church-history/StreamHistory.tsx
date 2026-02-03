import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { STREAM_HISTORY } from './HistoryQueries'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'

function StreamHistory() {
  const { streamId } = useContext(ChurchContext)
  const { error, loading, data } = useQuery(STREAM_HISTORY, {
    variables: { id: streamId },
  })
  const stream = data?.streams[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${stream?.name} ${stream?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Stream History</HeadingSecondary>
        </div>
        <Container>
          <Timeline record={stream?.history} limit={100} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default StreamHistory
