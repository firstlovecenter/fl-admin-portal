import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { GET_COUNCIL_TRANSACTION_HISTORY } from './transactionHistory'
import TransactionHistoryView from './TransactionHistoryView'
import { AccountTransaction } from './transaction-types'

type CouncilTransactionHistoryData = {
  councils: Array<{
    id: string
    name: string
    transactionCount: number
    transactions: AccountTransaction[]
  }>
}

const CouncilTransactionHistory = () => {
  const { councilId } = useContext(ChurchContext)

  return (
    <TransactionHistoryView<CouncilTransactionHistoryData>
      query={GET_COUNCIL_TRANSACTION_HISTORY}
      parentId={councilId}
      parentTypename="Council"
      churchType="Council"
      pluckParent={(data) => {
        const c = data?.councils?.[0]
        if (!c) return undefined
        return {
          name: c.name,
          transactionCount: c.transactionCount,
          transactions: c.transactions,
        }
      }}
    />
  )
}

export default CouncilTransactionHistory
