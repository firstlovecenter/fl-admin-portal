import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { COUNCIL_MEMBERSHIP_DOWNLOAD } from './MembershipDownload.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadCouncilMembership = () => {
  const { councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(COUNCIL_MEMBERSHIP_DOWNLOAD, {
    variables: { id: councilId },
  })

  return (
    <DownloadMembershipList
      church={data?.councils[0]}
      loading={loading}
      error={error}
      churchType="Council"
    />
  )
}

export default DownloadCouncilMembership
