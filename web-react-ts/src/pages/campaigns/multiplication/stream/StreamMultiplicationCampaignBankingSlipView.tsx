import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import MultiplicationCampaignBankingSlipView from '../MultiplicationCampaignBankingSlipView'
import { STREAM_MULTIPLICATION_BANKING_SLIP_QUERY } from '../MultiplicationQueries'

const StreamMultiplicationCampaignBankingSlipView = () => {
  const { streamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    STREAM_MULTIPLICATION_BANKING_SLIP_QUERY,
    {
      variables: { streamId: streamId },
    }
  )

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <MultiplicationCampaignBankingSlipView
        loading={loading}
        church={data?.streams[0]}
        services={data?.streams[0]?.multiplicationRecords}
      />
    </ApolloWrapper>
  )
}

export default StreamMultiplicationCampaignBankingSlipView
