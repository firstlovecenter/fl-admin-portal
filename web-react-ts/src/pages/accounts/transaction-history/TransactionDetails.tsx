import { useMutation, useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import {
  GET_TRANSACTION_DETAILS,
  UNDO_BUSSING_TRANSACTION,
  UNDO_WEEKDAY_TRANSACTION,
} from './transactionHistory'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { AccountTransaction } from './transaction-types'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useNavigate } from 'react-router'
import TransactionCard from '../TransactionCard'
import RoleView from 'auth/RoleView'
import { permitAdmin, permitArrivals, permitLeader } from 'permission-utils'
import { Button } from 'components/ui/button'

const TransactionDetails = () => {
  const { transactionId } = useContext(ChurchContext)

  const navigate = useNavigate()
  const { data, loading, error } = useQuery(GET_TRANSACTION_DETAILS, {
    variables: { id: transactionId },
  })
  const [UndoBussingTransaction] = useMutation(UNDO_BUSSING_TRANSACTION)
  const [UndoWeekdayTransaction] = useMutation(UNDO_WEEKDAY_TRANSACTION)

  const transaction: AccountTransaction = data?.accountTransactions[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <HeadingPrimary>Transaction Details</HeadingPrimary>
        <hr />
        <TransactionCard transaction={transaction} />

        <div className="text-center mt-5">
          <Button
            variant="destructive"
            onClick={async () => {
              if (transaction.category === 'Bussing')
                await UndoBussingTransaction({ variables: { transactionId } })
              else
                await UndoWeekdayTransaction({ variables: { transactionId } })

              navigate('/accounts/council/transaction-history')
            }}
          >
            Undo Transaction
          </Button>
        </div>
        <div className="text-center mt-2">
          <Button
            variant="success"
            onClick={() => navigate('/accounts/council/transaction-history')}
          >
            View Council History
          </Button>
        </div>

        <div className="text-center mt-2">
          <Button
            variant="warning"
            onClick={() => navigate('/accounts/council/dashboard')}
          >
            Go To Council Dashboard
          </Button>
        </div>
        <div className="text-center mt-2">
          <RoleView
            roles={[
              ...permitAdmin('Campus'),
              ...permitLeader('Campus'),
              ...permitArrivals('Campus'),
            ]}
          >
            <Button
              variant="info"
              onClick={() => navigate('/accounts/campus/dashboard')}
            >
              Go To Campus Dashboard
            </Button>
          </RoleView>
        </div>
      </div>
    </ApolloWrapper>
  )
}

export default TransactionDetails
