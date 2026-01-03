import { ServiceContext } from 'contexts/ServiceContext'
import { useContext } from 'react'
import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MultiplicationCampaignUploadReceipts from '../MultiplicationCampaignUploadReceipts'
import { MULTIPLICATION_RECORDS } from '../MultiplicationQueries'

const CouncilMultiplicationCampaignUploadReceipts = () => {
  const { multiplicationRecordId } = useContext(ServiceContext)
  const { data, loading, error } = useQuery(MULTIPLICATION_RECORDS, {
    variables: { id: multiplicationRecordId },
  })

  const serviceRecord = data?.multiplicationRecords[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <MultiplicationCampaignUploadReceipts serviceRecord={serviceRecord} />
    </ApolloWrapper>
  )
}

export default CouncilMultiplicationCampaignUploadReceipts
