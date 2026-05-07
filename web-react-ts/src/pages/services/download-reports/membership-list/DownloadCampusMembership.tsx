import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { CAMPUS_MEMBERSHIP_DOWNLOAD } from './MembershipDownload.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadCampusMembership = () => {
  const { campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(CAMPUS_MEMBERSHIP_DOWNLOAD, {
    variables: { id: campusId },
  })

  return (
    <DownloadMembershipList
      church={data?.campuses[0]}
      loading={loading}
      error={error}
      churchType="Campus"
    />
  )
}

export default DownloadCampusMembership
