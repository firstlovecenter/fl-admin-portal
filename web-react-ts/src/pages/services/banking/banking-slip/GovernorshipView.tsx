import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { GOVERNORSHIP_BANKING_SLIP_QUERIES } from '../../ServicesQueries'
import BankingSlipList from './BankingSlipList'

const GovernorshipBankingSlipView = () => {
  const { governorshipId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GOVERNORSHIP_BANKING_SLIP_QUERIES, {
    variables: { governorshipId },
  })

  return (
    <BankingSlipList
      church={data?.governorships?.[0]}
      loading={loading}
      error={error}
      levelSlug="governorship"
    />
  )
}

export default GovernorshipBankingSlipView
