import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { BackButton } from 'components/shell/BackButton'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'components/ui/breadcrumb'
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Layers,
  Search,
  Users,
} from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { classifyBacenta } from './bacenta-classification'
import { GET_STREAM_BACENTAS } from './ReadQueries'

type LeaderRef = {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  nameWithTitle?: string
  pictureUrl?: string
} | null

type BacentaRow = {
  id: string
  name: string
  memberCount: number
  vacationStatus?: 'Vacation' | 'Active' | null
  labels?: string[] | null
  __typename: 'Bacenta'
  leader?: {
    id: string
    firstName?: string
    lastName?: string
    pictureUrl?: string
  } | null
}

type GovernorshipGroup = {
  id: string
  name: string
  leader: LeaderRef
  bacentas: BacentaRow[]
}

type CouncilData = {
  id: string
  name: string
  governorships: GovernorshipGroup[]
}

type CategorySplit = {
  total: number
  graduated: number
  ic: number
  unclassified: number
}

const emptySplit: CategorySplit = {
  total: 0,
  graduated: 0,
  ic: 0,
  unclassified: 0,
}

const splitFor = (bacentas: BacentaRow[]): CategorySplit =>
  bacentas.reduce<CategorySplit>(
    (acc, b) => {
      const c = classifyBacenta(b.labels)
      if (c?.label === 'Graduated') acc.graduated += 1
      else if (c?.label === 'IC') acc.ic += 1
      else acc.unclassified += 1
      acc.total += 1
      return acc
    },
    { ...emptySplit }
  )

const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100)

const formatCount = (n: number) => n.toLocaleString('en-GH')

const leaderInitials = (l: LeaderRef, fallbackName?: string) =>
  `${l?.firstName?.[0] ?? ''}${l?.lastName?.[0] ?? ''}` ||
  fallbackName?.charAt(0) ||
  '?'

const SplitBar = ({ split }: { split: CategorySplit }) => {
  if (split.total === 0) {
    return <div className="h-1.5 w-full rounded-full bg-muted" />
  }
  const graduatedPct = (split.graduated / split.total) * 100
  const icPct = (split.ic / split.total) * 100

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
      {graduatedPct > 0 && (
        <div className="bg-success" style={{ width: `${graduatedPct}%` }} />
      )}
      {icPct > 0 && (
        <div className="bg-destructive" style={{ width: `${icPct}%` }} />
      )}
    </div>
  )
}

const SplitLegend = ({ split }: { split: CategorySplit }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block size-2 rounded-full bg-success" />
      <span className="tabular-nums">
        {pct(split.graduated, split.total)}% Graduated
      </span>
      <span className="tabular-nums">({formatCount(split.graduated)})</span>
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block size-2 rounded-full bg-destructive" />
      <span className="tabular-nums">{pct(split.ic, split.total)}% IC</span>
      <span className="tabular-nums">({formatCount(split.ic)})</span>
    </span>
    {split.unclassified > 0 && (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-2 rounded-full bg-muted-foreground/40" />
        <span className="tabular-nums">
          {pct(split.unclassified, split.total)}% Unclassified
        </span>
        <span className="tabular-nums">
          ({formatCount(split.unclassified)})
        </span>
      </span>
    )}
  </div>
)

const BacentaRowItem = ({
  bacenta,
  onOpen,
}: {
  bacenta: BacentaRow
  onOpen: (b: BacentaRow) => void
}) => {
  const initials =
    `${bacenta.leader?.firstName?.[0] ?? ''}${
      bacenta.leader?.lastName?.[0] ?? ''
    }` ||
    bacenta.name?.charAt(0) ||
    '?'
  const isVacation = bacenta.vacationStatus === 'Vacation'
  const category = classifyBacenta(bacenta.labels)

  return (
    <Link
      to="/bacenta/displaydetails"
      onClick={() => onOpen(bacenta)}
      aria-label={`Open ${bacenta.name}`}
      className="group block rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 active:bg-muted"
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
            <Badge variant="outline" className="gap-1 px-2 py-0.5">
              <Users className="size-3" />
              <span className="font-mono tabular-nums">
                {formatCount(bacenta.memberCount ?? 0)}
              </span>
            </Badge>
            {isVacation && (
              <Badge variant="destructive" className="px-2 py-0.5">
                Vacation
              </Badge>
            )}
            {category && (
              <Badge variant={category.variant} className="px-2 py-0.5">
                {category.label}
              </Badge>
            )}
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

const GovernorshipSection = ({
  group,
  onOpenBacenta,
}: {
  group: GovernorshipGroup
  onOpenBacenta: (b: BacentaRow) => void
}) => {
  const split = useMemo(() => splitFor(group.bacentas), [group.bacentas])
  const leader = group.leader

  return (
    <div className="space-y-3">
      <header className="flex items-start justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="size-8 shrink-0">
            <AvatarImage
              src={leader?.pictureUrl}
              alt={leader?.fullName ?? group.name}
            />
            <AvatarFallback className="bg-members/10 text-xs font-medium text-members">
              {leaderInitials(leader, group.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {group.name}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                Governorship
              </span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {leader?.nameWithTitle ||
                leader?.fullName ||
                [leader?.firstName, leader?.lastName].filter(Boolean).join(' ') ||
                'No governor'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 gap-1 px-2 py-0.5">
          <Building2 className="size-3" />
          <span className="font-mono tabular-nums">
            {formatCount(split.total)}
          </span>
        </Badge>
      </header>

      <div className="space-y-1.5">
        <SplitBar split={split} />
        <SplitLegend split={split} />
      </div>

      {group.bacentas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No bacentas match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {group.bacentas.map((bacenta) => (
            <BacentaRowItem
              key={bacenta.id}
              bacenta={bacenta}
              onOpen={onOpenBacenta}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const CouncilSection = ({
  council,
  onOpenBacenta,
}: {
  council: CouncilData
  onOpenBacenta: (b: BacentaRow) => void
}) => (
  <Card>
    <CardContent className="p-4 lg:p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        {council.name}{' '}
        <span className="text-xs font-normal text-muted-foreground">Council</span>
      </h2>
      <div className="space-y-6">
        {council.governorships.map((group) => (
          <GovernorshipSection
            key={group.id}
            group={group}
            onOpenBacenta={onOpenBacenta}
          />
        ))}
      </div>
    </CardContent>
  </Card>
)

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[0, 1].map((i) => (
      <Card key={i}>
        <CardContent className="space-y-4 p-4 lg:p-5">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-6">
            {[0, 1].map((j) => (
              <div key={j} className="space-y-3">
                <div className="flex items-center gap-2.5 px-1">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {[0, 1, 2, 3].map((k) => (
                    <Skeleton key={k} className="h-[88px] w-full rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

const AllStreamBacentas = () => {
  const { streamId, clickCard } = useContext(ChurchContext)
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery(GET_STREAM_BACENTAS, {
    variables: { id: streamId },
  })

  const stream = data?.streams?.[0]
  const councils: CouncilData[] = stream?.councils ?? []

  const term = search.trim().toLowerCase()

  const filteredCouncils = useMemo(() => {
    if (!term) return councils
    return councils
      .map((c) => ({
        ...c,
        governorships: c.governorships
          .map((g) => ({
            ...g,
            bacentas: g.bacentas.filter((b) => {
              const haystack = [
                b.name ?? '',
                b.leader?.firstName ?? '',
                b.leader?.lastName ?? '',
                g.name ?? '',
                c.name ?? '',
              ]
                .join(' ')
                .toLowerCase()
              return haystack.includes(term)
            }),
          }))
          .filter((g) => g.bacentas.length > 0),
      }))
      .filter((c) => c.governorships.length > 0)
  }, [councils, term])

  const allBacentas = useMemo(
    () => councils.flatMap((c) => c.governorships.flatMap((g) => g.bacentas)),
    [councils]
  )
  const streamSplit = useMemo(() => splitFor(allBacentas), [allBacentas])

  const totalBacentas = allBacentas.length

  return (
    <ApolloWrapper loading={loading} data={data} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <header>
            <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 lg:px-6">
              <BackButton className="-ml-2 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Directory
                </p>
                {loading || !stream ? (
                  <Skeleton className="mt-0.5 h-8 w-56" />
                ) : (
                  <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {stream.name ? `${stream.name} ` : ''}
                    <span className="text-members">Bacentas</span>
                  </h1>
                )}
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-4 pb-2 lg:px-6">
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem><span>Stream</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Council</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Governorship</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-members">Bacenta</BreadcrumbPage>
                </BreadcrumbItem>
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
                  placeholder="Search bacenta, leader, or governorship"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search bacentas"
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
              ) : filteredCouncils.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Building2 className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {totalBacentas === 0
                        ? 'No bacentas in this stream yet.'
                        : 'No bacentas match your search.'}
                    </p>
                    {totalBacentas > 0 && search && (
                      <p className="text-xs text-muted-foreground">
                        Try a different search term.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredCouncils.map((council) => (
                  <CouncilSection
                    key={council.id}
                    council={council}
                    onOpenBacenta={(b) => clickCard(b)}
                  />
                ))
              )}
            </section>

            <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-[104px]">
              <Card>
                <CardContent className="space-y-4 p-4 lg:p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Stream Summary
                    </p>
                    {loading ? (
                      <Skeleton className="mt-2 h-9 w-24" />
                    ) : (
                      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                        {formatCount(streamSplit.total)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Bacentas in stream
                    </p>
                  </div>

                  {loading ? (
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  ) : (
                    <SplitBar split={streamSplit} />
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border p-2.5">
                      <p className="text-[11px] text-muted-foreground">
                        Graduated
                      </p>
                      {loading ? (
                        <Skeleton className="mt-1 h-5 w-10" />
                      ) : (
                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-success">
                          {pct(streamSplit.graduated, streamSplit.total)}%
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-border p-2.5">
                      <p className="text-[11px] text-muted-foreground">IC</p>
                      {loading ? (
                        <Skeleton className="mt-1 h-5 w-10" />
                      ) : (
                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-destructive">
                          {pct(streamSplit.ic, streamSplit.total)}%
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-border p-2.5">
                      <p className="text-[11px] text-muted-foreground">
                        Councils
                      </p>
                      {loading ? (
                        <Skeleton className="mt-1 h-5 w-12" />
                      ) : (
                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                          {formatCount(councils.length)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
                      <Layers className="size-3.5 shrink-0" />
                      <span className="tabular-nums">
                        {loading ? '—' : formatCount(
                          councils.reduce(
                            (sum, c) => sum + c.governorships.length,
                            0
                          )
                        )}
                      </span>
                      <span>governorships</span>
                    </div>
                  </div>

                  <Button
                    variant="link"
                    asChild
                    className="h-11 justify-start px-0"
                  >
                    <Link
                      to="/stream/displaydetails"
                      className="gap-1 text-sm font-medium text-members"
                    >
                      <ArrowLeft className="size-4" />
                      Back to stream details
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <div className="relative hidden lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder="Search bacenta, leader, or governorship"
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

export default AllStreamBacentas
