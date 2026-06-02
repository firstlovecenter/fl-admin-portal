import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
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
  Search,
  Users,
} from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { classifyBacenta } from './bacenta-classification'
import { GET_COUNCIL_BACENTAS } from './ReadQueries'

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
      <span className="tabular-nums">
        {pct(split.ic, split.total)}% IC
      </span>
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
    <Card>
      <CardContent className="p-4 lg:p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarImage
                src={leader?.pictureUrl}
                alt={leader?.fullName ?? group.name}
              />
              <AvatarFallback className="bg-members/10 text-xs font-medium text-members">
                {leaderInitials(leader, group.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground">
                {group.name}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  Governorship
                </span>
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {leader?.nameWithTitle ||
                  leader?.fullName ||
                  (leader
                    ? `${leader.firstName ?? ''} ${leader.lastName ?? ''}`
                    : 'No governor')}
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

        <div className="mt-4 space-y-2">
          <SplitBar split={split} />
          <SplitLegend split={split} />
        </div>

        {group.bacentas.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No bacentas match your search.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {group.bacentas.map((bacenta) => (
              <BacentaRowItem
                key={bacenta.id}
                bacenta={bacenta}
                onOpen={onOpenBacenta}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const RollupCard = ({
  council,
  split,
  loading,
}: {
  council?: {
    name?: string
    memberCount?: number
  }
  split: CategorySplit
  loading: boolean
}) => (
  <Card>
    <CardContent className="space-y-4 p-4 lg:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Council Summary
        </p>
        {loading ? (
          <Skeleton className="mt-2 h-9 w-24" />
        ) : (
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {formatCount(split.total)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Bacentas in council</p>
      </div>

      {loading ? (
        <Skeleton className="h-1.5 w-full rounded-full" />
      ) : (
        <SplitBar split={split} />
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border p-2.5">
          <p className="text-[11px] text-muted-foreground">Graduated</p>
          {loading ? (
            <Skeleton className="mt-1 h-5 w-10" />
          ) : (
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-success">
              {pct(split.graduated, split.total)}%
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border p-2.5">
          <p className="text-[11px] text-muted-foreground">IC</p>
          {loading ? (
            <Skeleton className="mt-1 h-5 w-10" />
          ) : (
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-destructive">
              {pct(split.ic, split.total)}%
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border p-2.5">
          <p className="text-[11px] text-muted-foreground">Members</p>
          {loading ? (
            <Skeleton className="mt-1 h-5 w-12" />
          ) : (
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
              {formatCount(council?.memberCount ?? 0)}
            </p>
          )}
        </div>
      </div>

      <Button variant="link" asChild className="h-11 justify-start px-0">
        <Link
          to="/council/displaydetails"
          className="gap-1 text-sm font-medium text-members"
        >
          <ArrowLeft className="size-4" />
          Back to council details
        </Link>
      </Button>
    </CardContent>
  </Card>
)

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
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-[88px] w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

const CouncilBacentas = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery(GET_COUNCIL_BACENTAS, {
    variables: { id: councilId },
  })

  const council = data?.councils?.[0]
  const governorships: GovernorshipGroup[] = council?.governorships ?? []

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return governorships
    return governorships
      .map((g) => ({
        ...g,
        bacentas: g.bacentas.filter((b) => {
          const haystack = [
            b.name ?? '',
            b.leader?.firstName ?? '',
            b.leader?.lastName ?? '',
            g.name ?? '',
          ]
            .join(' ')
            .toLowerCase()
          return haystack.includes(term)
        }),
      }))
      .filter((g) => g.bacentas.length > 0)
  }, [governorships, search])

  const councilSplit = useMemo(
    () => splitFor(governorships.flatMap((g) => g.bacentas)),
    [governorships]
  )

  return (
    <ApolloWrapper loading={loading} data={data} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader bare>
          <div className="mx-auto flex max-w-6xl items-center gap-3 py-3 pl-16 pr-16 md:px-4 lg:px-6">
            <Button
              size="icon"
              variant="ghost"
              className="size-11 shrink-0"
              asChild
            >
              <Link to="/council/displaydetails" aria-label="Back to council">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Directory
              </p>
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                {council?.name ? `${council.name} ` : ''}
                <span className="text-members">Bacentas</span>
              </h1>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-2 lg:px-6">
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
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
        </StickyPageHeader>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            <section className="order-2 space-y-4 lg:order-1">
              {loading ? (
                <LoadingSkeleton />
              ) : filteredGroups.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Building2 className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {governorships.length === 0
                        ? 'No bacentas in this council yet.'
                        : 'No bacentas match your search.'}
                    </p>
                    {governorships.length > 0 && search && (
                      <p className="text-xs text-muted-foreground">
                        Try a different search term.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredGroups.map((group) => (
                  <GovernorshipSection
                    key={group.id}
                    group={group}
                    onOpenBacenta={(b) => clickCard(b)}
                  />
                ))
              )}
            </section>

            <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-[104px]">
              <RollupCard
                council={council}
                split={councilSplit}
                loading={loading}
              />

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

export default CouncilBacentas
