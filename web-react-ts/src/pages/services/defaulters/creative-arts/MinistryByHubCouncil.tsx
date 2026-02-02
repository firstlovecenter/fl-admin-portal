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
import { MINISTRY_BY_HUBCOUNCIL } from './SontaDefaultersQueries'
import useSetUserChurch from 'hooks/useSetUserChurch'

const MinistryByHubCouncil = () => {
  const { ministryId, clickCard } = useContext(ChurchContext)
  const { setUserChurch } = useSetUserChurch()
  const { data, loading, error, refetch } = useQuery(MINISTRY_BY_HUBCOUNCIL, {
    variables: {
      id: ministryId,
    },
  })

  const router = useRouter()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <Container>
          <HeadingPrimary loading={loading || !data?.ministries[0]?.name}>
            {`${data?.ministries[0].name} Ministry By Hub Council`}
          </HeadingPrimary>
          <Row>
            {data?.ministries.length ? (
              data?.ministries[0].hubCouncils.map(
                (hub: HigherSontaChurchWithDefaulters, i: number) => (
                  <Col key={i} xs={12} className="mb-3">
                    <Card>
                      <Card.Header className="fw-bold">{`${hub.name} Hub Council`}</Card.Header>
                      <Card.Body
                        onClick={() => {
                          clickCard(hub)
                          setUserChurch(hub)

                          router.push('/services/defaulters/dashboard')
                        }}
                      >
                        <div className="fw-bold">
                          Active Hubs {hub.activeHubCount}
                        </div>
                        <div className="good">
                          Rehearsals This Week {hub.hubRehearsalsThisWeekCount}
                        </div>
                        <div
                          className={
                            hub.hubFormDefaultersThisWeekCount ? 'bad' : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {hub.hubFormDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            hub.hubsBankedThisWeekCount ===
                            hub.hubRehearsalsThisWeekCount
                              ? 'good'
                              : hub.hubsBankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {hub.hubsBankedThisWeekCount}
                        </div>
                        <div
                          className={
                            hub.hubBankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {hub.hubBankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            hub.hubCancelledRehearsalsThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {hub.hubCancelledRehearsalsThisWeekCount}
                        </div>
                        <hr />
                        <div className="fw-bold">
                          Active Bacentas {hub.activeBacentaCount}
                        </div>
                        <div className="good">
                          Services This Week {hub.servicesThisWeekCount}
                        </div>
                        <div
                          className={
                            hub.formDefaultersThisWeekCount ? 'bad' : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {hub.formDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            hub.bankedThisWeekCount ===
                            hub.servicesThisWeekCount
                              ? 'good'
                              : hub.bankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {hub.bankedThisWeekCount}
                        </div>
                        <div
                          className={
                            hub.bankingDefaultersThisWeekCount ? 'bad' : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {hub.bankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            hub.cancelledServicesThisWeekCount ? 'bad' : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {hub.cancelledServicesThisWeekCount}
                        </div>
                      </Card.Body>
                      <Card.Footer>
                        <div className="mb-2">
                          Contact Leader: {hub?.leader?.fullName}
                        </div>
                        <a href={`tel:${hub?.leader?.phoneNumber}`}>
                          <Button variant="primary">
                            <TelephoneFill /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            hub?.leader?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(hub)}`}
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

export default MinistryByHubCouncil
