import React, { useContext } from 'react'
import { DocumentNode } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { CSVLink } from 'react-csv'
import {
  Check,
  CheckCheck,
  CircleHelp,
  XCircle,
  Download,
} from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import ErrorScreen from 'components/base-component/ErrorScreen'
import { Skeleton } from 'components/ui/skeleton'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import CurrencySpan from 'components/CurrencySpan'
import { AccountTransaction } from './transaction-types'

const INITIAL_PAGE_SIZE = 25
const PAGE_SIZE = 25

type TransactionParent = {
  name?: string
  transactionCount?: number
  transactions?: AccountTransaction[]
}

type TransactionHistoryViewProps<TData> = {
  query: DocumentNode
  parentId: string | undefined
  parentTypename: 'Campus' | 'Council' | 'Stream'
  pluckParent: (data: TData | undefined) => TransactionParent | undefined
  churchType: 'Campus' | 'Council' | 'Stream'
  showCouncilColumn?: boolean
}

const formatShortDate = (iso: string | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      })
    : '—'

const StatusIcon = ({ status }: { status: string | undefined }) => {
  if (status === 'success')
    return <Check className="size-4 text-emerald-500" aria-label="success" />
  if (status === 'pending approval')
    return (
      <CircleHelp
        className="size-4 text-amber-500"
        aria-label="pending approval"
      />
    )
  if (status === 'declined')
    return <XCircle className="size-4 text-destructive" aria-label="declined" />
  return null
}

const buildCsvData = (
  transactions: AccountTransaction[] | undefined,
  showCouncilColumn: boolean
) =>
  (transactions ?? []).map((t) => ({
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
    lastModified: t.lastModified ? new Date(t.lastModified).toISOString() : '',
    ...(showCouncilColumn
      ? {
          council: t.council?.name ?? '',
          leader: t.council?.leader?.fullName ?? '',
        }
      : {}),
    type: t.category,
    account: t.account,
    success: t.status,
    credit: t.category === 'Deposit' ? t.amount : null,
    debit: t.category !== 'Deposit' ? t.amount : null,
    charge: t.charge,
    weekdayBalance: t.weekdayBalance?.toLocaleString('en-US') ?? '',
    bussingSocietyBalance:
      t.bussingSocietyBalance?.toLocaleString('en-US') ?? '',
    depositedBy: t.loggedBy?.fullName ?? '',
    description: t.description,
  }))

const TransactionHistoryView = <TData,>({
  query,
  parentId,
  parentTypename,
  pluckParent,
  churchType,
  showCouncilColumn = false,
}: TransactionHistoryViewProps<TData>) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  const {
    data,
    items,
    totalCount,
    loading,
    error,
    fetchingMore,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll<TData, AccountTransaction>({
    query,
    variables: parentTypename === 'Campus'
      ? { campusId: parentId }
      : parentTypename === 'Council'
        ? { councilId: parentId }
        : { streamId: parentId },
    initialPageSize: INITIAL_PAGE_SIZE,
    pageSize: PAGE_SIZE,
    getItems: (d) => pluckParent(d)?.transactions ?? [],
    getCount: (d) => pluckParent(d)?.transactionCount,
    skip: !parentId,
    cacheKey: parentId
      ? { id: `${parentTypename}:${parentId}`, fieldName: 'transactions' }
      : undefined,
  })

  if (error) return <ErrorScreen error={error} />

  const parent = pluckParent(data)
  const parentName = parent?.name

  const csvHeaders = [
    { label: 'Created At', key: 'createdAt' },
    { label: 'Last Modified', key: 'lastModified' },
    ...(showCouncilColumn
      ? [
          { label: 'Council', key: 'council' },
          { label: 'Leader', key: 'leader' },
        ]
      : []),
    { label: 'Type', key: 'type' },
    { label: 'Account', key: 'account' },
    { label: 'Status', key: 'success' },
    { label: 'Credit', key: 'credit' },
    { label: 'Debit', key: 'debit' },
    { label: 'Charge', key: 'charge' },
    { label: 'Weekday Balance', key: 'weekdayBalance' },
    { label: 'Bussing Society Balance', key: 'bussingSocietyBalance' },
    { label: 'Recorded By', key: 'depositedBy' },
    { label: 'Description', key: 'description' },
  ]

  const csvData = buildCsvData(items, showCouncilColumn)

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        <header className="mb-6 space-y-1">
          {loading || !parentName ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Transaction History{' '}
              <span className="text-muted-foreground font-normal">
                — {parentName} {churchType}
              </span>
            </h1>
          )}
          {totalCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'transaction' : 'transactions'}{' '}
              recorded.
            </p>
          )}
        </header>

        <div className="mb-4 flex items-center justify-end">
          <Button
            variant="outline"
            size="default"
            asChild
            disabled={loading || items.length === 0}
            className="gap-1.5"
          >
            <CSVLink
              filename={`${parentName ?? ''} ${churchType} Transaction History.csv`}
              headers={csvHeaders}
              data={csvData}
            >
              <Download className="size-4" />
              Download CSV
            </CSVLink>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-3 sm:col-span-2">Date</div>
            {showCouncilColumn ? (
              <div className="col-span-3 truncate">Council</div>
            ) : (
              <div className="col-span-3 sm:col-span-2 truncate">Account</div>
            )}
            <div className="col-span-2 truncate">Category</div>
            <div className="col-span-3 sm:col-span-4 text-right">Amount</div>
            <div className="col-span-1 flex justify-center">
              <CheckCheck className="size-4" />
            </div>
          </div>

          {loading && items.length === 0 ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((transaction) => {
                const total =
                  (transaction.amount ?? 0) + (transaction.charge ?? 0)
                return (
                  <li key={transaction.id}>
                    <button
                      type="button"
                      onClick={() => {
                        clickCard(transaction)
                        navigate('/accounts/transaction-details')
                      }}
                      className="grid w-full grid-cols-12 gap-2 px-4 py-3 text-left text-sm hover:bg-muted/40 active:bg-muted transition-colors min-h-12"
                    >
                      <div className="col-span-3 sm:col-span-2 text-foreground">
                        {formatShortDate(transaction.lastModified)}
                      </div>
                      {showCouncilColumn ? (
                        <div className="col-span-3 truncate text-foreground">
                          {transaction.council?.name}
                        </div>
                      ) : (
                        <div className="col-span-3 sm:col-span-2 truncate text-foreground">
                          {transaction.account}
                        </div>
                      )}
                      <div className="col-span-2 truncate text-muted-foreground">
                        {transaction.category}
                      </div>
                      <div
                        className={cn(
                          'col-span-3 sm:col-span-4 text-right font-medium tabular-nums',
                          transaction.category === 'Deposit'
                            ? 'text-emerald-600'
                            : 'text-destructive'
                        )}
                      >
                        <CurrencySpan number={total} negative />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <StatusIcon status={transaction.status} />
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {fetchingMore && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full rounded" />
              <Skeleton className="h-12 w-full rounded" />
              <Skeleton className="h-12 w-full rounded" />
            </div>
          )}
          {hasMore && <div ref={sentinelRef} aria-hidden className="h-1" />}
        </div>
      </main>
    </div>
  )
}

export default TransactionHistoryView
