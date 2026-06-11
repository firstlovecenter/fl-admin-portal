import React from 'react'
import { DocumentNode } from '@apollo/client'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import Timeline from 'components/Timeline/Timeline'
import ErrorScreen from 'components/base-component/ErrorScreen'
import { Skeleton } from 'components/ui/skeleton'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { History as HistoryIcon } from 'lucide-react'
import { HistoryLog } from 'global-types'

const INITIAL_PAGE_SIZE = 50
const PAGE_SIZE = 25

export type ChurchHistoryParent = {
  displayName?: string
  historyCount?: number
  history?: HistoryLog[]
}

type ChurchHistoryViewProps<TData> = {
  parentTypename: string
  parentId: string | undefined
  query: DocumentNode
  pluckParent: (data: TData | undefined) => ChurchHistoryParent | undefined
  headingSuffix: string
}

const ChurchHistoryView = <TData,>({
  parentTypename,
  parentId,
  query,
  pluckParent,
  headingSuffix,
}: ChurchHistoryViewProps<TData>) => {
  const {
    data,
    items,
    totalCount,
    loading,
    error,
    fetchingMore,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll<TData, HistoryLog>({
    query,
    variables: { id: parentId },
    initialPageSize: INITIAL_PAGE_SIZE,
    pageSize: PAGE_SIZE,
    getItems: (d) => pluckParent(d)?.history ?? [],
    getCount: (d) => pluckParent(d)?.historyCount,
    skip: !parentId,
    cacheKey: parentId
      ? { id: `${parentTypename}:${parentId}`, fieldName: 'history' }
      : undefined,
  })

  if (error) return <ErrorScreen error={error} />

  const parent = pluckParent(data)
  const headingName = parent?.displayName ?? ''
  const showCounter = totalCount !== undefined && items.length < totalCount

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        {loading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {headingName && `${headingName} `}
            <span className="text-members">{headingSuffix}</span>
          </h1>
        )}
        <p className="text-sm text-muted-foreground">
          Audit trail of leadership and status changes for this{' '}
          {parentTypename.toLowerCase()}.
        </p>
      </StickyPageHeader>
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="rounded-xl border border-border bg-card p-4 lg:p-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No history yet
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Leadership changes and major events will appear here as they
                  happen.
                </p>
              </div>
            ) : (
              <Timeline
                entries={items}
                fetchingMore={fetchingMore}
                hasMore={hasMore}
                sentinelRef={sentinelRef}
              />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[73px]">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Summary
                </h2>
              </div>
              <div className="space-y-1 px-4 py-4">
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {loading ? (
                    <Skeleton className="inline-block h-8 w-12 align-middle" />
                  ) : (
                    totalCount ?? items.length
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(totalCount ?? items.length) === 1
                    ? 'recorded entry'
                    : 'recorded entries'}
                </p>
                {showCounter && (
                  <p className="pt-2 text-xs text-muted-foreground">
                    Showing {items.length} of {totalCount}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  About this log
                </h2>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Every leadership transition, status change, and major event
                  is appended here as it happens. Entries are read-only and
                  cannot be edited or removed.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default ChurchHistoryView
