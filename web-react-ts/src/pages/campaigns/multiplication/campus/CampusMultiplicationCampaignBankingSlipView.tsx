import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import MultiplicationCampaignBankingSlipView from '../MultiplicationCampaignBankingSlipView'
import { CAMPUS_MULTIPLICATION_BANKING_SLIP_QUERY } from '../MultiplicationQueries'

const CampusMultiplicationCampaignBankingSlipView = () => {
  const { campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    CAMPUS_MULTIPLICATION_BANKING_SLIP_QUERY,
    {
      variables: { campusId: campusId },
    }
  )

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <MultiplicationCampaignBankingSlipView
        loading={loading}
        church={data?.campuses[0]}
        services={data?.campuses[0]?.multiplicationRecords}
      />
    </ApolloWrapper>
  )
}

export default CampusMultiplicationCampaignBankingSlipView
