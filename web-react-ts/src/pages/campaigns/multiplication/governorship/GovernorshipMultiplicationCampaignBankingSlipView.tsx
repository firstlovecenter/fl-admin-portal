import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import MultiplicationCampaignBankingSlipView from '../MultiplicationCampaignBankingSlipView'
import { GOVERNORSHIP_MULTIPLICATION_BANKING_SLIP_QUERY } from '../MultiplicationQueries'

const GovernorshipMultiplicationCampaignBankingSlipView = () => {
  const { governorshipId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    GOVERNORSHIP_MULTIPLICATION_BANKING_SLIP_QUERY,
    {
      variables: { governorshipId: governorshipId },
    }
  )

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <MultiplicationCampaignBankingSlipView
        loading={loading}
        church={data?.governorships[0]}
        services={data?.governorships[0]?.multiplicationRecords}
      />
    </ApolloWrapper>
  )
}

export default GovernorshipMultiplicationCampaignBankingSlipView
