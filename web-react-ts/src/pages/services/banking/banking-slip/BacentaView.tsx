import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { BACENTA_BANKING_SLIP_QUERIES } from '../../ServicesQueries'
import BankingSlipList from './BankingSlipList'

const BacentaBankingSlipView = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(BACENTA_BANKING_SLIP_QUERIES, {
    variables: { bacentaId },
  })

  return (
    <BankingSlipList
      church={data?.bacentas?.[0]}
      loading={loading}
      error={error}
      levelSlug="bacenta"
    />
  )
}

export default BacentaBankingSlipView
