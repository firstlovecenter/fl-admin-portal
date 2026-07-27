import { useMutation, useQuery } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertOctagon,
  AlertTriangle,
  Banknote,
  BusFront,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Loader2,
  Megaphone,
  Settings2,
  Users,
  UsersRound,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import RoleView from 'auth/RoleView'
import useAuth from 'auth/useAuth'
import SearchMember from 'components/formik/SearchMember'
import { ChurchContext } from 'contexts/ChurchContext'
import ArrivalsHeader from '../ArrivalsHeader'
import DownloadArrivalsButton from '../DownloadArrivalsButton'
import useArrivalsScopeSync from '../utils/useArrivalsScopeSync'

import { Alert, AlertDescription } from 'components/ui/alert'
import { Button } from 'components/ui/button'
import { Card } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'
import { Skeleton } from 'components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs'
import ArrivalsDashboardMeta from '../components/ArrivalsDashboardMeta'
import {
  StickyPageHeader,
  StickyPageHeaderActions,
} from 'components/shell/StickyPageHeader'

import { SHORT_POLL_INTERVAL, throwToSentry } from 'global-utils'
import {
  permitAdmin,
  permitArrivals,
  permitArrivalsCounter,
  permitLeaderAdmin,
} from 'permission-utils'

import { STREAM_ARRIVALS_DASHBOARD } from '../arrivalsQueries'
import { MAKE_STREAMARRIVALS_ADMIN } from '../arrivalsMutation'
import { beforeStreamArrivalsDeadline, formatAmount } from '../arrivals-utils'
import { StreamWithArrivals } from '../arrivals-types'
import { AdminFormOptions } from './DashboardGovernorship'
import {
  LiveDot,
  LiveRow,
  SectionLabel,
  StatusTile,
  useUpdatedAt,
  useVisibilityAwarePolling,
  type StatusTone,
} from '../components/live-feed'

type BacentaTile = {
  key: string
  label: string
  value?: number
  icon: React.ComponentType<{ className?: string }>
  tone: StatusTone
  to: string
}

const STREAM_ADMIN_ROLES = [
  ...permitAdmin('Stream'),
  ...permitArrivals('Stream'),
]

const StreamDashboard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isAuthorised } = useAuth()
  const { arrivalDate, streamId } = useContext(ChurchContext)
  useArrivalsScopeSync('Stream', streamId)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const effectiveDate = arrivalDate || today

  const {
    data,
    previousData,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery(STREAM_ARRIVALS_DASHBOARD, {
    variables: { id: streamId, arrivalDate: effectiveDate },
    fetchPolicy: 'cache-and-network',
  })

  useVisibilityAwarePolling({
    startPolling,
    stopPolling,
    refetch,
    interval: SHORT_POLL_INTERVAL,
  })

  const [MakeStreamArrivalsAdmin] = useMutation(MAKE_STREAMARRIVALS_ADMIN)
  const stream: StreamWithArrivals = data?.streams?.[0]
  const updatedLabel = useUpdatedAt(data)

  const initialAdminValues: AdminFormOptions = useMemo(
    () => ({
      adminName: stream?.arrivalsAdmin?.fullName ?? '',
      adminSelect: stream?.arrivalsAdmin?.id ?? '',
    }),
    [stream?.arrivalsAdmin]
  )

  const adminValidationSchema = Yup.object({
    adminSelect: Yup.string().required(t('arrivals.dashboard.selectAdmin')),
  })

  const onAdminSubmit = async (
    values: AdminFormOptions,
    onSubmitProps: FormikHelpers<AdminFormOptions>
  ) => {
    if (!isAuthorised(STREAM_ADMIN_ROLES)) {
      toast.error(t('arrivals.dashboard.notAuthorisedToChangeAdmin'))
      return
    }
    onSubmitProps.setSubmitting(true)
    try {
      const result = await MakeStreamArrivalsAdmin({
        variables: {
          streamId,
          newAdminId: values.adminSelect,
          oldAdminId: initialAdminValues.adminSelect || 'no-old-admin',
        },
      })
      if (result.errors?.length) {
        toast.error(
          String(
            result.errors[0].message ?? t('arrivals.dashboard.updateFailed')
          )
        )
        return
      }
      toast.success(t('arrivals.dashboard.adminUpdated'))
      setAdminDialogOpen(false)
    } catch (e) {
      throwToSentry('Failed to update arrivals admin', e)
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  const deadlinePassed = !!stream && !beforeStreamArrivalsDeadline(stream)

  const bacentaTiles: BacentaTile[] = [
    {
      key: 'no-activity',
      label: t('arrivals.dashboard.noActivity'),
      value: stream?.bacentasNoActivityCount,
      icon: AlertOctagon,
      tone: 'defaulters',
      to: '/arrivals/bacentas-no-activity',
    },
    {
      key: 'mobilising',
      label: t('arrivals.dashboard.mobilising'),
      value: stream?.bacentasMobilisingCount,
      icon: Megaphone,
      tone: 'warning',
      to: '/arrivals/bacentas-mobilising',
    },
    {
      key: 'on-the-way',
      label: t('arrivals.dashboard.onTheWay'),
      value: stream?.bacentasOnTheWayCount,
      icon: BusFront,
      tone: 'arrivals',
      to: '/arrivals/bacentas-on-the-way',
    },
    {
      key: 'didnt-bus',
      label: t('arrivals.dashboard.didNotBus'),
      value: stream?.bacentasBelow8Count,
      icon: AlertTriangle,
      tone: 'destructive',
      to: '/arrivals/bacentas-below-8',
    },
    {
      key: 'arrived',
      label: t('arrivals.dashboard.haveArrived'),
      value: stream?.bacentasHaveArrivedCount,
      icon: CheckCircle2,
      tone: 'success',
      to: '/arrivals/bacentas-have-arrived',
    },
  ]

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper
        data={data}
        loading={loading}
        error={error}
        placeholder={!!previousData}
      >
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <StickyPageHeader bare>
            <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 py-3 pl-16 pr-16 md:px-4 lg:px-6">
              <div className="min-w-0 flex-1">
                {loading && !stream ? (
                  <Skeleton className="h-9 w-72" />
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {stream?.name}{' '}
                    <span className="text-arrivals">
                      {t('arrivals.common.title')}
                    </span>
                  </h1>
                )}
              </div>

              {/* Settings dropdown */}
              <RoleView roles={STREAM_ADMIN_ROLES}>
                <StickyPageHeaderActions>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11 shrink-0"
                        aria-label={t('arrivals.dashboard.settingsAriaLabel')}
                      >
                        <Settings2 className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        {t('arrivals.dashboard.settings')}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setAdminDialogOpen(true)}
                      >
                        {t('arrivals.dashboard.changeAdmin')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => navigate('/stream/arrivals-counters')}
                      >
                        {t('arrivals.dashboard.arrivalsCounters')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => navigate('/stream/arrival-times')}
                      >
                        {t('arrivals.dashboard.arrivalTimes')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => navigate('/stream/arrival-excel-data')}
                      >
                        {t('arrivals.dashboard.downloadPaymentData')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </StickyPageHeaderActions>
              </RoleView>
            </div>
          </StickyPageHeader>
          <main className="mx-auto w-full max-w-6xl px-4 py-3 lg:px-6 lg:py-8">
            {deadlinePassed && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  {t('arrivals.dashboard.deadlinePassed')}
                </AlertDescription>
              </Alert>
            )}

            {/* Counter blocks: mobile = tabs (one visible at a time);
                desktop = 2-column grid (all three visible). */}
            {(() => {
              const metaRow = (
                <ArrivalsDashboardMeta
                  admin={stream?.arrivalsAdmin}
                  loading={loading && !stream}
                  subChurch={{
                    label:
                      stream?.councilCount === 1
                        ? t('shared.churchLevel.Council')
                        : t('shared.churchLevelPlural.Council'),
                    count: stream?.councilCount,
                    to: '/arrivals/stream-by-council',
                  }}
                />
              )
              const bacentaStatusBlock = (
                <section className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <SectionLabel>
                      {t('arrivals.dashboard.bacentaStatus')}
                    </SectionLabel>
                    <DownloadArrivalsButton
                      level="Stream"
                      churchId={streamId}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {bacentaTiles.map((tile) => (
                      <StatusTile
                        key={tile.key}
                        label={tile.label}
                        value={tile.value}
                        icon={tile.icon}
                        tone={tile.tone}
                        onClick={() => navigate(tile.to)}
                        loading={loading && !stream}
                      />
                    ))}
                    <RoleView roles={permitArrivalsCounter()}>
                      <StatusTile
                        label={t('arrivals.dashboard.toBeCounted')}
                        value={stream?.vehiclesNotCountedCount}
                        icon={ClipboardList}
                        tone="warning"
                        onClick={() => navigate('/arrivals/bacentas-to-count')}
                        loading={loading && !stream}
                      />
                    </RoleView>
                  </div>
                </section>
              )

              const financialDataBlock = (
                <RoleView
                  roles={[
                    ...permitArrivals('Campus'),
                    ...permitLeaderAdmin('Stream'),
                  ]}
                >
                  <section className="space-y-2">
                    <SectionLabel>
                      {t('arrivals.dashboard.financialData')}
                    </SectionLabel>
                    <Card className="overflow-hidden">
                      <div className="divide-y divide-border">
                        <LiveRow
                          label={t('arrivals.dashboard.vehiclesPaid')}
                          value={stream?.vehiclesHaveBeenPaidCount}
                          icon={CheckCircle2}
                          tone="success"
                          loading={loading && !stream}
                        />
                        <LiveRow
                          label={t('arrivals.dashboard.vehiclesToBePaid')}
                          value={stream?.vehiclesToBePaidCount}
                          icon={BusFront}
                          tone="warning"
                          loading={loading && !stream}
                        />
                        <LiveRow
                          label={t('arrivals.dashboard.amountPaid')}
                          value={formatAmount(stream?.vehicleAmountHasBeenPaid)}
                          icon={Banknote}
                          tone="success"
                          loading={loading && !stream}
                        />
                        <LiveRow
                          label={t('arrivals.dashboard.amountToBePaid')}
                          value={formatAmount(stream?.vehicleAmountToBePaid)}
                          icon={CreditCard}
                          tone="warning"
                          loading={loading && !stream}
                        />
                      </div>
                    </Card>
                  </section>
                </RoleView>
              )

              const liveArrivalsBlock = (
                <section className="space-y-2">
                  <SectionLabel>
                    {t('arrivals.dashboard.liveArrivals')}
                  </SectionLabel>
                  <Card className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <LiveDot />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('arrivals.dashboard.realtime')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {t('arrivals.dashboard.updated', {
                          time: updatedLabel,
                        })}
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      <LiveRow
                        label={t('arrivals.dashboard.membersOnTheWay')}
                        value={stream?.bussingMembersOnTheWayCount}
                        icon={UsersRound}
                        tone="warning"
                        loading={loading && !stream}
                      />
                      <LiveRow
                        label={t('arrivals.dashboard.membersArrived')}
                        value={stream?.bussingMembersHaveArrivedCount}
                        icon={Users}
                        tone="success"
                        loading={loading && !stream}
                      />
                      <LiveRow
                        label={t('arrivals.dashboard.busesOnTheWay')}
                        value={stream?.bussesOnTheWayCount}
                        icon={BusFront}
                        tone="warning"
                        loading={loading && !stream}
                      />
                      <LiveRow
                        label={t('arrivals.dashboard.busesArrived')}
                        value={stream?.bussesThatArrivedCount}
                        icon={BusFront}
                        tone="success"
                        loading={loading && !stream}
                      />
                    </div>
                  </Card>
                </section>
              )

              return (
                <>
                  {/* Mobile: meta row + sticky toolbar + tabs. */}
                  <div className="lg:hidden">
                    {metaRow}
                    <ArrivalsHeader />
                    <Tabs defaultValue="bacentas">
                      <TabsList className="grid h-11 w-full grid-cols-3">
                        <TabsTrigger value="bacentas" className="text-xs">
                          {t('shared.churchLevelPlural.Bacenta')}
                        </TabsTrigger>
                        <RoleView
                          roles={[
                            ...permitArrivals('Campus'),
                            ...permitLeaderAdmin('Stream'),
                          ]}
                        >
                          <TabsTrigger value="financial" className="text-xs">
                            {t('arrivals.dashboard.financial')}
                          </TabsTrigger>
                        </RoleView>
                        <TabsTrigger value="live" className="text-xs">
                          {t('arrivals.dashboard.live')}
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="bacentas" className="mt-3">
                        {bacentaStatusBlock}
                      </TabsContent>
                      <TabsContent value="financial" className="mt-3">
                        {financialDataBlock}
                      </TabsContent>
                      <TabsContent value="live" className="mt-3">
                        {liveArrivalsBlock}
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Desktop: 2-col grid — meta + bacentas + financial on
                      the left; date toolbar + live on the right (sticky). */}
                  <div className="hidden gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
                    <div className="space-y-4">
                      {metaRow}
                      {bacentaStatusBlock}
                      {financialDataBlock}
                    </div>
                    <aside className="space-y-4 lg:sticky lg:top-6">
                      <ArrivalsHeader />
                      {liveArrivalsBlock}
                    </aside>
                  </div>
                </>
              )
            })()}

            {/* ── Change Arrivals Admin dialog ── */}
            <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {t('arrivals.dashboard.changeAdmin')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('arrivals.dashboard.changeAdminDescription', {
                      level: t('shared.churchLevel.Stream').toLowerCase(),
                    })}
                  </DialogDescription>
                </DialogHeader>

                <Formik
                  initialValues={initialAdminValues}
                  validationSchema={adminValidationSchema}
                  onSubmit={onAdminSubmit}
                  enableReinitialize
                >
                  {(formik) => (
                    <Form className="space-y-4">
                      <SearchMember
                        name="adminSelect"
                        initialValue={initialAdminValues.adminName}
                        placeholder={t('arrivals.dashboard.searchMember')}
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Member Search"
                        error={formik.errors.adminSelect}
                      />
                      <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAdminDialogOpen(false)}
                          disabled={formik.isSubmitting}
                        >
                          {t('arrivals.dashboard.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={!formik.isValid || formik.isSubmitting}
                          className="gap-2"
                        >
                          {formik.isSubmitting && (
                            <Loader2 className="size-4 animate-spin" />
                          )}
                          {t('arrivals.dashboard.saveChanges')}
                        </Button>
                      </DialogFooter>
                    </Form>
                  )}
                </Formik>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StreamDashboard
