import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { DISPLAY_HUBCOUNCIL_REHEARSAL } from '../RecordServiceMutations'
import { ServiceContext } from 'contexts/ServiceContext'
import ServiceDetails from '../ServiceDetails'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const HubCouncilRehearsalServiceDetails = () => {
  const { hubCouncilId } = useContext(ChurchContext)
  const { serviceRecordId } = useContext(ServiceContext)
  const { data, loading, error } = useQuery(DISPLAY_HUBCOUNCIL_REHEARSAL, {
    variables: { serviceId: serviceRecordId, hubCouncilId },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <ServiceDetails
        loading={loading}
        service={data?.rehearsalRecords[0]}
        church={data?.hubCouncils[0]}
      />
    </ApolloWrapper>
  )
}

export default HubCouncilRehearsalServiceDetails
