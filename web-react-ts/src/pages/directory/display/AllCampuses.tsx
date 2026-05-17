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
import { Building, ChevronRight, Layers, Plus, Search, Users } from 'lucide-react'
import { permitAdmin } from 'permission-utils'
import { GET_OVERSIGHT_CAMPUSES } from 'queries/ListQueries'
import { ChangeEvent, useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type CampusRow = {
  id: string
  name: string
  memberCount: number
  councilCount: number
  currency?: string
  noIncomeTracking?: boolean
  __typename?: 'Campus'
  leader?: {
    id: string
    firstName: string
    lastName: string
    pictureUrl?: string
  } | null
}

type OversightLeader = {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
}

const formatCount = (n: number) => n.toLocaleString('en-GH')

const DisplayAllCampuses = () => {
  const { clickCard, oversightId } = useContext(ChurchContext)
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery(GET_OVERSIGHT_CAMPUSES, {
    variables: { id: oversightId },
  })

  const oversight = data?.oversights?.[0]
  const campuses: CampusRow[] = oversight?.campuses ?? []

  const term = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!term) return campuses
    return campuses.filter((c) => {
      const haystack = [
        c.name ?? '',
        c.leader?.firstName ?? '',
        c.leader?.lastName ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [campuses, term])

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value)

  return (
    <ApolloWrapper loading={loading} data={data} error={error}>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        {/* TODO(SYN-145): migrate to <StickyPageHeader> */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <header>
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Directory
                </p>
                <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {oversight?.name ? `${oversight.name} ` : ''}
                  <span className="text-members">Campuses</span>
                </h1>
              </div>
              <RoleView roles={permitAdmin('Oversight')} directoryLock>
                <Link to="/campus/addcampus" className="shrink-0">
                  <Button size="sm" className="h-11 gap-2">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Add Campus</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </Link>
              </RoleView>
            </div>
          </header>
          <div className="border-t border-border lg:hidden">
            <div className="mx-auto max-w-6xl px-4 py-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder="Search campuses"
                  value={search}
                  onChange={handleSearch}
                  aria-label="Search campuses"
                />
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            <section className="order-2 space-y-3 lg:order-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {term ? 'Campuses' : 'All Campuses'}
                </h2>
                <span
                  aria-live="polite"
                  className="text-xs tabular-nums text-muted-foreground"
                >
                  {term
                    ? `${filtered.length} of ${campuses.length}`
                    : `${campuses.length}`}
                </span>
              </div>

              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Building className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {term ? `No matches for "${search}"` : 'No campuses yet'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {term
                        ? 'Try a different name or leader.'
                        : 'This oversight has no campuses.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {filtered.map((campus) => {
                    const initials =
                      `${campus.leader?.firstName?.[0] ?? ''}${
                        campus.leader?.lastName?.[0] ?? ''
                      }` ||
                      campus.name?.charAt(0) ||
                      '?'

                    return (
                      <Link
                        key={campus.id}
                        to="/campus/displaydetails"
                        onClick={() => clickCard(campus)}
                        aria-label={`Open ${campus.name}`}
                        className="group rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 active:bg-muted"
                      >
                        <div className="flex min-h-[88px] items-center gap-3 p-4">
                          <Avatar className="size-12 shrink-0">
                            <AvatarImage
                              src={campus.leader?.pictureUrl}
                              alt={
                                campus.leader
                                  ? `${campus.leader.firstName} ${campus.leader.lastName}`
                                  : campus.name
                              }
                            />
                            <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-foreground">
                              {campus.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {campus.leader
                                ? `${campus.leader.firstName} ${campus.leader.lastName}`
                                : 'No leader'}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="gap-1 px-2 py-0.5"
                              >
                                <Users className="size-3" />
                                <span className="font-mono tabular-nums">
                                  {formatCount(campus.memberCount ?? 0)}
                                </span>
                              </Badge>
                              <Badge
                                variant="outline"
                                className="gap-1 px-2 py-0.5"
                              >
                                <Layers className="size-3" />
                                <span className="font-mono tabular-nums">
                                  {formatCount(campus.councilCount ?? 0)}
                                </span>
                              </Badge>
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
                    Oversight
                  </p>
                  <Link
                    to="/oversight/displaydetails"
                    onClick={() => oversight && clickCard(oversight)}
                    className="mt-1 block truncate text-base font-semibold text-foreground hover:underline"
                  >
                    {oversight?.name}
                  </Link>
                  {oversight?.leader &&
                    (() => {
                      const leader: OversightLeader = oversight.leader
                      const displayName =
                        leader.fullName ||
                        [leader.firstName, leader.lastName]
                          .filter(Boolean)
                          .join(' ')
                      const initials =
                        `${leader.firstName?.[0] ?? ''}${
                          leader.lastName?.[0] ?? ''
                        }` ||
                        oversight?.name?.charAt(0) ||
                        '?'

                      return (
                        <Link
                          to="/member/displaydetails"
                          onClick={() =>
                            clickCard({ ...leader, __typename: 'Member' })
                          }
                          className="-mx-2 mt-3 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                          <Avatar className="size-10 shrink-0">
                            <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Overseer
                            </p>
                            <p className="truncate text-sm font-semibold text-foreground">
                              {displayName || 'Unnamed Overseer'}
                            </p>
                          </div>
                        </Link>
                      )
                    })()}
                  {oversight?.admin &&
                    (() => {
                      const admin: OversightLeader = oversight.admin
                      const displayName = [admin.firstName, admin.lastName]
                        .filter(Boolean)
                        .join(' ')
                      const initials =
                        `${admin.firstName?.[0] ?? ''}${
                          admin.lastName?.[0] ?? ''
                        }` ||
                        oversight?.name?.charAt(0) ||
                        '?'

                      return (
                        <Link
                          to="/member/displaydetails"
                          onClick={() =>
                            clickCard({ ...admin, __typename: 'Member' })
                          }
                          className="-mx-2 mt-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                          <Avatar className="size-10 shrink-0">
                            <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              Admin
                            </p>
                            <p className="truncate text-sm font-semibold text-foreground">
                              {displayName || 'Unnamed Admin'}
                            </p>
                          </div>
                        </Link>
                      )
                    })()}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Campuses"
                  value={formatCount(campuses.length)}
                  icon={Building}
                  accent="members"
                  compact
                  loading={loading}
                />
                <Link to="/oversight/members" className="block hover:opacity-80 active:opacity-70 transition-opacity rounded-xl">
                  <StatCard
                    label="Members"
                    value={formatCount(oversight?.memberCount ?? 0)}
                    icon={Users}
                    accent="members"
                    compact
                    loading={loading}
                  />
                </Link>
              </div>

              <div className="relative hidden lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder="Search campuses"
                  value={search}
                  onChange={handleSearch}
                  aria-label="Search campuses"
                />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllCampuses
