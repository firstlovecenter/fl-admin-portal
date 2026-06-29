import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ChurchContext } from 'contexts/ChurchContext'
import useSetUserChurch from 'hooks/useSetUserChurch'
import React, { useContext } from 'react'
import { Phone } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { useNavigate } from 'react-router'
import PullToRefresh from 'components/base-component/PullToRefresh'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from 'components/ui/card'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { COUNCIL_BY_GOVERNORSHIP } from '../DefaultersQueries'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import '../Defaulters.css'

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
        <div className="mx-auto w-full max-w-screen-md px-4">
          <HeadingPrimary
            loading={!data}
          >{`${data?.councils[0].name} Council By Governorship`}</HeadingPrimary>
          <div className="grid gap-3">
            {data ? (
              data?.councils[0].governorships.map(
                (governorship: HigherChurchWithDefaulters, i: number) => (
                  <Card key={i}>
                    <CardHeader className="font-bold">
                      <div>{`${governorship.name} Governorship`}</div>
                      <div className="text-muted-foreground">
                        {governorship.leader?.fullName ?? 'No Leader'}
                      </div>
                    </CardHeader>
                    <CardContent
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        clickCard(governorship)
                        setUserChurch(governorship)
                        navigate('/services/defaulters/dashboard')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          clickCard(governorship)
                          setUserChurch(governorship)
                          navigate('/services/defaulters/dashboard')
                        }
                      }}
                      className="cursor-pointer space-y-1"
                    >
                      <div className="font-bold">
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
                    <CardFooter className="flex flex-col items-start gap-2">
                      {governorship?.bankedBy && (
                        <div className="text-[hsl(var(--warning))]">
                          Offering Received By:{' '}
                          {`${governorship.bankedBy.firstName} ${governorship.bankedBy.lastName}`}
                        </div>
                      )}
                      <div className="mb-2">
                        Contact Admin: {governorship?.admin?.fullName}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild>
                          <a
                            href={`tel:${governorship?.admin?.phoneNumber}`}
                          >
                            <Phone className="h-4 w-4" /> Call
                          </a>
                        </Button>
                        <Button
                          asChild
                          className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                        >
                          <a
                            href={`https://wa.me/${
                              governorship?.admin?.whatsappNumber
                            }?text=${messageForAdminsOfDefaulters(
                              governorship
                            )}`}
                          >
                            <FaWhatsapp className="h-4 w-4" /> WhatsApp
                          </a>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
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
