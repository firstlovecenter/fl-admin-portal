import { useQuery } from '@apollo/client'
import RoleView from 'auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { Skeleton } from 'components/ui/skeleton'
import { StatCard } from 'components/ui/stat-card'
import { ChurchContext } from 'contexts/ChurchContext'
import { Building2, ChevronRight, Layers, Plus, Search, Users } from 'lucide-react'
import { permitAdmin } from 'permission-utils'
import { ChangeEvent, useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GET_CAMPUS_STREAMS_WITH_GOVERNORSHIPS } from './ReadQueries'

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

type StreamGroup = {
  __typename?: 'Stream'
  id: string
  name: string
  memberCount: number
  councilCount: number
  leader?: {
    id: string
    firstName?: string
    lastName?: string
    fullName?: string
    pictureUrl?: string
  } | null
  councils: CouncilGroup[]
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
  council,
  term,
  onOpen,
  onOpenCouncil,
}: {
  council: CouncilGroup
  term: string
  onOpen: (g: GovernorshipRow) => void
  onOpenCouncil: (c: CouncilGroup) => void
}) => {
  const leader = council.leader
  const leaderName =
    leader?.nameWithTitle ||
    leader?.fullName ||
    [leader?.firstName, leader?.lastName].filter(Boolean).join(' ') ||
    'No leader'
  const leaderInitials =
    `${leader?.firstName?.[0] ?? ''}${leader?.lastName?.[0] ?? ''}` ||
    council.name?.charAt(0) ||
    '?'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/council/displaydetails"
          onClick={() => onOpenCouncil(council)}
          className="flex min-w-0 items-center gap-2.5 hover:opacity-80 active:opacity-70"
          aria-label={`Open ${council.name} council`}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={leader?.pictureUrl} alt={leaderName} />
            <AvatarFallback className="bg-members/10 text-xs font-medium text-members">
              {leaderInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {council.name}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                Council
              </span>
            </p>
            <p className="truncate text-xs text-muted-foreground">{leaderName}</p>
          </div>
        </Link>
        <Badge variant="outline" className="shrink-0 gap-1 px-2 py-0.5 text-xs">
          <Layers className="size-3" />
          <span className="font-mono tabular-nums">
            {formatCount(council.governorships.length)}
          </span>
        </Badge>
      </div>

      {council.governorships.length === 0 ? (
        <p className="pl-10 text-xs text-muted-foreground">
          {term
            ? 'No governorships match your search.'
            : 'This council has no governorships yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 pl-10 lg:grid-cols-2">
          {council.governorships.map((g) => (
            <GovernorshipCard key={g.id} governorship={g} onClick={() => onOpen(g)} />
          ))}
        </div>
      )}
    </div>
  )
}

const StreamSection = ({
  stream,
  term,
  onOpenGovernorship,
  onOpenStream,
  onOpenCouncil,
}: {
  stream: StreamGroup
  term: string
  onOpenGovernorship: (g: GovernorshipRow) => void
  onOpenStream: (s: StreamGroup) => void
  onOpenCouncil: (c: CouncilGroup) => void
}) => {
  const streamLeader = stream.leader
  const streamLeaderName =
    streamLeader?.fullName ||
    [streamLeader?.firstName, streamLeader?.lastName].filter(Boolean).join(' ') ||
    'No leader'
  const streamLeaderInitials =
    `${streamLeader?.firstName?.[0] ?? ''}${streamLeader?.lastName?.[0] ?? ''}` ||
    stream.name?.charAt(0) ||
    '?'
  const totalInStream = stream.councils.reduce(
    (sum, c) => sum + c.governorships.length,
    0
  )

  return (
    <Card>
      <CardContent className="p-4 lg:p-5">
        <header className="flex items-start justify-between gap-3">
          <Link
            to="/stream/displaydetails"
            onClick={() => onOpenStream(stream)}
            className="flex min-w-0 items-center gap-3 hover:opacity-80 active:opacity-70"
            aria-label={`Open ${stream.name} stream`}
          >
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={streamLeader?.pictureUrl} alt={streamLeaderName} />
              <AvatarFallback className="bg-churches/10 text-xs font-medium text-churches">
                {streamLeaderInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground">
                {stream.name}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  Stream
                </span>
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {streamLeaderName}
              </p>
            </div>
          </Link>
          <Badge variant="outline" className="shrink-0 gap-1 px-2 py-0.5">
            <Building2 className="size-3" />
            <span className="font-mono tabular-nums">{formatCount(totalInStream)}</span>
          </Badge>
        </header>

        {stream.councils.length > 0 && (
          <div className="mt-4 space-y-6 border-t border-border pt-4">
            {stream.councils.map((council) => (
              <CouncilSection
                key={council.id}
                council={council}
                term={term}
                onOpen={onOpenGovernorship}
                onOpenCouncil={onOpenCouncil}
              />
            ))}
          </div>
        )}

        {stream.councils.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {term
              ? 'No governorships match your search.'
              : 'This stream has no governorships yet.'}
          </p>
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
          <div className="space-y-4 pl-10">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {[0, 1, 2].map((j) => (
                <Skeleton key={j} className="h-[88px] w-full rounded-xl" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

const AllCampusGovernorships = () => {
  const { clickCard, campusId } = useContext(ChurchContext)
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery(
    GET_CAMPUS_STREAMS_WITH_GOVERNORSHIPS,
    { variables: { id: campusId } }
  )

  const campus = data?.campuses?.[0]
  const streams: StreamGroup[] = campus?.streams ?? []

  const term = search.trim().toLowerCase()

  const filteredStreams = useMemo(() => {
    if (!term) return streams
    return streams
      .map((s) => ({
        ...s,
        councils: s.councils
          .map((c) => ({
            ...c,
            governorships: c.governorships.filter((g) => {
              const haystack = [
                g.name ?? '',
                g.leader?.firstName ?? '',
                g.leader?.lastName ?? '',
                c.name ?? '',
                s.name ?? '',
              ]
                .join(' ')
                .toLowerCase()
              return haystack.includes(term)
            }),
          }))
          .filter((c) => c.governorships.length > 0),
      }))
      .filter((s) => s.councils.length > 0)
  }, [streams, term])

  const totalGovernorships = streams.reduce(
    (sum, s) => sum + s.councils.reduce((cs, c) => cs + c.governorships.length, 0),
    0
  )
  const totalStreams = streams.length

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value)

  return (
    <ApolloWrapper loading={loading} data={data} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <header>
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Directory
                </p>
                <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {campus?.name ? `${campus.name} ` : ''}
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
          <div className="border-t border-border lg:hidden">
            <div className="mx-auto max-w-6xl px-4 py-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder="Search governorships, councils, or streams"
                  value={search}
                  onChange={handleSearch}
                  aria-label="Search governorships"
                />
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            <section className="order-2 space-y-4 lg:order-1">
              {loading ? (
                <LoadingSkeleton />
              ) : filteredStreams.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Building2 className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {totalGovernorships === 0
                        ? 'No governorships in this campus yet.'
                        : `No governorships match "${search}".`}
                    </p>
                    {totalGovernorships > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Try a different name, leader, council, or stream.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredStreams.map((stream) => (
                  <StreamSection
                    key={stream.id}
                    stream={stream}
                    term={term}
                    onOpenGovernorship={(g) => clickCard(g)}
                    onOpenStream={(s) => clickCard(s)}
                    onOpenCouncil={(c) => clickCard(c)}
                  />
                ))
              )}
            </section>

            <aside className="order-1 space-y-4 lg:sticky lg:top-[73px] lg:order-2">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Campus
                  </p>
                  <Link
                    to="/campus/displaydetails"
                    onClick={() => campus && clickCard(campus)}
                    className="mt-1 block truncate text-base font-semibold text-foreground hover:underline"
                  >
                    {campus?.name}
                  </Link>
                  {campus?.leader && (
                    <Link
                      to="/member/displaydetails"
                      onClick={() =>
                        clickCard({ ...campus.leader, __typename: 'Member' })
                      }
                      className="-mx-2 mt-3 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                          {`${campus.leader.firstName?.[0] ?? ''}${
                            campus.leader.lastName?.[0] ?? ''
                          }` ||
                            campus?.name?.charAt(0) ||
                            '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Lead Pastor
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {campus.leader.fullName || 'Unnamed Pastor'}
                        </p>
                      </div>
                    </Link>
                  )}
                  {campus?.admin && (
                    <Link
                      to="/member/displaydetails"
                      onClick={() =>
                        clickCard({ ...campus.admin, __typename: 'Member' })
                      }
                      className="-mx-2 mt-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                          {`${campus.admin.firstName?.[0] ?? ''}${
                            campus.admin.lastName?.[0] ?? ''
                          }` ||
                            campus?.name?.charAt(0) ||
                            '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Admin
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {[campus.admin.firstName, campus.admin.lastName]
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
                  label="Streams"
                  value={formatCount(totalStreams)}
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
                  placeholder="Search governorships, councils, or streams"
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

export default AllCampusGovernorships
