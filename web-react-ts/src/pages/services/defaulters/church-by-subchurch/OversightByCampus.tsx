import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Phone, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import '../Defaulters.css'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { OVERSIGHT_BY_CAMPUS } from '../stream-services/StreamDefaultersQueries'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from 'components/ui/card'

const OversightByCampus = () => {
  const { oversightId, clickCard } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(OVERSIGHT_BY_CAMPUS, {
    variables: {
      id: oversightId,
    },
  })
  const navigate = useNavigate()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div>
          <HeadingPrimary
            loading={loading || !data?.oversights[0]?.name}
          >{`${data?.oversights[0]?.name} Oversight By Campus`}</HeadingPrimary>

          <div>
            {data?.oversights.length ? (
              data?.oversights[0]?.campuses.map(
                (campus: HigherChurchWithDefaulters, i: number) => (
                  <div key={i} xs={12} className="mb-3">
                    <Card>
                      <CardHeader className="fw-bold">
                        <div>{`${campus.name} Campus`}</div>
                        <div className="text-secondary">
                          {campus.leader.fullName}
                        </div>
                      </CardHeader>
                      <CardContent
                        onClick={() => {
                          clickCard(campus)
                          navigate('/services/campus-by-stream')
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
                      </CardContent>
                      <CardFooter>
                        <div className="mb-2">
                          Contact Admin: {campus?.admin?.fullName}
                        </div>
                        <a href={`tel:${campus?.admin?.phoneNumber}`}>
                          <Button variant="default">
                            <Phone /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            campus?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(campus)}`}
                          className="ms-3"
                        >
                          <Button variant="success">
                            <MessageCircle /> WhatsApp
                          </Button>
                        </a>
                      </CardFooter>
                    </Card>
                  </div>
                )
              )
            ) : (
              <PlaceholderDefaulterList />
            )}
          </div>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default OversightByCampus
