import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Card, Col, Row, Button, Container } from 'react-bootstrap'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import { useRouter } from 'next/navigation'
import { CAMPUS_BY_STREAM } from '../DefaultersQueries'
import '../Defaulters.css'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'

const CampusByStream = () => {
  const { campusId, clickCard } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(CAMPUS_BY_STREAM, {
    variables: {
      id: campusId,
    },
  })
  const router = useRouter()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary
            loading={loading || !data?.campuses[0]?.name}
          >{`${data?.campuses[0]?.name} Campus By Streams`}</HeadingPrimary>

          <Row>
            {data?.campuses.length ? (
              data?.campuses[0]?.streams.map(
                (stream: HigherChurchWithDefaulters, i: number) => (
                  <Col key={i} xs={12} className="mb-3">
                    <Card>
                      <Card.Header className="fw-bold">
                        <div>{`${stream.name} Stream`}</div>
                        <div className="text-secondary">
                          {stream.leader.fullName}
                        </div>
                      </Card.Header>
                      <Card.Body
                        onClick={() => {
                          clickCard(stream)
                          router.push('/services/stream-by-council')
                        }}
                      >
                        <div className="fw-bold">
                          Active Bacentas {stream.activeBacentaCount}
                        </div>
                        <div className="good">
                          Services This Week {stream.servicesThisWeekCount}
                        </div>
                        <div
                          className={
                            stream.formDefaultersThisWeekCount ? 'bad' : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {stream.formDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            stream.bankedThisWeekCount ===
                            stream.servicesThisWeekCount
                              ? 'good'
                              : stream.bankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {stream.bankedThisWeekCount}
                        </div>
                        <div
                          className={
                            stream.bankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {stream.bankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            stream.cancelledServicesThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {stream.cancelledServicesThisWeekCount}
                        </div>
                      </Card.Body>
                      <Card.Footer>
                        <div className="mb-2">
                          Contact Admin: {stream?.admin?.fullName}
                        </div>
                        <a href={`tel:${stream?.admin?.phoneNumber}`}>
                          <Button variant="primary">
                            <TelephoneFill /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            stream?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(stream)}`}
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

export default CampusByStream
