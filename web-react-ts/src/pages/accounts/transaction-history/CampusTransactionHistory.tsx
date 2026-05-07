import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { GET_CAMPUS_TRANSACTION_HISTORY } from './transactionHistory'
import TransactionHistoryView from './TransactionHistoryView'
import { AccountTransaction } from './transaction-types'

type CampusTransactionHistoryData = {
  campuses: Array<{
    id: string
    name: string
    transactionCount: number
    transactions: AccountTransaction[]
  }>
}

const CampusTransactionHistory = () => {
  const { campusId } = useContext(ChurchContext)

  return (
    <TransactionHistoryView<CampusTransactionHistoryData>
      query={GET_CAMPUS_TRANSACTION_HISTORY}
      parentId={campusId}
      parentTypename="Campus"
      churchType="Campus"
      showCouncilColumn
      pluckParent={(data) => {
        const c = data?.campuses?.[0]
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

export default CampusTransactionHistory
