import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { Phone, MessageCircle, Layers } from 'lucide-react'

import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import {
  StickyPageHeader,
  StickyPageHeaderActions,
} from 'components/shell/StickyPageHeader'

import { STREAM_BY_GOVERNORSHIP } from '../DefaultersQueries'
import { messageForAdminsOfDefaulters } from '../defaulters-utils'
import DownloadDefaultersButton from '../DownloadDefaultersButton'
import useSelectedWeek from 'hooks/useSelectedWeek'
import useSetUserChurch from 'hooks/useSetUserChurch'
import {
  statClass,
  bankedClass,
  StatRow,
  SummaryRow,
  CardSkeleton,
} from './subchurch-shared'

interface GovernorshipStat {
  id: string
  name: string
  __typename: 'Governorship'
  leader?: { fullName: string }
  admin?: {
    firstName: string
    lastName: string
    fullName: string
    phoneNumber: string
    whatsappNumber: string
  }
  activeBacentaCount?: number
  servicesThisWeekCount: number
  formDefaultersThisWeekCount: number
  bankedThisWeekCount: number
  bankingDefaultersThisWeekCount: number
  cancelledServicesThisWeekCount: number
}

interface CouncilWithGovernorships {
  id: string
  name: string
  leader?: { fullName: string }
  governorships: GovernorshipStat[]
}

const CouncilSectionSkeleton = () => (
  <div className="space-y-3">
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-1 h-4 w-28" />
    </div>
    <CardSkeleton />
    <CardSkeleton />
  </div>
)

const StreamByGovernorship = () => {
  const { streamId, clickCard } = useContext(ChurchContext)
  const { setUserChurch } = useSetUserChurch()
  const { weekStart } = useSelectedWeek()
  const { data, loading, error, refetch } = useQuery(STREAM_BY_GOVERNORSHIP, {
    variables: { id: streamId, weekStart },
  })
  const navigate = useNavigate()

  const stream = data?.streams?.[0]
  const councils: CouncilWithGovernorships[] = stream?.councils ?? []
  const allGovernorships = councils.flatMap((c) => c.governorships ?? [])

  const totals = allGovernorships.reduce(
    (acc, g) => ({
      services: acc.services + (g.servicesThisWeekCount ?? 0),
      formDefaulters:
        acc.formDefaulters + (g.formDefaultersThisWeekCount ?? 0),
      banked: acc.banked + (g.bankedThisWeekCount ?? 0),
      notBanked: acc.notBanked + (g.bankingDefaultersThisWeekCount ?? 0),
      cancelled: acc.cancelled + (g.cancelledServicesThisWeekCount ?? 0),
    }),
    { services: 0, formDefaulters: 0, banked: 0, notBanked: 0, cancelled: 0 }
  )

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error} placeholder>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <StickyPageHeader bare>
            <div className="mx-auto max-w-6xl space-y-2 py-3 pl-16 pr-16 md:px-4 lg:px-6">
              {loading || !stream ? (
                <Skeleton className="h-9 w-72" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {stream.name}{' '}
                  <span className="text-churches">Stream By Governorship</span>
                </h1>
              )}
              <StickyPageHeaderActions>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11 gap-1.5"
                  onClick={() => navigate('/services/stream-by-council')}
                >
                  <Layers className="h-4 w-4" />
                  By Council
                </Button>
                <DownloadDefaultersButton
                  level="Stream"
                  churchId={streamId}
                  disabled={loading || !stream}
                  showLabel
                  className="min-h-11"
                />
              </StickyPageHeaderActions>
            </div>
          </StickyPageHeader>
          <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start">
              {/* Council-sectioned governorship list */}
              <div className="space-y-6">
                {loading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <CouncilSectionSkeleton key={i} />
                    ))
                  : councils.map((council) => (
                      <div key={council.id} className="space-y-3">
                        {/* Council section header */}
                        <div className="rounded-lg bg-muted/60 px-4 py-3">
                          <p className="font-semibold text-foreground">
                            {council.name} Council
                          </p>
                          {council.leader?.fullName && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {council.leader.fullName}
                            </p>
                          )}
                        </div>

                        {/* Governorships under this council */}
                        {council.governorships?.length === 0 ? (
                          <p className="px-4 text-sm text-muted-foreground">
                            No governorships
                          </p>
                        ) : (
                          council.governorships?.map((governorship) => (
                            <div
                              key={governorship.id}
                              className="overflow-hidden rounded-xl border border-border bg-card"
                            >
                              {/* Header + stats — single clickable area */}
                              <button
                                type="button"
                                className="w-full text-left transition-colors hover:bg-muted/30 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                                onClick={() => {
                                  clickCard(governorship)
                                  setUserChurch(governorship)
                                  navigate('/services/defaulters/dashboard')
                                }}
                              >
                                <div className="border-b border-border px-4 py-3">
                                  <p className="font-semibold text-foreground">
                                    {governorship.name} Governorship
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {governorship.leader?.fullName}
                                  </p>
                                </div>
                                <div className="divide-y divide-border">
                                  <StatRow
                                    label="Active Bacentas"
                                    value={governorship.activeBacentaCount ?? 0}
                                    valueClass={statClass(
                                      governorship.activeBacentaCount ?? 0,
                                      false
                                    )}
                                  />
                                  <StatRow
                                    label="Services This Week"
                                    value={governorship.servicesThisWeekCount}
                                    valueClass={statClass(
                                      governorship.servicesThisWeekCount,
                                      false
                                    )}
                                  />
                                  <StatRow
                                    label="Form Not Filled"
                                    value={
                                      governorship.formDefaultersThisWeekCount
                                    }
                                    valueClass={statClass(
                                      governorship.formDefaultersThisWeekCount
                                    )}
                                  />
                                  <StatRow
                                    label="Banked This Week"
                                    value={governorship.bankedThisWeekCount}
                                    valueClass={bankedClass(
                                      governorship.bankedThisWeekCount,
                                      governorship.servicesThisWeekCount
                                    )}
                                  />
                                  <StatRow
                                    label="Not Banked This Week"
                                    value={
                                      governorship.bankingDefaultersThisWeekCount
                                    }
                                    valueClass={statClass(
                                      governorship.bankingDefaultersThisWeekCount
                                    )}
                                  />
                                  <StatRow
                                    label="Cancelled Services"
                                    value={
                                      governorship.cancelledServicesThisWeekCount
                                    }
                                    valueClass={statClass(
                                      governorship.cancelledServicesThisWeekCount
                                    )}
                                  />
                                </div>
                              </button>

                              {/* Footer — admin contact (outside the clickable area) */}
                              <div className="border-t border-border bg-muted/20 px-4 py-3">
                                <p className="mb-2.5 text-xs text-muted-foreground">
                                  Admin:{' '}
                                  <span className="font-medium text-foreground">
                                    {governorship.admin?.fullName}
                                  </span>
                                </p>
                                <div className="flex gap-2">
                                  <a
                                    href={`tel:${governorship.admin?.phoneNumber}`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="min-h-[44px] gap-1.5"
                                    >
                                      <Phone className="h-4 w-4" />
                                      Call
                                    </Button>
                                  </a>
                                  <a
                                    href={`https://wa.me/${
                                      governorship.admin?.whatsappNumber
                                    }?text=${messageForAdminsOfDefaulters(governorship)}`}
                                    rel="noopener noreferrer"
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="min-h-[44px] gap-1.5 border-success/30 text-success hover:bg-success/10"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                      WhatsApp
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ))}
              </div>

              {/* Summary sidebar */}
              <div className="space-y-4 lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Stream Summary
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    <SummaryRow
                      label="Councils"
                      value={loading ? '—' : String(councils.length)}
                    />
                    <SummaryRow
                      label="Governorships"
                      value={loading ? '—' : String(allGovernorships.length)}
                    />
                    <SummaryRow
                      label="Services Filed"
                      value={
                        loading ? '—' : totals.services.toLocaleString('en-GH')
                      }
                      valueClass={
                        totals.services ? 'text-success' : 'text-muted-foreground'
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
            </div>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StreamByGovernorship
