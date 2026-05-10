import { useLazyQuery } from '@apollo/client'
import { Ban, CalendarCheck, CheckCircle2 } from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import useSontaLevel from 'hooks/useSontaLevel'
import useSelectedWeek from 'hooks/useSelectedWeek'
import WeekSelector from 'components/WeekSelector/WeekSelector'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'

import {
  CAMPUS_CANCELLED_SERVICES_LIST,
  COUNCIL_CANCELLED_SERVICES_LIST,
  GOVERNORSHIP_CANCELLED_SERVICES_LIST,
  STREAM_CANCELLED_SERVICES_LIST,
} from './DefaultersQueries'
import BacentaServiceCard, {
  BacentaServiceCardSkeleton,
} from './BacentaServiceCard'
import WeekTotalsCard, { WeekTotalItem } from './WeekTotalsCard'
import DownloadDefaultersButton from './DownloadDefaultersButton'
import { isDefaultersDownloadLevel } from './utils/buildDefaultersWorkbook'
import { DefaultersUseChurchType } from './defaulters-types'

const CancelledServicesThisWeek = () => {
  const { weekStart, week, isCurrent } = useSelectedWeek()

  const [governorshipCancelledServices, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_CANCELLED_SERVICES_LIST)
  const [councilCancelledServices, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_CANCELLED_SERVICES_LIST
  )
  const [streamCancelledServices, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_CANCELLED_SERVICES_LIST
  )
  const [campusCancelledServices, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_CANCELLED_SERVICES_LIST
  )

  const data = useSontaLevel({
    governorshipFunction: governorshipCancelledServices,
    governorshipRefetch,
    councilFunction: councilCancelledServices,
    councilRefetch,
    streamFunction: streamCancelledServices,
    streamRefetch,
    campusFunction: campusCancelledServices,
    campusRefetch,
    weekStart,
  })
  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  const cancelled = church?.cancelledServicesThisWeek ?? []
  const total = cancelled.length

  const formatCount = (n: number) => n.toLocaleString('en-GH')

  const totalsItems: WeekTotalItem[] = [
    {
      key: 'cancelled',
      label: 'Cancelled services',
      value: formatCount(total),
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
                    <span className="text-defaulters">Cancelled Services</span>
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
                    {total === 1
                      ? 'service was cancelled'
                      : 'services were cancelled'}
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
                          No cancelled services
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Nothing has been cancelled for week {week}.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {church &&
                  cancelled.map((service) => (
                    <BacentaServiceCard
                      key={service.id}
                      defaulter={service}
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

export default CancelledServicesThisWeek
