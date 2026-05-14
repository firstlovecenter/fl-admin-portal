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
  Layers,
  Plus,
  Search,
  Users,
  Waves,
} from 'lucide-react'
import { permitAdmin } from 'permission-utils'
import { ChangeEvent, useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GET_CAMPUS_STREAMS_WITH_COUNCILS } from './ReadQueries'

type CouncilRow = {
  __typename?: 'Council'
  id: string
  name: string
  memberCount: number
  governorshipCount: number
  leader?: {
    id: string
    firstName: string
    lastName: string
    fullName?: string
    nameWithTitle?: string
    pictureUrl?: string
  } | null
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
  councils: CouncilRow[]
}

type CampusLeader = {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  pictureUrl?: string
}

const formatCount = (n: number) => n.toLocaleString('en-GH')

const CouncilCard = ({
  council,
  onClick,
}: {
  council: CouncilRow
  onClick: () => void
}) => {
  const initials =
    `${council.leader?.firstName?.[0] ?? ''}${
      council.leader?.lastName?.[0] ?? ''
    }` ||
    council.name?.charAt(0) ||
    '?'
  const leaderName =
    council.leader?.nameWithTitle ||
    council.leader?.fullName ||
    [council.leader?.firstName, council.leader?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'No leader'

  return (
    <Link
      to="/council/displaydetails"
      onClick={onClick}
      aria-label={`Open ${council.name}`}
      className="group rounded-xl border border-border bg-background transition-colors hover:bg-muted/40 active:bg-muted"
    >
      <div className="flex min-h-[88px] items-center gap-3 p-4">
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={council.leader?.pictureUrl} alt={leaderName} />
          <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">
            {council.name}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              Council
            </span>
          </p>
          <p className="truncate text-xs text-muted-foreground">{leaderName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="gap-1 px-2 py-0.5">
              <Users className="size-3" />
              <span className="font-mono tabular-nums">
                {formatCount(council.memberCount ?? 0)}
              </span>
            </Badge>
            <Badge variant="outline" className="gap-1 px-2 py-0.5">
              <Building2 className="size-3" />
              <span className="font-mono tabular-nums">
                {formatCount(council.governorshipCount ?? 0)}
              </span>
            </Badge>
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

const StreamSection = ({
  stream,
  term,
  onOpenCouncil,
  onOpenStream,
}: {
  stream: StreamGroup
  term: string
  onOpenCouncil: (c: CouncilRow) => void
  onOpenStream: (s: StreamGroup) => void
}) => {
  const streamLeader = stream.leader
  const streamLeaderName =
    streamLeader?.fullName ||
    [streamLeader?.firstName, streamLeader?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'No leader'
  const streamLeaderInitials =
    `${streamLeader?.firstName?.[0] ?? ''}${
      streamLeader?.lastName?.[0] ?? ''
    }` ||
    stream.name?.charAt(0) ||
    '?'

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
              <AvatarImage
                src={streamLeader?.pictureUrl}
                alt={streamLeaderName}
              />
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
            <Layers className="size-3" />
            <span className="font-mono tabular-nums">
              {formatCount(stream.councils.length)}
            </span>
          </Badge>
        </header>

        {stream.councils.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 lg:grid-cols-2">
            {stream.councils.map((c) => (
              <CouncilCard
                key={c.id}
                council={c}
                onClick={() => onOpenCouncil(c)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {term
              ? 'No councils match your search.'
              : 'This stream has no councils yet.'}
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
          <div className="grid grid-cols-1 gap-3 pt-4 lg:grid-cols-2">
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-[88px] w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

const AllCampusCouncils = () => {
  const { clickCard, campusId } = useContext(ChurchContext)
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery(GET_CAMPUS_STREAMS_WITH_COUNCILS, {
    variables: { id: campusId },
    skip: !campusId,
  })

  const campus = data?.campuses?.[0]
  const streams: StreamGroup[] = campus?.streams ?? []

  const term = search.trim().toLowerCase()

  const filteredStreams = useMemo(() => {
    if (!term) return streams
    return streams
      .map((s) => ({
        ...s,
        councils: s.councils.filter((c) => {
          const haystack = [
            c.name ?? '',
            c.leader?.firstName ?? '',
            c.leader?.lastName ?? '',
            s.name ?? '',
          ]
            .join(' ')
            .toLowerCase()
          return haystack.includes(term)
        }),
      }))
      .filter((s) => s.councils.length > 0)
  }, [streams, term])

  const totalCouncils = streams.reduce((sum, s) => sum + s.councils.length, 0)
  const totalStreams = streams.length

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value)

  return (
    <ApolloWrapper loading={loading} data={data} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <header>
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="min-w-0 pr-14 md:pr-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Directory
                </p>
                <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {campus?.name ? `${campus.name} ` : ''}
                  <span className="text-members">Councils</span>
                </h1>
              </div>
              <RoleView roles={permitAdmin('Stream')} directoryLock>
                <Link to="/council/addcouncil" className="shrink-0">
                  <Button size="sm" className="h-11 gap-2">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Add Council</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </Link>
              </RoleView>
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-4 pb-2 lg:px-6">
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem><span>Campus</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Stream</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-members">Council</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Governorship</span></BreadcrumbItem>
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
                  placeholder="Search councils or streams"
                  value={search}
                  onChange={handleSearch}
                  aria-label="Search councils"
                />
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            {/* Aside first in DOM — renders above the list on mobile */}
            <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-[104px]">
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
                  {campus?.leader && (() => {
                    const leader: CampusLeader = campus.leader
                    const displayName =
                      leader.fullName ||
                      [leader.firstName, leader.lastName].filter(Boolean).join(' ')
                    const initials =
                      `${leader.firstName?.[0] ?? ''}${leader.lastName?.[0] ?? ''}` ||
                      campus?.name?.charAt(0) ||
                      '?'
                    return (
                      <Link
                        to="/member/displaydetails"
                        onClick={() => clickCard({ ...leader, __typename: 'Member' })}
                        className="-mx-2 mt-3 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                      >
                        <Avatar className="size-10 shrink-0">
                          <AvatarImage src={leader.pictureUrl} alt={displayName || ''} />
                          <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            Lead Pastor
                          </p>
                          <p className="truncate text-sm font-semibold text-foreground">
                            {displayName || 'Unnamed Pastor'}
                          </p>
                        </div>
                      </Link>
                    )
                  })()}
                  {campus?.admin && (() => {
                    const admin: CampusLeader = campus.admin
                    const displayName = [admin.firstName, admin.lastName]
                      .filter(Boolean)
                      .join(' ')
                    const initials =
                      `${admin.firstName?.[0] ?? ''}${admin.lastName?.[0] ?? ''}` ||
                      campus?.name?.charAt(0) ||
                      '?'
                    return (
                      <Link
                        to="/member/displaydetails"
                        onClick={() => clickCard({ ...admin, __typename: 'Member' })}
                        className="-mx-2 mt-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                      >
                        <Avatar className="size-10 shrink-0">
                          <AvatarImage src={admin.pictureUrl} alt={displayName || ''} />
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
                  label="Councils"
                  value={formatCount(totalCouncils)}
                  icon={Layers}
                  accent="members"
                  compact
                  loading={loading}
                />
                <StatCard
                  label="Streams"
                  value={formatCount(totalStreams)}
                  icon={Waves}
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
                  placeholder="Search councils or streams"
                  value={search}
                  onChange={handleSearch}
                  aria-label="Search councils"
                />
              </div>
            </aside>

            <section className="space-y-4 lg:col-start-1 lg:row-start-1">
              {loading ? (
                <LoadingSkeleton />
              ) : filteredStreams.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Layers className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {totalCouncils === 0
                        ? 'No councils in this campus yet.'
                        : `No councils match "${search}".`}
                    </p>
                    {totalCouncils > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Try a different name, leader, or stream.
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
                    onOpenCouncil={(c) => clickCard(c)}
                    onOpenStream={(s) => clickCard(s)}
                  />
                ))
              )}
            </section>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default AllCampusCouncils
