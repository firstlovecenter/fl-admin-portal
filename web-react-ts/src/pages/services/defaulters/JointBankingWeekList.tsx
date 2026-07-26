import { ApolloError } from '@apollo/client'
import {
  Banknote,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'
import { StatCard } from 'components/ui/stat-card'
import { Skeleton } from 'components/ui/skeleton'
import { formatChurchLevel } from 'lib/scope-display'
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
  const { t } = useTranslation()
  const isNotBanked = variant === 'not-banked'
  const levelLabel = formatChurchLevel(subjectLabel, t)

  const accentText = isNotBanked ? 'text-defaulters' : 'text-banking'
  const sectionName = isNotBanked
    ? t('services.defaulters.subjectNotBanked', { level: levelLabel })
    : t('services.defaulters.subjectBanked', { level: levelLabel })
  const count = records.length

  const countMessage = isNotBanked
    ? t('services.defaulters.jointCountNotBanked', {
        count,
        level: levelLabel,
      })
    : t('services.defaulters.jointCountBanked', { count, level: levelLabel })

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
                  {t('services.defaulters.weekBadge', { week })}
                </Badge>
                {church ? (
                  <p className="text-sm text-muted-foreground">{countMessage}</p>
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
                  label={
                    isNotBanked
                      ? t('services.defaulters.notBanked')
                      : t('services.defaulters.bankedThisWeekStat')
                  }
                  value={count}
                  icon={isNotBanked ? AlertTriangle : Banknote}
                  accent={isNotBanked ? 'defaulters' : 'banking'}
                  hint={t('services.defaulters.weekBadge', { week })}
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
                          ? t('services.defaulters.nothingOutstanding')
                          : t('services.defaulters.noBankedServicesYet')}
                      </p>
                      <p className="max-w-xs text-xs text-muted-foreground">
                        {isNotBanked
                          ? t('services.defaulters.noJointAwaiting', {
                              level: levelLabel,
                            })
                          : t('services.defaulters.noJointBanked', {
                              level: levelLabel,
                            })}
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
