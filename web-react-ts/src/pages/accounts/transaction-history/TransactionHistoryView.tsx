import React, { useContext, useMemo, useState } from 'react'
import { DocumentNode } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CSVLink } from 'react-csv'
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CircleHelp,
  Download,
  XCircle,
} from 'lucide-react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ChurchContext } from 'contexts/ChurchContext'
import useInfiniteScroll from 'hooks/useInfiniteScroll'
import ErrorScreen from 'components/base-component/ErrorScreen'
import { Skeleton } from 'components/ui/skeleton'
import { Button } from 'components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'
import { cn } from 'components/lib/utils'
import CurrencySpan from 'components/CurrencySpan'
import {
  translateAccountLabel,
  translateCategoryLabel,
  translateStatusLabel,
} from '../accounts-i18n'
import { AccountTransaction } from './transaction-types'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import type { TFunction } from 'i18next'

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

const StatusIcon = ({
  status,
  labels,
}: {
  status: string | undefined
  labels: {
    success: string
    pending: string
    declined: string
  }
}) => {
  if (status === 'success')
    return <Check className="size-4 text-emerald-500" aria-label={labels.success} />
  if (status === 'pending approval')
    return (
      <CircleHelp
        className="size-4 text-amber-500"
        aria-label={labels.pending}
      />
    )
  if (status === 'declined')
    return (
      <XCircle className="size-4 text-destructive" aria-label={labels.declined} />
    )
  return null
}

const SortIcon = ({ sorted }: { sorted: 'asc' | 'desc' | false }) => {
  if (sorted === 'asc') return <ChevronUp className="size-3.5 shrink-0" />
  if (sorted === 'desc') return <ChevronDown className="size-3.5 shrink-0" />
  return (
    <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />
  )
}

const buildCsvData = (
  transactions: AccountTransaction[] | undefined,
  showCouncilColumn: boolean,
  t: TFunction
) =>
  (transactions ?? []).map((row) => ({
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
    lastModified: row.lastModified
      ? new Date(row.lastModified).toISOString()
      : '',
    ...(showCouncilColumn
      ? {
          council: row.council?.name ?? '',
          leader: row.council?.leader?.fullName ?? '',
        }
      : {}),
    type: translateCategoryLabel(t, row.category),
    account: translateAccountLabel(t, row.account),
    success: translateStatusLabel(t, row.status),
    credit: row.category === 'Deposit' ? row.amount : null,
    debit: row.category !== 'Deposit' ? row.amount : null,
    charge: row.charge,
    weekdayBalance: row.weekdayBalance?.toLocaleString('en-US') ?? '',
    bussingSocietyBalance:
      row.bussingSocietyBalance?.toLocaleString('en-US') ?? '',
    depositedBy: row.loggedBy?.fullName ?? '',
    description: row.description,
  }))

const columnHelper = createColumnHelper<AccountTransaction>()

const TransactionHistoryView = <TData,>({
  query,
  parentId,
  parentTypename,
  pluckParent,
  churchType,
  showCouncilColumn = false,
}: TransactionHistoryViewProps<TData>) => {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])
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
    variables:
      parentTypename === 'Campus'
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

  const parent = pluckParent(data)
  const parentName = parent?.name

  const statusLabels = useMemo(
    () => ({
      success: t('accounts.history.statusSuccess'),
      pending: t('accounts.history.statusPending'),
      declined: t('accounts.history.statusDeclined'),
    }),
    [t]
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('lastModified', {
        header: t('accounts.history.colDate'),
        sortingFn: 'datetime',
        cell: (info) => (
          <span className="text-foreground">
            {formatShortDate(info.getValue())}
          </span>
        ),
      }),
      ...(showCouncilColumn
        ? [
            columnHelper.accessor((row) => row.council?.name ?? '', {
              id: 'council',
              header: t('accounts.history.colCouncil'),
              cell: (info) => (
                <span className="truncate text-foreground">
                  {info.getValue()}
                </span>
              ),
            }),
          ]
        : [
            columnHelper.accessor('account', {
              header: t('accounts.history.colAccount'),
              cell: (info) => (
                <span className="truncate text-foreground">
                  {translateAccountLabel(t, info.getValue())}
                </span>
              ),
            }),
          ]),
      columnHelper.accessor('category', {
        header: t('accounts.history.colCategory'),
        cell: (info) => (
          <span className="text-muted-foreground">
            {translateCategoryLabel(t, info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor((row) => (row.amount ?? 0) + (row.charge ?? 0), {
        id: 'total',
        header: t('accounts.history.colAmount'),
        sortingFn: 'basic',
        cell: ({ row, getValue }) => (
          <span
            className={cn(
              'font-medium tabular-nums',
              row.original.category === 'Deposit'
                ? 'text-emerald-600'
                : 'text-destructive'
            )}
          >
            <CurrencySpan number={getValue()} negative />
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: () => <CheckCheck className="mx-auto size-4" />,
        enableSorting: false,
        cell: (info) => (
          <span className="flex justify-center">
            <StatusIcon status={info.getValue()} labels={statusLabels} />
          </span>
        ),
      }),
    ],
    [showCouncilColumn, statusLabels, t]
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (error) return <ErrorScreen error={error} />

  const csvData = buildCsvData(
    table.getRowModel().rows.map((row) => row.original),
    showCouncilColumn,
    t
  )

  const csvHeaders = [
    { label: t('accounts.history.csvCreatedAt'), key: 'createdAt' },
    { label: t('accounts.history.csvLastModified'), key: 'lastModified' },
    ...(showCouncilColumn
      ? [
          { label: t('accounts.history.csvCouncil'), key: 'council' },
          { label: t('accounts.history.csvLeader'), key: 'leader' },
        ]
      : []),
    { label: t('accounts.history.csvType'), key: 'type' },
    { label: t('accounts.history.csvAccount'), key: 'account' },
    { label: t('accounts.history.csvStatus'), key: 'success' },
    { label: t('accounts.history.csvCredit'), key: 'credit' },
    { label: t('accounts.history.csvDebit'), key: 'debit' },
    { label: t('accounts.history.csvCharge'), key: 'charge' },
    { label: t('accounts.history.csvWeekdayBalance'), key: 'weekdayBalance' },
    {
      label: t('accounts.history.csvBussingSocietyBalance'),
      key: 'bussingSocietyBalance',
    },
    { label: t('accounts.history.csvRecordedBy'), key: 'depositedBy' },
    { label: t('accounts.history.csvDescription'), key: 'description' },
  ]

  const churchTypeLabel = t(`shared.churchLevel.${churchType}`, {
    defaultValue: churchType,
  })

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          {parentName ? (
            <>{parentName} </>
          ) : (
            <Skeleton className="mr-2 inline-block h-7 w-40 align-middle" />
          )}
          <span className="text-banking">
            {t('accounts.history.titleHighlight')}
          </span>
        </h1>
        {totalCount !== undefined && (
          <p className="text-sm text-muted-foreground">
            {t('accounts.history.transactionCount', { count: totalCount })}
          </p>
        )}
      </StickyPageHeader>
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        <div className="mb-4 flex items-center justify-end">
          {loading || items.length === 0 ? (
            <Button
              variant="outline"
              size="default"
              disabled
              className="gap-1.5"
            >
              <Download className="size-4" />
              {t('accounts.history.downloadCsv')}
            </Button>
          ) : (
            <Button variant="outline" size="default" asChild className="gap-1.5">
              <CSVLink
                filename={t('accounts.history.csvFilename', {
                  name: parentName ?? '',
                  churchType: churchTypeLabel,
                })}
                headers={csvHeaders}
                data={csvData}
              >
                <Download className="size-4" />
                {t('accounts.history.downloadCsv')}
              </CSVLink>
            </Button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {loading && items.length === 0 ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {t('accounts.history.empty')}
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b border-border hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="px-4 py-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={(e) =>
                              header.column.getToggleSortingHandler()?.(e)
                            }
                            className="-ml-1 flex min-h-11 items-center gap-1 rounded px-1 transition-colors hover:text-foreground"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <SortIcon sorted={header.column.getIsSorted()} />
                          </button>
                        ) : (
                          <div className="flex min-h-11 items-center">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer border-b border-border transition-colors hover:bg-muted/40 active:bg-muted"
                    onClick={() => {
                      clickCard(row.original)
                      navigate('/accounts/transaction-details')
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
