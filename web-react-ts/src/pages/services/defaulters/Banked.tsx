import { useLazyQuery } from '@apollo/client'
import { useContext, useMemo } from 'react'
import {
  Banknote,
  CalendarCheck,
  Landmark,
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
  CAMPUS_BANKED_LIST,
  COUNCIL_BANKED_LIST,
  GOVERNORSHIP_BANKED_LIST,
  STREAM_BANKED_LIST,
} from './DefaultersQueries'
import BacentaServiceCard, {
  BacentaServiceCardSkeleton,
} from './BacentaServiceCard'
import WeekTotalsCard, { WeekTotalItem } from './WeekTotalsCard'
import DownloadDefaultersButton from './DownloadDefaultersButton'
import { isDefaultersDownloadLevel } from './utils/buildDefaultersWorkbook'
import { DefaultersUseChurchType } from './defaulters-types'

const Banked = () => {
  const { weekStart, week, isCurrent } = useSelectedWeek()

  const [governorshipBanked, { refetch: governorshipRefetch }] = useLazyQuery(
    GOVERNORSHIP_BANKED_LIST
  )
  const [councilBanked, { refetch: councilRefetch }] =
    useLazyQuery(COUNCIL_BANKED_LIST)
  const [streamBanked, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_BANKED_LIST)
  const [campusBanked, { refetch: campusRefetch }] =
    useLazyQuery(CAMPUS_BANKED_LIST)

  const data = useSontaLevel({
    governorshipFunction: governorshipBanked,
    governorshipRefetch,
    councilFunction: councilBanked,
    councilRefetch,
    streamFunction: streamBanked,
    streamRefetch,
    campusFunction: campusBanked,
    campusRefetch,
    weekStart,
  })
  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  const { currentUser } = useContext(MemberContext)
  const banked = church?.bankedThisWeek ?? []
  const total = banked.length

  const { totalAttendance, totalBankedIncome } = useMemo(() => {
    return banked.reduce(
      (acc, item) => {
        const detail = item.serviceRecordForWeek
        if (typeof detail?.attendance === 'number') {
          acc.totalAttendance += detail.attendance
        }
        if (typeof detail?.income === 'number') {
          acc.totalBankedIncome += detail.income
        }
        return acc
      },
      { totalAttendance: 0, totalBankedIncome: 0 }
    )
  }, [banked])

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
      key: 'banked',
      label: 'Banked',
      value: formatCount(total),
      accent: 'banking',
      icon: <Landmark />,
    },
  ]
  if (trackIncome) {
    totalsItems.push({
      key: 'income',
      label: 'Total banked',
      value: totalBankedIncome > 0 ? formatMoney(totalBankedIncome) : '—',
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
          <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
            <header className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                {church ? (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {church.name}{' '}
                    <span className="text-banking">Banked This Week</span>
                  </h1>
                ) : (
                  <Skeleton className="h-9 w-72" />
                )}
                {isDefaultersDownloadLevel(church?.__typename) && church?.id && (
                  <DownloadDefaultersButton
                    level={church.__typename}
                    churchId={church.id}
                    disabled={!church}
                  />
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
                    {total === 1 ? 'bacenta has' : 'bacentas have'} banked
                    {isCurrent ? ' this week' : ' that week'}
                  </p>
                ) : (
                  <Skeleton className="h-4 w-48" />
                )}
              </div>
            </header>

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
                      <div className="rounded-full bg-banking/10 p-3">
                        <Landmark className="size-6 text-banking" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          No bacentas have banked yet
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Banking confirmations for week {week} will appear
                          here.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {church &&
                  banked.map((item) => (
                    <BacentaServiceCard
                      key={item.id}
                      defaulter={item}
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

export default Banked
