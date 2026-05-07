import { useLazyQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertOctagon } from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import useChurchLevel from 'hooks/useChurchLevel'

import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'

import { LONG_POLL_INTERVAL } from 'global-utils'

import {
  GOVERNORSHIP_BACENTAS_NO_ACTIVITY,
  COUNCIL_BACENTAS_NO_ACTIVITY,
  CAMPUS_BACENTAS_NO_ACTIVITY,
  STREAM_BACENTAS_NO_ACTIVITY,
} from '../bussingStatusQueries'
import { ArrivalsUseChurchType } from '../arrivals-types'
import { SectionLabel } from '../components/live-feed'

const ListSkeleton = () => (
  <div className="space-y-3">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
      >
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-md" />
      </div>
    ))}
  </div>
)

const BacentasNoActivity = () => {
  const navigate = useNavigate()

  const [governorshipBacentasNoActivity, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_BACENTAS_NO_ACTIVITY, {
      pollInterval: LONG_POLL_INTERVAL,
    })
  const [councilBacentasNoActivity, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_BACENTAS_NO_ACTIVITY,
    { pollInterval: LONG_POLL_INTERVAL }
  )
  const [streamBacentasNoActivity, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_BACENTAS_NO_ACTIVITY,
    { pollInterval: LONG_POLL_INTERVAL }
  )
  const [campusBacentasNoActivity, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_BACENTAS_NO_ACTIVITY,
    { pollInterval: LONG_POLL_INTERVAL }
  )

  const data = useChurchLevel({
    governorshipFunction: governorshipBacentasNoActivity,
    governorshipRefetch,
    councilFunction: councilBacentasNoActivity,
    councilRefetch,
    streamFunction: streamBacentasNoActivity,
    streamRefetch,
    campusFunction: campusBacentasNoActivity,
    campusRefetch,
  })
  const { church, loading, error, refetch } = data as ArrivalsUseChurchType

  const bacentas = church?.bacentasNoActivity ?? []
  const count = bacentas.length
  const isEmpty = !!church && !loading && count === 0

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            {/* Back to dashboard */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 mb-4 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {/* Header */}
            <header className="mb-6 space-y-2 lg:mb-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-defaulters">
                <AlertOctagon className="size-3.5" />
                <span>Bacenta Status</span>
              </div>
              {loading && !church ? (
                <Skeleton className="h-9 w-72" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {church?.name}{' '}
                  <span className="text-defaulters">No Activity</span>
                </h1>
              )}
              <p className="text-sm text-muted-foreground">
                Bacentas that have not started bussing for today.
              </p>
            </header>

            {/* 2-column list layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
              {/* LEFT — list */}
              <section className="space-y-3 lg:order-1">
                <div className="flex items-center justify-between">
                  <SectionLabel>Bacentas</SectionLabel>
                  {!loading && church && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {count} total
                    </span>
                  )}
                </div>

                {loading && !church && <ListSkeleton />}

                {isEmpty && (
                  <Card className="border-success/40 bg-success/5">
                    <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                      <CheckCircle2 className="size-8 text-success" />
                      <p className="text-base font-semibold text-foreground">
                        Nothing to flag
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Every bacenta has started bussing today.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {!isEmpty && bacentas.length > 0 && (
                  <div className="space-y-3">
                    {bacentas.map((bacenta, i) => (
                      <MemberDisplayCard
                        key={bacenta.id ?? i}
                        member={bacenta}
                        leader={bacenta.leader}
                        contact
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* RIGHT — summary */}
              <aside className="space-y-3 lg:sticky lg:top-6 lg:order-2">
                <SectionLabel>Summary</SectionLabel>
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <div>
                      {loading && !church ? (
                        <Skeleton className="h-10 w-16" />
                      ) : (
                        <p className="text-4xl font-bold tabular-nums tracking-tight text-defaulters">
                          {count}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {count === 1 ? 'bacenta' : 'bacentas'} with no activity
                      </p>
                    </div>

                    {church && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-defaulters/30 bg-defaulters/10 text-defaulters"
                        >
                          {church?.__typename}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">
                          {church?.name}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      &quot;No activity&quot; means no mobilisation picture has
                      been uploaded and no vehicles have been registered for
                      the day.
                    </p>
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

export default BacentasNoActivity
