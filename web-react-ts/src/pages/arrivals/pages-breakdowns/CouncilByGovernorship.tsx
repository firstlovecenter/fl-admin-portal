import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import PullToRefresh from 'react-simple-pull-to-refresh'
import '../Arrivals.css'
import { COUNCIL_BY_GOVERNORSHIP_ARRIVALS } from './churchBySubchurchQueries'
import { HigherChurchWithArrivals } from '../arrivals-types'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import useSetUserChurch from 'hooks/useSetUserChurch'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import { Card, CardContent, CardHeader } from 'components/ui/card'

const CouncilByGovernorship = () => {
  const { clickCard, councilId, arrivalDate } = useContext(ChurchContext)
  const navigate = useNavigate()
  const { setUserChurch } = useSetUserChurch()

  const { data, loading, error, refetch } = useQuery(
    COUNCIL_BY_GOVERNORSHIP_ARRIVALS,
    {
      variables: { id: councilId, arrivalDate },
      pollInterval: SHORT_POLL_INTERVAL,
    }
  )

  const council = data?.councils[0]

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div>
          <HeadingPrimary
            loading={!council}
          >{`${council?.name} Council By Governorship`}</HeadingPrimary>
          <div>
            {council?.governorships?.map(
              (governorship: HigherChurchWithArrivals, i: number) => {
                const array = [
                  {
                    title: 'Active Bacentas',
                    number: governorship.activeBacentaCount,
                    color: 'white',
                  },
                  {
                    title: 'Bacentas With No Activity',
                    number: governorship.bacentasNoActivityCount,
                    color: 'red',
                  },
                  {
                    title: 'Bacentas Mobilising',
                    number: governorship.bacentasMobilisingCount,
                    color: 'orange',
                  },
                  {
                    title: 'Bacentas On The Way',
                    number: governorship.bacentasOnTheWayCount,
                    color: 'yellow',
                  },
                  {
                    title: `Bacentas That Didn't Bus`,
                    number: governorship.bacentasBelow8Count,
                    color: 'red',
                  },
                  {
                    title: 'Bacentas That Have Arrived',
                    number: governorship.bacentasHaveArrivedCount,
                    color: 'green',
                  },
                ]
                const membersArray = [
                  {
                    title: 'Members On The Way',
                    number: governorship.bussingMembersOnTheWayCount,
                    color: 'yellow',
                  },
                  {
                    title: 'Members Arrived',
                    number: governorship.bussingMembersHaveArrivedCount,
                    color: 'green',
                  },
                  {
                    title: 'Busses Arrived',
                    number: governorship.bussesThatArrivedCount,
                    color: 'green',
                  },
                ]

                return (
                  <div key={i} xs={12} className="mb-3">
                    <Card>
                      <CardHeader>
                        <div className="fw-bold">{`${governorship.name} ${governorship.__typename}`}</div>
                        <div className="text-secondary">
                          <MemberAvatarWithName member={governorship.leader} />
                        </div>
                      </CardHeader>
                      <CardContent
                        onClick={() => {
                          clickCard(governorship)
                          setUserChurch(governorship)
                          navigate(`/arrivals/governorship`)
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

export default CouncilByGovernorship
