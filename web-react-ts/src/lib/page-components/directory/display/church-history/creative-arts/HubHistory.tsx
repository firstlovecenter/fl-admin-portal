import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { HUB_HISTORY } from '../HistoryQueries'
import { useQuery } from '@apollo/client'

function HubHistory() {
  const { hubId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(HUB_HISTORY, {
    variables: { id: hubId },
  })

  const hub = data?.hubs[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${hub?.name} ${hub?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Hub History</HeadingSecondary>
        </div>
        <Container>
          <Timeline record={hub?.history} limit={10} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default HubHistory
