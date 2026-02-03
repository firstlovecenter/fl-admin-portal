import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { DISPLAY_MINISTRY_REHEARSAL } from '../RecordServiceMutations'
import { ServiceContext } from 'contexts/ServiceContext'
import ServiceDetails from '../ServiceDetails'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const MinistryRehearsalServiceDetails = () => {
  const { ministryId } = useContext(ChurchContext)
  const { serviceRecordId } = useContext(ServiceContext)
  const { data, loading, error } = useQuery(DISPLAY_MINISTRY_REHEARSAL, {
    variables: { serviceId: serviceRecordId, ministryId },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <ServiceDetails
        loading={loading}
        service={data?.rehearsalRecords[0]}
        church={data?.ministries[0]}
      />
    </ApolloWrapper>
  )
}

export default MinistryRehearsalServiceDetails
