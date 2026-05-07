import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { OVERSIGHT_MEMBERSHIP_DOWNLOAD } from './MembershipDownload.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadOversightMembership = () => {
  const { oversightId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(OVERSIGHT_MEMBERSHIP_DOWNLOAD, {
    variables: { id: oversightId },
  })

  return (
    <DownloadMembershipList
      church={data?.oversights[0]}
      loading={loading}
      error={error}
      churchType="Oversight"
    />
  )
}

export default DownloadOversightMembership
