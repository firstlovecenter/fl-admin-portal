import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { COUNCIL_BANKING_SLIP_QUERIES } from '../../ServicesQueries'
import BankingSlipList from './BankingSlipList'

const CouncilBankingSlipView = () => {
  const { councilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(COUNCIL_BANKING_SLIP_QUERIES, {
    variables: { councilId },
  })

  return (
    <BankingSlipList
      church={data?.councils?.[0]}
      loading={loading}
      error={error}
      levelSlug="council"
    />
  )
}

export default CouncilBankingSlipView
