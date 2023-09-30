import React, { useContext } from 'react'
import { ChurchContext } from '../../../contexts/ChurchContext'

import { useMutation, useQuery } from '@apollo/client'
import { RECORD_HUB_REHEARSAL_SERVICE } from './RecordServiceMutations'
import { DISPLAY_HUB } from '../../directory/display/ReadQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import ServiceForm from './ServiceForm'

const HubRehearsalService = () => {
  const { hubId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_HUB, {
    variables: { id: hubId },
  })
  const [RecordHubRehearsalService] = useMutation(RECORD_HUB_REHEARSAL_SERVICE)

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <ServiceForm
        RecordServiceMutation={RecordHubRehearsalService}
        church={data?.hubs[0]}
        churchId={hubId}
        churchType="Hub"
        recordType="RehearsalRecord"
      />
    </ApolloWrapper>
  )
}

export default HubRehearsalService
