import { getHumanReadableDateTime } from '@jaedag/admin-portal-types'
import React, { useContext } from 'react'
import { AccountTransaction } from './transaction-history/transaction-types'
import CurrencySpan from 'components/CurrencySpan'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import './accounts-colors.css'
import { Color } from 'react-bootstrap/esm/types'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'

const TransactionCard = ({
  transaction,
}: {
  transaction: AccountTransaction
}) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const htmlElement = document.querySelector('html')
  const currentTheme = htmlElement?.getAttribute('data-bs-theme')

  return (
    <Card
      onClick={() => {
        clickCard(transaction)
        navigate('/accounts/transaction-details/')
      }}
    >
      <CardContent>
        <div className="mb-3 d-flex align-items-center">
          <div className="text-secondary col-4">Created At</div>
          <div>{getHumanReadableDateTime(transaction?.createdAt)}</div>
        </div>
        {transaction?.createdAt !== transaction?.lastModified && (
          <div className="mb-3 d-flex align-items-center">
            <div className="text-secondary col-4">Last Modified</div>
            <div>{getHumanReadableDateTime(transaction?.lastModified)}</div>
          </div>
        )}
        <div className="mb-3 d-flex align-items-center">
          <div className="text-secondary col-4">Created By</div>
          <div>{transaction?.loggedBy.fullName}</div>
        </div>
        <div className="mb-3 d-flex align-items-center">
          <div className="text-secondary col-4">Account Involved</div>
          <div>{transaction?.account}</div>
        </div>
        <div className="mb-3 d-flex align-items-center">
          <div className="text-secondary col-4">Amount</div>
          <div>
            <CurrencySpan
              number={transaction?.amount}
              className="text-primary"
              negative
            />
          </div>
        </div>
        {!!transaction?.charge && (
          <div className="mb-3 d-flex align-items-center">
            <div className="text-secondary col-4">Charge</div>
            <div>
              <CurrencySpan
                number={transaction?.charge}
                negative
                className="text-primary"
              />
            </div>
          </div>
        )}
        <div className="mb-3 d-flex align-items-center">
          <div className="text-secondary col-4">Category</div>
          <div>{transaction?.category}</div>
        </div>
        <div className="mb-3 d-flex align-items-center">
          <div className="text-secondary col-4">Description</div>
          <div>{transaction?.description}</div>
        </div>
        <div className="mb-3 d-flex align-items-center">
          <div className="text-secondary col-4">Status</div>
          <div>
            <Badge
              className="text-uppercase"
              text={currentTheme as Color}
              bg={
                transaction?.status === 'pending approval'
                  ? 'warning'
                  : transaction?.status === 'declined'
                  ? 'danger'
                  : 'success'
              }
            >
              {transaction?.status}
            </Badge>
          </div>
        </div>
        {transaction?.weekdayBalance && transaction?.bussingSocietyBalance && (
          <hr />
        )}
        {!!transaction?.weekdayBalance && (
          <div className="mb-3 d-flex align-items-center">
            <div className="text-secondary col-4">Weekday Balance</div>
            <div>
              {(transaction?.weekdayBalance || 0.0).toLocaleString('en-US')}
            </div>
          </div>
        )}
        {!!transaction?.bussingSocietyBalance && (
          <div className="mb-3 d-flex align-items-center">
            <div className="text-secondary col-4">Bussing Society Balance</div>
            <div>
              {(transaction?.bussingSocietyBalance || 0.0).toLocaleString(
                'en-US'
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TransactionCard
