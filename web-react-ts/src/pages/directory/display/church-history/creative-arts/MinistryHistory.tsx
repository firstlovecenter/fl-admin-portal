import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Timeline from 'components/Timeline/Timeline'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { MINISTRY_HISTORY } from '../HistoryQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

function MinistryHistory() {
  const { ministryId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(MINISTRY_HISTORY, {
    variables: { id: ministryId },
  })

  const ministry = data?.ministries[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center mb-5">
          <HeadingPrimary>{`${ministry?.name} ${ministry?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Ministry History</HeadingSecondary>
        </div>
        <div>
          <Timeline record={ministry?.history} limit={10} />
        </div>
      </>
    </ApolloWrapper>
  )
}

export default MinistryHistory
