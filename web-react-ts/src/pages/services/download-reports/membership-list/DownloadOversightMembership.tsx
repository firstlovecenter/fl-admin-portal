import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { DISPLAY_OVERSIGHT_MEMBERSHIP } from './DownloadMembership.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadOversightMembership = () => {
  const { oversightId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_OVERSIGHT_MEMBERSHIP, {
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
