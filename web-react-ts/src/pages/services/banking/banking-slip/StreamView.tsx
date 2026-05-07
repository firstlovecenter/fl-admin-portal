import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { STREAM_BANKING_SLIP_QUERIES } from '../../ServicesQueries'
import BankingSlipList from './BankingSlipList'

const StreamBankingSlipView = () => {
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(STREAM_BANKING_SLIP_QUERIES, {
    variables: { streamId },
  })

  return (
    <BankingSlipList
      church={data?.streams?.[0]}
      loading={loading}
      error={error}
      levelSlug="stream"
    />
  )
}

export default StreamBankingSlipView
