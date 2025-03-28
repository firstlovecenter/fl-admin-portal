import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { BACENTA_HISTORY } from './HistoryQueries'

function BacentaHistory() {
  const { bacentaId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(BACENTA_HISTORY, {
    variables: { id: bacentaId },
  })

  const bacenta = data?.bacentas[0]
  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${bacenta?.name} ${bacenta?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Bacenta History</HeadingSecondary>
        </div>
        <Container>
          <Timeline record={bacenta?.history} limit={100} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default BacentaHistory
