import { useLazyQuery } from '@apollo/client'
import { useContext, useMemo } from 'react'
import { Banknote, CalendarCheck, Inbox, Users } from 'lucide-react'
import { getWeekNumber } from 'jd-date-utils'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import useSontaLevel from 'hooks/useSontaLevel'
import { MemberContext } from 'contexts/MemberContext'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'
import { Separator } from 'components/ui/separator'
import { Skeleton } from 'components/ui/skeleton'

import {
  CAMPUS_SERVICES_LIST,
  COUNCIL_SERVICES_LIST,
  GOVERNORSHIP_SERVICES_LIST,
  STREAM_SERVICES_LIST,
} from './DefaultersQueries'
import BacentaServiceCard from './BacentaServiceCard'
import { DefaultersUseChurchType } from './defaulters-types'

const RowSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="size-4 rounded" />
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-11 flex-1 rounded-md" />
      <Skeleton className="h-11 flex-1 rounded-md" />
    </div>
  </div>
)

const ServicesThisWeek = () => {
  const [governorshipServicesThisWeek, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_SERVICES_LIST)
  const [councilServicesThisWeek, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_SERVICES_LIST
  )
  const [streamServicesThisWeek, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_SERVICES_LIST
  )
  const [campusThisWeek, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_SERVICES_LIST
  )

  const data = useSontaLevel({
    governorshipFunction: governorshipServicesThisWeek,
    governorshipRefetch,
    councilFunction: councilServicesThisWeek,
    councilRefetch,
    streamFunction: streamServicesThisWeek,
    streamRefetch,
    campusFunction: campusThisWeek,
    campusRefetch,
  })
  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  const { currentUser } = useContext(MemberContext)
  const services = church?.servicesThisWeek ?? []
  const total = services.length
  const week = getWeekNumber()

  const { totalAttendance, totalIncome } = useMemo(() => {
    return services.reduce(
      (acc, service) => {
        const detail = service.services?.[0]
        if (typeof detail?.attendance === 'number') {
          acc.totalAttendance += detail.attendance
        }
        if (typeof detail?.income === 'number') {
          acc.totalIncome += detail.income
        }
        return acc
      },
      { totalAttendance: 0, totalIncome: 0 }
    )
  }, [services])

  const trackIncome = !currentUser?.noIncomeTracking
  const formatCount = (n: number) => n.toLocaleString('en-GH')
  const formatMoney = (n: number) => {
    try {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: currentUser?.currency || 'GHS',
        maximumFractionDigits: 0,
      }).format(n)
    } catch {
      return `${currentUser?.currency ?? 'GHS'} ${formatCount(n)}`
    }
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
            <header className="space-y-2">
              {church ? (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {church.name}{' '}
                  <span className="text-churches">Filled Services</span>
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
                      {total}
                    </span>{' '}
                    {total === 1 ? 'service form' : 'service forms'} filed this
                    week
                  </p>
                ) : (
                  <Skeleton className="h-4 w-48" />
                )}
              </div>
            </header>

            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
              <section className="space-y-3">
                {!church && (
                  <>
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                  </>
                )}

                {church && total === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                      <div className="rounded-full bg-muted p-3">
                        <Inbox className="size-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          No service forms filed yet
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Forms filled by Bacenta leaders this week will appear
                          here.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {church &&
                  services.map((service) => (
                    <BacentaServiceCard
                      key={service.id}
                      defaulter={service}
                      link="/bacenta/service-details"
                    />
                  ))}
              </section>

              <aside className="space-y-3 lg:sticky lg:top-6">
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Week {week} totals
                    </p>

                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-churches/10 p-2 text-churches">
                        <CalendarCheck className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          Forms filed
                        </p>
                        {church ? (
                          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                            {formatCount(total)}
                          </p>
                        ) : (
                          <Skeleton className="h-7 w-16" />
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-members/10 p-2 text-members">
                        <Users className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          Total attendance
                        </p>
                        {church ? (
                          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                            {totalAttendance > 0
                              ? formatCount(totalAttendance)
                              : '—'}
                          </p>
                        ) : (
                          <Skeleton className="h-7 w-20" />
                        )}
                      </div>
                    </div>

                    {trackIncome && (
                      <>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-banking/10 p-2 text-banking">
                            <Banknote className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">
                              Total income
                            </p>
                            {church ? (
                              <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                                {totalIncome > 0
                                  ? formatMoney(totalIncome)
                                  : '—'}
                              </p>
                            ) : (
                              <Skeleton className="h-7 w-28" />
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </aside>
            </div>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default ServicesThisWeek
