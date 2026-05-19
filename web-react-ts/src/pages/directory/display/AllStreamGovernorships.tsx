import { useQuery } from '@apollo/client'
import RoleView from 'auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { Skeleton } from 'components/ui/skeleton'
import { StatCard } from 'components/ui/stat-card'
import { ChurchContext } from 'contexts/ChurchContext'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'components/ui/breadcrumb'
import { Building2, ChevronRight, Layers, Plus, Search, Users } from 'lucide-react'
import { permitAdmin } from 'permission-utils'
import { ChangeEvent, useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GET_STREAM_COUNCILS_WITH_GOVERNORSHIPS } from './ReadQueries'

type GovernorshipRow = {
  __typename?: 'Governorship'
  id: string
  name: string
  memberCount: number
  bacentaCount: number
  leader?: {
    id: string
    firstName: string
    lastName: string
    pictureUrl?: string
  } | null
}

type CouncilGroup = {
  __typename?: 'Council'
  id: string
  name: string
  memberCount: number
  governorshipCount: number
  leader?: {
    id: string
    firstName?: string
    lastName?: string
    fullName?: string
    nameWithTitle?: string
    pictureUrl?: string
  } | null
  governorships: GovernorshipRow[]
}

const formatCount = (n: number) => n.toLocaleString('en-GH')

const GovernorshipCard = ({
  governorship,
  onClick,
}: {
  governorship: GovernorshipRow
  onClick: () => void
}) => {
  const initials =
    `${governorship.leader?.firstName?.[0] ?? ''}${
      governorship.leader?.lastName?.[0] ?? ''
    }` ||
    governorship.name?.charAt(0) ||
    '?'

  return (
    <Link
      to="/governorship/displaydetails"
      onClick={onClick}
      aria-label={`Open ${governorship.name}`}
      className="group rounded-xl border border-border bg-background transition-colors hover:bg-muted/40 active:bg-muted"
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
            <Badge variant="outline" className="gap-1 px-2 py-0.5">
              <Users className="size-3" />
              <span className="font-mono tabular-nums">
                {formatCount(governorship.memberCount ?? 0)}
              </span>
            </Badge>
            <Badge variant="outline" className="gap-1 px-2 py-0.5">
              <Building2 className="size-3" />
              <span className="font-mono tabular-nums">
                {formatCount(governorship.bacentaCount ?? 0)}
              </span>
            </Badge>
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

const CouncilSection = ({
  group,
  term,
  onOpenGovernorship,
  onOpenCouncil,
}: {
  group: CouncilGroup
  term: string
  onOpenGovernorship: (g: GovernorshipRow) => void
  onOpenCouncil: (c: CouncilGroup) => void
}) => {
  const leader = group.leader
  const leaderName =
    leader?.nameWithTitle ||
    leader?.fullName ||
    [leader?.firstName, leader?.lastName].filter(Boolean).join(' ') ||
    'No leader'
  const leaderInitials =
    `${leader?.firstName?.[0] ?? ''}${leader?.lastName?.[0] ?? ''}` ||
    group.name?.charAt(0) ||
    '?'

  return (
    <Card>
      <CardContent className="p-4 lg:p-5">
        <header className="flex items-start justify-between gap-3">
          <Link
            to="/council/displaydetails"
            onClick={() => onOpenCouncil(group)}
            className="flex min-w-0 items-center gap-3 hover:opacity-80 active:opacity-70"
            aria-label={`Open ${group.name} council`}
          >
            <Avatar className="size-10 shrink-0">
              <AvatarImage
                src={leader?.pictureUrl}
                alt={leaderName}
              />
              <AvatarFallback className="bg-members/10 text-xs font-medium text-members">
                {leaderInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground">
                {group.name}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  Council
                </span>
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {leaderName}
              </p>
            </div>
          </Link>
          <Badge variant="outline" className="shrink-0 gap-1 px-2 py-0.5">
            <Layers className="size-3" />
            <span className="font-mono tabular-nums">
              {formatCount(group.governorships.length)}
            </span>
          </Badge>
        </header>

        {group.governorships.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {term
              ? 'No governorships match your search.'
              : 'This council has no governorships yet.'}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {group.governorships.map((g) => (
              <GovernorshipCard
                key={g.id}
                governorship={g}
                onClick={() => onOpenGovernorship(g)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[0, 1].map((i) => (
      <Card key={i}>
        <CardContent className="space-y-4 p-4 lg:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-[88px] w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

const AllStreamGovernorships = () => {
  const { clickCard, streamId } = useContext(ChurchContext)
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery(
    GET_STREAM_COUNCILS_WITH_GOVERNORSHIPS,
    { variables: { id: streamId } }
  )

  const stream = data?.streams?.[0]
  const councils: CouncilGroup[] = stream?.councils ?? []

  const term = search.trim().toLowerCase()

  const filteredCouncils = useMemo(() => {
    if (!term) return councils
    return councils
      .map((c) => ({
        ...c,
        governorships: c.governorships.filter((g) => {
          const haystack = [
            g.name ?? '',
            g.leader?.firstName ?? '',
            g.leader?.lastName ?? '',
            c.name ?? '',
          ]
            .join(' ')
            .toLowerCase()
          return haystack.includes(term)
        }),
      }))
      .filter((c) => c.governorships.length > 0)
  }, [councils, term])

  const totalGovernorships = councils.reduce(
    (sum, c) => sum + c.governorships.length,
    0
  )

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value)

  return (
    <ApolloWrapper loading={loading} data={data} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader bare>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-3 pl-16 pr-16 md:px-4 lg:px-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Directory
              </p>
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                {stream?.name ? `${stream.name} ` : ''}
                <span className="text-members">Governorships</span>
              </h1>
            </div>
            <RoleView roles={permitAdmin('Stream')} directoryLock>
              <Link to="/governorship/addgovernorship" className="shrink-0">
                <Button size="sm" className="h-11 gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add Governorship</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </Link>
            </RoleView>
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-2 lg:px-6">
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem><span>Stream</span></BreadcrumbItem>
                <BreadcrumbSeparator />
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
                  placeholder="Search governorships or councils"
                  value={search}
                  onChange={handleSearch}
                  aria-label="Search governorships"
                />
              </div>
            </div>
          </div>
        </StickyPageHeader>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            <section className="order-2 space-y-4 lg:order-1">
              {loading ? (
                <LoadingSkeleton />
              ) : filteredCouncils.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Building2 className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {totalGovernorships === 0
                        ? 'No governorships in this stream yet.'
                        : `No governorships match "${search}".`}
                    </p>
                    {totalGovernorships > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Try a different name, leader, or council.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredCouncils.map((council) => (
                  <CouncilSection
                    key={council.id}
                    group={council}
                    term={term}
                    onOpenGovernorship={(g) => clickCard(g)}
                    onOpenCouncil={(c) => clickCard(c)}
                  />
                ))
              )}
            </section>

            <aside className="order-1 space-y-4 lg:sticky lg:top-[104px] lg:order-2">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Stream
                  </p>
                  <Link
                    to="/stream/displaydetails"
                    onClick={() => stream && clickCard(stream)}
                    className="mt-1 block truncate text-base font-semibold text-foreground hover:underline"
                  >
                    {stream?.name}
                  </Link>
                  {stream?.leader && (
                    <Link
                      to="/member/displaydetails"
                      onClick={() =>
                        clickCard({
                          ...stream.leader,
                          __typename: 'Member',
                        })
                      }
                      className="-mx-2 mt-3 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                          {`${stream.leader.firstName?.[0] ?? ''}${
                            stream.leader.lastName?.[0] ?? ''
                          }` ||
                            stream?.name?.charAt(0) ||
                            '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Overseer
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {stream.leader.fullName || 'Unnamed Overseer'}
                        </p>
                      </div>
                    </Link>
                  )}
                  {stream?.admin && (
                    <Link
                      to="/member/displaydetails"
                      onClick={() =>
                        clickCard({ ...stream.admin, __typename: 'Member' })
                      }
                      className="-mx-2 mt-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                          {`${stream.admin.firstName?.[0] ?? ''}${
                            stream.admin.lastName?.[0] ?? ''
                          }` ||
                            stream?.name?.charAt(0) ||
                            '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Admin
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {[stream.admin.firstName, stream.admin.lastName]
                            .filter(Boolean)
                            .join(' ') || 'Unnamed Admin'}
                        </p>
                      </div>
                    </Link>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Governorships"
                  value={formatCount(totalGovernorships)}
                  icon={Building2}
                  accent="members"
                  compact
                  loading={loading}
                />
                <StatCard
                  label="Councils"
                  value={formatCount(councils.length)}
                  icon={Layers}
                  accent="members"
                  compact
                  loading={loading}
                />
              </div>

              <div className="relative hidden lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder="Search governorships or councils"
                  value={search}
                  onChange={handleSearch}
                  aria-label="Search governorships"
                />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default AllStreamGovernorships
