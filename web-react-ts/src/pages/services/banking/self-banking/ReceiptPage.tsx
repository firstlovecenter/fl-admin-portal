import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import TableFromArrays from 'components/TableFromArrays/TableFromArrays'
import { ServiceContext } from 'contexts/ServiceContext'
import { parseNeoTime } from 'jd-date-utils'
import { parseDate } from 'jd-date-utils'
import { getHumanReadableDate } from 'jd-date-utils'
import { capitalise, throwToSentry } from 'global-utils'
import React, { useContext } from 'react'
import { Button, Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import {
  CONFIRM_OFFERING_PAYMENT,
  SELF_BANKING_RECEIPT,
  SET_TRANSACTION_REFERENCE,
} from './bankingQueries'
import ButtonConfirmPayment from './components/button/ConfirmPayment'
import { Form, Formik } from 'formik'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import RoleView from 'auth/RoleView'
import { permitAdmin } from 'permission-utils'
import { MemberContext } from 'contexts/MemberContext'

const ReceiptPage = () => {
  const { serviceRecordId } = useContext(ServiceContext)
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error, refetch } = useQuery(SELF_BANKING_RECEIPT, {
    variables: {
      id: serviceRecordId,
    },
  })
  const [SetTransactionReference] = useMutation(SET_TRANSACTION_REFERENCE)
  const [ConfirmOfferingPayment] = useMutation(CONFIRM_OFFERING_PAYMENT)

  const navigate = useNavigate()
  const service = data?.serviceRecords[0]
  const tablevalues = [
    ['Date of Service', getHumanReadableDate(service?.serviceDate?.date)],
    ['Cash', service?.cash],
    ['Offering Banked By', service?.offeringBankedBy?.fullName],
    ['Transaction Ref', service?.transactionReference],
    ['Transaction Status', capitalise(service?.transactionStatus)],
    ['Network Used', service?.sourceNetwork],
    ['Number Used', service?.sourceNumber],
    ['Reference', service?.desc],
    ['Date of Banking', parseDate(service?.transactionTime)],
    ['Time of Banking', parseNeoTime(service?.transactionTime)],
  ]

  if (service?.transactionError) {
    tablevalues.push(['Transaction Error', service?.transactionError])
  }

  const submitTransactionReference = async (values: any) => {
    const { transactionReference } = values

    try {
      await SetTransactionReference({
        variables: {
          serviceRecordId,
          currentUserId: currentUser.id,
          transactionReference,
        },
      })
      await ConfirmOfferingPayment({
        variables: {
          serviceRecordId,
        },
        refetchQueries: [
          {
            query: SELF_BANKING_RECEIPT,
            variables: { id: serviceRecordId },
          },
        ],
      })
      refetch()
    } catch (error) {
      throwToSentry('', error)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>Self Banking Receipt</HeadingPrimary>

        <TableFromArrays tableArray={tablevalues} loading={false} />

        <RoleView roles={permitAdmin('Stream')}>
          {!['success', 'pending'].includes(service?.transactionStatus) && (
            <Formik
              initialValues={{
                transactionReference: '',
              }}
              onSubmit={submitTransactionReference}
            >
              {(formik) => (
                <Form>
                  <Input
                    name="transactionReference"
                    label="Transaction Reference"
                  />
                  <SubmitButton formik={formik} />
                </Form>
              )}
            </Formik>
          )}
        </RoleView>

        <div className="d-grid gap-2 mt-5">
          {service?.transactionStatus === 'pending' && (
            <ButtonConfirmPayment
              refetch={refetch}
              service={{
                id: serviceRecordId,
              }}
            />
          )}
          <Button size="lg" onClick={() => navigate('/services/church-list')}>
            Go Home
          </Button>
        </div>
      </Container>
    </ApolloWrapper>
  )
}

export default ReceiptPage
