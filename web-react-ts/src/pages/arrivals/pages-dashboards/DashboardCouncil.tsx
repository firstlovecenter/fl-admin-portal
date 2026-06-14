import { useMutation, useQuery } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertOctagon,
  AlertTriangle,
  Banknote,
  BusFront,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Megaphone,
  Settings2,
  Users,
  UsersRound,
  Wallet,
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
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
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
import {
  permitAdmin,
  permitArrivals,
  permitArrivalsPayer,
  permitLeaderAdmin,
} from 'permission-utils'

import { COUNCIL_ARRIVALS_DASHBOARD } from '../arrivalsQueries'
import { MAKE_COUNCILARRIVALS_ADMIN } from '../arrivalsMutation'
import { beforeStreamArrivalsDeadline, formatAmount } from '../arrivals-utils'
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

const COUNCIL_ADMIN_ROLES = [
  ...permitAdmin('Council'),
  ...permitArrivals('Stream'),
]

const PAYMENT_VISIBLE_ROLES = [
  ...permitArrivalsPayer(),
  ...permitLeaderAdmin('Council'),
  ...permitArrivals('Campus'),
]

const CouncilDashboard = () => {
  const navigate = useNavigate()
  const { isAuthorised } = useAuth()
  const { arrivalDate, councilId } = useContext(ChurchContext)
  useArrivalsScopeSync('Council', councilId)
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
  } = useQuery(COUNCIL_ARRIVALS_DASHBOARD, {
    variables: { id: councilId, arrivalDate: effectiveDate },
    fetchPolicy: 'cache-and-network',
  })

  useVisibilityAwarePolling({
    startPolling,
    stopPolling,
    refetch,
    interval: SHORT_POLL_INTERVAL,
  })

  const [MakeCouncilArrivalsAdmin] = useMutation(MAKE_COUNCILARRIVALS_ADMIN)
  const council = data?.councils?.[0]
  const updatedLabel = useUpdatedAt(data)

  const initialAdminValues: AdminFormOptions = useMemo(
    () => ({
      adminName: council?.arrivalsAdmin?.fullName ?? '',
      adminSelect: council?.arrivalsAdmin?.id ?? '',
    }),
    [council?.arrivalsAdmin]
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
    if (!isAuthorised(COUNCIL_ADMIN_ROLES)) {
      toast.error('You are not authorised to change the arrivals admin')
      return
    }
    onSubmitProps.setSubmitting(true)
    try {
      const result = await MakeCouncilArrivalsAdmin({
        variables: {
          councilId,
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

  const deadlinePassed =
    !!council && !beforeStreamArrivalsDeadline(council?.stream)

  const bacentaTiles: BacentaTile[] = [
    {
      key: 'no-activity',
      label: 'No Activity',
      value: council?.bacentasNoActivityCount,
      icon: AlertOctagon,
      tone: 'defaulters',
      to: '/arrivals/bacentas-no-activity',
    },
    {
      key: 'mobilising',
      label: 'Mobilising',
      value: council?.bacentasMobilisingCount,
      icon: Megaphone,
      tone: 'warning',
      to: '/arrivals/bacentas-mobilising',
    },
    {
      key: 'on-the-way',
      label: 'On The Way',
      value: council?.bacentasOnTheWayCount,
      icon: BusFront,
      tone: 'arrivals',
      to: '/arrivals/bacentas-on-the-way',
    },
    {
      key: 'didnt-bus',
      label: "Didn't Bus",
      value: council?.bacentasBelow8Count,
      icon: AlertTriangle,
      tone: 'destructive',
      to: '/arrivals/bacentas-below-8',
    },
    {
      key: 'arrived',
      label: 'Have Arrived',
      value: council?.bacentasHaveArrivedCount,
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
                {loading && !council ? (
                  <Skeleton className="h-9 w-72" />
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {council?.name}{' '}
                    <span className="text-arrivals">Arrivals</span>
                  </h1>
                )}
              </div>

              {/* Settings dropdown */}
              <RoleView roles={COUNCIL_ADMIN_ROLES}>
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
                      <DropdownMenuItem
                        onSelect={() => setAdminDialogOpen(true)}
                      >
                        Change Arrivals Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => navigate('/council/arrivals-payers')}
                      >
                        Arrivals Payment Governorship
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
                  Arrival deadline is up. Thank you very much.
                </AlertDescription>
              </Alert>
            )}

            {(() => {
              const metaRow = (
                <ArrivalsDashboardMeta
                  admin={council?.arrivalsAdmin}
                  loading={loading && !council}
                  subChurch={{
                    label:
                      council?.governorshipCount === 1
                        ? 'Governorship'
                        : 'Governorships',
                    count: council?.governorshipCount,
                    to: '/arrivals/council-by-governorship',
                  }}
                />
              )

              const vehiclesToBePaidCount = council?.vehiclesToBePaidCount ?? 0

              const quickActionsBlock = (
                <RoleView roles={PAYMENT_VISIBLE_ROLES}>
                  <section className="space-y-2">
                    <SectionLabel>Quick Actions</SectionLabel>
                    <Card
                      className="cursor-pointer transition hover:border-banking/40 hover:bg-banking/5"
                      onClick={() =>
                        navigate('/arrivals/vehicles-to-be-paid')
                      }
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-banking/10 text-banking">
                          <Wallet className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              Pay Vehicles
                            </p>
                            {vehiclesToBePaidCount > 0 && (
                              <Badge
                                variant="outline"
                                className="border-banking/30 bg-banking/10 text-banking tabular-nums"
                              >
                                {vehiclesToBePaidCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {vehiclesToBePaidCount === 0
                              ? 'No vehicles awaiting payment'
                              : `${vehiclesToBePaidCount} ${
                                  vehiclesToBePaidCount === 1
                                    ? 'vehicle'
                                    : 'vehicles'
                                } awaiting payment`}
                          </p>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </section>
                </RoleView>
              )

              const bacentaStatusBlock = (
                <section className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <SectionLabel>
                      Bacenta Status
                    </SectionLabel>
                    <DownloadArrivalsButton
                      level="Council"
                      churchId={councilId}
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
                        loading={loading && !council}
                      />
                    ))}
                  </div>
                </section>
              )

              const financialDataBlock = (
                <RoleView roles={PAYMENT_VISIBLE_ROLES}>
                  <section className="space-y-2">
                    <SectionLabel>
                      Financial Data
                    </SectionLabel>
                    <Card className="overflow-hidden">
                      <div className="divide-y divide-border">
                        <LiveRow
                          label="Vehicles Paid"
                          value={council?.vehiclesHaveBeenPaidCount}
                          icon={CheckCircle2}
                          tone="success"
                          loading={loading && !council}
                        />
                        <LiveRow
                          label="Vehicles To Be Paid"
                          value={council?.vehiclesToBePaidCount}
                          icon={BusFront}
                          tone="warning"
                          loading={loading && !council}
                        />
                        <LiveRow
                          label="Amount Paid"
                          value={formatAmount(
                            council?.vehicleAmountHasBeenPaid
                          )}
                          icon={Banknote}
                          tone="success"
                          loading={loading && !council}
                        />
                        <LiveRow
                          label="Amount To Be Paid"
                          value={formatAmount(council?.vehicleAmountToBePaid)}
                          icon={CreditCard}
                          tone="warning"
                          loading={loading && !council}
                        />
                      </div>
                    </Card>
                  </section>
                </RoleView>
              )

              const liveArrivalsBlock = (
                <section className="space-y-2">
                  <SectionLabel>
                    Live Arrivals
                  </SectionLabel>
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
                        value={council?.bussingMembersOnTheWayCount}
                        icon={UsersRound}
                        tone="warning"
                        loading={loading && !council}
                      />
                      <LiveRow
                        label="Members Arrived"
                        value={council?.bussingMembersHaveArrivedCount}
                        icon={Users}
                        tone="success"
                        loading={loading && !council}
                      />
                      <LiveRow
                        label="Buses On The Way"
                        value={council?.bussesOnTheWayCount}
                        icon={BusFront}
                        tone="warning"
                        loading={loading && !council}
                      />
                      <LiveRow
                        label="Buses Arrived"
                        value={council?.bussesThatArrivedCount}
                        icon={BusFront}
                        tone="success"
                        loading={loading && !council}
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
                    <div className="mb-3">{quickActionsBlock}</div>
                    <Tabs defaultValue="bacentas">
                      <TabsList className="grid h-11 w-full grid-cols-3">
                        <TabsTrigger value="bacentas" className="text-xs">
                          Bacentas
                        </TabsTrigger>
                        <RoleView roles={PAYMENT_VISIBLE_ROLES}>
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

                  {/* Desktop: 2-col grid — meta + bacentas + financial on
                      the left; date toolbar + live on the right (sticky). */}
                  <div className="hidden gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
                    <div className="space-y-4">
                      {metaRow}
                      {quickActionsBlock}
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
                    arrivals admin for this council.
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
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CouncilDashboard
