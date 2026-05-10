import { useLazyQuery } from '@apollo/client'
import { useMemo } from 'react'
import {
  AlertOctagon,
  Ban,
  CalendarCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import useSontaLevel from 'hooks/useSontaLevel'
import useSelectedWeek from 'hooks/useSelectedWeek'
import WeekSelector from 'components/WeekSelector/WeekSelector'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'

import {
  CAMPUS_FORM_DEFAULTERS_LIST,
  COUNCIL_FORM_DEFAULTERS_LIST,
  GOVERNORSHIP_FORM_DEFAULTERS_LIST,
  STREAM_FORM_DEFAULTERS_LIST,
} from './DefaultersQueries'
import BacentaServiceCard, {
  BacentaServiceCardSkeleton,
} from './BacentaServiceCard'
import WeekTotalsCard, { WeekTotalItem } from './WeekTotalsCard'
import DownloadDefaultersButton from './DownloadDefaultersButton'
import { isDefaultersDownloadLevel } from './utils/buildDefaultersWorkbook'
import { DefaultersUseChurchType } from './defaulters-types'

const FormDefaulters = () => {
  const { weekStart, week, isCurrent } = useSelectedWeek()

  const [governorshipFormDefaulters, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_FORM_DEFAULTERS_LIST)
  const [councilFormDefaulters, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_FORM_DEFAULTERS_LIST
  )
  const [streamFormDefaulters, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_FORM_DEFAULTERS_LIST
  )
  const [campusFormDefaulters, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_FORM_DEFAULTERS_LIST
  )

  const data = useSontaLevel({
    governorshipFunction: governorshipFormDefaulters,
    governorshipRefetch,
    councilFunction: councilFormDefaulters,
    councilRefetch,
    streamFunction: streamFormDefaulters,
    streamRefetch,
    campusFunction: campusFormDefaulters,
    campusRefetch,
    weekStart,
  })
  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  const defaulters = church?.formDefaultersThisWeek ?? []
  const total = defaulters.length

  const { cancelledCount, awaitingCount } = useMemo(() => {
    return defaulters.reduce(
      (acc, defaulter) => {
        const detail = defaulter.serviceRecordForWeek
        if (detail?.noServiceReason) acc.cancelledCount += 1
        else acc.awaitingCount += 1
        return acc
      },
      { cancelledCount: 0, awaitingCount: 0 }
    )
  }, [defaulters])

  const formatCount = (n: number) => n.toLocaleString('en-GH')

  const totalsItems: WeekTotalItem[] = [
    {
      key: 'outstanding',
      label: 'Outstanding',
      value: formatCount(total),
      accent: 'defaulters',
      icon: <AlertOctagon />,
    },
    {
      key: 'awaiting',
      label: 'Awaiting form',
      value: formatCount(awaitingCount),
      accent: 'warning',
      icon: <Clock />,
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: formatCount(cancelledCount),
      accent: 'destructive',
      icon: <Ban />,
    },
  ]

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
                    <span className="text-defaulters">Form Defaulters</span>
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
                    {total === 1 ? 'bacenta has' : 'bacentas have'} not filled
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
                      <div className="rounded-full bg-success/10 p-3">
                        <CheckCircle2 className="size-6 text-success" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          All bacentas filled
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
                      showCancellationControls
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

export default FormDefaulters
