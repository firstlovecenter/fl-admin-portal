import { useLazyQuery } from '@apollo/client'
import { useContext, useMemo } from 'react'
import {
  AlertOctagon,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  Users,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import useSontaLevel from 'hooks/useSontaLevel'
import useSelectedWeek from 'hooks/useSelectedWeek'
import WeekSelector from 'components/WeekSelector/WeekSelector'
import { MemberContext } from 'contexts/MemberContext'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import {
  StickyPageHeader,
  StickyPageHeaderActions,
} from 'components/shell/StickyPageHeader'

import {
  CAMPUS_BANKING_DEFAULTERS_LIST,
  COUNCIL_BANKING_DEFAULTERS_LIST,
  GOVERNORSHIP_BANKING_DEFAULTERS_LIST,
  STREAM_BANKING_DEFAULTERS_LIST,
} from './DefaultersQueries'
import BacentaServiceCard, {
  BacentaServiceCardSkeleton,
} from './BacentaServiceCard'
import WeekTotalsCard, { WeekTotalItem } from './WeekTotalsCard'
import DownloadDefaultersButton from './DownloadDefaultersButton'
import { isDefaultersDownloadLevel } from './utils/buildDefaultersWorkbook'
import { DefaultersUseChurchType } from './defaulters-types'

const BankingDefaulters = () => {
  const { weekStart, week, isCurrent } = useSelectedWeek()

  const [governorshipBankingDefaulters, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_BANKING_DEFAULTERS_LIST)
  const [councilBankingDefaulters, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_BANKING_DEFAULTERS_LIST
  )
  const [streamBankingDefaulters, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_BANKING_DEFAULTERS_LIST
  )
  const [campusBankingDefaulters, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_BANKING_DEFAULTERS_LIST
  )

  const data = useSontaLevel({
    governorshipFunction: governorshipBankingDefaulters,
    governorshipRefetch,
    councilFunction: councilBankingDefaulters,
    councilRefetch,
    streamFunction: streamBankingDefaulters,
    streamRefetch,
    campusFunction: campusBankingDefaulters,
    campusRefetch,
    weekStart,
  })
  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  const { currentUser } = useContext(MemberContext)
  const defaulters = church?.bankingDefaultersThisWeek ?? []
  const total = defaulters.length

  const { totalAttendance, totalUnbankedIncome } = useMemo(() => {
    return defaulters.reduce(
      (acc, defaulter) => {
        const detail = defaulter.serviceRecordForWeek
        if (typeof detail?.attendance === 'number') {
          acc.totalAttendance += detail.attendance
        }
        if (typeof detail?.income === 'number') {
          acc.totalUnbankedIncome += detail.income
        }
        return acc
      },
      { totalAttendance: 0, totalUnbankedIncome: 0 }
    )
  }, [defaulters])

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

  const totalsItems: WeekTotalItem[] = [
    {
      key: 'outstanding',
      label: 'Outstanding',
      value: formatCount(total),
      accent: 'defaulters',
      icon: <AlertOctagon />,
    },
  ]
  if (trackIncome) {
    totalsItems.push({
      key: 'unbanked',
      label: 'Unbanked income',
      value: totalUnbankedIncome > 0 ? formatMoney(totalUnbankedIncome) : '—',
      accent: 'banking',
      icon: <Banknote />,
    })
  }
  totalsItems.push({
    key: 'attendance',
    label: 'Total attendance',
    value: totalAttendance > 0 ? formatCount(totalAttendance) : '—',
    accent: 'members',
    icon: <Users />,
  })

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <StickyPageHeader bare>
            <div className="mx-auto max-w-6xl space-y-2 py-3 pl-16 pr-16 md:px-4 lg:px-6">
              <div className="flex items-start justify-between gap-3">
                {church ? (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {church.name}{' '}
                    <span className="text-defaulters">Banking Defaulters</span>
                  </h1>
                ) : (
                  <Skeleton className="h-9 w-72" />
                )}
                {isDefaultersDownloadLevel(church?.__typename) && church?.id && (
                  <StickyPageHeaderActions>
                    <DownloadDefaultersButton
                      level={church.__typename}
                      churchId={church.id}
                      disabled={!church}
                    />
                  </StickyPageHeaderActions>
                )}
              </div>
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
                    {total === 1 ? 'bacenta has' : 'bacentas have'} not banked
                    {isCurrent ? ' this week' : ' that week'}
                  </p>
                ) : (
                  <Skeleton className="h-4 w-48" />
                )}
              </div>
            </div>
          </StickyPageHeader>
          <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
              <aside className="space-y-3 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
                <WeekSelector />
                <WeekTotalsCard
                  week={week}
                  items={totalsItems}
                  loading={!church}
                />
              </aside>

              <section className="space-y-3 lg:col-start-1 lg:row-start-1 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                {!church && (
                  <>
                    <BacentaServiceCardSkeleton />
                    <BacentaServiceCardSkeleton />
                    <BacentaServiceCardSkeleton />
                    <div className="hidden lg:block">
                      <BacentaServiceCardSkeleton />
                    </div>
                  </>
                )}

                {church && total === 0 && (
                  <Card className="lg:col-span-2">
                    <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                      <div className="rounded-full bg-success/10 p-3">
                        <CheckCircle2 className="size-6 text-success" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          All bacentas have banked
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Nothing outstanding for week {week}.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {church &&
                  defaulters.map((defaulter) => (
                    <BacentaServiceCard
                      key={defaulter.id}
                      defaulter={defaulter}
                      link="/bacenta/service-details"
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

export default BankingDefaulters
