import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ChurchContext } from 'contexts/ChurchContext'
import useSetUserChurch from 'hooks/useSetUserChurch'
import React, { useContext } from 'react'
import { Phone, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { COUNCIL_BY_GOVERNORSHIP } from '../DefaultersQueries'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import '../Defaulters.css'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from 'components/ui/card'

const CouncilByGovernorship = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const { setUserChurch } = useSetUserChurch()
  const { data, loading, error, refetch } = useQuery(COUNCIL_BY_GOVERNORSHIP, {
    variables: {
      id: councilId,
    },
  })
  const navigate = useNavigate()

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div>
          <HeadingPrimary
            loading={!data}
          >{`${data?.councils[0].name} Council By Governorship`}</HeadingPrimary>
          <div>
            {data ? (
              data?.councils[0].governorships.map(
                (governorship: HigherChurchWithDefaulters, i: number) => (
                  <div key={i} xs={12} className="mb-3">
                    <Card>
                      <CardHeader className="fw-bold">
                        <div>{`${governorship.name} Governorship`}</div>
                        <div className="text-secondary">
                          {governorship.leader.fullName}
                        </div>
                      </CardHeader>
                      <CardContent
                        onClick={() => {
                          clickCard(governorship)
                          setUserChurch(governorship)

                          navigate('/services/defaulters/dashboard')
                        }}
                      >
                        <div className="fw-bold">
                          Active Bacentas {governorship.activeBacentaCount}
                        </div>
                        <div className="good">
                          Services This Week{' '}
                          {governorship.servicesThisWeekCount}
                        </div>
                        <div
                          className={
                            governorship.formDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Form Not Filled This Week{' '}
                          {governorship.formDefaultersThisWeekCount}
                        </div>

                        <div
                          className={
                            governorship.bankedThisWeekCount ===
                            governorship.servicesThisWeekCount
                              ? 'good'
                              : governorship.bankedThisWeekCount > 0
                              ? 'yellow'
                              : 'bad'
                          }
                        >
                          Banked This Week {governorship.bankedThisWeekCount}
                        </div>
                        <div
                          className={
                            governorship.bankingDefaultersThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Not Banked This Week{' '}
                          {governorship.bankingDefaultersThisWeekCount}
                        </div>
                        <div
                          className={
                            governorship.cancelledServicesThisWeekCount
                              ? 'bad'
                              : 'good'
                          }
                        >
                          Cancelled Services This Week{' '}
                          {governorship.cancelledServicesThisWeekCount}
                        </div>
                      </CardContent>
                      <CardFooter>
                        {governorship?.bankedBy && (
                          <div className="text-warning">
                            Offering Received By:{' '}
                            {`${governorship.bankedBy.firstName} ${governorship.bankedBy.lastName}`}
                          </div>
                        )}
                        <div className="mb-2">
                          Contact Admin: {governorship?.admin?.fullName}
                        </div>
                        <a href={`tel:${governorship?.admin?.phoneNumber}`}>
                          <Button variant="default">
                            <Phone /> Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/${
                            governorship?.admin?.whatsappNumber
                          }?text=${messageForAdminsOfDefaulters(governorship)}`}
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

export default CouncilByGovernorship
