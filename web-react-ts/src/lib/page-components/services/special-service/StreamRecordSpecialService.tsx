import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { DISPLAY_STREAM } from 'pages/directory/display/ReadQueries'
import React, { useContext } from 'react'
import { RECORD_SPECIAL_SERVICE } from '../record-service/RecordServiceMutations'
import SpecialServiceForm from './SpecialServiceForm'

const StreamRecordSpecialService = () => {
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_STREAM, {
    variables: { id: streamId },
  })
  const [RecordService] = useMutation(RECORD_SPECIAL_SERVICE)

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <SpecialServiceForm
        RecordServiceMutation={RecordService}
        church={data?.streams[0]}
        churchId={streamId}
        churchType="Stream"
      />
    </ApolloWrapper>
  )
}

export default StreamRecordSpecialService
