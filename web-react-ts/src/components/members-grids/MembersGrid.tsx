import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DocumentNode } from '@apollo/client'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import useBulkSelect from 'hooks/useBulkSelect'
import MemberTable, { GridMember } from './MemberTable'
import { ChurchContext } from 'contexts/ChurchContext'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'
import { Skeleton } from 'components/ui/skeleton'
import { Checkbox } from 'components/ui/checkbox'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import BulkActionBar from 'components/bulk-action-bar/BulkActionBar'
import BulkTransferMemberSheet from 'components/directory/BulkTransferMemberSheet'
import Filters from './Filters'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'
import {
  ArrowRightLeft,
  CheckSquare,
  Download,
  FileDown,
  Search,
  SlidersHorizontal,
  UserPlus,
  X,
} from 'lucide-react'
import { cn } from 'components/lib/utils'
import { useTranslation } from 'react-i18next'
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

const exportMembersCsv = (members: GridMember[], filename: string) => {
  const header = 'First Name,Last Name,Bacenta,Basonta'
  const rows = members.map(
    (m) =>
      [m.firstName, m.lastName, m.bacenta?.name ?? '', m.basonta?.name ?? '']
        .map((v) => `"${(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const MembersGrid = ({
  query,
  parentId,
  parentTypename,
  pluckParent,
  getHeading,
}: MembersGridProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { filters } = useContext(ChurchContext) as { filters: MemberFilters }
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false)
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

  const allMemberIds = useMemo(() => items.map((m) => m.id), [items])
  const { selectedIds, toggle, selectAll, clear, count, isAllSelected } =
    useBulkSelect(allMemberIds)

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

  const handleCancelSelect = () => {
    setSelectMode(false)
    clear()
  }

  const selectedMembers = items.filter((m) => selectedIds.has(m.id))

  return (
    <div className={cn('min-h-svh bg-background', count > 0 ? 'pb-32' : 'pb-[env(safe-area-inset-bottom)]')}>
      <StickyPageHeader innerClassName="space-y-3">
        <div className="flex items-center justify-between">
          {selectMode ? (
            <>
              <div className="flex min-h-[44px] items-center gap-3">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(v) => (v ? selectAll() : clear())}
                  aria-label="Select all members"
                  className="h-5 w-5"
                />
                <span className="text-sm font-medium text-foreground">
                  {count > 0 ? `${count} selected` : 'Select members'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="default"
                className="h-11 gap-1.5 text-sm"
                onClick={handleCancelSelect}
              >
                <X className="size-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
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
                    {isFiltering
                      ? t('directory.memberGrid.matches')
                      : t('directory.memberGrid.members')}
                  </span>
                </span>
              )}
            </>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder={t('directory.memberGrid.searchPlaceholder')}
            className="h-11 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          {!selectMode && (
            <RoleView roles={permitLeaderAdmin('Bacenta')}>
              <Link to="/member/addmember">
                <Button
                  variant="outline"
                  size="default"
                  className="h-11 gap-1.5 text-sm text-foreground"
                >
                  <UserPlus className="size-4" />
                  {t('directory.memberGrid.addMember')}
                </Button>
              </Link>
            </RoleView>
          )}
          <div className="ml-auto flex items-center gap-1">
            {/* Select toggle */}
            <RoleView roles={permitLeaderAdmin('Bacenta')}>
              <Button
                variant={selectMode ? 'default' : 'ghost'}
                size="default"
                className="h-11 gap-1.5 text-sm"
                onClick={() => setSelectMode((prev) => !prev)}
                disabled={items.length === 0}
              >
                <CheckSquare className="size-4" />
                <span className="hidden sm:inline">Select</span>
              </Button>
            </RoleView>

            {/* Download / export */}
            {downloadPath && downloadLevel && (
              <RoleView roles={permitLeaderAdmin(downloadLevel)}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="default"
                      className="h-11 gap-1.5 text-sm text-foreground"
                      aria-label={t('directory.memberGrid.downloadMembershipList')}
                    >
                      <Download className="size-4" />
                      <span className="hidden sm:inline">
                        {t('directory.memberGrid.download')}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        exportMembersCsv(
                          items,
                          `members-${parentId}.csv`
                        )
                      }
                    >
                      <FileDown className="mr-2 size-4" />
                      Export visible ({displayCount})
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectMode(true)
                      }}
                    >
                      <CheckSquare className="mr-2 size-4" />
                      Select to export
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate(downloadPath)}
                    >
                      <Download className="mr-2 size-4" />
                      {t('directory.memberGrid.download')} page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </RoleView>
            )}

            {/* Filters */}
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
              {t('directory.memberGrid.filters')}
              {hasActiveFilters && (
                <span className="size-1.5 rounded-full bg-members inline-block" />
              )}
            </Button>
          </div>
        </div>
      </StickyPageHeader>

      <div className="max-w-6xl mx-auto">
        <MemberTable
          data={items}
          error={error}
          loading={loading}
          fetchingMore={fetchingMore}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggle={toggle}
        />
        {hasMore && <div ref={sentinelRef} aria-hidden className="h-1" />}
      </div>

      {/* Filters dialog */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('directory.memberGrid.filterMembers')}</DialogTitle>
          </DialogHeader>
          <Filters onClose={() => setFilterOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Bulk action bar */}
      <BulkActionBar
        count={count}
        label={`member${count !== 1 ? 's' : ''} selected`}
        actions={[
          {
            label: 'Transfer',
            variant: 'outline',
            icon: <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />,
            onClick: () => setBulkTransferOpen(true),
            className: 'text-violet-500 border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-500',
          },
          {
            label: `Export CSV (${count})`,
            variant: 'default',
            icon: <FileDown className="h-4 w-4" aria-hidden="true" />,
            onClick: () =>
              exportMembersCsv(selectedMembers, `members-selected-${parentId}.csv`),
          },
        ]}
      />

      {/* Bulk transfer sheet */}
      <BulkTransferMemberSheet
        open={bulkTransferOpen}
        onClose={() => setBulkTransferOpen(false)}
        memberIds={Array.from(selectedIds)}
        onSuccess={handleCancelSelect}
      />
    </div>
  )
}

export default MembersGrid
