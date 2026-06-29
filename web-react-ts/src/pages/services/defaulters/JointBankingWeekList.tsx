import { ApolloError } from '@apollo/client'
import {
  Banknote,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'
import { StatCard } from 'components/ui/stat-card'
import { Skeleton } from 'components/ui/skeleton'
import {
  DefaultersUseChurchType,
  GovernorshipWithDefaulters,
  CouncilWithDefaulters,
} from './defaulters-types'
import PlaceholderDefaulterList from './PlaceholderDefaulterList'
import JointServiceDefaulterCard from './JointServiceDefaultersCard'

type JointRecord = GovernorshipWithDefaulters | CouncilWithDefaulters

type JointBankingWeekListProps = {
  church: DefaultersUseChurchType['church'] | undefined
  loading: boolean
  error?: ApolloError
  refetch: () => Promise<unknown>
  records: JointRecord[]
  /** Sub-church grouping shown in the heading. */
  subjectLabel: 'Council' | 'Governorship'
  /** `not-banked` = defaulters (orange); `banked` = banked services (green). */
  variant: 'banked' | 'not-banked'
  /** Service-details route for each card. */
  serviceLink: string
  /** ISO week number being displayed — sourced from the selected week so the
   * header reconciles with the dashboard count and the queried window. */
  week: number
}

const JointBankingWeekList = ({
  church,
  loading,
  error,
  refetch,
  records,
  subjectLabel,
  variant,
  serviceLink,
  week,
}: JointBankingWeekListProps) => {
  const isNotBanked = variant === 'not-banked'

  const accentText = isNotBanked ? 'text-defaulters' : 'text-banking'
  const sectionName = isNotBanked
    ? `${subjectLabel} Not Banked`
    : `${subjectLabel} Banked`
  const count = records.length

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          {/* ── Sticky heading — clears the floating PWA shell controls on mobile ── */}
          <StickyPageHeader bare>
            <div className="mx-auto max-w-6xl space-y-2 py-3 pl-16 pr-16 md:px-4 lg:px-6">
              {church ? (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {church.name} <span className={accentText}>{sectionName}</span>
                </h1>
              ) : (
                <Skeleton className="h-9 w-72" />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <CalendarCheck className="size-3.5" />
                  Week {week}
                </Badge>
                {church ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold tabular-nums text-foreground">
                      {count}
                    </span>{' '}
                    {subjectLabel.toLowerCase()}
                    {count === 1 ? ' service has' : ' services have'}{' '}
                    {isNotBanked ? 'not banked' : 'banked'} this week
                  </p>
                ) : (
                  <Skeleton className="h-5 w-40" />
                )}
              </div>
            </div>
          </StickyPageHeader>

          <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6">
            {/* ── 2-column on lg+, summary first in DOM (sits on top on mobile) ── */}
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start">
              {/* Supporting column — summary */}
              <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-[88px]">
                <StatCard
                  label={isNotBanked ? 'Not Banked' : 'Banked This Week'}
                  value={count}
                  icon={isNotBanked ? AlertTriangle : Banknote}
                  accent={isNotBanked ? 'defaulters' : 'banking'}
                  hint={`Week ${week}`}
                  loading={!church}
                />
              </aside>

              {/* Primary column — list */}
              <section className="space-y-3 lg:col-start-1 lg:row-start-1">
                {!church && <PlaceholderDefaulterList />}

                {church && count === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                      <span className="flex size-12 items-center justify-center rounded-full bg-banking/10">
                        <CheckCircle2 className="size-6 text-banking" />
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {isNotBanked
                          ? 'Nothing outstanding'
                          : 'No banked services yet'}
                      </p>
                      <p className="max-w-xs text-xs text-muted-foreground">
                        {isNotBanked
                          ? `No ${subjectLabel.toLowerCase()} services are awaiting banking this week.`
                          : `No ${subjectLabel.toLowerCase()} services have banked this week.`}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {church &&
                  records.map((service, i) => (
                    <JointServiceDefaulterCard
                      key={i}
                      defaulter={service}
                      link={serviceLink}
                    />
                  ))}
              </section>
            </div>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default JointBankingWeekList
