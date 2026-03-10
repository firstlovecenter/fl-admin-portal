import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { DISPLAY_CAMPUS_MEMBERSHIP } from './DownloadMembership.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadCampusMembership = () => {
  const { campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_CAMPUS_MEMBERSHIP, {
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
