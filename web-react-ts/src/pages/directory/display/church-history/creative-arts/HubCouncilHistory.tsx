import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { HUB_COUNCIL_HISTORY } from '../HistoryQueries'

function BacentaHistory() {
  const { hubCouncilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(HUB_COUNCIL_HISTORY, {
    variables: { id: hubCouncilId },
  })

  const hubCouncil = data?.hubCouncils[0]
  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${hubCouncil?.name} ${hubCouncil?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Hub Council History</HeadingSecondary>
        </div>
        <div>
          <Timeline record={hubCouncil?.history} limit={10} />
        </div>
      </>
    </ApolloWrapper>
  )
}

export default BacentaHistory
