import { useMutation, useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { DISPLAY_MINISTRY } from 'pages/directory/display/ReadQueries'
import React, { useContext } from 'react'
import { RECORD_MINISTRY_REHEARSAL_MEETING } from '../RecordServiceMutations'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import ServiceForm from '../ServiceForm'

const MinistryRehearsalService = () => {
  const { ministryId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_MINISTRY, {
    variables: { id: ministryId },
  })

  const [RecordJointRehearsalMeeting] = useMutation(
    RECORD_MINISTRY_REHEARSAL_MEETING
  )

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <ServiceForm
        RecordServiceMutation={RecordJointRehearsalMeeting}
        church={data?.ministries[0]}
        churchId={ministryId}
        churchType="Ministry"
        recordType="RehearsalRecord"
      />
    </ApolloWrapper>
  )
}

export default MinistryRehearsalService
