import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { MessageCircle, Phone } from 'lucide-react'

import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'

import { OVERSIGHT_BY_CAMPUS } from '../stream-services/StreamDefaultersQueries'
import { HigherChurchWithDefaulters } from '../defaulters-types'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import {
  bankedClass,
  CardSkeleton,
  StatRow,
  statClass,
  SummaryRow,
} from './subchurch-shared'

const OversightByCampus = () => {
  const { oversightId, clickCard } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(OVERSIGHT_BY_CAMPUS, {
    variables: { id: oversightId },
  })
  const navigate = useNavigate()

  const oversight = data?.oversights?.[0]
  const campuses: HigherChurchWithDefaulters[] = oversight?.campuses ?? []

  const totals = campuses.reduce(
    (acc, c) => ({
      services: acc.services + (c.servicesThisWeekCount ?? 0),
      formDefaulters:
        acc.formDefaulters + (c.formDefaultersThisWeekCount ?? 0),
      banked: acc.banked + (c.bankedThisWeekCount ?? 0),
      notBanked: acc.notBanked + (c.bankingDefaultersThisWeekCount ?? 0),
      cancelled: acc.cancelled + (c.cancelledServicesThisWeekCount ?? 0),
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
              {loading || !oversight ? (
                <Skeleton className="h-9 w-72" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {oversight.name}{' '}
                  <span className="text-churches">Oversight By Campuses</span>
                </h1>
              )}
            </div>

            {/* Summary first in DOM → sits above campus list on mobile */}
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start">
              {/* Summary sidebar — first in DOM, placed in col 2 on lg */}
              <div className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Oversight Summary
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    <SummaryRow
                      label="Campuses"
                      value={loading ? '—' : String(campuses.length)}
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
                        totals.banked
                          ? 'text-success'
                          : 'text-muted-foreground'
                      }
                    />
                    <SummaryRow
                      label="Not Banked"
                      value={
                        loading ? '—' : totals.notBanked.toLocaleString('en-GH')
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
                        loading ? '—' : totals.cancelled.toLocaleString('en-GH')
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

              {/* Campus list — second in DOM, placed in col 1 on lg */}
              <div className="space-y-4 lg:col-start-1 lg:row-start-1">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <CardSkeleton key={i} rows={8} />
                    ))
                  : campuses.map((campus) => (
                      <div
                        key={campus.id}
                        className="overflow-hidden rounded-xl border border-border bg-card"
                      >
                        {/* Clickable area: header + stats */}
                        <button
                          type="button"
                          className="w-full text-left transition-colors hover:bg-muted/30 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                          onClick={() => {
                            clickCard(campus)
                            navigate('/services/campus-by-stream')
                          }}
                        >
                          <div className="border-b border-border px-4 py-3">
                            <p className="font-semibold text-foreground">
                              {campus.name} Campus
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {campus.leader?.fullName}
                            </p>
                          </div>

                          {/* Stream-level stats */}
                          <div className="border-b border-border bg-muted/10 px-4 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Streams
                            </p>
                          </div>
                          <div className="divide-y divide-border">
                            <StatRow
                              label="Active Streams"
                              value={campus.activeStreamCount ?? 0}
                              valueClass={statClass(
                                campus.activeStreamCount ?? 0,
                                false
                              )}
                            />
                            <StatRow
                              label="Services This Week"
                              value={campus.streamServicesThisWeekCount ?? 0}
                              valueClass={statClass(
                                campus.streamServicesThisWeekCount ?? 0,
                                false
                              )}
                            />
                            <StatRow
                              label="Form Not Filled"
                              value={
                                campus.streamFormDefaultersThisWeekCount ?? 0
                              }
                              valueClass={statClass(
                                campus.streamFormDefaultersThisWeekCount ?? 0
                              )}
                            />
                            <StatRow
                              label="Banked This Week"
                              value={campus.streamBankedThisWeekCount ?? 0}
                              valueClass={bankedClass(
                                campus.streamBankedThisWeekCount ?? 0,
                                campus.streamServicesThisWeekCount ?? 0
                              )}
                            />
                            <StatRow
                              label="Not Banked This Week"
                              value={
                                campus.streamBankingDefaultersThisWeekCount ?? 0
                              }
                              valueClass={statClass(
                                campus.streamBankingDefaultersThisWeekCount ?? 0
                              )}
                            />
                            <StatRow
                              label="Cancelled Services"
                              value={
                                campus.streamCancelledServicesThisWeekCount ?? 0
                              }
                              valueClass={statClass(
                                campus.streamCancelledServicesThisWeekCount ?? 0
                              )}
                            />
                          </div>

                          {/* Bacenta-level stats */}
                          <div className="border-y border-border bg-muted/10 px-4 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Bacentas
                            </p>
                          </div>
                          <div className="divide-y divide-border">
                            <StatRow
                              label="Active Bacentas"
                              value={campus.activeBacentaCount ?? 0}
                              valueClass={statClass(
                                campus.activeBacentaCount ?? 0,
                                false
                              )}
                            />
                            <StatRow
                              label="Services This Week"
                              value={campus.servicesThisWeekCount ?? 0}
                              valueClass={statClass(
                                campus.servicesThisWeekCount ?? 0,
                                false
                              )}
                            />
                            <StatRow
                              label="Form Not Filled"
                              value={campus.formDefaultersThisWeekCount ?? 0}
                              valueClass={statClass(
                                campus.formDefaultersThisWeekCount ?? 0
                              )}
                            />
                            <StatRow
                              label="Banked This Week"
                              value={campus.bankedThisWeekCount ?? 0}
                              valueClass={bankedClass(
                                campus.bankedThisWeekCount ?? 0,
                                campus.servicesThisWeekCount ?? 0
                              )}
                            />
                            <StatRow
                              label="Not Banked This Week"
                              value={campus.bankingDefaultersThisWeekCount ?? 0}
                              valueClass={statClass(
                                campus.bankingDefaultersThisWeekCount ?? 0
                              )}
                            />
                            <StatRow
                              label="Cancelled Services"
                              value={campus.cancelledServicesThisWeekCount ?? 0}
                              valueClass={statClass(
                                campus.cancelledServicesThisWeekCount ?? 0
                              )}
                            />
                          </div>
                        </button>

                        {/* Footer — admin contact (outside the clickable area) */}
                        <div className="border-t border-border bg-muted/20 px-4 py-3">
                          <p className="mb-2.5 text-xs text-muted-foreground">
                            Admin:{' '}
                            <span className="font-medium text-foreground">
                              {campus.admin?.fullName}
                            </span>
                          </p>
                          <div className="flex gap-2">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] gap-1.5"
                            >
                              <a href={`tel:${campus.admin?.phoneNumber}`}>
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
                                href={`https://wa.me/${
                                  campus.admin?.whatsappNumber
                                }?text=${messageForAdminsOfDefaulters(campus)}`}
                              >
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default OversightByCampus
