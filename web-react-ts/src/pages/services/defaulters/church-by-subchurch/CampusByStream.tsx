import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown, ChevronRight, MessageCircle, Phone } from 'lucide-react'
import PullToRefresh from 'components/base-component/PullToRefresh'
import { cn } from 'components/lib/utils'

import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'

import { CAMPUS_BY_STREAM } from '../DefaultersQueries'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import useSelectedWeek from 'hooks/useSelectedWeek'
import {
  statClass,
  bankedClass,
  StatRow,
  SummaryRow,
} from './subchurch-shared'

const CampusByStream = () => {
  const { campusId, clickCard } = useContext(ChurchContext)
  const { weekStart } = useSelectedWeek()
  const { data, loading, error, refetch } = useQuery(CAMPUS_BY_STREAM, {
    variables: { id: campusId, weekStart },
  })
  const navigate = useNavigate()

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const campus = data?.campuses?.[0]
  const streams: HigherChurchWithDefaulters[] = campus?.streams ?? []

  const totals = streams.reduce(
    (acc, s) => ({
      services: acc.services + (s.servicesThisWeekCount ?? 0),
      formDefaulters:
        acc.formDefaulters + (s.formDefaultersThisWeekCount ?? 0),
      banked: acc.banked + (s.bankedThisWeekCount ?? 0),
      notBanked: acc.notBanked + (s.bankingDefaultersThisWeekCount ?? 0),
      cancelled: acc.cancelled + (s.cancelledServicesThisWeekCount ?? 0),
    }),
    { services: 0, formDefaulters: 0, banked: 0, notBanked: 0, cancelled: 0 }
  )

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6">
            {/* Page heading */}
            <div className="pr-14 md:pr-0">
              {loading || !campus ? (
                <Skeleton className="h-9 w-64" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {campus.name}{' '}
                  <span className="text-churches">Campus By Streams</span>
                </h1>
              )}
            </div>

            {/* Summary first in DOM → sits above stream list on mobile */}
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start">
              {/* Summary sidebar — first in DOM, placed in col 2 on lg */}
              <div className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Campus Summary
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    <SummaryRow
                      label="Streams"
                      value={loading ? '—' : String(streams.length)}
                    />
                    <SummaryRow
                      label="Services Filed"
                      value={
                        loading ? '—' : totals.services.toLocaleString('en-GH')
                      }
                      valueClass={
                        totals.services
                          ? 'text-success'
                          : 'text-muted-foreground'
                      }
                    />
                    <SummaryRow
                      label="Form Defaulters"
                      value={
                        loading
                          ? '—'
                          : totals.formDefaulters.toLocaleString('en-GH')
                      }
                      valueClass={
                        totals.formDefaulters
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }
                    />
                    <SummaryRow
                      label="Banked"
                      value={
                        loading ? '—' : totals.banked.toLocaleString('en-GH')
                      }
                      valueClass={
                        totals.banked ? 'text-success' : 'text-muted-foreground'
                      }
                    />
                    <SummaryRow
                      label="Not Banked"
                      value={
                        loading
                          ? '—'
                          : totals.notBanked.toLocaleString('en-GH')
                      }
                      valueClass={
                        totals.notBanked
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }
                    />
                    <SummaryRow
                      label="Cancelled"
                      value={
                        loading
                          ? '—'
                          : totals.cancelled.toLocaleString('en-GH')
                      }
                      valueClass={
                        totals.cancelled
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Stream list — second in DOM, placed in col 1 on lg */}
              <div className="space-y-3 lg:col-start-1 lg:row-start-1">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                      >
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))
                  : streams.map((stream) => {
                      const isExpanded = expandedIds.has(stream.id)

                      return (
                        <div
                          key={stream.id}
                          className="overflow-hidden rounded-xl border border-border bg-card"
                        >
                          {/* Collapse toggle — compact row */}
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${stream.name} Stream`}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                            onClick={() => toggle(stream.id)}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {stream.name} Stream
                              </p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {stream.leader?.fullName}
                              </p>
                            </div>

                            {/* At-a-glance: services · form defaulters · not banked */}
                            <div className="flex shrink-0 items-center gap-2.5 text-xs font-bold tabular-nums">
                              <span
                                className={statClass(
                                  stream.servicesThisWeekCount,
                                  false
                                )}
                                title="Services"
                              >
                                {stream.servicesThisWeekCount ?? 0}
                              </span>
                              <span
                                className={statClass(
                                  stream.formDefaultersThisWeekCount
                                )}
                                title="Form defaulters"
                              >
                                {stream.formDefaultersThisWeekCount ?? 0}
                              </span>
                              <span
                                className={statClass(
                                  stream.bankingDefaultersThisWeekCount
                                )}
                                title="Not banked"
                              >
                                {stream.bankingDefaultersThisWeekCount ?? 0}
                              </span>
                            </div>

                            <ChevronDown
                              className={cn(
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>

                          {/* Expandable detail */}
                          {isExpanded && (
                            <>
                              <div className="divide-y divide-border border-t border-border">
                                <StatRow
                                  label="Active Bacentas"
                                  value={stream.activeBacentaCount}
                                  valueClass={statClass(
                                    stream.activeBacentaCount,
                                    false
                                  )}
                                />
                                <StatRow
                                  label="Services This Week"
                                  value={stream.servicesThisWeekCount}
                                  valueClass={statClass(
                                    stream.servicesThisWeekCount,
                                    false
                                  )}
                                />
                                <StatRow
                                  label="Form Not Filled"
                                  value={stream.formDefaultersThisWeekCount}
                                  valueClass={statClass(
                                    stream.formDefaultersThisWeekCount
                                  )}
                                />
                                <StatRow
                                  label="Banked This Week"
                                  value={stream.bankedThisWeekCount}
                                  valueClass={bankedClass(
                                    stream.bankedThisWeekCount,
                                    stream.servicesThisWeekCount
                                  )}
                                />
                                <StatRow
                                  label="Not Banked This Week"
                                  value={stream.bankingDefaultersThisWeekCount}
                                  valueClass={statClass(
                                    stream.bankingDefaultersThisWeekCount
                                  )}
                                />
                                <StatRow
                                  label="Cancelled Services"
                                  value={stream.cancelledServicesThisWeekCount}
                                  valueClass={statClass(
                                    stream.cancelledServicesThisWeekCount
                                  )}
                                />
                              </div>

                              {/* Admin contact + navigate */}
                              <div className="border-t border-border bg-muted/20 px-4 py-3">
                                <p className="mb-2.5 text-xs text-muted-foreground">
                                  Admin:{' '}
                                  <span className="font-medium text-foreground">
                                    {stream.admin?.fullName}
                                  </span>
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="min-h-[44px] gap-1.5"
                                  >
                                    <a
                                      href={`tel:${stream.admin?.phoneNumber}`}
                                    >
                                      <Phone className="h-4 w-4" />
                                      Call
                                    </a>
                                  </Button>
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="min-h-[44px] gap-1.5 border-success/30 text-success hover:bg-success/10"
                                  >
                                    <a
                                      href={`https://wa.me/${stream.admin?.whatsappNumber}?text=${messageForAdminsOfDefaulters(stream)}`}
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                      WhatsApp
                                    </a>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto min-h-[44px] gap-1.5"
                                    onClick={() => {
                                      clickCard(stream)
                                      navigate('/services/stream-by-council')
                                    }}
                                  >
                                    View Stream
                                    <ChevronRight className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
              </div>
            </div>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CampusByStream
