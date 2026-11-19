import { useMutation, useQuery } from '@apollo/client'
import RoleView from 'auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import BulkActionBar from 'components/bulk-action-bar/BulkActionBar'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Checkbox } from 'components/ui/checkbox'
import { Input } from 'components/ui/input'
import { StatCard } from 'components/ui/stat-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import { ChurchContext } from 'contexts/ChurchContext'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'components/ui/breadcrumb'
import { ArrowRightLeft, Building2, CheckSquare, ChevronRight, Loader2, Plus, Search, Users, X } from 'lucide-react'
import { permitAdminArrivals } from 'permission-utils'
import { GET_GOVERNORSHIP_BACENTAS } from 'queries/ListQueries'
import { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { classifyBacenta } from './bacenta-classification'
import useBulkSelect from 'hooks/useBulkSelect'
import {
  SET_ACTIVE_BACENTA,
  SET_VACATION_BACENTA,
} from 'pages/directory/update/StatusChanges'
import { throwToSentry } from 'global-utils'
import { displayError, isPermissionError } from 'utils/errorHandler'
import BulkTransferChurchSheet from 'components/directory/BulkTransferChurchSheet'

type BacentaRow = {
  id: string
  name: string
  memberCount: number
  vacationStatus?: 'Vacation' | 'Active' | null
  labels?: string[] | null
  __typename: 'Bacenta'
  council?: { id: string }
  leader?: {
    id: string
    firstName: string
    lastName: string
    pictureUrl?: string
  } | null
}

type GovernorshipLeader = {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  nameWithTitle?: string
  pictureUrl?: string
}

const formatCount = (n: number) => n.toLocaleString('en-GH')

const DisplayAllBacentas = () => {
  const { t } = useTranslation()
  const { governorshipId, clickCard } = useContext(ChurchContext)
  const [search, setSearch] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'vacation' | 'active' | null>(null)
  const [applying, setApplying] = useState(false)
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false)

  const { data, loading, error, refetch } = useQuery(GET_GOVERNORSHIP_BACENTAS, {
    variables: { id: governorshipId },
  })

  const [SetVacationBacenta] = useMutation(SET_VACATION_BACENTA)
  const [SetActiveBacenta] = useMutation(SET_ACTIVE_BACENTA)

  const governorship = data?.governorships?.[0]
  const bacentas: BacentaRow[] = governorship?.bacentas ?? []
  const allIds = useMemo(() => bacentas.map((b) => b.id), [bacentas])

  const { selectedIds, toggle, selectAll, clear, isSelected, count, isAllSelected } =
    useBulkSelect(allIds)

  const selectedNames = useMemo(
    () => bacentas.filter((b) => selectedIds.has(b.id)).map((b) => b.name),
    [bacentas, selectedIds]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return bacentas
    return bacentas.filter((b) => {
      const haystack = [
        b.name ?? '',
        b.leader?.firstName ?? '',
        b.leader?.lastName ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [bacentas, search])

  const handleCancelSelect = () => {
    setSelectMode(false)
    clear()
  }

  const handleBulkApply = async (action: 'vacation' | 'active') => {
    setApplying(true)
    setConfirmAction(null)
    const mutation = action === 'vacation' ? SetVacationBacenta : SetActiveBacenta
    try {
      await Promise.all(
        Array.from(selectedIds).map((bacentaId) =>
          mutation({ variables: { bacentaId } })
        )
      )
      await refetch()
      clear()
      setSelectMode(false)
    } catch (e) {
      if (!isPermissionError(e)) {
        throwToSentry(`Error setting bacentas to ${action}`, e)
      }
      displayError(`Could not set bacentas to ${action}`, e)
    } finally {
      setApplying(false)
    }
  }

  return (
    <ApolloWrapper loading={loading} data={data} error={error}>
      <div className={`min-h-svh bg-background ${count > 0 ? 'pb-32' : 'pb-[env(safe-area-inset-bottom)]'}`}>
        <StickyPageHeader bare>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-3 pl-16 pr-16 md:px-4 lg:px-6">
            {selectMode ? (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => (checked ? selectAll() : clear())}
                    aria-label="Select all bacentas"
                    className="h-5 w-5"
                  />
                  <span className="text-sm font-medium text-foreground">
                    {count > 0 ? `${count} selected` : 'Select bacentas'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 gap-1.5 shrink-0"
                  onClick={handleCancelSelect}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('directory.list.eyebrow')}
                  </p>
                  <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {governorship?.name ? `${governorship.name} ` : ''}
                    <span className="text-members">
                      {t('shared.churchLevelPlural.Bacenta')}
                    </span>
                  </h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RoleView roles={permitAdminArrivals('Council')} directoryLock>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 gap-2"
                      onClick={() => setSelectMode(true)}
                      disabled={bacentas.length === 0}
                    >
                      <CheckSquare className="size-4" />
                      <span className="hidden sm:inline">Select</span>
                    </Button>
                  </RoleView>
                  <RoleView roles={permitAdminArrivals('Council')} directoryLock>
                    <Link to="/bacenta/addbacenta" className="shrink-0">
                      <Button size="sm" className="h-11 gap-2">
                        <Plus className="size-4" />
                        <span className="hidden sm:inline">
                          {t('directory.list.add', {
                            level: t('shared.churchLevel.Bacenta'),
                          })}
                        </span>
                        <span className="sm:hidden">
                          {t('directory.list.addShort')}
                        </span>
                      </Button>
                    </Link>
                  </RoleView>
                </div>
              </>
            )}
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-2 lg:px-6">
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem>
                  <span>{t('shared.churchLevel.Governorship')}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-members">
                    {t('shared.churchLevel.Bacenta')}
                  </BreadcrumbPage>
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
                  placeholder={t('directory.list.searchBacentaOrLeader')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={t('directory.list.searchAria', {
                    levelPlural: t('shared.churchLevelPlural.Bacenta'),
                  })}
                />
              </div>
            </div>
          </div>
        </StickyPageHeader>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            <section className="order-2 space-y-4 lg:order-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('directory.list.allOf', {
                    levelPlural: t('shared.churchLevelPlural.Bacenta'),
                  })}
                </h2>
                <span
                  aria-live="polite"
                  className="text-xs tabular-nums text-muted-foreground"
                >
                  {t('directory.list.countOfTotal', {
                    shown: filtered.length,
                    total: bacentas.length,
                  })}
                </span>
              </div>

              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Building2 className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {t('directory.list.noneFound', {
                        levelPlural: t('shared.churchLevelPlural.Bacenta'),
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {search
                        ? t('directory.list.tryDifferentSearch')
                        : t('directory.list.noneUnderYet', {
                            parent: t('shared.churchLevel.Governorship'),
                            levelPlural: t('shared.churchLevelPlural.Bacenta'),
                          })}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {filtered.map((bacenta) => {
                    const initials =
                      `${bacenta.leader?.firstName?.[0] ?? ''}${
                        bacenta.leader?.lastName?.[0] ?? ''
                      }` ||
                      bacenta.name?.charAt(0) ||
                      '?'
                    const isVacation = bacenta.vacationStatus === 'Vacation'
                    const category = classifyBacenta(bacenta.labels)
                    const selected = isSelected(bacenta.id)

                    const cardContent = (
                      <div
                        className={`flex min-h-[88px] items-center gap-3 p-4 rounded-xl border transition-colors ${
                          selectMode && selected
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border bg-card hover:bg-muted/40 active:bg-muted'
                        }`}
                      >
                        {selectMode && (
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggle(bacenta.id)}
                            aria-label={`Select ${bacenta.name}`}
                            className="h-5 w-5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
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
                            {bacenta.name}{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                              {t('shared.churchLevel.Bacenta')}
                            </span>
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {bacenta.leader
                              ? `${bacenta.leader.firstName} ${bacenta.leader.lastName}`
                              : t('directory.list.noLeader')}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="gap-1 px-2 py-0.5"
                            >
                              <Users className="size-3" />
                              <span className="font-mono tabular-nums">
                                {formatCount(bacenta.memberCount ?? 0)}
                              </span>
                            </Badge>
                            {isVacation && (
                              <Badge
                                variant="destructive"
                                className="px-2 py-0.5"
                              >
                                {t('directory.list.vacation')}
                              </Badge>
                            )}
                            {category && (
                              <Badge
                                variant={category.variant}
                                className="px-2 py-0.5"
                              >
                                {category.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!selectMode && (
                          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        )}
                      </div>
                    )

                    if (selectMode) {
                      return (
                        <button
                          key={bacenta.id}
                          type="button"
                          className="group w-full text-left"
                          onClick={() => toggle(bacenta.id)}
                          aria-pressed={selected}
                          aria-label={`${selected ? 'Deselect' : 'Select'} ${bacenta.name}`}
                        >
                          {cardContent}
                        </button>
                      )
                    }

                    return (
                      <Link
                        key={bacenta.id}
                        to="/bacenta/displaydetails"
                        onClick={() => clickCard(bacenta)}
                        aria-label={t('directory.list.openChurch', {
                          name: bacenta.name,
                        })}
                        className="group"
                      >
                        {cardContent}
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <aside className="order-1 space-y-4 lg:sticky lg:top-[104px] lg:order-2">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('shared.churchLevel.Governorship')}
                  </p>
                  <Link
                    to="/governorship/displaydetails"
                    onClick={() => governorship && clickCard(governorship)}
                    className="mt-1 block truncate text-base font-semibold text-foreground hover:underline"
                  >
                    {governorship?.name}
                  </Link>
                  {governorship?.leader &&
                    (() => {
                      const leader: GovernorshipLeader = governorship.leader
                      const displayName =
                        leader.nameWithTitle ||
                        leader.fullName ||
                        [leader.firstName, leader.lastName]
                          .filter(Boolean)
                          .join(' ')
                      const initials =
                        `${leader.firstName?.[0] ?? ''}${
                          leader.lastName?.[0] ?? ''
                        }` ||
                        governorship?.name?.charAt(0) ||
                        '?'

                      return (
                        <Link
                          to="/member/displaydetails"
                          onClick={() => clickCard(leader)}
                          className="-mx-2 mt-3 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                          <Avatar className="size-10 shrink-0">
                            <AvatarImage
                              src={leader.pictureUrl}
                              alt={displayName}
                            />
                            <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              {t('directory.leaderTitle.governor')}
                            </p>
                            <p className="truncate text-sm font-semibold text-foreground">
                              {displayName ||
                                t('directory.list.unnamed', {
                                  role: t('directory.leaderTitle.governor'),
                                })}
                            </p>
                          </div>
                        </Link>
                      )
                    })()}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label={t('shared.churchLevelPlural.Bacenta')}
                  value={formatCount(bacentas.length)}
                  icon={Building2}
                  accent="members"
                  compact
                  loading={loading}
                />
                <Link to="/governorship/members" className="block">
                  <StatCard
                    label={t('shared.churchesSummary.members')}
                    value={formatCount(governorship?.memberCount ?? 0)}
                    icon={Users}
                    accent="members"
                    compact
                    loading={loading}
                  />
                </Link>
              </div>

              <div className="relative hidden lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder={t('directory.list.searchBacentaOrLeader')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={t('directory.list.searchAria', {
                    levelPlural: t('shared.churchLevelPlural.Bacenta'),
                  })}
                />
              </div>
            </aside>
          </div>
        </main>

        {/* Bulk action bar */}
        <BulkActionBar
          count={count}
          label="bacentas selected"
          actions={[
            {
              label: 'Transfer',
              variant: 'outline',
              className: 'text-violet-500 border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-500',
              icon: <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />,
              disabled: applying,
              onClick: () => setIsBulkTransferOpen(true),
            },
            {
              label: 'Set Active',
              variant: 'outline',
              className: 'text-green-600 border-green-600/30 hover:bg-green-600/10 hover:text-green-600',
              icon: applying ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined,
              disabled: applying,
              onClick: () => setConfirmAction('active'),
            },
            {
              label: 'Set Vacation',
              variant: 'outline',
              className: 'text-amber-600 border-amber-600/30 hover:bg-amber-600/10 hover:text-amber-600',
              icon: applying ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined,
              disabled: applying,
              onClick: () => setConfirmAction('vacation'),
            },
          ]}
        />

        {/* Bulk transfer sheet */}
        <BulkTransferChurchSheet
          open={isBulkTransferOpen}
          onClose={() => setIsBulkTransferOpen(false)}
          churchIds={Array.from(selectedIds)}
          churchNames={selectedNames}
          churchLevel="Bacenta"
          oldParentId={governorshipId}
          onSuccess={() => {
            clear()
            setSelectMode(false)
          }}
        />

        {/* Confirmation dialogs */}
        <AlertDialog
          open={confirmAction !== null}
          onOpenChange={(o) => !o && setConfirmAction(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction === 'vacation'
                  ? `Set ${count} Bacenta${count !== 1 ? 's' : ''} to Vacation?`
                  : `Set ${count} Bacenta${count !== 1 ? 's' : ''} to Active?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction === 'vacation'
                  ? `These bacentas will be marked as on vacation and will not be counted as defaulters.`
                  : `These bacentas will be restored to active status.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmAction && handleBulkApply(confirmAction)}
                className={
                  confirmAction === 'vacation'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-green-600 hover:bg-green-700'
                }
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllBacentas
