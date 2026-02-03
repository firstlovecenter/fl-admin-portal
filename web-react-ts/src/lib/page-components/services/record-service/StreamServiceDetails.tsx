import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'

import { useQuery } from '@apollo/client'
import { DISPLAY_STREAM_SERVICE } from './RecordServiceMutations'
import { ServiceContext } from 'contexts/ServiceContext'

import ServiceDetails from './ServiceDetails'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const StreamServiceDetails = () => {
  const { streamId } = useContext(ChurchContext)
  const { serviceRecordId } = useContext(ServiceContext)
  const { data, loading, error } = useQuery(DISPLAY_STREAM_SERVICE, {
    variables: { serviceId: serviceRecordId, streamId },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <ServiceDetails
        loading={loading}
        service={data?.serviceRecords[0]}
        church={data?.streams[0]}
      />
    </ApolloWrapper>
  )
}

export default StreamServiceDetails
