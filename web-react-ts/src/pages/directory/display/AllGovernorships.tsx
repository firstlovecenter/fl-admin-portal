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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'components/ui/breadcrumb'
import {
  Building2,
  ChevronRight,
  Home,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { permitAdmin } from 'permission-utils'
import { GET_COUNCIL_GOVERNORSHIPS } from 'queries/ListQueries'
import { ChangeEvent, useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type GovernorshipBacenta = {
  id: string
  name: string
  __typename?: 'Bacenta'
}

type GovernorshipRow = {
  id: string
  name: string
  memberCount: number
  bacentaCount: number
  __typename?: 'Governorship'
  leader?: {
    id: string
    firstName: string
    lastName: string
    pictureUrl?: string
  } | null
  admin?: {
    id: string
    firstName: string
    lastName: string
  } | null
  bacentas?: GovernorshipBacenta[] | null
}

type BacentaHit = GovernorshipBacenta & {
  governorshipId: string
  governorshipName: string
}

type CouncilAdmin = {
  id: string
  firstName?: string
  lastName?: string
}

type CouncilCascade = {
  id: string
  stream?: {
    id: string
    campus?: {
      id: string
      oversight?: {
        id: string
        denomination?: { id: string } | null
      } | null
    } | null
  } | null
}

const formatCount = (n: number) => n.toLocaleString('en-GH')

const DisplayAllGovernorships = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery(GET_COUNCIL_GOVERNORSHIPS, {
    variables: { id: councilId },
  })

  const council = data?.councils?.[0]
  const governorships: GovernorshipRow[] = council?.governorships ?? []

  const bacentaPool: BacentaHit[] = useMemo(() => {
    return governorships.flatMap((g) =>
      (g.bacentas ?? []).map((b) => ({
        ...b,
        governorshipId: g.id,
        governorshipName: g.name,
      }))
    )
  }, [governorships])

  const term = search.trim().toLowerCase()
  const searching = term.length > 0

  const filteredGovernorships = useMemo(() => {
    if (!searching) return governorships
    return governorships.filter((g) => {
      const haystack = [
        g.name ?? '',
        g.leader?.firstName ?? '',
        g.leader?.lastName ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [governorships, searching, term])

  const filteredBacentas = useMemo(() => {
    if (!searching) return []
    return bacentaPool.filter((b) => b.name?.toLowerCase().includes(term))
  }, [bacentaPool, searching, term])

  const noResults =
    searching && filteredGovernorships.length === 0 && filteredBacentas.length === 0

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value)

  const handleBacentaClick = (
    bacenta: BacentaHit,
    parentGovernorshipId: string
  ) => {
    if (!council?.id) return
    const councilCascade: CouncilCascade = {
      id: council.id,
      stream: council.stream ?? null,
    }
    clickCard({
      id: bacenta.id,
      name: bacenta.name,
      __typename: 'Bacenta',
      governorship: {
        id: parentGovernorshipId,
        council: councilCascade,
      },
    })
  }

  return (
    <ApolloWrapper loading={loading} data={data} error={error}>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <header>
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="min-w-0 pr-14 md:pr-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Directory
                </p>
                <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {council?.name ? `${council.name} ` : ''}
                  <span className="text-members">Governorships</span>
                </h1>
              </div>
              <RoleView roles={permitAdmin('Council')} directoryLock>
                <Link to="/governorship/addgovernorship" className="shrink-0">
                  <Button size="sm" className="h-11 gap-2">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Add Governorship</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </Link>
              </RoleView>
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-4 pb-2 lg:px-6">
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem><span>Council</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-members">Governorship</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Bacenta</span></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="border-t border-border lg:hidden">
            <div className="mx-auto max-w-6xl px-4 py-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder="Search governorships or bacentas"
                  value={search}
                  onChange={handleSearch}
                  aria-label="Search governorships and bacentas"
                />
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            <section className="order-2 space-y-6 lg:order-1">
              {noResults ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Search className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      No matches for &ldquo;{search}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try a different governorship or bacenta name.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {(filteredGovernorships.length > 0 || !searching) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          {searching ? 'Governorships' : 'All Governorships'}
                        </h2>
                        <span
                          aria-live="polite"
                          className="text-xs tabular-nums text-muted-foreground"
                        >
                          {searching
                            ? `${filteredGovernorships.length} of ${governorships.length}`
                            : `${governorships.length}`}
                        </span>
                      </div>

                      {filteredGovernorships.length === 0 ? (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                            <Building2 className="size-8 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">
                              No governorships
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {searching
                                ? 'No governorship name or leader matches.'
                                : 'This council has no governorships yet.'}
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                          {filteredGovernorships.map((governorship) => {
                            const initials =
                              `${governorship.leader?.firstName?.[0] ?? ''}${
                                governorship.leader?.lastName?.[0] ?? ''
                              }` ||
                              governorship.name?.charAt(0) ||
                              '?'

                            return (
                              <Link
                                key={governorship.id}
                                to="/governorship/displaydetails"
                                onClick={() => clickCard(governorship)}
                                aria-label={`Open ${governorship.name}`}
                                className="group rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 active:bg-muted"
                              >
                                <div className="flex min-h-[88px] items-center gap-3 p-4">
                                  <Avatar className="size-12 shrink-0">
                                    <AvatarImage
                                      src={governorship.leader?.pictureUrl}
                                      alt={
                                        governorship.leader
                                          ? `${governorship.leader.firstName} ${governorship.leader.lastName}`
                                          : governorship.name
                                      }
                                    />
                                    <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-base font-semibold text-foreground">
                                      {governorship.name}{' '}
                                      <span className="text-xs font-normal text-muted-foreground">
                                        Governorship
                                      </span>
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {governorship.leader
                                        ? `${governorship.leader.firstName} ${governorship.leader.lastName}`
                                        : 'No leader'}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                      <Badge
                                        variant="outline"
                                        className="gap-1 px-2 py-0.5"
                                      >
                                        <Users className="size-3" />
                                        <span className="font-mono tabular-nums">
                                          {formatCount(
                                            governorship.memberCount ?? 0
                                          )}
                                        </span>
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className="gap-1 px-2 py-0.5"
                                      >
                                        <Building2 className="size-3" />
                                        <span className="font-mono tabular-nums">
                                          {formatCount(
                                            governorship.bacentaCount ?? 0
                                          )}
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
                    </div>
                  )}

                  {searching && filteredBacentas.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Bacentas
                        </h2>
                        <span
                          aria-live="polite"
                          className="text-xs tabular-nums text-muted-foreground"
                        >
                          {filteredBacentas.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {filteredBacentas.map((bacenta) => (
                          <Link
                            key={bacenta.id}
                            to="/bacenta/displaydetails"
                            onClick={() =>
                              handleBacentaClick(bacenta, bacenta.governorshipId)
                            }
                            aria-label={`Open ${bacenta.name}`}
                            className="group rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 active:bg-muted"
                          >
                            <div className="flex min-h-[72px] items-center gap-3 p-4">
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-churches/10">
                                <Home className="size-5 text-churches" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-base font-semibold text-foreground">
                                  {bacenta.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  in {bacenta.governorshipName}
                                </p>
                              </div>
                              <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            <aside className="order-1 space-y-4 lg:sticky lg:top-[104px] lg:order-2">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Council
                  </p>
                  <Link
                    to="/council/displaydetails"
                    onClick={() => council && clickCard(council)}
                    className="mt-1 block truncate text-base font-semibold text-foreground hover:underline"
                  >
                    {council?.name}
                  </Link>
                  {council?.admin &&
                    (() => {
                      const admin: CouncilAdmin = council.admin
                      const displayName = [admin.firstName, admin.lastName]
                        .filter(Boolean)
                        .join(' ')
                      const initials =
                        `${admin.firstName?.[0] ?? ''}${
                          admin.lastName?.[0] ?? ''
                        }` ||
                        council?.name?.charAt(0) ||
                        '?'

                      return (
                        <Link
                          to="/member/displaydetails"
                          onClick={() => clickCard(admin)}
                          className="-mx-2 mt-3 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
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
                  label="Governorships"
                  value={formatCount(governorships.length)}
                  icon={Building2}
                  accent="members"
                  compact
                  loading={loading}
                />
                <Link to="/council/members" className="block">
                  <StatCard
                    label="Members"
                    value={formatCount(council?.memberCount ?? 0)}
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
                  placeholder="Search governorships or bacentas"
                  value={search}
                  onChange={handleSearch}
                  aria-label="Search governorships and bacentas"
                />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllGovernorships
