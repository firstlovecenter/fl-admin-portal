import React, { useContext } from 'react'
import { ChurchContext } from '../../../contexts/ChurchContext'

import { useQuery } from '@apollo/client'
import { DISPLAY_HUBFELLOWSHIP_SUNDAY_MEETING } from './RecordServiceMutations'
import { ServiceContext } from 'contexts/ServiceContext'

import ServiceDetails from './ServiceDetails'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const HubFellowshipSundayMeetingDetails = () => {
  const { hubfellowshipId } = useContext(ChurchContext)
  const { serviceRecordId } = useContext(ServiceContext)
  const { data, loading, error } = useQuery(
    DISPLAY_HUBFELLOWSHIP_SUNDAY_MEETING,
    {
      variables: {
        serviceId: serviceRecordId,
        hubfellowshipId: hubfellowshipId,
      },
    }
  )

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <ServiceDetails
        loading={loading}
        service={data?.ministryAttendanceRecords[0]}
        church={data?.hubfellowships[0]}
      />
    </ApolloWrapper>
  )
}

export default HubFellowshipSundayMeetingDetails