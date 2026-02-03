import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { COUNCIL_SERVICE_PAYMENT } from './bankingQueries'
import PayOffering from './PayOffering'

const PayCouncilOffering = () => {
  const { councilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(COUNCIL_SERVICE_PAYMENT, {
    variables: {
      id: councilId,
    },
  })

  return (
    <PayOffering church={data?.councils[0]} loading={loading} error={error} />
  )
}

export default PayCouncilOffering
