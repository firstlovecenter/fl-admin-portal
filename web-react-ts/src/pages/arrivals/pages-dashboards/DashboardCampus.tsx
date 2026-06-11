import { NetworkStatus, useMutation, useQuery } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getHumanReadableDate } from 'lib/date-utils'
import {
  AlertOctagon,
  AlertTriangle,
  Banknote,
  BusFront,
  CheckCircle2,
  CreditCard,
  Loader2,
  Megaphone,
  Settings2,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import RoleView from 'auth/RoleView'
import SearchMember from 'components/formik/SearchMember'
import { ChurchContext } from 'contexts/ChurchContext'
import useAuth from 'auth/useAuth'
import ArrivalsHeader from '../ArrivalsHeader'
import DownloadArrivalsButton from '../DownloadArrivalsButton'

import { Badge } from 'components/ui/badge'
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
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'
import { Skeleton } from 'components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'components/ui/tabs'
import ArrivalsDashboardMeta from '../components/ArrivalsDashboardMeta'
import {
  StickyPageHeader,
  StickyPageHeaderActions,
} from 'components/shell/StickyPageHeader'

import { SHORT_POLL_INTERVAL, throwToSentry } from 'global-utils'
import { permitAdmin, permitArrivals, permitLeaderAdmin } from 'permission-utils'

import { CAMPUS_ARRIVALS_DASHBOARD } from '../arrivalsQueries'
import {
  MAKE_CAMPUSARRIVALS_ADMIN,
  SET_CODE_OF_THE_DAY,
  SET_SWELL_DATE,
} from '../arrivalsMutation'
import { formatAmount } from '../arrivals-utils'
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

const CampusDashboard = () => {
  const navigate = useNavigate()
  const { isAuthorised } = useAuth()
  const { arrivalDate, campusId } = useContext(ChurchContext)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [swellDialogOpen, setSwellDialogOpen] = useState(false)
  const [codeDialogOpen, setCodeDialogOpen] = useState(false)
  const [codeValue, setCodeValue] = useState('')
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
    networkStatus,
  } = useQuery(CAMPUS_ARRIVALS_DASHBOARD, {
    variables: { id: campusId, date: today, arrivalDate: effectiveDate },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  })

  useVisibilityAwarePolling({
    startPolling,
    stopPolling,
    refetch,
    interval: SHORT_POLL_INTERVAL,
  })

  const [MakeCampusArrivalsAdmin] = useMutation(MAKE_CAMPUSARRIVALS_ADMIN)
  const [SetSwellDate, { loading: swellLoading }] = useMutation(SET_SWELL_DATE)
  const [SetCodeOfTheDay, { loading: codeLoading }] =
    useMutation(SET_CODE_OF_THE_DAY)
  const campus = data?.campuses?.[0]
  const timeGraph = data?.timeGraphs?.[0]
  const updatedLabel = useUpdatedAt(data)

  const initialAdminValues: AdminFormOptions = useMemo(
    () => ({
      adminName: campus?.arrivalsAdmin?.fullName ?? '',
      adminSelect: campus?.arrivalsAdmin?.id ?? '',
    }),
    [campus?.arrivalsAdmin]
  )

  const adminValidationSchema = Yup.object({
    adminSelect: Yup.string().required(
      'Please select an Admin from the dropdown'
    ),
  })

  const onAdminSubmit = async (
    values: AdminFormOptions,
    onSubmitProps: FormikHelpers<AdminFormOptions>
  ) => {
    if (!isAuthorised(permitAdmin('Campus'))) {
      toast.error('You are not authorised to change the arrivals admin')
      return
    }
    onSubmitProps.setSubmitting(true)
    try {
      const result = await MakeCampusArrivalsAdmin({
        variables: {
          campusId,
          newAdminId: values.adminSelect,
          oldAdminId: initialAdminValues.adminSelect || 'no-old-admin',
        },
      })
      if (result.errors?.length) {
        toast.error(String(result.errors[0].message ?? 'Update failed'))
        return
      }
      toast.success('Arrivals admin updated')
      setAdminDialogOpen(false)
    } catch (e) {
      throwToSentry('Failed to update arrivals admin', e)
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  const isSwellDay = !!timeGraph?.swell

  const handleSetSwell = async () => {
    if (!isAuthorised(permitAdmin('Campus'))) {
      toast.error('You are not authorised to set the swell date')
      return
    }
    if (isSwellDay) {
      toast.info('Swell is already set for today')
      setSwellDialogOpen(false)
      return
    }
    try {
      await SetSwellDate({ variables: { date: today } })
      toast.success('Swell date set successfully')
      setSwellDialogOpen(false)
    } catch (e) {
      throwToSentry('Failed to set swell date', e)
    }
  }

  const canSetSwell =
    networkStatus === NetworkStatus.ready &&
    (!data?.timeGraphs?.length || !timeGraph?.swell)

  // The dashboard route gates entry by `permitLeaderAdminArrivals
  // ('Campus')` — i.e. a Campus-level Leader, Admin, or Arrivals role
  // (note: pure `leaderCampus` qualifies even without an arrivals role).
  // The Code of the Day override is additionally restricted to fishers
  // — checked here on the FE and enforced server-side by the
  // `SetCodeOfTheDay` mutation's @authentication directive, which
  // requires `fishers` AND one of the arrivals-dashboard roles.
  const canSetCodeOfDay = isAuthorised(['fishers'])
  const isCampusAdmin = isAuthorised(permitAdmin('Campus'))
  const showSettingsMenu = isCampusAdmin || canSetCodeOfDay

  const handleSetCodeOfTheDay = async () => {
    const code = codeValue.trim()
    if (!code) {
      toast.error('Please enter a code')
      return
    }
    try {
      const result = await SetCodeOfTheDay({ variables: { code } })
      if (result.errors?.length) {
        toast.error(String(result.errors[0].message ?? 'Update failed'))
        return
      }
      toast.success(
        `Code of the day set to "${result.data?.SetCodeOfTheDay ?? code}"`
      )
      setCodeValue('')
      setCodeDialogOpen(false)
    } catch (e) {
      throwToSentry('Failed to set Code of the Day', e)
    }
  }

  const bacentaTiles: BacentaTile[] = [
    {
      key: 'no-activity',
      label: 'No Activity',
      value: campus?.bacentasNoActivityCount,
      icon: AlertOctagon,
      tone: 'defaulters',
      to: '/arrivals/bacentas-no-activity',
    },
    {
      key: 'mobilising',
      label: 'Mobilising',
      value: campus?.bacentasMobilisingCount,
      icon: Megaphone,
      tone: 'warning',
      to: '/arrivals/bacentas-mobilising',
    },
    {
      key: 'on-the-way',
      label: 'On The Way',
      value: campus?.bacentasOnTheWayCount,
      icon: BusFront,
      tone: 'arrivals',
      to: '/arrivals/bacentas-on-the-way',
    },
    {
      key: 'didnt-bus',
      label: "Didn't Bus",
      value: campus?.bacentasBelow8Count,
      icon: AlertTriangle,
      tone: 'destructive',
      to: '/arrivals/bacentas-below-8',
    },
    {
      key: 'arrived',
      label: 'Have Arrived',
      value: campus?.bacentasHaveArrivedCount,
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
              <div className="min-w-0 flex-1 space-y-1.5">
                {loading && !campus ? (
                  <Skeleton className="h-9 w-72" />
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {campus?.name}{' '}
                    <span className="text-arrivals">Arrivals</span>
                  </h1>
                )}
                {(isSwellDay || timeGraph?.date) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {isSwellDay && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-warning/30 bg-warning/10 text-warning"
                      >
                        <Sparkles className="size-3" />
                        Swollen Weekend
                      </Badge>
                    )}
                    {timeGraph?.date && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {getHumanReadableDate(timeGraph.date, true)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Settings dropdown — visible to Campus admins and to
                  fishers (who only see the Code of the Day item). */}
              {showSettingsMenu && (
                <StickyPageHeaderActions>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11 shrink-0"
                        aria-label="Dashboard settings"
                      >
                        <Settings2 className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Settings</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {isCampusAdmin && (
                        <DropdownMenuItem
                          onSelect={() => setAdminDialogOpen(true)}
                        >
                          Change Arrivals Admin
                        </DropdownMenuItem>
                      )}
                      {isCampusAdmin && canSetSwell && (
                        <DropdownMenuItem
                          onSelect={() => setSwellDialogOpen(true)}
                        >
                          Set Today as Swell
                        </DropdownMenuItem>
                      )}
                      {canSetCodeOfDay && (
                        <DropdownMenuItem
                          onSelect={() => setCodeDialogOpen(true)}
                        >
                          Set Code of the Day
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </StickyPageHeaderActions>
              )}
            </div>
          </StickyPageHeader>
          <main className="mx-auto w-full max-w-6xl px-4 py-3 lg:px-6 lg:py-8">
            {(() => {
              const metaRow = (
                <ArrivalsDashboardMeta
                  admin={campus?.arrivalsAdmin}
                  loading={loading && !campus}
                  subChurch={{
                    label: campus?.streamCount === 1 ? 'Stream' : 'Streams',
                    count: campus?.streamCount,
                    to: '/arrivals/campus-by-stream',
                  }}
                />
              )

              const bacentaStatusBlock = (
                <section className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <SectionLabel>Bacenta Status</SectionLabel>
                    <DownloadArrivalsButton
                      level="Campus"
                      churchId={campusId}
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
                        loading={loading && !campus}
                      />
                    ))}
                  </div>
                </section>
              )

              const financialDataBlock = (
                <RoleView
                  roles={[
                    ...permitArrivals('Campus'),
                    ...permitLeaderAdmin('Campus'),
                  ]}
                >
                  <section className="space-y-2">
                    <SectionLabel>Financial Data</SectionLabel>
                    <Card className="overflow-hidden">
                      <div className="divide-y divide-border">
                        <LiveRow
                          label="Vehicles Paid"
                          value={campus?.vehiclesHaveBeenPaidCount}
                          icon={CheckCircle2}
                          tone="success"
                          loading={loading && !campus}
                        />
                        <LiveRow
                          label="Vehicles To Be Paid"
                          value={campus?.vehiclesToBePaidCount}
                          icon={BusFront}
                          tone="warning"
                          loading={loading && !campus}
                        />
                        <LiveRow
                          label="Amount Paid"
                          value={formatAmount(campus?.vehicleAmountHasBeenPaid)}
                          icon={Banknote}
                          tone="success"
                          loading={loading && !campus}
                        />
                        <LiveRow
                          label="Amount To Be Paid"
                          value={formatAmount(campus?.vehicleAmountToBePaid)}
                          icon={CreditCard}
                          tone="warning"
                          loading={loading && !campus}
                        />
                      </div>
                    </Card>
                  </section>
                </RoleView>
              )

              const liveArrivalsBlock = (
                <section className="space-y-2">
                  <SectionLabel>Live Arrivals</SectionLabel>
                  <Card className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <LiveDot />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Realtime
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        Updated {updatedLabel}
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      <LiveRow
                        label="Members On The Way"
                        value={campus?.bussingMembersOnTheWayCount}
                        icon={UsersRound}
                        tone="warning"
                        loading={loading && !campus}
                      />
                      <LiveRow
                        label="Members Arrived"
                        value={campus?.bussingMembersHaveArrivedCount}
                        icon={Users}
                        tone="success"
                        loading={loading && !campus}
                      />
                      <LiveRow
                        label="Buses On The Way"
                        value={campus?.bussesOnTheWayCount}
                        icon={BusFront}
                        tone="warning"
                        loading={loading && !campus}
                      />
                      <LiveRow
                        label="Buses Arrived"
                        value={campus?.bussesThatArrivedCount}
                        icon={BusFront}
                        tone="success"
                        loading={loading && !campus}
                      />
                    </div>
                  </Card>
                </section>
              )

              return (
                <>
                  <div className="lg:hidden">
                    {metaRow}
                    <ArrivalsHeader />
                    <Tabs defaultValue="bacentas">
                      <TabsList className="grid h-11 w-full grid-cols-3">
                        <TabsTrigger value="bacentas" className="text-xs">
                          Bacentas
                        </TabsTrigger>
                        <RoleView
                          roles={[
                            ...permitArrivals('Campus'),
                            ...permitLeaderAdmin('Campus'),
                          ]}
                        >
                          <TabsTrigger value="financial" className="text-xs">
                            Financial
                          </TabsTrigger>
                        </RoleView>
                        <TabsTrigger value="live" className="text-xs">
                          Live
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
                  <DialogTitle>Change Arrivals Admin</DialogTitle>
                  <DialogDescription>
                    Search for the member you want to assign as the new
                    arrivals admin for this campus.
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
                        placeholder="Search for a member"
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
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={!formik.isValid || formik.isSubmitting}
                          className="gap-2"
                        >
                          {formik.isSubmitting && (
                            <Loader2 className="size-4 animate-spin" />
                          )}
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </Form>
                  )}
                </Formik>
              </DialogContent>
            </Dialog>

            {/* ── Set Swell confirmation dialog ── */}
            <Dialog open={swellDialogOpen} onOpenChange={setSwellDialogOpen}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="size-5 text-warning" />
                    Set Today as Swell
                  </DialogTitle>
                  <DialogDescription>
                    This will mark today as a Swell / special weekend. This
                    action applies to the entire campus.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSwellDialogOpen(false)}
                    disabled={swellLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSetSwell}
                    disabled={swellLoading}
                    className="gap-2"
                  >
                    {swellLoading && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Set as Swell
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ── Set Code of the Day dialog ── */}
            <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Set Code of the Day</DialogTitle>
                  <DialogDescription>
                    Override today&apos;s Code of the Day. The new value
                    replaces whatever was set this morning until the next
                    daily run.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="code-of-the-day-input">Code</Label>
                  <Input
                    id="code-of-the-day-input"
                    autoFocus
                    value={codeValue}
                    onChange={(e) => setCodeValue(e.target.value)}
                    placeholder="e.g. Anointing"
                    disabled={codeLoading}
                  />
                </div>
                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCodeDialogOpen(false)}
                    disabled={codeLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSetCodeOfTheDay}
                    disabled={codeLoading || !codeValue.trim()}
                    className="gap-2"
                  >
                    {codeLoading && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Save Code
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CampusDashboard
