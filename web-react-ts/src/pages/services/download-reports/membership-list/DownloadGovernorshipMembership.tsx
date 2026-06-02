import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { GOVERNORSHIP_MEMBERSHIP_DOWNLOAD } from './MembershipDownload.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadGovernorshipMembership = () => {
  const { governorshipId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GOVERNORSHIP_MEMBERSHIP_DOWNLOAD, {
    variables: { id: governorshipId },
  })

  return (
    <DownloadMembershipList
      church={data?.governorships[0]}
      loading={loading}
      error={error}
      churchType="Governorship"
    />
  )
}

export default DownloadGovernorshipMembership
