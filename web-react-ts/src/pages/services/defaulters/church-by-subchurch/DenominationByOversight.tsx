import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Phone } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { useNavigate } from 'react-router'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PullToRefresh from 'components/base-component/PullToRefresh'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from 'components/ui/card'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { DENOMINATION_BY_OVERSIGHT } from '../stream-services/StreamDefaultersQueries'
import '../Defaulters.css'

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
        <div className="mx-auto w-full max-w-screen-md px-4">
          <HeadingPrimary
            loading={loading || !data?.denominations[0]?.name}
          >{`${data?.denominations[0]?.name} Denomination By Oversights`}</HeadingPrimary>

          <div className="grid gap-3">
            {data?.denominations.length ? (
              data?.denominations[0]?.oversights.map(
                (oversight: HigherChurchWithDefaulters, i: number) => (
                  <Card key={i}>
                    <CardHeader className="font-bold">
                      <div>{`${oversight.name} Oversight`}</div>
                      <div className="text-muted-foreground">
                        {oversight.leader?.fullName ?? 'No Leader'}
                      </div>
                    </CardHeader>
                    <CardContent
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        clickCard(oversight)
                        navigate('/services/oversight-by-campus')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          clickCard(oversight)
                          navigate('/services/oversight-by-campus')
                        }
                      }}
                      className="cursor-pointer space-y-1"
                    >
                      <div className="font-bold">
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
                    <CardFooter className="flex flex-col items-start gap-2">
                      <div className="mb-2">
                        Contact Admin: {oversight?.admin?.fullName}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild>
                          <a href={`tel:${oversight?.admin?.phoneNumber}`}>
                            <Phone className="h-4 w-4" /> Call
                          </a>
                        </Button>
                        <Button
                          asChild
                          className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                        >
                          <a
                            href={`https://wa.me/${
                              oversight?.admin?.whatsappNumber
                            }?text=${messageForAdminsOfDefaulters(oversight)}`}
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

export default DenominationByOversight
