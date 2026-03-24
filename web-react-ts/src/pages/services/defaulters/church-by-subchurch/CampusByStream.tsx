import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Phone, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import { CAMPUS_BY_STREAM } from '../DefaultersQueries'
import '../Defaulters.css'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from 'components/ui/card'

const CampusByStream = () => {
  const { campusId, clickCard } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(CAMPUS_BY_STREAM, {
    variables: {
      id: campusId,
    },
  })
  const navigate = useNavigate()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div>
          <HeadingPrimary
            loading={loading || !data?.campuses[0]?.name}
          >{`${data?.campuses[0]?.name} Campus By Streams`}</HeadingPrimary>

          <div>
            {data?.campuses.length ? (
              data?.campuses[0]?.streams.map(
                (stream: HigherChurchWithDefaulters, i: number) => (
                  <div key={i} xs={12} className="mb-3">
                    <Card>
                      <CardHeader className="fw-bold">
                        <div>{`${stream.name} Stream`}</div>
                        <div className="text-secondary">
                          {stream.leader.fullName}
                        </div>
                      </CardHeader>
                      <CardContent
                        onClick={() => {
                          clickCard(stream)
                          navigate('/services/stream-by-council')
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
                      </CardContent>
                      <CardFooter>
                        <div className="mb-2">
                          Contact Admin: {stream?.admin?.fullName}
                        </div>
                        <a href={`tel:${stream?.admin?.phoneNumber}`}>
                          <Button variant="default">
                            <Phone /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            stream?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(stream)}`}
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

export default CampusByStream
