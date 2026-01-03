import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import CampaignChurchList from '../../CampaignChurchList'
import { GOVERNORSHIP_LIST } from '../SwollenSundayQueries'

const SwollenSundayGovernorshipList = () => {
  const { councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GOVERNORSHIP_LIST, {
    variables: {
      councilId: councilId,
    },
  })

  const governorships = data?.councils[0]?.governorships

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div className="text-center">
        <HeadingPrimary>Swollen Sunday Campaign</HeadingPrimary>
        <HeadingSecondary>
          {`${data?.councils[0]?.name} ${data?.councils[0]?.__typename}`}{' '}
          Governorships
        </HeadingSecondary>
        <CampaignChurchList data={governorships} page="swollen-sunday" />
      </div>
    </ApolloWrapper>
  )
}

export default SwollenSundayGovernorshipList
