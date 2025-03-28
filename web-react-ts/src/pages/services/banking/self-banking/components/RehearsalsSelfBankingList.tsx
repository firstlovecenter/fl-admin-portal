import { ApolloError, ApolloQueryResult } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceRecord } from 'global-types'
import { capitalise, throwToSentry } from 'global-utils'
import { parseDate } from 'jd-date-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { useContext } from 'react'
import { Button, ButtonGroup, Card, Col, Modal, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import ConfirmPaymentButton, {
  ConfirmPaymentServiceType,
} from './button/ConfirmPayment'

const SelfBankingList = ({
  church,
  loading,
  error,
  refetch,
  confirmationTools,
  popupTools,
  skip,
  setSkip,
}: {
  church: any
  loading: boolean
  error: ApolloError | undefined
  skip: number
  setSkip: (skip: number) => void
  refetch: (
    variables?:
      | Partial<{
          serviceRecordId?: string
          fellowshipId?: string
          governorshipId?: string
          councilId?: string
        }>
      | undefined
  ) => Promise<ApolloQueryResult<any>>
  confirmationTools: {
    confirmService: ConfirmPaymentServiceType
    setConfirmService: (service: ConfirmPaymentServiceType) => void
  }
  popupTools: {
    show: boolean
    handleShow: () => void
    handleClose: () => void
  }
}) => {
  const { clickCard } = useContext(ChurchContext)
  const { show, handleShow, handleClose } = popupTools
  const { confirmService, setConfirmService } = confirmationTools
  const navigate = useNavigate()
  const placeholder = ['', '', '']

  if (error) {
    throwToSentry('', error)
  }

  const skipValue = 10
  const hasNoFailedOrPending = church?.rehearsals?.every(
    (rehearsal: ServiceRecord) => {
      return rehearsal.noServiceReason !== null
    }
  )

  return (
    <>
      <HeadingPrimary loading={loading}>
        {church?.name} {church?.__typename}
      </HeadingPrimary>
      {church?.bankingCode && (
        <PlaceholderCustom as="p" loading={loading}>
          <p>Banking Code: {church?.bankingCode}</p>
        </PlaceholderCustom>
      )}

      <HeadingSecondary loading={loading}>
        Please click to bank any of these rehearsals
      </HeadingSecondary>

      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            Your transaction status is pending please press this button to
            confirm the status
          </div>
          <div className="text-center">
            <ConfirmPaymentButton
              service={confirmService}
              refetch={refetch}
              handleClose={handleClose}
            />
          </div>
        </Modal.Body>
      </Modal>

      <ButtonGroup className="mb-3">
        <Button
          disabled={skip - skipValue < 0}
          onClick={() => {
            setSkip(skip - skipValue)
          }}
        >
          Previous
        </Button>

        <Button
          disabled={church?.rehearsals?.length < skipValue}
          onClick={() => {
            if (church?.rehearsals?.length < skipValue) return
            setSkip(skip + skipValue)
          }}
        >
          Next
        </Button>
      </ButtonGroup>

      {hasNoFailedOrPending && (
        <NoDataComponent text="No rehearsals to bank. When you have a rehearsal, it will show up here" />
      )}

      {church?.rehearsals?.map((rehearsal: ServiceRecord, index: number) => {
        if (rehearsal.noServiceReason || rehearsal.bankingSlip) {
          return null
        }

        return (
          <Card
            key={index}
            className="mb-2"
            onClick={() => {
              clickCard(rehearsal)

              setConfirmService({
                id: rehearsal.id,
              })
              if (rehearsal.transactionStatus === 'pending') {
                handleShow()
                return
              }

              if (rehearsal.transactionStatus === 'success') {
                navigate('/self-banking/receipt')
                return
              }
              navigate(
                `/rehearsals/${church.__typename.toLowerCase()}/self-banking/pay`
              )
            }}
          >
            <Card.Header>
              <b>{parseDate(rehearsal.serviceDate.date)}</b>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <span>Offering: {rehearsal.cash}</span>
                  <div
                    className={`${
                      (rehearsal?.transactionStatus === 'pending' ||
                        rehearsal?.transactionStatus === 'send OTP') &&
                      'yellow'
                    } ${rehearsal?.transactionStatus === 'success' && 'good'} ${
                      rehearsal?.transactionStatus === 'failed' && 'bad'
                    }`}
                  >
                    {rehearsal?.transactionStatus &&
                      `Transaction Status: ${capitalise(
                        rehearsal?.transactionStatus
                      )}`}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )
      })}

      {loading &&
        placeholder.map((service, index) => (
          <Card key={index} className="mb-2">
            <Card.Header>
              <PlaceholderCustom as="p" loading={loading}></PlaceholderCustom>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <PlaceholderCustom
                    as="span"
                    loading={loading}
                  ></PlaceholderCustom>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
    </>
  )
}

export default SelfBankingList
