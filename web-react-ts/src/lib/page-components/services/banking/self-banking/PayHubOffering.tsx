import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { HUB_REHEARSALS_PAYMENT } from './bankingQueries'
import PayRehearsalOffering from './PayRehearsalOffering'

const PayHubOffering = () => {
  const { hubId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(HUB_REHEARSALS_PAYMENT, {
    variables: {
      id: hubId,
    },
  })

  return (
    <PayRehearsalOffering
      church={data?.hubs[0]}
      loading={loading}
      error={error}
    />
  )
}

export default PayHubOffering
