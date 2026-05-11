import { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { Bus, TrendingUp, Wallet } from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import { Card, CardContent } from 'components/ui/card'
import { Badge } from 'components/ui/badge'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import { STREAM_AVG_WEEKDAY_STATS } from '../QuickFactsQueries'
import {
  computeDelta,
  formatCount,
  formatMoney,
  safeNumber,
} from '../components/quick-fact-utils'
import QuickFactComparisonCard from './QuickFactComparisonCard'

const StreamAvgWeekdayQuickFacts = () => {
  const { streamId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(STREAM_AVG_WEEKDAY_STATS, {
    variables: { streamId, days: 30 },
  })

  const stream = data?.streams?.[0]
  const currency = currentUser?.currency || 'GHS'

  const churchAttendance = safeNumber(stream?.avgWeekdayStats?.attendance)
  const parentAttendance = safeNumber(
    stream?.campus?.avgStreamWeekdayStats?.attendance
  )
  const churchIncome = safeNumber(stream?.avgWeekdayStats?.income)
  const parentIncome = safeNumber(stream?.campus?.avgStreamWeekdayStats?.income)
  const churchBussing = safeNumber(stream?.avgBussingAttendance)
  const parentBussing = safeNumber(stream?.campus?.avgStreamBussingAttendance)

  const attendanceDelta = computeDelta(churchAttendance, parentAttendance)
  const incomeDelta = computeDelta(churchIncome, parentIncome)
  const bussingDelta = computeDelta(churchBussing, parentBussing)

  const parentName = stream?.campus?.name ?? 'Campus'

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Facts
              </p>
              <Badge variant="outline" className="rounded-full text-xs">
                This Month
              </Badge>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {stream?.name ?? 'Stream'}{' '}
                <span className="text-members">Quick Facts</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                How this Stream compares against the average Stream in{' '}
                <span className="font-medium text-foreground">{parentName}</span>.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">
                  Your number is at the top of each card.
                </span>{' '}
                Below the divider is the campus avg — what a typical Stream in{' '}
                <span className="font-medium text-foreground">{parentName}</span>{' '}
                records. The pill shows whether you&apos;re above, below, or right
                at that avg.
              </p>
            </div>
          </header>

          <Card>
            <CardContent className="px-4 py-3 sm:px-5">
              <LeaderAvatar
                leader={stream?.leader}
                leaderTitle="Stream Leader"
                loading={!stream}
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
              benchmarkLabel="Campus avg"
              benchmarkValue={formatCount(parentAttendance)}
              benchmarkContext={`Avg Stream in ${parentName}`}
              delta={attendanceDelta}
              loading={!stream}
            />

            <QuickFactComparisonCard
              testId="bussingCard"
              icon={Bus}
              accent="defaulters"
              metricLabel="Sunday Bussing"
              churchLabel="Your avg this month"
              churchValue={formatCount(churchBussing)}
              benchmarkLabel="Campus avg"
              benchmarkValue={formatCount(parentBussing)}
              benchmarkContext={`Avg Stream in ${parentName}`}
              delta={bussingDelta}
              loading={!stream}
            />

            <QuickFactComparisonCard
              testId="incomeCard"
              icon={Wallet}
              accent="banking"
              metricLabel="Weekday Income"
              churchLabel="Your avg this month"
              churchValue={formatMoney(churchIncome, currency)}
              benchmarkLabel="Campus avg"
              benchmarkValue={formatMoney(parentIncome, currency)}
              benchmarkContext={`Avg Stream in ${parentName}`}
              delta={incomeDelta}
              loading={!stream}
            />
          </section>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default StreamAvgWeekdayQuickFacts
