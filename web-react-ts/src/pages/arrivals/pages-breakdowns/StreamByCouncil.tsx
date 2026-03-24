import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import PullToRefresh from 'react-simple-pull-to-refresh'
import '../Arrivals.css'
import { STREAM_BY_COUNCIL_ARRIVALS } from './churchBySubchurchQueries'
import { HigherChurchWithArrivals } from '../arrivals-types'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import useSetUserChurch from 'hooks/useSetUserChurch'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import { Card, CardContent, CardHeader } from 'components/ui/card'

const StreamByCouncil = () => {
  const { clickCard, streamId, arrivalDate } = useContext(ChurchContext)
  const navigate = useNavigate()
  const { setUserChurch } = useSetUserChurch()

  const { data, loading, error, refetch } = useQuery(
    STREAM_BY_COUNCIL_ARRIVALS,
    {
      variables: { id: streamId, arrivalDate },
      pollInterval: SHORT_POLL_INTERVAL,
    }
  )

  const stream = data?.streams[0]

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div>
          <HeadingPrimary
            loading={!stream}
          >{`${stream?.name} Stream By Council`}</HeadingPrimary>
          <div>
            {stream?.councils?.map(
              (council: HigherChurchWithArrivals, i: number) => {
                const array = [
                  {
                    title: 'Active Bacentas',
                    number: council.activeBacentaCount,
                    color: 'white',
                  },
                  {
                    title: 'Bacentas With No Activity',
                    number: council.bacentasNoActivityCount,
                    color: 'red',
                  },
                  {
                    title: 'Bacentas Mobilising',
                    number: council.bacentasMobilisingCount,
                    color: 'orange',
                  },
                  {
                    title: 'Bacentas On The Way',
                    number: council.bacentasOnTheWayCount,
                    color: 'yellow',
                  },
                  {
                    title: `Bacentas That Didn't Bus`,
                    number: council.bacentasBelow8Count,
                    color: 'red',
                  },
                  {
                    title: 'Bacentas That Have Arrived',
                    number: council.bacentasHaveArrivedCount,
                    color: 'green',
                  },
                ]
                const membersArray = [
                  {
                    title: 'Members On The Way',
                    number: council.bussingMembersOnTheWayCount,
                    color: 'yellow',
                  },
                  {
                    title: 'Members Arrived',
                    number: council.bussingMembersHaveArrivedCount,
                    color: 'green',
                  },
                  {
                    title: 'Busses Arrived',
                    number: council.bussesThatArrivedCount,
                    color: 'green',
                  },
                ]

                return (
                  <div key={i} xs={12} className="mb-3">
                    <Card>
                      <CardHeader>
                        <div className="fw-bold">{`${council.name} ${council.__typename}`}</div>
                        <div className="text-secondary">
                          <MemberAvatarWithName member={council.leader} />
                        </div>
                      </CardHeader>
                      <CardContent
                        onClick={() => {
                          clickCard(council)
                          setUserChurch(council)
                          navigate(`/arrivals/council`)
                        }}
                      >
                        <div className="mb-3">
                          {array.map((col, index) => (
                            <div key={index} className={col.color}>
                              {`${col.title} - ${col.number}`}
                            </div>
                          ))}
                        </div>
                        <hr />
                        <div>
                          {membersArray.map((col, index) => (
                            <div key={index} className={col.color}>
                              {`${col.title} - ${col.number}`}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              }
            )}

            {(loading || !data) &&
              [1, 2, 3].map((placeholder, i) => (
                <div key={i} xs={12} className="mb-3">
                  <Card>
                    <CardHeader className="fw-bold">
                      <PlaceholderCustom
                        loading={loading}
                        className="fw-bold"
                      ></PlaceholderCustom>
                    </CardHeader>
                    <CardContent>
                      <PlaceholderCustom loading={loading} as="div" />
                      <PlaceholderCustom loading={loading} as="div" />
                      <PlaceholderCustom loading={loading} as="div" />
                      <PlaceholderCustom loading={loading} as="div" />
                    </CardContent>
                  </Card>
                </div>
              ))}
          </div>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StreamByCouncil
