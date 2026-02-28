import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { DISPLAY_STREAM_MEMBERSHIP } from './DownloadMembership.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadStreamMembership = () => {
  const { streamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_STREAM_MEMBERSHIP, {
    variables: { id: streamId },
  })

  return (
    <DownloadMembershipList
      church={data?.streams[0]}
      loading={loading}
      error={error}
      churchType="Stream"
    />
  )
}

export default DownloadStreamMembership
