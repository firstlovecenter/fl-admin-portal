import { useContext, useState, useMemo, useEffect } from 'react'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import CloudinaryImage from 'components/CloudinaryImage'
import { DISPLAY_AGGREGATE_SERVICE_RECORD } from 'pages/services/record-service/RecordServiceMutations'
import { alertMsg, getWeekNumber, throwToSentry } from 'global-utils'
import { Church, UserJobs } from 'global-types'
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Inbox,
  Loader2,
  Search,
} from 'lucide-react'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardFooter } from 'components/ui/card'
import { Input as ShadInput } from 'components/ui/input'
import { Separator } from 'components/ui/separator'
import { Skeleton } from 'components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { ChurchRoleScopePicker } from 'components/shell/ChurchRoleScopePicker'
import { cn } from 'components/lib/utils'
import { formatChurchLevel } from 'lib/scope-display'
import {
  CONFIRM_BANKING,
  CONFIRM_COUNCIL_BANKING,
  DISPLAY_COUNCIL_AGGREGATE_SERVICE_RECORD,
  STREAM_BANKING_DEFAULTERS_THIS_WEEK,
} from './Treasury.gql'

interface Defaulter extends Church {
  id: string
  name: string
  __typename: 'Governorship' | 'Council'
}

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const formatCurrency = (value: number | string | null | undefined) => {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return '—'
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 2,
  }).format(num)
}

const ConfirmManualBanking = () => {
  const { currentUser, userJobs } = useContext(MemberContext)
  const { selectedScope, roleChurchOptions } = useChurchRoleScope()
  const { streamId: contextStreamId } = useContext(ChurchContext)

  const tellerStreamFromJobs = useMemo(() => {
    const stream = (userJobs as UserJobs[] | undefined)?.find(
      (job: UserJobs) => job.authRoles === 'tellerStream'
    )
    return stream?.church?.[0]
  }, [userJobs])

  const activeStream =
    selectedScope?.churchType === 'Stream'
      ? {
          id: selectedScope.churchId,
          name: selectedScope.churchName,
          __typename: 'Stream',
        }
      : tellerStreamFromJobs
      ? {
          id: tellerStreamFromJobs.id,
          name: tellerStreamFromJobs.name,
          __typename: tellerStreamFromJobs.__typename ?? 'Stream',
        }
      : currentUser?.currentChurch
      ? {
          id: currentUser.currentChurch.id,
          name: currentUser.currentChurch.name,
          __typename: currentUser.currentChurch.__typename,
        }
      : undefined

  const streamId = activeStream?.id ?? contextStreamId

  const [isSubmitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<Defaulter | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Server-side search — debounced so we don't fire a query on every keystroke.
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const handle = window.setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS
    )
    return () => window.clearTimeout(handle)
  }, [searchInput])

  // Per-section pagination. Councils + governorships are independent
  // sections so each gets its own pager. Reset both to page 1 whenever the
  // search term changes.
  const [govPage, setGovPage] = useState(1)
  const [councilPage, setCouncilPage] = useState(1)
  useEffect(() => {
    setGovPage(1)
    setCouncilPage(1)
  }, [debouncedSearch])

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(undefined)
  }

  const { data, loading, error, refetch } = useQuery(
    STREAM_BANKING_DEFAULTERS_THIS_WEEK,
    {
      variables: {
        id: streamId,
        searchKey: debouncedSearch || null,
        govSkip: (govPage - 1) * PAGE_SIZE,
        govLimit: PAGE_SIZE,
        councilSkip: (councilPage - 1) * PAGE_SIZE,
        councilLimit: PAGE_SIZE,
      },
      skip: !streamId,
      fetchPolicy: 'cache-and-network',
    }
  )

  const [
    getGovernorshipServiceRecordThisWeek,
    {
      data: governorshipServiceData,
      loading: governorshipServiceLoading,
    },
  ] = useLazyQuery(DISPLAY_AGGREGATE_SERVICE_RECORD)
  const [
    getCouncilServiceRecordThisWeek,
    { data: councilServiceData, loading: councilServiceLoading },
  ] = useLazyQuery(DISPLAY_COUNCIL_AGGREGATE_SERVICE_RECORD)

  const [ConfirmBanking] = useMutation(CONFIRM_BANKING)
  const [ConfirmCouncilBanking] = useMutation(CONFIRM_COUNCIL_BANKING)

  const selectedIsCouncil = selected?.__typename === 'Council'
  const serviceLoading = selectedIsCouncil
    ? councilServiceLoading
    : governorshipServiceLoading
  const service = selectedIsCouncil
    ? councilServiceData?.councils?.[0]?.aggregateServiceRecordForWeek
    : governorshipServiceData?.governorships?.[0]?.aggregateServiceRecordForWeek

  const stream = data?.streams?.[0]
  const governorshipDefaulters: Defaulter[] =
    stream?.governorshipBankingDefaultersThisWeek ?? []
  const councilDefaulters: Defaulter[] =
    stream?.councilBankingDefaultersThisWeek ?? []
  const govCount: number = stream?.governorshipBankingDefaultersThisWeekCount ?? 0
  const councilCount: number =
    stream?.councilBankingDefaultersThisWeekCount ?? 0
  const totalPending = govCount + councilCount

  const govTotalPages = Math.max(1, Math.ceil(govCount / PAGE_SIZE))
  const councilTotalPages = Math.max(1, Math.ceil(councilCount / PAGE_SIZE))

  const headerTypeLabel = activeStream?.__typename
    ? formatChurchLevel(activeStream.__typename)
    : ''
  const hasMultipleScopes = roleChurchOptions.length > 1

  const openConfirmation = async (defaulter: Defaulter) => {
    setSelected(defaulter)
    setDialogOpen(true)
    if (defaulter.__typename === 'Council') {
      await getCouncilServiceRecordThisWeek({
        variables: { councilId: defaulter.id, week: getWeekNumber() },
      })
    } else {
      await getGovernorshipServiceRecordThisWeek({
        variables: { governorshipId: defaulter.id, week: getWeekNumber() },
      })
    }
  }

  const handleConfirm = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      if (selected.__typename === 'Council') {
        await ConfirmCouncilBanking({ variables: { councilId: selected.id } })
      } else {
        await ConfirmBanking({ variables: { governorshipId: selected.id } })
      }
      setSubmitting(false)
      alertMsg('Banking confirmed successfully')
      if (streamId)
        refetch({
          id: streamId,
          searchKey: debouncedSearch || null,
          govSkip: (govPage - 1) * PAGE_SIZE,
          govLimit: PAGE_SIZE,
          councilSkip: (councilPage - 1) * PAGE_SIZE,
          councilLimit: PAGE_SIZE,
        })
      closeDialog()
    } catch (err: any) {
      setSubmitting(false)
      throwToSentry('Failed to confirm banking', err)
      alertMsg(
        err?.message?.includes('already been banked')
          ? err.message
          : 'Something went wrong while confirming. Please try again.'
      )
    }
  }

  const showSearch = totalPending > 0 || debouncedSearch.length > 0
  const showCouncilSection = councilCount > 0
  const showGovSection = govCount > 0

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        {/* ── Page header ── */}
        <header className="space-y-3">
          {activeStream?.name ? (
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {activeStream.name}{' '}
              <span className="text-banking">Receive Offering</span>
            </h1>
          ) : (
            <Skeleton className="h-9 w-72 max-w-full" />
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge
              variant="outline"
              className="rounded-full px-2.5 py-1 text-xs font-normal text-muted-foreground"
            >
              <Building2 className="mr-1 size-3 text-churches" />
              {headerTypeLabel || 'Stream'}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full px-2.5 py-1 text-xs font-medium"
            >
              Week {getWeekNumber()}
            </Badge>
            {!loading && (
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  totalPending > 0
                    ? 'border-warning/40 bg-warning/10 text-warning'
                    : 'border-success/40 bg-success/10 text-success'
                )}
              >
                <HandCoins className="mr-1 size-3" />
                {totalPending === 0
                  ? 'All caught up'
                  : `${totalPending} pending`}
              </Badge>
            )}
          </div>

          {hasMultipleScopes && (
            <div className="pt-1">
              <ChurchRoleScopePicker />
            </div>
          )}
        </header>

        {/* ── 2-column grid: content left, intentional negative space right ── */}
        <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
          {/* ── Left column ── */}
          <div className="space-y-4">
            <ApolloWrapper data={data} loading={loading} error={error}>
              <>
                {showSearch && (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <ShadInput
                      type="search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search councils or governorships"
                      className="min-h-11 pl-9"
                      aria-label="Search churches"
                    />
                  </div>
                )}

                {/* ── Councils section (only when non-empty) ── */}
                {showCouncilSection && (
                  <section className="space-y-3">
                    <SectionHeading
                      label="Councils"
                      total={councilCount}
                      page={councilPage}
                      totalPages={councilTotalPages}
                    />
                    {councilDefaulters.length === 0 && !loading ? (
                      <EmptyStateNoMatch
                        search={debouncedSearch}
                        onClear={() => setSearchInput('')}
                      />
                    ) : (
                      councilDefaulters.map((defaulter) => (
                        <DefaulterCard
                          key={`${defaulter.__typename}-${defaulter.id}`}
                          defaulter={defaulter}
                          onConfirm={() => openConfirmation(defaulter)}
                          isLoading={
                            serviceLoading && selected?.id === defaulter.id
                          }
                        />
                      ))
                    )}
                    {councilTotalPages > 1 && (
                      <Pager
                        page={councilPage}
                        totalPages={councilTotalPages}
                        onPage={setCouncilPage}
                      />
                    )}
                  </section>
                )}

                {/* ── Governorships section ── */}
                {showGovSection && (
                  <section className="space-y-3">
                    <SectionHeading
                      label="Governorships"
                      total={govCount}
                      page={govPage}
                      totalPages={govTotalPages}
                    />
                    {governorshipDefaulters.length === 0 && !loading ? (
                      <EmptyStateNoMatch
                        search={debouncedSearch}
                        onClear={() => setSearchInput('')}
                      />
                    ) : (
                      governorshipDefaulters.map((defaulter) => (
                        <DefaulterCard
                          key={`${defaulter.__typename}-${defaulter.id}`}
                          defaulter={defaulter}
                          onConfirm={() => openConfirmation(defaulter)}
                          isLoading={
                            serviceLoading && selected?.id === defaulter.id
                          }
                        />
                      ))
                    )}
                    {govTotalPages > 1 && (
                      <Pager
                        page={govPage}
                        totalPages={govTotalPages}
                        onPage={setGovPage}
                      />
                    )}
                  </section>
                )}

                {/* ── Empty states ── */}
                {!streamId && !loading && <EmptyStateNoScope />}
                {streamId && !loading && totalPending === 0 && !debouncedSearch && (
                  <EmptyStateAllConfirmed />
                )}
                {streamId &&
                  !loading &&
                  totalPending === 0 &&
                  debouncedSearch && (
                    <EmptyStateNoMatch
                      search={debouncedSearch}
                      onClear={() => setSearchInput('')}
                    />
                  )}
              </>
            </ApolloWrapper>
          </div>

          {/* ── Right column — intentional negative space on desktop ── */}
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </main>

      {/* ── Confirm Offering dialog ── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (isSubmitting) return
          if (!open) closeDialog()
          else setDialogOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span>{selected?.name}</span>
              {selected?.__typename && (
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0.5 text-[11px] font-normal text-muted-foreground"
                >
                  {formatChurchLevel(selected.__typename)}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Confirm the offering submitted for week {getWeekNumber()}.
            </DialogDescription>
          </DialogHeader>

          {serviceLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Loading the latest figure…
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Income
                  </p>
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    {formatCurrency(service?.income)}
                  </p>
                </div>
                {service?.foreignCurrency &&
                  service.foreignCurrency.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Foreign currency
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {Array.isArray(service.foreignCurrency)
                            ? service.foreignCurrency.join(', ')
                            : String(service.foreignCurrency)}
                        </p>
                      </div>
                    </>
                  )}
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>
                  Only confirm if the cash handed in matches this figure
                  exactly. This action is logged and cannot be reversed.
                </p>
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={closeDialog}
            >
              No, take me back
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || serviceLoading}
              onClick={handleConfirm}
              className="bg-banking text-white hover:bg-banking/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Confirming…</span>
                </>
              ) : (
                <>
                  <HandCoins className="size-4" />
                  Yes, I&apos;m sure
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface SectionHeadingProps {
  label: string
  total: number
  page: number
  totalPages: number
}

const SectionHeading = ({
  label,
  total,
  page,
  totalPages,
}: SectionHeadingProps) => (
  <div className="flex items-baseline justify-between gap-2">
    <h2 className="text-sm font-semibold text-foreground">
      {label}{' '}
      <span className="ml-1 text-xs font-normal text-muted-foreground">
        ({total})
      </span>
    </h2>
    {totalPages > 1 && (
      <p className="text-xs tabular-nums text-muted-foreground">
        Page {page} of {totalPages}
      </p>
    )}
  </div>
)

interface PagerProps {
  page: number
  totalPages: number
  onPage: (n: number) => void
}

const Pager = ({ page, totalPages, onPage }: PagerProps) => (
  <div className="flex items-center justify-between gap-2 pt-1">
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={page <= 1}
      onClick={() => onPage(Math.max(1, page - 1))}
      className="min-h-11 flex-1 sm:flex-none"
    >
      <ChevronLeft className="size-4" />
      Previous
    </Button>
    <p className="text-xs tabular-nums text-muted-foreground">
      Page {page} of {totalPages}
    </p>
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={page >= totalPages}
      onClick={() => onPage(Math.min(totalPages, page + 1))}
      className="min-h-11 flex-1 sm:flex-none"
    >
      Next
      <ChevronRight className="size-4" />
    </Button>
  </div>
)

interface DefaulterCardProps {
  defaulter: Defaulter
  onConfirm: () => void
  isLoading: boolean
}

const DefaulterCard = ({
  defaulter,
  onConfirm,
  isLoading,
}: DefaulterCardProps) => {
  const isCouncil = defaulter.__typename === 'Council'
  return (
    <Card className="overflow-hidden border border-border transition-colors hover:border-banking/40">
      <CardContent className="flex items-center gap-4 p-4">
        <CloudinaryImage
          className="size-12 shrink-0 rounded-full object-cover ring-2 ring-border"
          src={defaulter?.leader?.pictureUrl}
          alt={defaulter?.leader?.fullName}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="truncate text-base font-semibold text-foreground">
              {defaulter.name}
            </p>
            <Badge
              variant="outline"
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                isCouncil
                  ? 'border-churches/40 bg-churches/10 text-churches'
                  : 'border-members/40 bg-members/10 text-members'
              )}
            >
              {formatChurchLevel(defaulter.__typename)}
            </Badge>
          </div>
          {defaulter?.leader?.fullName && (
            <p className="truncate text-xs text-muted-foreground">
              {defaulter.leader.fullName}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t border-border bg-muted/20 px-4 py-3">
        <Button
          type="button"
          disabled={isLoading}
          onClick={onConfirm}
          className="ml-auto bg-banking text-white hover:bg-banking/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Loading…</span>
            </>
          ) : (
            <>
              <HandCoins className="size-4" />
              Confirm offering
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

const EmptyStateAllConfirmed = () => (
  <Card className="border-dashed bg-card">
    <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
        <HandCoins className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">All caught up</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          There are no offerings waiting to be confirmed this week.
        </p>
      </div>
    </CardContent>
  </Card>
)

const EmptyStateNoScope = () => (
  <Card className="border-dashed bg-card">
    <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          Pick a stream in focus
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Select a stream from the sidebar to view services awaiting
          confirmation.
        </p>
      </div>
    </CardContent>
  </Card>
)

interface NoMatchProps {
  search: string
  onClear: () => void
}

const EmptyStateNoMatch = ({ search, onClear }: NoMatchProps) => (
  <Card className="border-dashed bg-card">
    <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Search className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          No matches for &ldquo;{search}&rdquo;
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Try a different search term or clear it to see all pending
          confirmations.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onClear}>
        Clear search
      </Button>
    </CardContent>
  </Card>
)

export default ConfirmManualBanking
