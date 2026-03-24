import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Phone, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import { STREAM_BY_COUNCIL } from '../DefaultersQueries'
import '../Defaulters.css'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from 'components/ui/card'

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
        <div>
          <HeadingPrimary loading={loading || !data?.streams[0]?.name}>
            {`${data?.streams[0].name} Stream By Council`}
          </HeadingPrimary>
          <div>
            {data?.streams.length ? (
              data?.streams[0].councils.map(
                (council: HigherChurchWithDefaulters, i: number) => (
                  <div key={i} xs={12} className="mb-3">
                    <Card>
                      <CardHeader className="fw-bold">
                        <div>{`${council.name} Council`}</div>
                        <div className="text-secondary">
                          {council.leader.fullName}
                        </div>
                      </CardHeader>
                      <CardContent
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
                      </CardContent>
                      <CardFooter>
                        <div className="mb-2">
                          Contact Admin: {council?.admin?.fullName}
                        </div>
                        <a href={`tel:${council?.admin?.phoneNumber}`}>
                          <Button variant="default">
                            <Phone /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            council?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(council)}`}
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

export default StreamByCouncil
