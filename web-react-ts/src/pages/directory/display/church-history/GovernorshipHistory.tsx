import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { GOVERNORSHIP_HISTORY } from './HistoryQueries'

function GovernorshipHistory() {
  const { governorshipId } = useContext(ChurchContext)
  const { data, error, loading } = useQuery(GOVERNORSHIP_HISTORY, {
    variables: { id: governorshipId },
  })
  const governorship = data?.governorships[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${governorship?.name} ${governorship?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Governorship History</HeadingSecondary>
        </div>
        <Container>
          <Timeline record={governorship?.history} limit={100} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default GovernorshipHistory
