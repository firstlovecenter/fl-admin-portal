import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { COUNCIL_HISTORY } from './HistoryQueries'

function CouncilHistory() {
  const { councilId } = useContext(ChurchContext)
  const { data, error, loading } = useQuery(COUNCIL_HISTORY, {
    variables: { id: councilId },
  })
  const council = data?.councils[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${council?.name} ${council?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Council History</HeadingSecondary>
        </div>
        <Container>
          <Timeline record={council?.history} limit={100} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default CouncilHistory
