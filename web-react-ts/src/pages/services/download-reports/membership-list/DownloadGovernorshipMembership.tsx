import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { DISPLAY_GOVERNORSHIP_MEMBERSHIP } from './DownloadMembership.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadGovernorshipMembership = () => {
  const { governorshipId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_GOVERNORSHIP_MEMBERSHIP, {
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
