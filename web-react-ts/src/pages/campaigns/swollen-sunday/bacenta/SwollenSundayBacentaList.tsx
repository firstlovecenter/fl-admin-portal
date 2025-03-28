import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import CampaignChurchList from '../../CampaignChurchList'
import { BACENTA_LIST } from '../SwollenSundayQueries'

const SwollenSundayBacentaList = () => {
  const { governorshipId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(BACENTA_LIST, {
    variables: {
      governorshipId: governorshipId,
    },
  })

  const bacentas = data?.governorships[0]?.bacentas

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div className="text-center">
        <HeadingPrimary>Swollen Sunday Campaign</HeadingPrimary>
        <HeadingSecondary>
          {`${data?.governorships[0]?.name} ${data?.governorships[0]?.__typename}`}{' '}
          Bacentas
        </HeadingSecondary>
        <CampaignChurchList data={bacentas} page="swollen-sunday" />
      </div>
    </ApolloWrapper>
  )
}

export default SwollenSundayBacentaList
