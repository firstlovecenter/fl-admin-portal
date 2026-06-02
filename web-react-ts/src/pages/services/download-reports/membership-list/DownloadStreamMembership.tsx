import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { STREAM_MEMBERSHIP_DOWNLOAD } from './MembershipDownload.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadStreamMembership = () => {
  const { streamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(STREAM_MEMBERSHIP_DOWNLOAD, {
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
