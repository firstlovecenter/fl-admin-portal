import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { DISPLAY_BACENTA_MEMBERSHIP } from './DownloadMembership.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadBacentaMembership = () => {
  const { bacentaId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_BACENTA_MEMBERSHIP, {
    variables: { id: bacentaId },
  })

  return (
    <DownloadMembershipList
      church={data?.bacentas[0]}
      loading={loading}
      error={error}
      churchType="Bacenta"
    />
  )
}

export default DownloadBacentaMembership
