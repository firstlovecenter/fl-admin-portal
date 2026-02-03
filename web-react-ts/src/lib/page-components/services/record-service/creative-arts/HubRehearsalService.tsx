import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'

import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { DISPLAY_HUB } from 'pages/directory/display/ReadQueries'
import { RECORD_HUB_REHEARSAL_SERVICE } from '../RecordServiceMutations'
import ServiceForm from '../ServiceForm'

const HubRehearsalService = () => {
  const { hubId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_HUB, {
    variables: { id: hubId },
  })
  const [RecordHubRehearsalMeeting] = useMutation(RECORD_HUB_REHEARSAL_SERVICE)

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <ServiceForm
        RecordServiceMutation={RecordHubRehearsalMeeting}
        church={data?.hubs[0]}
        churchId={hubId}
        churchType="Hub"
        event="Rehearsal"
        recordType="RehearsalRecord"
      />
    </ApolloWrapper>
  )
}

export default HubRehearsalService
