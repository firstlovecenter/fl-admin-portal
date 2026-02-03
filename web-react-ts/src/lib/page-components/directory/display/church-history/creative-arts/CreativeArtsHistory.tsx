import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { CREATIVE_ARTS_HISTORY } from '../HistoryQueries'

function CreativeArtsHistory() {
  const { creativeArtsId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(CREATIVE_ARTS_HISTORY, {
    variables: { id: creativeArtsId },
  })

  const creativeArt = data?.creativeArts[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${creativeArt?.name} ${creativeArt?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Creative Art History</HeadingSecondary>
        </div>
        <Container>
          <Timeline record={creativeArt?.history} limit={10} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default CreativeArtsHistory
