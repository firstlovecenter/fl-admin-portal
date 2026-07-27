import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Compass } from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import MemberDisplayCard from 'components/card/MemberDisplayCard'

import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'

import { ChurchContext } from 'contexts/ChurchContext'

import {
  GOVERNORSHIP_BACENTAS_BELOW_8,
  COUNCIL_BACENTAS_BELOW_8,
  CAMPUS_BACENTAS_BELOW_8,
  STREAM_BACENTAS_BELOW_8,
} from '../bussingStatusQueries'
import { SectionLabel } from '../components/live-feed'
import BacentaArrivalsCard from './BacentaArrivalsCard'
import BacentaListSkeleton from './BacentaListSkeleton'
import BacentasByGovernorshipAccordion from './BacentasByGovernorshipAccordion'
import { useArrivalsScopedQuery } from './useArrivalsScopedQuery'

const QUERIES_BY_LEVEL = {
  Governorship: GOVERNORSHIP_BACENTAS_BELOW_8,
  Council: COUNCIL_BACENTAS_BELOW_8,
  Stream: STREAM_BACENTAS_BELOW_8,
  Campus: CAMPUS_BACENTAS_BELOW_8,
}

const BacentasBelow8 = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const {
    church,
    churchType,
    churchName,
    loading,
    error,
    refetch,
    isScopeSupported,
    hasScope,
  } = useArrivalsScopedQuery({ queriesByLevel: QUERIES_BY_LEVEL })

  const bacentas = church?.bacentasBelow8 ?? []
  const count = bacentas.length
  const isEmpty = !!church && !loading && count === 0
  const groupByGovernorship = churchType === 'Council'

  const onBacentaClick = (bacenta: (typeof bacentas)[number]) => {
    clickCard(bacenta)
    clickCard(bacenta.bussingThisWeek)
    navigate('/bacenta/bussing-details')
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <StickyPageHeader bare>
            <div className="mx-auto max-w-6xl py-3 pl-16 pr-16 md:px-4 lg:px-6">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 mb-4 min-h-11 gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="size-4" />
                {t('arrivals.state.back')}
              </Button>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-defaulters">
                  <AlertTriangle className="size-3.5" />
                  <span>{t('arrivals.dashboard.bacentaStatus')}</span>
                </div>
                {loading && !church ? (
                  <Skeleton className="h-9 w-72" />
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {church?.name ?? churchName ?? ''}{' '}
                    <span className="text-defaulters">
                      {t('arrivals.dashboard.didNotBus')}
                    </span>
                  </h1>
                )}
                <p className="text-sm text-muted-foreground">
                  {t('arrivals.state.below8.subtitle')}
                </p>
              </div>
            </div>
          </StickyPageHeader>
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            {!isScopeSupported && (
              <Card className="mb-6 border-warning/40 bg-warning/5">
                <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                  <Compass className="size-8 text-warning" />
                  <p className="text-base font-semibold text-foreground">
                    {hasScope
                      ? t('arrivals.state.pickHigherChurch')
                      : t('arrivals.state.pickChurchInFocus')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasScope
                      ? t('arrivals.state.trackedAtLevels')
                      : t('arrivals.state.chooseFromSelector')}
                  </p>
                </CardContent>
              </Card>
            )}

            {isScopeSupported && (
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start">
                <section className="space-y-3 lg:order-1">
                  <div className="flex items-center justify-between">
                    <SectionLabel>
                      {t('shared.churchLevelPlural.Bacenta')}
                    </SectionLabel>
                    {!loading && church && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {t('arrivals.state.countTotal', { count })}
                      </span>
                    )}
                  </div>

                  {loading && !church && <BacentaListSkeleton />}

                  {isEmpty && (
                    <Card className="border-success/40 bg-success/5">
                      <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                        <CheckCircle2 className="size-8 text-success" />
                        <p className="text-base font-semibold text-foreground">
                          {t('arrivals.state.below8.emptyTitle')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('arrivals.state.below8.emptyBody')}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {!isEmpty && groupByGovernorship && (
                    <BacentasByGovernorshipAccordion
                      bacentas={bacentas}
                      tone="defaulters"
                      onBacentaClick={onBacentaClick}
                      renderExtra={(bacenta) => (
                        <span className="text-xs font-semibold text-defaulters tabular-nums">
                          Attendance: {bacenta.bussingThisWeek?.attendance ?? 0}
                        </span>
                      )}
                    />
                  )}

                  {!isEmpty && !groupByGovernorship && (
                    <>
                      <div className="md:hidden space-y-3">
                        {bacentas.map((bacenta, i) => (
                          <MemberDisplayCard
                            key={bacenta.id ?? `mobile-${i}`}
                            member={bacenta}
                            leader={bacenta.leader}
                            contact
                            onClick={() => onBacentaClick(bacenta)}
                          >
                            <span className="text-xs font-semibold text-defaulters tabular-nums">
                              Attendance:{' '}
                              {bacenta.bussingThisWeek?.attendance ?? 0}
                            </span>
                          </MemberDisplayCard>
                        ))}
                      </div>
                      <div className="hidden md:grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        {bacentas.map((bacenta, i) => (
                          <BacentaArrivalsCard
                            key={bacenta.id ?? `grid-${i}`}
                            bacenta={bacenta}
                            onClick={() => onBacentaClick(bacenta)}
                          >
                            <span className="text-xs font-semibold text-defaulters tabular-nums">
                              Attendance:{' '}
                              {bacenta.bussingThisWeek?.attendance ?? 0}
                            </span>
                          </BacentaArrivalsCard>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                <aside className="space-y-3 lg:sticky lg:top-6 lg:order-2">
                  <SectionLabel>{t('arrivals.common.summary')}</SectionLabel>
                  <Card>
                    <CardContent className="space-y-4 p-5">
                      <div>
                        {loading && !church ? (
                          <Skeleton className="h-10 w-16" />
                        ) : (
                          <p className="text-4xl font-bold tabular-nums tracking-tight text-defaulters">
                            {count}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t('arrivals.state.below8.countLabel', { count })}
                        </p>
                      </div>

                      {church && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-defaulters/30 bg-defaulters/10 text-defaulters"
                          >
                            {church?.__typename}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {church?.name}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {t('arrivals.state.below8.footnote')}
                      </p>
                    </CardContent>
                  </Card>
                </aside>
              </div>
            )}
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BacentasBelow8
