import { getHumanReadableDateTime } from '@jaedag/admin-portal-types'
import React, { useContext } from 'react'
import { Badge, Card, Col, Row } from 'react-bootstrap'
import { AccountTransaction } from './transaction-history/transaction-types'
import CurrencySpan from 'components/CurrencySpan'
import { ChurchContext } from 'contexts/ChurchContext'
import { useRouter } from 'next/navigation'
import './accounts-colors.css'
import { Color } from 'react-bootstrap/esm/types'

const TransactionCard = ({
  transaction,
}: {
  transaction: AccountTransaction
}) => {
  const { clickCard } = useContext(ChurchContext)
  const router = useRouter()
  const htmlElement = document.querySelector('html')
  const currentTheme = htmlElement?.getAttribute('data-bs-theme')

  return (
    <Card
      onClick={() => {
        clickCard(transaction)
        router.push('/accounts/transaction-details/')
      }}
    >
      <Card.Body>
        <Row className="mb-3 d-flex align-items-center">
          <Col className="text-secondary col-4">Created At</Col>
          <Col>{getHumanReadableDateTime(transaction?.createdAt)}</Col>
        </Row>
        {transaction?.createdAt !== transaction?.lastModified && (
          <Row className="mb-3 d-flex align-items-center">
            <Col className="text-secondary col-4">Last Modified</Col>
            <Col>{getHumanReadableDateTime(transaction?.lastModified)}</Col>
          </Row>
        )}
        <Row className="mb-3 d-flex align-items-center">
          <Col className="text-secondary col-4">Created By</Col>
          <Col>{transaction?.loggedBy.fullName}</Col>
        </Row>
        <Row className="mb-3 d-flex align-items-center">
          <Col className="text-secondary col-4">Account Involved</Col>
          <Col>{transaction?.account}</Col>
        </Row>
        <Row className="mb-3 d-flex align-items-center">
          <Col className="text-secondary col-4">Amount</Col>
          <Col>
            <CurrencySpan
              number={transaction?.amount}
              className="text-primary"
              negative
            />
          </Col>
        </Row>
        {!!transaction?.charge && (
          <Row className="mb-3 d-flex align-items-center">
            <Col className="text-secondary col-4">Charge</Col>
            <Col>
              <CurrencySpan
                number={transaction?.charge}
                negative
                className="text-primary"
              />
            </Col>
          </Row>
        )}
        <Row className="mb-3 d-flex align-items-center">
          <Col className="text-secondary col-4">Category</Col>
          <Col>{transaction?.category}</Col>
        </Row>
        <Row className="mb-3 d-flex align-items-center">
          <Col className="text-secondary col-4">Description</Col>
          <Col>{transaction?.description}</Col>
        </Row>
        <Row className="mb-3 d-flex align-items-center">
          <Col className="text-secondary col-4">Status</Col>
          <Col>
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
          </Col>
        </Row>
        {transaction?.weekdayBalance && transaction?.bussingSocietyBalance && (
          <hr />
        )}
        {!!transaction?.weekdayBalance && (
          <Row className="mb-3 d-flex align-items-center">
            <Col className="text-secondary col-4">Weekday Balance</Col>
            <Col>
              {(transaction?.weekdayBalance || 0.0).toLocaleString('en-US')}
            </Col>
          </Row>
        )}
        {!!transaction?.bussingSocietyBalance && (
          <Row className="mb-3 d-flex align-items-center">
            <Col className="text-secondary col-4">Bussing Society Balance</Col>
            <Col>
              {(transaction?.bussingSocietyBalance || 0.0).toLocaleString(
                'en-US'
              )}
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  )
}

export default TransactionCard
