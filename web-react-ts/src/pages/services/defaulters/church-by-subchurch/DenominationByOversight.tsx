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
import { DENOMINATION_BY_OVERSIGHT } from '../stream-services/StreamDefaultersQueries'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from 'components/ui/card'

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
  const navigate = useNavigate()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div>
          <HeadingPrimary
            loading={loading || !data?.denominations[0]?.name}
          >{`${data?.denominations[0]?.name} Denomination By Oversights`}</HeadingPrimary>

          <div>
            {data?.denominations.length ? (
              data?.denominations[0]?.oversights.map(
                (oversight: HigherChurchWithDefaulters, i: number) => (
                  <div key={i} xs={12} className="mb-3">
                    <Card>
                      <CardHeader className="fw-bold">
                        <div>{`${oversight.name} Oversight`}</div>
                        <div className="text-secondary">
                          {oversight.leader.fullName}
                        </div>
                      </CardHeader>
                      <CardContent
                        onClick={() => {
                          clickCard(oversight)
                          navigate('/services/oversight-by-campus')
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
                      </CardContent>
                      <CardFooter>
                        <div className="mb-2">
                          Contact Admin: {oversight?.admin?.fullName}
                        </div>
                        <a href={`tel:${oversight?.admin?.phoneNumber}`}>
                          <Button variant="default">
                            <Phone /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            oversight?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(oversight)}`}
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

export default DenominationByOversight
