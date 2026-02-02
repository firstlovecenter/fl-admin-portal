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
import { DENOMINATION_BY_OVERSIGHT } from '../stream-services/StreamDefaultersQueries'

const DenominationByOversight = () => {
  const { denominationId, clickCard } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(
    DENOMINATION_BY_OVERSIGHT,
    {
      variables: {
        id: denominationId,
      },
    }
  )
  const router = useRouter()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary
            loading={loading || !data?.denominations[0]?.name}
          >{`${data?.denominations[0]?.name} Denomination By Oversights`}</HeadingPrimary>

          <Row>
            {data?.denominations.length ? (
              data?.denominations[0]?.oversights.map(
                (oversight: HigherChurchWithDefaulters, i: number) => (
                  <Col key={i} xs={12} className="mb-3">
                    <Card>
                      <Card.Header className="fw-bold">
                        <div>{`${oversight.name} Oversight`}</div>
                        <div className="text-secondary">
                          {oversight.leader.fullName}
                        </div>
                      </Card.Header>
                      <Card.Body
                        onClick={() => {
                          clickCard(oversight)
                          router.push('/services/oversight-by-campus')
                        }}
                      >
                        <div className="fw-bold">
                          Active Streams {oversight.activeStreamCount}
                        </div>
                        <div className="good">
                          Services This Week{' '}
                          {oversight.streamServicesThisWeekCount}
                        </div>
                        <div
                          className={
                            oversight.streamFormDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {oversight.streamFormDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            oversight.streamBankedThisWeekCount ===
                            oversight.streamServicesThisWeekCount
                              ? 'good'
                              : oversight.streamBankedThisWeekCount &&
                                oversight.streamBankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {oversight.streamBankedThisWeekCount}
                        </div>
                        <div
                          className={
                            oversight.streamBankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {oversight.streamBankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            oversight.cancelledServicesThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {oversight.streamCancelledServicesThisWeekCount}
                        </div>
                      </Card.Body>
                      <Card.Footer>
                        <div className="mb-2">
                          Contact Admin: {oversight?.admin?.fullName}
                        </div>
                        <a href={`tel:${oversight?.admin?.phoneNumber}`}>
                          <Button variant="primary">
                            <TelephoneFill /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            oversight?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(oversight)}`}
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

export default DenominationByOversight
