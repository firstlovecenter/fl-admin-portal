import { useMutation, useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { DISPLAY_HUBCOUNCIL } from 'pages/directory/display/ReadQueries'
import React, { useContext } from 'react'
import { RECORD_HUBCOUNCIL_REHEARSAL_MEETING } from '../RecordServiceMutations'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import ServiceForm from '../ServiceForm'

const HubCouncilRehearsalService = () => {
  const { hubCouncilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_HUBCOUNCIL, {
    variables: { id: hubCouncilId },
  })

  const [RecordJointRehearsalMeeting] = useMutation(
    RECORD_HUBCOUNCIL_REHEARSAL_MEETING
  )

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <ServiceForm
        RecordServiceMutation={RecordJointRehearsalMeeting}
        church={data?.hubCouncils[0]}
        churchId={hubCouncilId}
        churchType="HubCouncil"
        recordType="RehearsalRecord"
      />
    </ApolloWrapper>
  )
}

export default HubCouncilRehearsalService
