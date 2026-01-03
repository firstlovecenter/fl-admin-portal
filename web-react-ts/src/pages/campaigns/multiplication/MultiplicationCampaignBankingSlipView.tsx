import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { Church } from 'global-types'
import { parseDate } from 'jd-date-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import React, { useContext } from 'react'
import { Container, Card, Row, Col } from 'react-bootstrap'
import { CheckCircleFill, XCircleFill } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'
import { MultiplicationServiceRecord } from './MultiplicationCampaignServiceDetails'

export type BankingSlipViewProps = {
  church: Church
  loading: boolean
  services: MultiplicationServiceRecord[]
}

const MultiplicationCampaignBankingSlipView = ({
  loading,
  church,
  services,
}: BankingSlipViewProps) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const placeholder = ['', '', '']

  return (
    <Container>
      <HeadingPrimary loading={loading}>
        {church?.name} {church?.__typename}
      </HeadingPrimary>

      {services?.map((service: MultiplicationServiceRecord) => {
        return (
          <Card
            key={service.id}
            className="mb-2"
            onClick={() => {
              clickCard(service)

              !service.bankingProof &&
                navigate(
                  `/campaigns/${church?.__typename?.toLowerCase()}/multiplication/upload-receipts`
                )
            }}
          >
            <Card.Header>
              {<b>{parseDate(service.crusadeDate.date)}</b>}
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <span>Offering: {service.income}</span>
                </Col>
                <Col className="col-auto">
                  {service.bankingProof ? (
                    <span className="text-success fw-bold">
                      <CheckCircleFill color="green" size={35} /> Filled
                    </span>
                  ) : (
                    <span className="text-danger fw-bold">
                      <XCircleFill color="red" size={35} /> Not Filled
                    </span>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )
      })}

      {loading &&
        placeholder.map((service, index) => {
          return (
            <Card key={index} className="mb-2">
              <Card.Header>
                <PlaceholderCustom as="p" loading={loading}></PlaceholderCustom>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col>
                    <PlaceholderCustom as="span" loading={loading} />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )
        })}

      {services.length === 0 && (
        <NoDataComponent text="There is no data to be found" />
      )}
    </Container>
  )
}

export default MultiplicationCampaignBankingSlipView
