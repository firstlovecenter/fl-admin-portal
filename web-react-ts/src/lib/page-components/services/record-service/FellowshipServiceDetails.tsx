import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'

import { useQuery } from '@apollo/client'
import { DISPLAY_FELLOWSHIP_SERVICE } from './RecordServiceMutations'
import { ServiceContext } from 'contexts/ServiceContext'

import ServiceDetails from './ServiceDetails'
import { throwToSentry } from 'global-utils'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const FellowshipServiceDetails = () => {
  const { fellowshipId } = useContext(ChurchContext)
  const { serviceRecordId } = useContext(ServiceContext)
  const { data, loading, error } = useQuery(DISPLAY_FELLOWSHIP_SERVICE, {
    variables: { serviceId: serviceRecordId, fellowshipId },
  })
  throwToSentry('', error)

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <ServiceDetails
        loading={loading}
        service={data?.serviceRecords[0]}
        church={data?.fellowships[0]}
      />
    </ApolloWrapper>
  )
}

export default FellowshipServiceDetails
