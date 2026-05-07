import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MemberTable from './MemberTable'
import { memberFilter } from './member-filter-utils'
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
import DownloadMembershipModal from './DownloadMembershipModal'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin, permitMe } from 'permission-utils'
import { Download, Search, SlidersHorizontal, UserPlus } from 'lucide-react'
import { cn } from 'components/lib/utils'

/**
 * @typedef {{
 *   id: string,
 *   firstName?: string,
 *   lastName?: string,
 *   pictureUrl?: string,
 *   bacenta?: { name?: string },
 *   basonta?: { name?: string },
 * }} GridMember
 *
 * @typedef {{
 *   level: 'Fellowship' | 'Bacenta' | 'Governorship' | 'Council' | 'Stream' | 'Campus' | 'Oversight',
 *   churchId: string,
 *   churchName?: string,
 * }} DownloadConfig
 *
 * @param {{
 *   data: GridMember[] | null | undefined,
 *   error: import('@apollo/client').ApolloError | undefined,
 *   loading: boolean,
 *   title?: string | null,
 *   contextName?: string | null,
 *   sectionLabel?: string | null,
 *   downloadConfig?: DownloadConfig | null,
 * }} props
 */
const MembersGrid = ({
  data,
  error,
  loading,
  title,
  contextName = null,
  sectionLabel = null,
  downloadConfig = null,
}) => {
  const { filters } = useContext(ChurchContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() =>
    window.matchMedia('(min-width: 768px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const memberData = useMemo(() => {
    const base = data ? (memberFilter(data, filters) ?? []) : []
    if (!searchTerm.trim()) return base
    return base.filter((member) =>
      `${member.firstName} ${member.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  }, [data, filters, searchTerm])

  const hasActiveFilters =
    filters.gender?.length > 0 ||
    filters.maritalStatus?.length > 0 ||
    filters.leaderTitle?.length > 0 ||
    filters.leaderRank?.length > 0 ||
    filters.basonta?.length > 0

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 pt-4 pb-3 max-w-2xl md:max-w-7xl mx-auto">
          {/* Title + count */}
          <div className="flex items-center justify-between mb-3">
            {loading || !data ? (
              <Skeleton className="h-8 w-48 rounded" />
            ) : contextName || sectionLabel ? (
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                {contextName && <>{contextName}{' '}</>}
                <span className="text-members">{sectionLabel ?? 'Members'}</span>
              </h1>
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                {title || 'Members'}
              </h1>
            )}
            {!loading && data && (
              <span className="text-sm tabular-nums shrink-0 ml-2">
                <span className="font-semibold text-members">
                  {memberData.length}
                </span>
                <span className="text-muted-foreground"> members</span>
              </span>
            )}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search members…"
              className="h-11 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between gap-2 px-4 pb-3 max-w-2xl md:max-w-7xl mx-auto">
          <RoleView
            roles={[
              ...permitLeaderAdmin('Bacenta'),
              ...permitLeaderAdmin('Hub'),
            ]}
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
            {downloadConfig && (
              <RoleView roles={permitMe(downloadConfig.level)}>
                <Button
                  variant="ghost"
                  size="default"
                  className="h-11 gap-1.5 text-sm text-foreground"
                  onClick={() => setDownloadOpen(true)}
                  disabled={loading || !data}
                >
                  <Download className="size-4" />
                  Download
                </Button>
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

      {/* Member list */}
      <div className="max-w-2xl md:max-w-7xl mx-auto">
        <MemberTable
          data={memberData}
          error={error}
          loading={!data || loading}
        />
      </div>

      {/* Filter sheet — right side on desktop, bottom on mobile */}
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

      {/* Download CSV modal — opens lazily, applies the same filters + search.
          `key={level}` keeps useLazyQuery in lockstep with the church level
          if a parent ever reuses the same MembersGrid instance across levels. */}
      {downloadConfig && (
        <DownloadMembershipModal
          key={downloadConfig.level}
          open={downloadOpen}
          onOpenChange={setDownloadOpen}
          level={downloadConfig.level}
          churchId={downloadConfig.churchId}
          churchName={downloadConfig.churchName ?? title}
          filters={filters}
          searchTerm={searchTerm}
          isDesktop={isDesktop}
        />
      )}
    </div>
  )
}

export default MembersGrid
