import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { DENOMINATION_MEMBERSHIP_DOWNLOAD } from './MembershipDownload.gql'
import { useQuery } from '@apollo/client'
import DownloadMembershipList from './DownloadMembershipList'

const DownloadDenominationMembership = () => {
  const { denominationId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DENOMINATION_MEMBERSHIP_DOWNLOAD, {
    variables: { id: denominationId },
  })

  return (
    <DownloadMembershipList
      church={data?.denominations[0]}
      loading={loading}
      error={error}
      churchType="Denomination"
    />
  )
}

export default DownloadDenominationMembership
