import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { GET_COUNCIL_TRANSACTION_HISTORY } from './transactionHistory'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import CurrencySpan from 'components/CurrencySpan'
import { CSVLink } from 'react-csv'
import { useNavigate } from 'react-router'
import { AccountTransaction } from './transaction-types'
import { QuestionCircleFill } from 'react-bootstrap-icons'
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs'
import { BiCheckDouble } from 'react-icons/bi'

const CouncilTransactionHistory = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_COUNCIL_TRANSACTION_HISTORY, {
    variables: { councilId },
  })
  const navigate = useNavigate()

  const council = data?.councils[0]

  const csvHeaders = [
    { label: 'Date', key: 'date' },
    { label: 'Type', key: 'type' },
    { label: 'Account', key: 'account' },
    { label: 'Status', key: 'success' },
    { label: 'Credit', key: 'credit' },
    { label: 'Debit', key: 'debit' },
    { label: 'Recorded By', key: 'depositedBy' },
    { label: 'Description', key: 'description' },
  ]

  const csvData = council?.transactions.map((transaction: any) => ({
    date: new Date(transaction.timestamp).toISOString(),
    type: transaction.category,
    account: transaction.account,
    success: transaction.status,
    credit: transaction.category === 'Deposit' ? transaction.amount : null,
    debit: transaction.category !== 'Deposit' ? transaction.amount : null,
    depositedBy: transaction.loggedBy?.fullName,
    description: transaction.description,
  }))

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>Transaction History</HeadingPrimary>
        <HeadingSecondary>
          {council?.name} {council?.__typename}
        </HeadingSecondary>

        <div className="d-flex justify-content-end">
          <Button variant="outline-success" size="sm">
            <CSVLink
              filename={`${council?.name} ${council?.__typename} Transaction History.csv`}
              headers={csvHeaders}
              data={csvData}
            >
              <span className="good">Export CSV</span>
            </CSVLink>
          </Button>
        </div>
        <hr />

        <Card className="mb-1 fw-bold">
          <Card.Header>
            <Row>
              <Col xs={2}>Date</Col>
              <Col>Account</Col>
              <Col>Type</Col>
              <Col xs={3}>Amount</Col>
              <Col xs={1}>
                <BiCheckDouble />
              </Col>
            </Row>
          </Card.Header>
        </Card>

        {council?.transactions.map((transaction: AccountTransaction) => (
          <>
            <Card
              className="mb-1"
              onClick={() => {
                clickCard(transaction)
                navigate('/accounts/transaction-details')
              }}
            >
              <Card.Body className="py-1">
                <Row>
                  <Col xs={2}>
                    {new Date(transaction.timestamp).toLocaleDateString(
                      'en-US',
                      { day: 'numeric', month: 'short', year: '2-digit' }
                    )}
                  </Col>
                  <Col>
                    <span>{transaction.account}</span>
                  </Col>
                  <Col>
                    <span>{transaction.category}</span>
                  </Col>
                  <Col xs={3}>
                    <CurrencySpan
                      number={transaction.amount}
                      className={
                        transaction.category === 'Deposit' ? 'good' : 'bad'
                      }
                      negative
                    />
                  </Col>
                  <Col className="col-2" xs={1}>
                    {transaction?.status === 'success' && (
                      <BsCheckCircleFill color="green" />
                    )}

                    {transaction?.status === 'pending approval' && (
                      <QuestionCircleFill color="yellow" />
                    )}

                    {transaction?.status === 'declined' && (
                      <BsXCircleFill color="red" />
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </>
        ))}
      </Container>
    </ApolloWrapper>
  )
}

export default CouncilTransactionHistory
