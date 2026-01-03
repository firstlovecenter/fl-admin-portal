import { useContext } from 'react'
import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ServiceContext } from 'contexts/ServiceContext'
import MultiplicationCampaignServiceDetails from '../MultiplicationCampaignServiceDetails'
import { MULTIPLICATION_RECORDS } from '../MultiplicationQueries'
import { MemberContext } from 'contexts/MemberContext'

const CouncilMultiplicationCampaignServiceDetails = () => {
  const { currentUser } = useContext(MemberContext)
  const church = currentUser.currentChurch
  const { multiplicationRecordId } = useContext(ServiceContext)
  const { data, loading, error } = useQuery(MULTIPLICATION_RECORDS, {
    variables: { id: multiplicationRecordId },
    fetchPolicy: 'cache-and-network',
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <MultiplicationCampaignServiceDetails
        loading={loading}
        service={data?.multiplicationRecords[0]}
        church={church}
      />
    </ApolloWrapper>
  )
}

export default CouncilMultiplicationCampaignServiceDetails
