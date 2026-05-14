import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext, useState } from 'react'
import { CAMPUS_BY_COUNCIL_ACCOUNTS } from './accountsGQL'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import {
  CampusForAccounts,
  CouncilForAccounts,
  StreamForAccounts,
} from './accounts-types'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from './accounts-utils'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Card, CardContent } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { Separator } from 'components/ui/separator'
import { Skeleton } from 'components/ui/skeleton'
import { Bus, ChevronRight, Search, Wallet } from 'lucide-react'

type CampusCouncilListLink =
  | '/accounts/council/make-deposit'
  | '/accounts/council/dashboard'
  | '/accounts/campus/bussing-expense-entry'

const SUBTITLE_BY_LINK: Record<CampusCouncilListLink, string> = {
  '/accounts/council/make-deposit': 'Select a council to make a deposit',
  '/accounts/council/dashboard': 'Select a council to view its account details',
  '/accounts/campus/bussing-expense-entry':
    'Select a council to record bussing expenses',
}

const CampusCouncilList = ({ link }: { link: CampusCouncilListLink }) => {
  const { campusId, clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery<{
    campuses: CampusForAccounts[]
  }>(CAMPUS_BY_COUNCIL_ACCOUNTS, {
    variables: { id: campusId },
  })

  const campus = data?.campuses[0]

  const allCouncils =
    campus?.streams.flatMap((s: StreamForAccounts) => s.councils) ?? []
  const totalWeekday = allCouncils.reduce(
    (sum: number, c: CouncilForAccounts) => sum + (c.weekdayBalance ?? 0),
    0
  )
  const totalBussing = allCouncils.reduce(
    (sum: number, c: CouncilForAccounts) => sum + (c.bussingSocietyBalance ?? 0),
    0
  )

  const query = search.toLowerCase()

  return (
    <ApolloWrapper data={data} loading={loading} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
          <header className="mb-6 space-y-1 pr-14 md:pr-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {campus?.name ? (
                <>{campus.name} </>
              ) : (
                <Skeleton className="mr-2 inline-block h-7 w-40 align-middle" />
              )}
              <span className="text-banking">Councils</span>
            </h1>
            {campus?.name ? (
              <p className="text-sm text-muted-foreground">
                {SUBTITLE_BY_LINK[link]}
              </p>
            ) : (
              <Skeleton className="h-4 w-56" />
            )}
          </header>

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            {/* Supporting column — campus totals. First in DOM → above list on mobile */}
            <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
              <Card>
                <CardContent className="p-5">
                  <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Campus Totals
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-banking/10">
                        <Wallet className="size-4 text-banking" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          Weekday Account
                        </p>
                        {loading ? (
                          <Skeleton className="mt-1 h-5 w-24" />
                        ) : (
                          <p className="text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(totalWeekday)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-arrivals/10">
                        <Bus className="size-4 text-arrivals" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          Bussing Society
                        </p>
                        {loading ? (
                          <Skeleton className="mt-1 h-5 w-24" />
                        ) : (
                          <p className="text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(totalBussing)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Primary column — search + council list */}
            <section className="space-y-5 lg:col-start-1 lg:row-start-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search councils or leader"
                  aria-label="Search councils or leader"
                  className="min-h-11 pl-9"
                />
              </div>

              <div className="space-y-6">
                {loading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                  </div>
                )}

                {campus?.streams.map((stream: StreamForAccounts) => {
                  // Sort by leader name client-side; server returns councils sorted by council name.
                  const sorted = [...stream.councils].sort((a, b) =>
                    a.leader.fullName.localeCompare(b.leader.fullName)
                  )
                  const visible = query
                    ? sorted.filter(
                        (council) =>
                          council.name.toLowerCase().includes(query) ||
                          council.leader.fullName.toLowerCase().includes(query) ||
                          council.leader.firstName.toLowerCase().includes(query) ||
                          council.leader.lastName.toLowerCase().includes(query)
                      )
                    : sorted

                  return (
                    <div key={stream.id} className="space-y-2">
                      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {stream.name}
                      </h2>

                      {sorted.length === 0 ? (
                        <Card>
                          <CardContent className="p-4 text-sm text-muted-foreground">
                            No councils under this stream
                          </CardContent>
                        </Card>
                      ) : visible.length === 0 ? (
                        <Card>
                          <CardContent className="p-4 text-sm text-muted-foreground">
                            No councils match your search
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-2">
                          {visible.map((council) => (
                            <button
                              key={council.id}
                              type="button"
                              className="group w-full rounded-xl border border-border bg-card text-left transition-colors hover:bg-muted/40 active:bg-muted"
                              onClick={() => {
                                clickCard(council)
                                navigate(link)
                              }}
                            >
                              <div className="flex items-center gap-3 p-4">
                                <Avatar className="size-10 shrink-0">
                                  <AvatarImage
                                    src={council.leader.pictureUrl}
                                    alt={council.leader.fullName}
                                  />
                                  <AvatarFallback className="bg-banking/10 text-xs font-medium text-banking">
                                    {council.leader.firstName?.[0]}
                                    {council.leader.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {council.name}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {council.leader.fullName}
                                  </p>
                                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                    <span className="text-xs tabular-nums text-muted-foreground">
                                      <span className="font-medium text-banking">
                                        Weekday
                                      </span>{' '}
                                      {formatCurrency(council.weekdayBalance)}
                                    </span>
                                    <span className="text-xs tabular-nums text-muted-foreground">
                                      <span className="font-medium text-arrivals">
                                        Bussing
                                      </span>{' '}
                                      {formatCurrency(
                                        council.bussingSocietyBalance
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default CampusCouncilList
