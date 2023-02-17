import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceRecord } from 'global-types'
import { throwToSentry } from 'global-utils'
import { parseDate } from 'jd-date-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import React, { useContext } from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { CheckCircleFill, XCircleFill } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'
import { CONSTITUENCY_BANKING_SLIP_QUERIES } from '../../ServicesQueries'

const ConstituencyBankingSlipView = () => {
  const { constituencyId, clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const { data, loading, error } = useQuery(CONSTITUENCY_BANKING_SLIP_QUERIES, {
    variables: { constituencyId: constituencyId },
  })
  const constituency = data?.constituencies[0]
  const placeholder = ['', '', '']
  throwToSentry('', error)

  return (
    <Container>
      <HeadingPrimary loading={loading}>{constituency?.name}</HeadingPrimary>

      {data?.constituencies[0].services.map(
        (service: ServiceRecord, index: number) => {
          if (service.noServiceReason) {
            if (index === 0) {
              return (
                <NoDataComponent text="No services to bank. When you have a service, it will show up here" />
              )
            }

            return null
          }

          return (
            <Card
              key={service.id}
              className="mb-2"
              onClick={() => {
                clickCard(service)
                !service.bankingProof &&
                  navigate('/constituency/banking-slip/submission')
              }}
            >
              <Card.Header>
                <b>{parseDate(service.serviceDate.date)}</b>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col>
                    <span>Offering: {service.income}</span>
                  </Col>
                  <Col className="col-auto">
                    {service.bankingSlip ? (
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
        }
      )}

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
                    <PlaceholderCustom
                      as="span"
                      loading={loading}
                    ></PlaceholderCustom>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )
        })}
    </Container>
  )
}

export default ConstituencyBankingSlipView
