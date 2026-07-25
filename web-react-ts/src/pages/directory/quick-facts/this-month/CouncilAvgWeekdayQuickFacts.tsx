import { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { Bus, TrendingUp, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import { Card, CardContent } from 'components/ui/card'
import { Badge } from 'components/ui/badge'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import { COUNCIL_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'
import {
  computeDelta,
  formatCount,
  formatMoney,
  safeNumber,
} from '../components/quick-fact-utils'
import QuickFactComparisonCard from './QuickFactComparisonCard'

const CouncilAvgWeekdayQuickFacts = () => {
  const { t } = useTranslation()
  const { councilId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(COUNCIL_AVG_WEEKDAY_STATS, {
    variables: { councilId, days: 30 },
  })

  const council = data?.councils?.[0]
  const currency = currentUser?.currency || 'GHS'

  const churchAttendance = safeNumber(council?.avgWeekdayStats?.attendance)
  const parentAttendance = safeNumber(
    council?.stream?.avgCouncilWeekdayStats?.attendance
  )
  const churchIncome = safeNumber(council?.avgWeekdayStats?.income)
  const parentIncome = safeNumber(council?.stream?.avgCouncilWeekdayStats?.income)
  const churchBussing = safeNumber(council?.avgBussingAttendance)
  const parentBussing = safeNumber(council?.stream?.avgCouncilBussingAttendance)

  const attendanceDelta = computeDelta(churchAttendance, parentAttendance)
  const incomeDelta = computeDelta(churchIncome, parentIncome)
  const bussingDelta = computeDelta(churchBussing, parentBussing)

  const parentName = council?.stream?.name ?? t('shared.churchLevel.Stream')
  const level = t('shared.churchLevel.Council')
  const parentLevel = t('shared.churchLevel.Stream')

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('directory.quickFacts.title')}
            </p>
            <Badge variant="outline" className="rounded-full text-xs">
              {t('directory.quickFacts.avgWeekday.thisMonth')}
            </Badge>
          </div>
          <div className="mt-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {council?.name ?? level}{' '}
              <span className="text-members">
                {t('directory.quickFacts.title')}
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('directory.quickFacts.avgWeekday.compareDescriptionPrefix', {
                level,
              })}{' '}
              <span className="font-medium text-foreground">{parentName}</span>
              {t('directory.quickFacts.avgWeekday.compareDescriptionSuffix')}
            </p>
          </div>
        </StickyPageHeader>
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">
                {t('directory.quickFacts.avgWeekday.explainerBold')}
              </span>{' '}
              {t('directory.quickFacts.avgWeekday.explainerBodyPrefix', {
                parentLevel,
                level,
              })}{' '}
              <span className="font-medium text-foreground">{parentName}</span>
              {t('directory.quickFacts.avgWeekday.explainerBodySuffix')}
            </p>
          </div>

          <Card>
            <CardContent className="px-4 py-3 sm:px-5">
              <LeaderAvatar
                leader={council?.leader}
                leaderTitle={t('directory.leaderTitle.councilLeader')}
                loading={!council}
              />
            </CardContent>
          </Card>

          <section
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            aria-label={t('directory.quickFacts.avgWeekday.comparisonAriaLabel')}
          >
            <QuickFactComparisonCard
              testId="attendanceCard"
              icon={TrendingUp}
              accent="members"
              metricLabel={t('directory.quickFacts.avgWeekday.metricAttendance')}
              churchLabel={t('directory.quickFacts.avgWeekday.churchLabel')}
              churchValue={formatCount(churchAttendance)}
              benchmarkLabel={t('directory.quickFacts.avgWeekday.benchmarkLabel', {
                parentLevel,
              })}
              benchmarkValue={formatCount(parentAttendance)}
              benchmarkContext={t(
                'directory.quickFacts.avgWeekday.benchmarkContext',
                { level, parentName }
              )}
              delta={attendanceDelta}
              loading={!council}
            />

            <QuickFactComparisonCard
              testId="bussingCard"
              icon={Bus}
              accent="defaulters"
              metricLabel={t('directory.quickFacts.avgWeekday.metricBussing')}
              churchLabel={t('directory.quickFacts.avgWeekday.churchLabel')}
              churchValue={formatCount(churchBussing)}
              benchmarkLabel={t('directory.quickFacts.avgWeekday.benchmarkLabel', {
                parentLevel,
              })}
              benchmarkValue={formatCount(parentBussing)}
              benchmarkContext={t(
                'directory.quickFacts.avgWeekday.benchmarkContext',
                { level, parentName }
              )}
              delta={bussingDelta}
              loading={!council}
            />

            <QuickFactComparisonCard
              testId="incomeCard"
              icon={Wallet}
              accent="banking"
              metricLabel={t('directory.quickFacts.avgWeekday.metricIncome')}
              churchLabel={t('directory.quickFacts.avgWeekday.churchLabel')}
              churchValue={formatMoney(churchIncome, currency)}
              benchmarkLabel={t('directory.quickFacts.avgWeekday.benchmarkLabel', {
                parentLevel,
              })}
              benchmarkValue={formatMoney(parentIncome, currency)}
              benchmarkContext={t(
                'directory.quickFacts.avgWeekday.benchmarkContext',
                { level, parentName }
              )}
              delta={incomeDelta}
              loading={!council}
            />
          </section>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default CouncilAvgWeekdayQuickFacts
