import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DocumentNode } from '@apollo/client'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import MemberTable, { GridMember } from './MemberTable'
import { ChurchContext } from 'contexts/ChurchContext'
import { Button } from 'components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from 'components/ui/sheet'
import { Skeleton } from 'components/ui/skeleton'
import Filters from './Filters'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'
import { Download, Search, SlidersHorizontal, UserPlus } from 'lucide-react'
import { cn } from 'components/lib/utils'
import {
  MEMBERSHIP_DOWNLOAD_PATHS,
  getMembershipDownloadPath,
} from 'pages/reports/membership-paths'

const INITIAL_PAGE_SIZE = 30
const PAGE_SIZE = 30
const SEARCH_DEBOUNCE_MS = 300

type MemberFilters = {
  gender?: string[]
  maritalStatus?: string[]
  leaderTitle?: string[]
  leaderRank?: string[]
  basonta?: string[]
}

type ChurchParent = {
  members?: GridMember[]
  memberCount?: number
  name?: string
  fullName?: string
}

type MembersGridProps = {
  query: DocumentNode
  parentId: string | undefined
  parentTypename:
    | 'Bacenta'
    | 'Governorship'
    | 'Council'
    | 'Stream'
    | 'Campus'
    | 'Oversight'
    | 'Denomination'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pluckParent: (data: any) => ChurchParent | undefined
  getHeading: (parent: ChurchParent | undefined) => React.ReactNode | null
}

const buildFilterVars = (filters: MemberFilters) => ({
  genders: filters.gender?.length ? filters.gender : null,
  maritalStatuses: filters.maritalStatus?.length ? filters.maritalStatus : null,
  leaderTitles: filters.leaderTitle?.length ? filters.leaderTitle : null,
  basontas: filters.basonta?.length ? filters.basonta : null,
  leaderRanks: filters.leaderRank?.length ? filters.leaderRank : null,
})

const MembersGrid = ({
  query,
  parentId,
  parentTypename,
  pluckParent,
  getHeading,
}: MembersGridProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { filters } = useContext(ChurchContext) as { filters: MemberFilters }
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() =>
    window.matchMedia('(min-width: 768px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS
    )
    return () => clearTimeout(timer)
  }, [searchInput])

  const filterVars = useMemo(() => buildFilterVars(filters), [filters])
  const search = debouncedSearch || null

  const variables = useMemo(
    () => ({ id: parentId, search, ...filterVars }),
    [parentId, search, filterVars]
  )

  const {
    data,
    items,
    totalCount,
    loading,
    error,
    fetchingMore,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll<unknown, GridMember>({
    query,
    variables,
    initialPageSize: INITIAL_PAGE_SIZE,
    pageSize: PAGE_SIZE,
    getItems: (d) => pluckParent(d)?.members ?? [],
    getCount: (d) => pluckParent(d)?.memberCount,
    skip: !parentId,
    cacheKey: parentId
      ? { id: `${parentTypename}:${parentId}`, fieldName: 'members' }
      : undefined,
  })

  const heading = getHeading(pluckParent(data))

  const hasActiveFilters =
    (filters.gender?.length ?? 0) > 0 ||
    (filters.maritalStatus?.length ?? 0) > 0 ||
    (filters.leaderTitle?.length ?? 0) > 0 ||
    (filters.leaderRank?.length ?? 0) > 0 ||
    (filters.basonta?.length ?? 0) > 0

  const isFiltering = Boolean(search) || hasActiveFilters
  const displayCount = isFiltering ? items.length : (totalCount ?? items.length)

  const downloadPath = getMembershipDownloadPath(parentTypename)
  const downloadLevel = downloadPath
    ? (parentTypename as keyof typeof MEMBERSHIP_DOWNLOAD_PATHS)
    : undefined

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 pt-4 pb-3 max-w-2xl md:max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {loading || !heading ? (
              <Skeleton className="h-8 w-48 rounded" />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                {heading}
              </h1>
            )}
            {!loading && (
              <span className="text-sm tabular-nums shrink-0 ml-2">
                <span className="font-semibold text-members">
                  {displayCount}
                </span>
                <span className="text-muted-foreground">
                  {isFiltering ? ' matches' : ' members'}
                </span>
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search members…"
              className="h-11 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 pb-3 max-w-2xl md:max-w-7xl mx-auto">
          <RoleView
            roles={[...permitLeaderAdmin('Bacenta')]}
          >
            <Link to="/member/addmember">
              <Button
                variant="outline"
                size="default"
                className="h-11 gap-1.5 text-sm text-foreground"
              >
                <UserPlus className="size-4" />
                Add member
              </Button>
            </Link>
          </RoleView>
          <div className="ml-auto flex items-center gap-1">
            {downloadPath && downloadLevel && (
              <RoleView roles={permitLeaderAdmin(downloadLevel)}>
                <Link to={downloadPath}>
                  <Button
                    variant="ghost"
                    size="default"
                    className="h-11 gap-1.5 text-sm text-foreground"
                    aria-label="Download membership list"
                  >
                    <Download className="size-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </Link>
              </RoleView>
            )}
            <Button
              variant="ghost"
              size="default"
              className={cn(
                'h-11 gap-1.5 text-sm text-foreground',
                hasActiveFilters && 'text-members'
              )}
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {hasActiveFilters && (
                <span className="size-1.5 rounded-full bg-members inline-block" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl md:max-w-7xl mx-auto">
        <MemberTable
          data={items}
          error={error}
          loading={loading}
          fetchingMore={fetchingMore}
        />
        {hasMore && <div ref={sentinelRef} aria-hidden className="h-1" />}
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent
          side={isDesktop ? 'right' : 'bottom'}
          className={cn(
            'overflow-y-auto',
            isDesktop
              ? 'w-full sm:max-w-md'
              : 'max-h-[85vh] rounded-t-2xl'
          )}
        >
          <SheetHeader>
            <SheetTitle>Filter Members</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">
            <Filters onClose={() => setFilterOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default MembersGrid
