import { useMutation } from '@apollo/client'
import { getHumanReadableDateTime } from '@jaedag/admin-portal-types'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { Church } from 'global-types'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { Button, Card } from 'react-bootstrap'
import { FaCheckCircle } from 'react-icons/fa'
import { CONFIRM_CREDIT_TRANSACTION } from './PurchaseCredits.gql'
import { useState } from 'react'
import { DotLoader } from 'react-spinners'
import { alertMsg } from 'global-utils'

type PurchaseHistoryProps = {
  church: Church
}

const PurchaseHistory = (props: PurchaseHistoryProps) => {
  const { church } = props
  const [ConfirmCreditTransaction] = useMutation(CONFIRM_CREDIT_TRANSACTION)
  const [loading, setLoading] = useState(false)

  return (
    <div>
      <HeadingPrimary>Purchase History</HeadingPrimary>
      <HeadingSecondary>Church: {church?.name}</HeadingSecondary>

      {church.creditsTransactionHistory.length === 0 && (
        <NoDataComponent text="There are no transaction to view" />
      )}

      {church.creditsTransactionHistory.map((transaction, index) => (
        <Card key={index}>
          <Card.Body>
            <div>Credits: {transaction.amount}</div>
            <div>Reference: {transaction.transactionReference}</div>
            <div>Status: {transaction.transactionStatus}</div>

            <div>Mobile Network: {transaction.mobileNetwork}</div>
            <div>Mobile Number: {transaction.mobileNumber}</div>
            <div className="text-end caption text-secondary">
              {getHumanReadableDateTime(transaction.createdAt)}
            </div>
          </Card.Body>
          <Card.Footer>
            {(transaction.transactionStatus === 'success' &&
              transaction.credited === true) ||
            ['failed', 'abandoned'].includes(transaction.transactionStatus) ? (
              <Button variant="outline-success">
                Confirmed <FaCheckCircle />
              </Button>
            ) : (
              <Button
                variant="outline-warning"
                disabled={loading}
                onClick={async () => {
                  setLoading(true)

                  try {
                    await ConfirmCreditTransaction({
                      variables: {
                        transactionReference: transaction.transactionReference,
                      },
                    })
                  } catch (err) {
                  } finally {
                    setLoading(false)

                    alertMsg('Transaction confirmed successfully')
                  }
                }}
              >
                {loading ? (
                  <>
                    <DotLoader size={23} /> Loading{' '}
                  </>
                ) : (
                  'Confirm Transaction'
                )}
              </Button>
            )}
          </Card.Footer>
        </Card>
      ))}
    </div>
  )
}

export default PurchaseHistory
