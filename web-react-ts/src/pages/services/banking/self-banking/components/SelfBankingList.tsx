import { ApolloError, ApolloQueryResult } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import Popup from 'components/Popup/Popup'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceRecord } from 'global-types'
import { capitalise, throwToSentry } from 'global-utils'
import { parseDate } from 'jd-date-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { useContext } from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
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
}: {
  church: any
  loading: boolean
  error: ApolloError | undefined
  refetch: (
    variables?:
      | Partial<{
          serviceRecordId?: string
          fellowshipId?: string
          constituencyId?: string
          councilId?: string
        }>
      | undefined
  ) => Promise<ApolloQueryResult<any>>
  confirmationTools: {
    confirmService: ConfirmPaymentServiceType
    setConfirmService: (service: ConfirmPaymentServiceType) => void
  }
  popupTools: {
    isOpen: boolean
    togglePopup: () => void
  }
}) => {
  const { clickCard } = useContext(ChurchContext)
  const { isOpen, togglePopup } = popupTools
  const { confirmService, setConfirmService } = confirmationTools
  const navigate = useNavigate()
  const placeholder = ['', '', '']

  if (error) {
    throwToSentry('', error)
  }

  return (
    <Container>
      <HeadingPrimary loading={loading}>
        {church?.name} {church?.__typename}
      </HeadingPrimary>
      <PlaceholderCustom as="p" loading={loading}>
        <p>Banking Code: {church?.bankingCode}</p>
      </PlaceholderCustom>

      <HeadingSecondary loading={loading}>
        Please click to bank any of these services
      </HeadingSecondary>

      {isOpen && (
        <Popup handleClose={togglePopup}>
          <div>
            Your transaction status is pending please press this button to
            confirm the status
          </div>
          <div className="d-grid gap-2">
            <ConfirmPaymentButton
              service={confirmService}
              refetch={refetch}
              togglePopup={togglePopup}
            />
          </div>
        </Popup>
      )}

      {church?.services?.map((service: ServiceRecord, index: number) => {
        if (service.noServiceReason || service.bankingSlip) {
          if (index === 0) {
            return (
              <NoDataComponent text="No services to bank. When you have a service, it will show up here" />
            )
          }

          return null
        }

        return (
          <Card
            key={index}
            className="mb-2"
            onClick={() => {
              clickCard(service)

              setConfirmService({
                id: service.id,
                stream_name: service.stream_name,
              })
              if (service.transactionStatus === 'pending') {
                togglePopup()
                return
              }

              if (service.transactionStatus === 'success') {
                navigate('/self-banking/receipt')
                return
              }
              navigate(
                `/services/${church.__typename.toLowerCase()}/self-banking/pay`
              )
            }}
          >
            <Card.Header>
              <b>{parseDate(service.serviceDate.date)}</b>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <span>Offering: {service.income}</span>
                  <div
                    className={`${
                      (service?.transactionStatus === 'pending' ||
                        service?.transactionStatus === 'send OTP') &&
                      'yellow'
                    } ${service?.transactionStatus === 'success' && 'good'} ${
                      service?.transactionStatus === 'failed' && 'bad'
                    }`}
                  >
                    {service?.transactionStatus &&
                      `Transaction Status: ${capitalise(
                        service?.transactionStatus
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
    </Container>
  )
}

export default SelfBankingList
