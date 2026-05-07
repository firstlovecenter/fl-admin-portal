import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { BACENTA_MEMBERSHIP_DOWNLOAD } from './MembershipDownload.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadBacentaMembership = () => {
  const { bacentaId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(BACENTA_MEMBERSHIP_DOWNLOAD, {
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
