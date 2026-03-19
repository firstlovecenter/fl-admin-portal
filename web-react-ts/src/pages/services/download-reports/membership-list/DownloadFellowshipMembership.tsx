import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { DISPLAY_FELLOWSHIP_MEMBERSHIP } from './DownloadMembership.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadFellowshipMembership = () => {
  const { fellowshipId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_FELLOWSHIP_MEMBERSHIP, {
    variables: { id: fellowshipId },
  })

  return (
    <DownloadMembershipList
      church={data?.fellowships[0]}
      loading={loading}
      error={error}
      churchType="Fellowship"
    />
  )
}

export default DownloadFellowshipMembership
