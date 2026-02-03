import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { ServiceContext } from 'contexts/ServiceContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { DISPLAY_MINISTRY_ON_STAGE_ATTENDANCE } from './onstageGQL'
import ServiceDetailsNoIncome from '../record-service/ServiceDetailsNoIncome'

const MinistryOnStageAttendanceDetails = () => {
  const { ministryId } = useContext(ChurchContext)
  const { serviceRecordId } = useContext(ServiceContext)

  const { data, loading, error } = useQuery(
    DISPLAY_MINISTRY_ON_STAGE_ATTENDANCE,
    {
      variables: {
        serviceId: serviceRecordId,
        ministryId,
      },
    }
  )
  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <ServiceDetailsNoIncome
        loading={loading}
        service={data?.stageAttendanceRecords[0]}
        church={data?.ministries[0]}
      />
    </ApolloWrapper>
  )
}

export default MinistryOnStageAttendanceDetails
