import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import MultiplicationCampaignBankingSlipView from '../MultiplicationCampaignBankingSlipView'
import { COUNCIL_MULTIPLICATION_BANKING_SLIP_QUERY } from '../MultiplicationQueries'

const CouncilMultiplicationCampaignBankingSlipView = () => {
  const { councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    COUNCIL_MULTIPLICATION_BANKING_SLIP_QUERY,
    {
      variables: { councilId: councilId },
    }
  )

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <MultiplicationCampaignBankingSlipView
        loading={loading}
        church={data?.councils[0]}
        services={data?.councils[0]?.multiplicationRecords}
      />
    </ApolloWrapper>
  )
}

export default CouncilMultiplicationCampaignBankingSlipView
