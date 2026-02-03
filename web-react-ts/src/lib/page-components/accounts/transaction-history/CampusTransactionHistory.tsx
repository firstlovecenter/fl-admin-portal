import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { GET_CAMPUS_TRANSACTION_HISTORY } from './transactionHistory'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import CurrencySpan from 'components/CurrencySpan'
import { CSVLink } from 'react-csv'
import { useRouter } from 'next/navigation'
import { AccountTransaction } from './transaction-types'
import { QuestionCircleFill } from 'react-bootstrap-icons'
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs'
import { BiCheckDouble } from 'react-icons/bi'

const CampusTransactionHistory = () => {
  const { campusId, clickCard } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(GET_CAMPUS_TRANSACTION_HISTORY, {
    variables: { campusId },
  })
  const router = useRouter()

  const campus = data?.campuses[0]

  const csvHeaders = [
    { label: 'Created At', key: 'createdAt' },
    { label: 'Last Modified', key: 'lastModified' },
    { label: 'Council', key: 'council' },
    { label: 'Leader', key: 'leader' },
    { label: 'Type', key: 'type' },
    { label: 'Account', key: 'account' },
    { label: 'Status', key: 'success' },
    { label: 'Credit', key: 'credit' },
    { label: 'Debit', key: 'debit' },
    { label: 'Charge', key: 'charge' },
    { label: 'Weekday Balance', key: 'weekdayBalance' },
    { label: 'Bussing Society Balance', key: 'bussingSocietyBalance' },
    { label: 'Recorded By', key: 'depositedBy' },
    { label: 'Description', key: 'description' },
  ]

  const csvData = campus?.transactions.map((transaction: any) => ({
    createdAt: new Date(transaction.createdAt).toISOString(),
    lastModified: new Date(transaction.lastModified).toISOString(),
    council: transaction.council.name,
    leader: transaction.council.leader.fullName,
    type: transaction.category,
    account: transaction.account,
    success: transaction.status,
    credit: transaction.category === 'Deposit' ? transaction.amount : null,
    debit: transaction.category !== 'Deposit' ? transaction.amount : null,
    charge: transaction.charge,
    weekdayBalance: transaction.weekdayBalance?.toLocaleString('en-US'),
    bussingSocietyBalance:
      transaction.bussingSocietyBalance?.toLocaleString('en-US'),
    depositedBy: transaction.loggedBy?.fullName,
    description: transaction.description,
  }))

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>Transaction History</HeadingPrimary>
        <HeadingSecondary>
          {campus?.name} {campus?.__typename}
        </HeadingSecondary>

        <div className="d-flex justify-content-end">
          <Button variant="outline-success" size="sm">
            <CSVLink
              filename={`${campus?.name} ${campus?.__typename} Transaction History.csv`}
              headers={csvHeaders}
              data={csvData}
            >
              <span className="good">Download CSV</span>
            </CSVLink>
          </Button>
        </div>
        <hr />

        <Card className="mb-1 fw-bold">
          <Card.Header>
            <Row>
              <Col xs={2}>Last Modified</Col>
              <Col className="text-truncate">Council</Col>
              <Col>Category</Col>
              <Col xs={3}>Amount</Col>
              <Col xs={1}>
                <BiCheckDouble />
              </Col>
            </Row>
          </Card.Header>
        </Card>

        {campus?.transactions
          .slice(0, 50)
          .map((transaction: AccountTransaction) => (
            <div key={transaction.id}>
              <Card
                className="mb-1"
                onClick={() => {
                  clickCard(transaction)
                  router.push('/accounts/transaction-details')
                }}
              >
                <Card.Body className="py-1">
                  <Row className="row-cols-4">
                    <Col xs={2}>
                      {new Date(transaction.lastModified).toLocaleDateString(
                        'en-US',
                        { day: 'numeric', month: 'short' }
                      )}
                    </Col>

                    <Col className="text-truncate">
                      {transaction.council.name}
                    </Col>
                    <Col>
                      <span>{transaction.category}</span>
                    </Col>
                    <Col xs={3}>
                      <CurrencySpan
                        number={transaction.amount + (transaction.charge ?? 0)}
                        className={
                          transaction.category === 'Deposit' ? 'good' : 'bad'
                        }
                        negative
                      />
                    </Col>
                    <Col xs={1}>
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
            </div>
          ))}
      </Container>
    </ApolloWrapper>
  )
}

export default CampusTransactionHistory
