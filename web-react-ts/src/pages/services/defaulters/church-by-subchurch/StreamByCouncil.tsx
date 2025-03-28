import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Card, Col, Row, Button, Container } from 'react-bootstrap'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'
import { STREAM_BY_COUNCIL } from '../DefaultersQueries'
import '../Defaulters.css'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'

const StreamByCouncil = () => {
  const { streamId, clickCard } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(STREAM_BY_COUNCIL, {
    variables: {
      id: streamId,
    },
  })

  const navigate = useNavigate()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary loading={loading || !data?.streams[0]?.name}>
            {`${data?.streams[0].name} Stream By Council`}
          </HeadingPrimary>
          <Row>
            {data?.streams.length ? (
              data?.streams[0].councils.map(
                (council: HigherChurchWithDefaulters, i: number) => (
                  <Col key={i} xs={12} className="mb-3">
                    <Card>
                      <Card.Header className="fw-bold">
                        <div>{`${council.name} Council`}</div>
                        <div className="text-secondary">
                          {council.leader.fullName}
                        </div>
                      </Card.Header>
                      <Card.Body
                        onClick={() => {
                          clickCard(council)
                          navigate('/services/council-by-governorship')
                        }}
                      >
                        <div className="fw-bold">
                          Active Bacentas {council.activeBacentaCount}
                        </div>
                        <div className="good">
                          Services This Week {council.servicesThisWeekCount}
                        </div>
                        <div
                          className={
                            council.formDefaultersThisWeekCount ? 'bad' : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {council.formDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            council.bankedThisWeekCount ===
                            council.servicesThisWeekCount
                              ? 'good'
                              : council.bankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {council.bankedThisWeekCount}
                        </div>
                        <div
                          className={
                            council.bankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {council.bankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            council.cancelledServicesThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {council.cancelledServicesThisWeekCount}
                        </div>
                      </Card.Body>
                      <Card.Footer>
                        <div className="mb-2">
                          Contact Admin: {council?.admin?.fullName}
                        </div>
                        <a href={`tel:${council?.admin?.phoneNumber}`}>
                          <Button variant="primary">
                            <TelephoneFill /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            council?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(council)}`}
                          className="ms-3"
                        >
                          <Button variant="success">
                            <Whatsapp /> WhatsApp
                          </Button>
                        </a>
                      </Card.Footer>
                    </Card>
                  </Col>
                )
              )
            ) : (
              <PlaceholderDefaulterList />
            )}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StreamByCouncil
