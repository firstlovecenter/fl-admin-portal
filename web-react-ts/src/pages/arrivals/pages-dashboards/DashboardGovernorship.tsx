import { useMutation, useQuery } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertOctagon,
  AlertTriangle,
  BusFront,
  CheckCircle2,
  Loader2,
  Megaphone,
  Settings2,
  Users,
  UsersRound,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import RoleView from 'auth/RoleView'
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
import { permitAdmin, permitArrivals } from 'permission-utils'

import { GOVERNORSHIP_ARRIVALS_DASHBOARD } from '../arrivalsQueries'
import { MAKE_GOVERNORSHIPARRIVALS_ADMIN } from '../arrivalsMutation'
import { beforeStreamArrivalsDeadline } from '../arrivals-utils'
import {
  LiveDot,
  LiveRow,
  SectionLabel,
  StatusTile,
  useUpdatedAt,
  useVisibilityAwarePolling,
  type StatusTone,
} from '../components/live-feed'

export type AdminFormOptions = {
  adminName: string
  adminSelect: string
}

type BacentaTile = {
  key: string
  label: string
  value?: number
  icon: React.ComponentType<{ className?: string }>
  tone: StatusTone
  to: string
}

const GovernorshipDashboard = () => {
  const navigate = useNavigate()
  const { arrivalDate, governorshipId } =
    useContext(ChurchContext)
  useArrivalsScopeSync('Governorship', governorshipId)
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
  } = useQuery(GOVERNORSHIP_ARRIVALS_DASHBOARD, {
    variables: {
      id: governorshipId,
      date: today,
      arrivalDate: effectiveDate,
    },
    fetchPolicy: 'cache-and-network',
  })

  useVisibilityAwarePolling({
    startPolling,
    stopPolling,
    refetch,
    interval: SHORT_POLL_INTERVAL,
  })

  const [MakeGovernorshipArrivalsAdmin] = useMutation(
    MAKE_GOVERNORSHIPARRIVALS_ADMIN
  )

  const governorship = data?.governorships?.[0]
  const updatedLabel = useUpdatedAt(data)

  const initialAdminValues: AdminFormOptions = useMemo(
    () => ({
      adminName: governorship?.arrivalsAdmin
        ? `${governorship?.arrivalsAdmin?.fullName}`
        : '',
      adminSelect: governorship?.arrivalsAdmin?.id ?? '',
    }),
    [governorship?.arrivalsAdmin]
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
    onSubmitProps.setSubmitting(true)
    try {
      const result = await MakeGovernorshipArrivalsAdmin({
        variables: {
          governorshipId,
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
    !!governorship && !beforeStreamArrivalsDeadline(governorship?.council?.stream)

  const bacentaTiles: BacentaTile[] = [
    {
      key: 'no-activity',
      label: 'No Activity',
      value: governorship?.bacentasNoActivityCount,
      icon: AlertOctagon,
      tone: 'defaulters',
      to: '/arrivals/bacentas-no-activity',
    },
    {
      key: 'mobilising',
      label: 'Mobilising',
      value: governorship?.bacentasMobilisingCount,
      icon: Megaphone,
      tone: 'warning',
      to: '/arrivals/bacentas-mobilising',
    },
    {
      key: 'on-the-way',
      label: 'On The Way',
      value: governorship?.bacentasOnTheWayCount,
      icon: BusFront,
      tone: 'arrivals',
      to: '/arrivals/bacentas-on-the-way',
    },
    {
      key: 'didnt-bus',
      label: "Didn't Bus",
      value: governorship?.bacentasBelow8Count,
      icon: AlertTriangle,
      tone: 'destructive',
      to: '/arrivals/bacentas-below-8',
    },
    {
      key: 'arrived',
      label: 'Have Arrived',
      value: governorship?.bacentasHaveArrivedCount,
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
                {loading && !governorship ? (
                  <Skeleton className="h-9 w-72" />
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {governorship?.name}{' '}
                    <span className="text-arrivals">Arrivals</span>
                  </h1>
                )}
              </div>

              {/* Action row */}
              <StickyPageHeaderActions className="flex-wrap">
                <RoleView
                  roles={[
                    ...permitAdmin('Governorship'),
                    ...permitArrivals('Council'),
                  ]}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11"
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </RoleView>
              </StickyPageHeaderActions>
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
                  admin={governorship?.arrivalsAdmin}
                  loading={loading && !governorship}
                />
              )

              const bacentaStatusBlock = (
                <section className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <SectionLabel>Bacenta Status</SectionLabel>
                    <DownloadArrivalsButton
                      level="Governorship"
                      churchId={governorshipId}
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
                        loading={loading && !governorship}
                      />
                    ))}
                  </div>
                </section>
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
                        value={governorship?.bussingMembersOnTheWayCount}
                        icon={UsersRound}
                        tone="warning"
                        loading={loading && !governorship}
                      />
                      <LiveRow
                        label="Members Arrived"
                        value={governorship?.bussingMembersHaveArrivedCount}
                        icon={Users}
                        tone="success"
                        loading={loading && !governorship}
                      />
                      <LiveRow
                        label="Buses Arrived"
                        value={governorship?.bussesThatArrivedCount}
                        icon={BusFront}
                        tone="success"
                        loading={loading && !governorship}
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
                      <TabsList className="grid h-11 w-full grid-cols-2">
                        <TabsTrigger value="bacentas" className="text-xs">
                          Bacentas
                        </TabsTrigger>
                        <TabsTrigger value="live" className="text-xs">
                          Live
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="bacentas" className="mt-3">
                        {bacentaStatusBlock}
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
                    arrivals admin for this governorship.
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

export default GovernorshipDashboard
