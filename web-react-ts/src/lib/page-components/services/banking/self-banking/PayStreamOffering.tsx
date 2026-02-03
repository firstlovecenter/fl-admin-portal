import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { STREAM_SERVICE_PAYMENT } from './bankingQueries'
import PayOffering from './PayOffering'

const PayStreamOffering = () => {
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(STREAM_SERVICE_PAYMENT, {
    variables: {
      id: streamId,
    },
  })

  return (
    <PayOffering church={data?.streams[0]} loading={loading} error={error} />
  )
}

export default PayStreamOffering
