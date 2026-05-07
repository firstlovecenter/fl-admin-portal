import { useQuery } from '@apollo/client'
import RoleView from 'auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { StatCard } from 'components/ui/stat-card'
import { ChurchContext } from 'contexts/ChurchContext'
import { Building2, ChevronRight, Plus, Search, Users } from 'lucide-react'
import { permitAdminArrivals } from 'permission-utils'
import { GET_GOVERNORSHIP_BACENTAS } from 'queries/ListQueries'
import { useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type BacentaRow = {
  id: string
  name: string
  memberCount: number
  vacationStatus?: 'Vacation' | 'Active' | null
  __typename: 'Bacenta'
  council?: { id: string }
  leader?: {
    id: string
    firstName: string
    lastName: string
    pictureUrl?: string
  } | null
}

const formatCount = (n: number) => n.toLocaleString('en-GH')

const DisplayAllBacentas = () => {
  const { governorshipId, clickCard } = useContext(ChurchContext)
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery(GET_GOVERNORSHIP_BACENTAS, {
    variables: { id: governorshipId },
  })

  const governorship = data?.governorships?.[0]
  const bacentas: BacentaRow[] = governorship?.bacentas ?? []

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return bacentas
    return bacentas.filter((b) => {
      const haystack = [
        b.name ?? '',
        b.leader?.firstName ?? '',
        b.leader?.lastName ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [bacentas, search])

  return (
    <ApolloWrapper loading={loading} data={data} error={error}>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Directory
              </p>
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                {governorship?.name ? `${governorship.name} ` : ''}
                <span className="text-members">Bacentas</span>
              </h1>
            </div>
            <RoleView roles={permitAdminArrivals('Council')} directoryLock>
              <Link to="/bacenta/addbacenta" className="shrink-0">
                <Button size="sm" className="h-11 gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add Bacenta</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </Link>
            </RoleView>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            <section className="order-2 space-y-4 lg:order-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  All Bacentas
                </h2>
                <span
                  aria-live="polite"
                  className="text-xs tabular-nums text-muted-foreground"
                >
                  {filtered.length} of {bacentas.length}
                </span>
              </div>

              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Building2 className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      No bacentas found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {search
                        ? 'Try a different search term.'
                        : 'This governorship has no bacentas yet.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {filtered.map((bacenta) => {
                    const initials =
                      `${bacenta.leader?.firstName?.[0] ?? ''}${
                        bacenta.leader?.lastName?.[0] ?? ''
                      }` ||
                      bacenta.name?.charAt(0) ||
                      '?'
                    const isVacation = bacenta.vacationStatus === 'Vacation'

                    return (
                      <Link
                        key={bacenta.id}
                        to="/bacenta/displaydetails"
                        onClick={() => clickCard(bacenta)}
                        aria-label={`Open ${bacenta.name}`}
                        className="group rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 active:bg-muted"
                      >
                        <div className="flex min-h-[88px] items-center gap-3 p-4">
                          <Avatar className="size-12 shrink-0">
                            <AvatarImage
                              src={bacenta.leader?.pictureUrl}
                              alt={
                                bacenta.leader
                                  ? `${bacenta.leader.firstName} ${bacenta.leader.lastName}`
                                  : bacenta.name
                              }
                            />
                            <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-foreground">
                              {bacenta.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {bacenta.leader
                                ? `${bacenta.leader.firstName} ${bacenta.leader.lastName}`
                                : 'No leader'}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="gap-1 px-2 py-0.5"
                              >
                                <Users className="size-3" />
                                <span className="font-mono tabular-nums">
                                  {formatCount(bacenta.memberCount ?? 0)}
                                </span>
                              </Badge>
                              {isVacation && (
                                <Badge
                                  variant="destructive"
                                  className="px-2 py-0.5"
                                >
                                  Vacation
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <aside className="order-1 space-y-4 lg:sticky lg:top-[73px] lg:order-2">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Governorship
                  </p>
                  <Link
                    to="/governorship/displaydetails"
                    onClick={() => governorship && clickCard(governorship)}
                    className="mt-1 block truncate text-base font-semibold text-foreground hover:underline"
                  >
                    {governorship?.name}
                  </Link>
                  {governorship?.leader && (
                    <Link
                      to="/member/displaydetails"
                      onClick={() => clickCard(governorship.leader)}
                      className="mt-3 flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/50 active:bg-muted"
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                          {`${governorship.leader.firstName?.[0] ?? ''}${
                            governorship.leader.lastName?.[0] ?? ''
                          }`}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Constituency Overseer
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {governorship.leader.fullName ??
                            `${governorship.leader.firstName} ${governorship.leader.lastName}`}
                        </p>
                      </div>
                    </Link>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Bacentas"
                  value={formatCount(bacentas.length)}
                  icon={Building2}
                  accent="members"
                  compact
                  loading={loading}
                />
                <Link to="/governorship/members" className="block">
                  <StatCard
                    label="Members"
                    value={formatCount(governorship?.memberCount ?? 0)}
                    icon={Users}
                    accent="members"
                    compact
                    loading={loading}
                  />
                </Link>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder="Search bacenta or leader"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search bacentas"
                />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllBacentas
