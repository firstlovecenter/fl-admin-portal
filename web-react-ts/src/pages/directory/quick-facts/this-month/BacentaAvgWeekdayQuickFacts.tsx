import { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { Bus, TrendingUp, Wallet } from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import { Card, CardContent } from 'components/ui/card'
import { Badge } from 'components/ui/badge'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import { BACENTA_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'
import {
  computeDelta,
  formatCount,
  formatMoney,
  safeNumber,
} from '../components/quick-fact-utils'
import QuickFactComparisonCard from './QuickFactComparisonCard'

const BacentaAvgWeekdayQuickFacts = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(BACENTA_AVG_WEEKDAY_STATS, {
    variables: { bacentaId, days: 30 },
  })

  const bacenta = data?.bacentas?.[0]
  const currency = currentUser?.currency || 'GHS'

  const churchAttendance = safeNumber(bacenta?.avgWeekdayStats?.attendance)
  const parentAttendance = safeNumber(
    bacenta?.council?.avgBacentaWeekdayStats?.attendance
  )
  const churchIncome = safeNumber(bacenta?.avgWeekdayStats?.income)
  const parentIncome = safeNumber(
    bacenta?.council?.avgBacentaWeekdayStats?.income
  )
  const churchBussing = safeNumber(bacenta?.avgBussingAttendance)
  const parentBussing = safeNumber(bacenta?.council?.avgBacentaBussingAttendance)

  const attendanceDelta = computeDelta(churchAttendance, parentAttendance)
  const incomeDelta = computeDelta(churchIncome, parentIncome)
  const bussingDelta = computeDelta(churchBussing, parentBussing)

  const parentName = bacenta?.council?.name ?? 'Council'

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Facts
            </p>
            <Badge variant="outline" className="rounded-full text-xs">
              This Month
            </Badge>
          </div>
          <div className="mt-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {bacenta?.name ?? 'Bacenta'}{' '}
              <span className="text-members">Quick Facts</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              How this Bacenta compares against the average Bacenta in{' '}
              <span className="font-medium text-foreground">{parentName}</span>.
            </p>
          </div>
        </StickyPageHeader>
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">
                Your number is at the top of each card.
              </span>{' '}
              Below the divider is the council avg — what a typical Bacenta in{' '}
              <span className="font-medium text-foreground">{parentName}</span>{' '}
              records. The pill shows whether you&apos;re above, below, or right
              at that avg.
            </p>
          </div>

          <Card>
            <CardContent className="px-4 py-3 sm:px-5">
              <LeaderAvatar
                leader={bacenta?.leader}
                leaderTitle="Bacenta Leader"
                loading={!bacenta}
              />
            </CardContent>
          </Card>

          <section
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            aria-label="Quick facts comparison"
          >
            <QuickFactComparisonCard
              testId="attendanceCard"
              icon={TrendingUp}
              accent="members"
              metricLabel="Weekday Attendance"
              churchLabel="Your avg this month"
              churchValue={formatCount(churchAttendance)}
              benchmarkLabel="Council avg"
              benchmarkValue={formatCount(parentAttendance)}
              benchmarkContext={`Avg Bacenta in ${parentName}`}
              delta={attendanceDelta}
              loading={!bacenta}
            />

            <QuickFactComparisonCard
              testId="bussingCard"
              icon={Bus}
              accent="defaulters"
              metricLabel="Sunday Bussing"
              churchLabel="Your avg this month"
              churchValue={formatCount(churchBussing)}
              benchmarkLabel="Council avg"
              benchmarkValue={formatCount(parentBussing)}
              benchmarkContext={`Avg Bacenta in ${parentName}`}
              delta={bussingDelta}
              loading={!bacenta}
            />

            <QuickFactComparisonCard
              testId="incomeCard"
              icon={Wallet}
              accent="banking"
              metricLabel="Weekday Income"
              churchLabel="Your avg this month"
              churchValue={formatMoney(churchIncome, currency)}
              benchmarkLabel="Council avg"
              benchmarkValue={formatMoney(parentIncome, currency)}
              benchmarkContext={`Avg Bacenta in ${parentName}`}
              delta={incomeDelta}
              loading={!bacenta}
            />
          </section>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default BacentaAvgWeekdayQuickFacts
