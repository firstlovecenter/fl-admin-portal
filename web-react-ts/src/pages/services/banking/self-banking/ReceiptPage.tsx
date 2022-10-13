import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import TableFromArrays from 'components/TableFromArrays/TableFromArrays'
import { ServiceContext } from 'contexts/ServiceContext'
import { parseNeoTime } from 'jd-date-utils'
import { parseDate } from 'jd-date-utils'
import { getHumanReadableDate } from 'jd-date-utils'
import { capitalise } from 'global-utils'
import React, { useContext } from 'react'
import { Button, Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { SELF_BANKING_RECEIPT } from './bankingQueries'

const ReceiptPage = () => {
  const { serviceRecordId } = useContext(ServiceContext)
  const { data, loading, error } = useQuery(SELF_BANKING_RECEIPT, {
    variables: {
      id: serviceRecordId,
    },
  })
  const navigate = useNavigate()
  const service = data?.serviceRecords[0]
  const tablevalues = [
    ['Date of Service', getHumanReadableDate(service?.serviceDate.date)],
    ['Income', service?.income],
    ['Offering Banked By', service?.offeringBankedBy.fullName],
    ['Transaction Ref', service?.transactionReference],
    ['Transaction Status', capitalise(service?.transactionStatus)],
    ['Network Used', service?.sourceNetwork],
    ['Number Used', service?.sourceNumber],
    ['Reference', service?.desc],
    ['Date of Banking', parseDate(service?.transactionTime)],
    ['Time of Banking', parseNeoTime(service?.transactionTime)],
  ]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>Self Banking Receipt</HeadingPrimary>

        <TableFromArrays tableArray={tablevalues} loading={false} />
        <div className="d-grid gap-2">
          <Button size="lg" onClick={() => navigate('/services/church-list')}>
            Go Home
          </Button>
        </div>
      </Container>
    </ApolloWrapper>
  )
}

export default ReceiptPage
