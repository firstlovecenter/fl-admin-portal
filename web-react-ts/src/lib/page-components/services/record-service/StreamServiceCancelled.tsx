import { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'

import { useQuery } from '@apollo/client'
import { DISPLAY_STREAM } from 'pages/directory/display/ReadQueries'
import CancelledServiceForm from './CancelledServiceForm'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const StreamServiceCancelled = () => {
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_STREAM, {
    variables: { id: streamId },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <CancelledServiceForm
        church={data?.streams[0]}
        churchId={streamId}
        churchType="stream"
      />
    </ApolloWrapper>
  )
}

export default StreamServiceCancelled
