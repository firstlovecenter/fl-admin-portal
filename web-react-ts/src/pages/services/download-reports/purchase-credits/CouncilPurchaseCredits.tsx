import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { COUNCIL_SERVICE_PAYMENT } from 'pages/services/banking/self-banking/bankingQueries'
import React, { useContext } from 'react'
import PurchaseDownloadCredits from './PurchaseDownloadCredits'

const PurchaseCouncilCredits = () => {
  const { councilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(COUNCIL_SERVICE_PAYMENT, {
    variables: {
      id: councilId,
    },
  })

  return (
    <PurchaseDownloadCredits
      church={data?.councils[0]}
      loading={loading}
      error={error}
    />
  )
}

export default PurchaseCouncilCredits
