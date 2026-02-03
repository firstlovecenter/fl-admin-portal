import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { ChurchContext } from 'contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import Timeline from 'components/Timeline/Timeline'
import { CAMPUS_HISTORY } from './HistoryQueries'

function CampusHistory() {
  const { campusId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(CAMPUS_HISTORY, {
    variables: { id: campusId },
  })

  const campus = data?.campuses[0]
  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${campus?.name} ${campus?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Campus History</HeadingSecondary>
        </div>
        <Container>
          <Timeline record={campus?.history} limit={100} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default CampusHistory
