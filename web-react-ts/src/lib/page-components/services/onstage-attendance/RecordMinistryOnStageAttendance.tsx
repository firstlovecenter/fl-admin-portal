import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { DISPLAY_MINISTRY } from 'pages/directory/display/ReadQueries'
import React, { useContext } from 'react'
import { RECORD_MINISTRY_ON_STAGE_ATTENDANCE } from './onstageGQL'
import StageAttendanceForm from './StageAttendanceForm'

const RecordMinistryOnStageAttendance = () => {
  const { ministryId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_MINISTRY, {
    variables: { id: ministryId },
  })
  const [RecordMinistryOnStageAttendance] = useMutation(
    RECORD_MINISTRY_ON_STAGE_ATTENDANCE
  )

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <StageAttendanceForm
        RecordServiceMutation={RecordMinistryOnStageAttendance}
        church={data?.ministries[0]}
        churchId={ministryId}
        churchType="Ministry"
        event="On Stage Performance"
        recordType="StageAttendanceRecord"
      />
    </ApolloWrapper>
  )
}

export default RecordMinistryOnStageAttendance
