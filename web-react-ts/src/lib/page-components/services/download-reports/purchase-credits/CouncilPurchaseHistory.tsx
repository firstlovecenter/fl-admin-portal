import React, { useContext } from 'react'
import PurchaseHistory from './PurchaseHistory'
import { useQuery } from '@apollo/client'
import { COUNCIL_CREDITS_TRANSACTION_HISTORY } from '../dowloadReports.gql'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const CouncilPurchaseHistory = () => {
  const { councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    COUNCIL_CREDITS_TRANSACTION_HISTORY,
    {
      variables: { id: councilId },
    }
  )
  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <PurchaseHistory church={data?.councils[0]} />
    </ApolloWrapper>
  )
}

export default CouncilPurchaseHistory
