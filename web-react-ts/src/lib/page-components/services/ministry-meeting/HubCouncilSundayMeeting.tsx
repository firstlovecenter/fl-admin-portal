import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'

import { useMutation, useQuery } from '@apollo/client'
import { RECORD_HUBCOUNCIL_SUNDAY_MEETING } from '../record-service/RecordServiceMutations'
import { DISPLAY_HUBCOUNCIL } from 'pages/directory/display/ReadQueries'
import ServiceFormNoOffering from '../record-service/ServiceFormNoIncome'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const HubCouncilSundayMeeting = () => {
  const { hubCouncilId } = useContext(ChurchContext)
  const {
    data: hubData,
    loading: hubLoading,
    error: hubError,
  } = useQuery(DISPLAY_HUBCOUNCIL, { variables: { id: hubCouncilId } })
  const [RecordHubCouncilSundayMeeting] = useMutation(
    RECORD_HUBCOUNCIL_SUNDAY_MEETING
  )

  return (
    <ApolloWrapper loading={hubLoading} error={hubError} data={hubData}>
      <ServiceFormNoOffering
        RecordServiceMutation={RecordHubCouncilSundayMeeting}
        church={hubData?.hubCouncils[0]}
        churchId={hubCouncilId}
        churchType="Hub"
        recordType="MinistryAttendanceRecord"
      />
    </ApolloWrapper>
  )
}
export default HubCouncilSundayMeeting
