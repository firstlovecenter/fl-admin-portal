import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Phone, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import '../Defaulters.css'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { HigherSontaChurchWithDefaulters } from '../defaulters-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { CREATIVEARTS_BY_MINISTRY } from './SontaDefaultersQueries'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from 'components/ui/card'

const CreativeArtsByMinistry = () => {
  const { creativeArtsId, clickCard } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(CREATIVEARTS_BY_MINISTRY, {
    variables: {
      id: creativeArtsId,
    },
  })

  const navigate = useNavigate()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div>
          <HeadingPrimary loading={loading || !data?.creativeArts[0]?.name}>
            {`${data?.creativeArts[0].name} CreativeArts By Ministry`}
          </HeadingPrimary>
          <div>
            {data?.creativeArts.length ? (
              data?.creativeArts[0].ministries.map(
                (ministry: HigherSontaChurchWithDefaulters, i: number) => (
                  <div key={i} xs={12} className="mb-3">
                    <Card>
                      <CardHeader className="fw-bold">{`${ministry.name} Ministry`}</CardHeader>
                      <CardContent
                        onClick={() => {
                          clickCard(ministry)
                          navigate('/services/ministry-by-hubcouncil')
                        }}
                      >
                        <div className="fw-bold">
                          Active Hubs {ministry.activeHubCount}
                        </div>
                        <div className="good">
                          Rehearsals This Week{' '}
                          {ministry.hubRehearsalsThisWeekCount}
                        </div>
                        <div
                          className={
                            ministry.hubFormDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {ministry.hubFormDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            ministry.hubsBankedThisWeekCount ===
                            ministry.hubRehearsalsThisWeekCount
                              ? 'good'
                              : ministry.hubsBankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {ministry.hubsBankedThisWeekCount}
                        </div>
                        <div
                          className={
                            ministry.hubBankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {ministry.hubBankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            ministry.hubCancelledRehearsalsThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {ministry.hubCancelledRehearsalsThisWeekCount}
                        </div>
                        <hr />
                        <div className="fw-bold">
                          Active Bacentas {ministry.activeBacentaCount}
                        </div>
                        <div className="good">
                          Services This Week {ministry.servicesThisWeekCount}
                        </div>
                        <div
                          className={
                            ministry.formDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {ministry.formDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            ministry.bankedThisWeekCount ===
                            ministry.servicesThisWeekCount
                              ? 'good'
                              : ministry.bankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {ministry.bankedThisWeekCount}
                        </div>
                        <div
                          className={
                            ministry.bankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {ministry.bankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            ministry.cancelledServicesThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {ministry.cancelledServicesThisWeekCount}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="mb-2">
                          Contact Admin: {ministry?.admin?.fullName}
                        </div>
                        <a href={`tel:${ministry?.admin?.phoneNumber}`}>
                          <Button variant="default">
                            <Phone /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            ministry?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(ministry)}`}
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

export default CreativeArtsByMinistry
