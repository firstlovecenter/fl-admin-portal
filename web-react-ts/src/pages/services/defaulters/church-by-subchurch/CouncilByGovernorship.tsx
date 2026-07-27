import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ChurchContext } from 'contexts/ChurchContext'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { useContext } from 'react'
import { Phone } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import PullToRefresh from 'components/base-component/PullToRefresh'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from 'components/ui/card'
import { formatChurchLevel } from 'lib/scope-display'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import { COUNCIL_BY_GOVERNORSHIP } from '../DefaultersQueries'
import PlaceholderDefaulterList from '../PlaceholderDefaulterList'
import '../Defaulters.css'

const CouncilByGovernorship = () => {
  const { t } = useTranslation()
  const { councilId, clickCard } = useContext(ChurchContext)
  const { setUserChurch } = useSetUserChurch()
  const { data, loading, error, refetch } = useQuery(COUNCIL_BY_GOVERNORSHIP, {
    variables: {
      id: councilId,
    },
  })
  const navigate = useNavigate()

  const council = data?.councils?.[0]
  const pageTitle = council
    ? `${council.name} ${t('services.defaulters.bySubchurchHighlight', {
        level: formatChurchLevel('Council', t),
        subLevel: formatChurchLevel('Governorship', t),
      })}`
    : ''

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div className="mx-auto w-full max-w-screen-md px-4">
          <HeadingPrimary loading={!data}>{pageTitle}</HeadingPrimary>
          <div className="grid gap-3">
            {data ? (
              data?.councils[0].governorships.map(
                (governorship: HigherChurchWithDefaulters, i: number) => (
                  <Card key={i}>
                    <CardHeader className="font-bold">
                      <div>{`${governorship.name} ${formatChurchLevel(
                        'Governorship',
                        t
                      )}`}</div>
                      <div className="text-muted-foreground">
                        {governorship.leader?.fullName ??
                          t('services.defaulters.noLeader')}
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
                        {t('services.defaulters.activeBacentas')}{' '}
                        {governorship.activeBacentaCount}
                      </div>
                      <div className="good">
                        {t('services.defaulters.servicesThisWeekLabel')}{' '}
                        {governorship.servicesThisWeekCount}
                      </div>
                      <div
                        className={
                          governorship.formDefaultersThisWeekCount
                            ? 'bad'
                            : 'good'
                        }
                      >
                        {t('services.defaulters.formNotFilledThisWeek')}{' '}
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
                        {t('services.defaulters.bankedThisWeekLabel')}{' '}
                        {governorship.bankedThisWeekCount}
                      </div>
                      <div
                        className={
                          governorship.bankingDefaultersThisWeekCount
                            ? 'bad'
                            : 'good'
                        }
                      >
                        {t('services.defaulters.notBankedThisWeekLabel')}{' '}
                        {governorship.bankingDefaultersThisWeekCount}
                      </div>
                      <div
                        className={
                          governorship.cancelledServicesThisWeekCount
                            ? 'bad'
                            : 'good'
                        }
                      >
                        {t('services.defaulters.cancelledServicesThisWeekLabel')}{' '}
                        {governorship.cancelledServicesThisWeekCount}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-2">
                      {governorship?.bankedBy && (
                        <div className="text-[hsl(var(--warning))]">
                          {t('services.defaulters.offeringReceivedBy', {
                            name: `${governorship.bankedBy.firstName} ${governorship.bankedBy.lastName}`,
                          })}
                        </div>
                      )}
                      <div className="mb-2">
                        {t('services.defaulters.contactAdmin', {
                          name: governorship?.admin?.fullName ?? '',
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild>
                          <a
                            href={`tel:${governorship?.admin?.phoneNumber}`}
                          >
                            <Phone className="h-4 w-4" />{' '}
                            {t('services.defaulters.call')}
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
                            <FaWhatsapp className="h-4 w-4" />{' '}
                            {t('services.defaulters.whatsapp')}
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
