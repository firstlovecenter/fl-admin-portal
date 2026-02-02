import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Card, Col, Row, Button, Container } from 'react-bootstrap'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import { useRouter } from 'next/navigation'
import '../Defaulters.css'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { OVERSIGHT_BY_CAMPUS } from '../stream-services/StreamDefaultersQueries'

const OversightByCampus = () => {
  const { oversightId, clickCard } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(OVERSIGHT_BY_CAMPUS, {
    variables: {
      id: oversightId,
    },
  })
  const router = useRouter()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary
            loading={loading || !data?.oversights[0]?.name}
          >{`${data?.oversights[0]?.name} Oversight By Campus`}</HeadingPrimary>

          <Row>
            {data?.oversights.length ? (
              data?.oversights[0]?.campuses.map(
                (campus: HigherChurchWithDefaulters, i: number) => (
                  <Col key={i} xs={12} className="mb-3">
                    <Card>
                      <Card.Header className="fw-bold">
                        <div>{`${campus.name} Campus`}</div>
                        <div className="text-secondary">
                          {campus.leader.fullName}
                        </div>
                      </Card.Header>
                      <Card.Body
                        onClick={() => {
                          clickCard(campus)
                          router.push('/services/campus-by-stream')
                        }}
                      >
                        <div className="fw-bold">
                          Active Streams {campus.activeStreamCount}
                        </div>
                        <div className="good">
                          Services This Week{' '}
                          {campus.streamServicesThisWeekCount}
                        </div>
                        <div
                          className={
                            campus.streamFormDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {campus.streamFormDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            campus.streamBankedThisWeekCount ===
                            campus.streamServicesThisWeekCount
                              ? 'good'
                              : campus.streamBankedThisWeekCount &&
                                campus.streamBankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {campus.streamBankedThisWeekCount}
                        </div>
                        <div
                          className={
                            campus.streamBankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {campus.streamBankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            campus.cancelledServicesThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {campus.streamCancelledServicesThisWeekCount}
                        </div>
                        <hr />
                        <div className="fw-bold">
                          Active Bacentas {campus.activeBacentaCount}
                        </div>
                        <div className="good">
                          Services This Week {campus.servicesThisWeekCount}
                        </div>
                        <div
                          className={
                            campus.formDefaultersThisWeekCount ? 'bad' : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {campus.formDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            campus.bankedThisWeekCount ===
                            campus.servicesThisWeekCount
                              ? 'good'
                              : campus.bankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {campus.bankedThisWeekCount}
                        </div>
                        <div
                          className={
                            campus.bankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {campus.bankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            campus.cancelledServicesThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {campus.cancelledServicesThisWeekCount}
                        </div>
                      </Card.Body>
                      <Card.Footer>
                        <div className="mb-2">
                          Contact Admin: {campus?.admin?.fullName}
                        </div>
                        <a href={`tel:${campus?.admin?.phoneNumber}`}>
                          <Button variant="primary">
                            <TelephoneFill /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            campus?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(campus)}`}
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

export default OversightByCampus
