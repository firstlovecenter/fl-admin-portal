import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import CampaignChurchList from '../../CampaignChurchList'
import { COUNCIL_LIST } from '../SwollenSundayQueries'

const SwollenSundayCouncilList = () => {
  const { streamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(COUNCIL_LIST, {
    variables: {
      streamId: streamId,
    },
  })

  const councils = data?.streams[0]?.councils

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div className="text-center">
        <HeadingPrimary>Swollen Sunday Campaign</HeadingPrimary>
        <HeadingSecondary>
          {`${data?.streams[0]?.name} ${data?.streams[0]?.__typename}`} Councils
        </HeadingSecondary>
        <CampaignChurchList data={councils} page="swollen-sunday" />
      </div>
    </ApolloWrapper>
  )
}

export default SwollenSundayCouncilList
