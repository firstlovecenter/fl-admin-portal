import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'

import { useQuery } from '@apollo/client'
import { DISPLAY_COUNCIL_SERVICE } from './RecordServiceMutations'
import { ServiceContext } from 'contexts/ServiceContext'

import ServiceDetails from './ServiceDetails'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const CouncilServiceDetails = () => {
  const { councilId } = useContext(ChurchContext)
  const { serviceRecordId } = useContext(ServiceContext)
  const { data, loading, error } = useQuery(DISPLAY_COUNCIL_SERVICE, {
    variables: { serviceId: serviceRecordId, councilId },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <ServiceDetails
        loading={loading}
        service={data?.serviceRecords[0]}
        church={data?.councils[0]}
      />
    </ApolloWrapper>
  )
}

export default CouncilServiceDetails
