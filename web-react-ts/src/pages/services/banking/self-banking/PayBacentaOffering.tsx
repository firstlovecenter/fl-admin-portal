import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { BACENTA_SERVICE_PAYMENT } from './bankingQueries'
import PayOffering from './PayOffering'

const PayBacentaOffering = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(BACENTA_SERVICE_PAYMENT, {
    variables: {
      id: bacentaId,
    },
  })

  return (
    <PayOffering church={data?.bacentas[0]} loading={loading} error={error} />
  )
}

export default PayBacentaOffering
