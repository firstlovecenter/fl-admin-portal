import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { GOVERNORSHIP_SERVICE_PAYMENT } from './bankingQueries'
import PayOffering from './PayOffering'

const PayGovernorshipOffering = () => {
  const { governorshipId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GOVERNORSHIP_SERVICE_PAYMENT, {
    variables: {
      id: governorshipId,
    },
  })

  return (
    <PayOffering
      church={data?.governorships[0]}
      loading={loading}
      error={error}
    />
  )
}

export default PayGovernorshipOffering
