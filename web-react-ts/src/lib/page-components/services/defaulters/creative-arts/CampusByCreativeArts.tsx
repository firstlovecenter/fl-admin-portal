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
import { HigherSontaChurchWithDefaulters } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { CAMPUS_BY_CREATIVEARTS } from './SontaDefaultersQueries'

const CreativeArtsByMinistry = () => {
  const { campusId, clickCard } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(CAMPUS_BY_CREATIVEARTS, {
    variables: {
      id: campusId,
    },
  })

  const router = useRouter()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary loading={loading || !data?.campuses[0]?.name}>
            {`${data?.campuses[0].name} Campus By Creative Arts`}
          </HeadingPrimary>
          <Row>
            {data?.campuses.length ? (
              data?.campuses[0].creativeArts.map(
                (creativeArts: HigherSontaChurchWithDefaulters, i: number) => (
                  <Col key={i} xs={12} className="mb-3">
                    <Card>
                      <Card.Header className="fw-bold">{`${creativeArts.name} Creative Arts`}</Card.Header>
                      <Card.Body
                        onClick={() => {
                          clickCard(creativeArts)
                          router.push('/services/creativearts-by-ministry')
                        }}
                      >
                        <div className="fw-bold">
                          Active Hubs {creativeArts.activeHubCount}
                        </div>
                        <div className="good">
                          Rehearsals This Week{' '}
                          {creativeArts.hubRehearsalsThisWeekCount}
                        </div>
                        <div
                          className={
                            creativeArts.hubFormDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {creativeArts.hubFormDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            creativeArts.hubsBankedThisWeekCount ===
                            creativeArts.hubRehearsalsThisWeekCount
                              ? 'good'
                              : creativeArts.hubsBankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week{' '}
                          {creativeArts.hubsBankedThisWeekCount}
                        </div>
                        <div
                          className={
                            creativeArts.hubBankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {creativeArts.hubBankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            creativeArts.hubCancelledRehearsalsThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {creativeArts.hubCancelledRehearsalsThisWeekCount}
                        </div>
                        <hr />
                        <div className="fw-bold">
                          Active Bacentas {creativeArts.activeBacentaCount}
                        </div>
                        <div className="good">
                          Services This Week{' '}
                          {creativeArts.servicesThisWeekCount}
                        </div>
                        <div
                          className={
                            creativeArts.formDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {creativeArts.formDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            creativeArts.bankedThisWeekCount ===
                            creativeArts.servicesThisWeekCount
                              ? 'good'
                              : creativeArts.bankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {creativeArts.bankedThisWeekCount}
                        </div>
                        <div
                          className={
                            creativeArts.bankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {creativeArts.bankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            creativeArts.cancelledServicesThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {creativeArts.cancelledServicesThisWeekCount}
                        </div>
                      </Card.Body>
                      <Card.Footer>
                        <div className="mb-2">
                          Contact Admin: {creativeArts?.admin?.fullName}
                        </div>
                        <a href={`tel:${creativeArts?.admin?.phoneNumber}`}>
                          <Button variant="primary">
                            <TelephoneFill /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            creativeArts?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(creativeArts)}`}
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

export default CreativeArtsByMinistry
