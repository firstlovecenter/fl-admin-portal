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
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import DefaulterInfoCard from 'pages/services/defaulters/DefaulterInfoCard'
import { ChurchContext } from 'contexts/ChurchContext'
import ArrivalsHeader from '../ArrivalsHeader'

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

const POLL_SECONDS = Math.max(1, Math.round(SHORT_POLL_INTERVAL / 1000))

const STREAM_ADMIN_ROLES = [
  ...permitAdmin('Stream'),
  ...permitArrivals('Stream'),
]

const StreamDashboard = () => {
  const navigate = useNavigate()
  const { isAuthorised } = useAuth()
  const { arrivalDate, streamId } = useContext(ChurchContext)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const effectiveDate = arrivalDate || today

  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(
    STREAM_ARRIVALS_DASHBOARD,
    {
      variables: { id: streamId, arrivalDate: effectiveDate },
      fetchPolicy: 'cache-and-network',
    }
  )

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
    adminSelect: Yup.string().required(
      'Please select an Admin from the dropdown'
    ),
  })

  const onAdminSubmit = async (
    values: AdminFormOptions,
    onSubmitProps: FormikHelpers<AdminFormOptions>
  ) => {
    if (!isAuthorised(STREAM_ADMIN_ROLES)) {
      toast.error('You are not authorised to change the arrivals admin')
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

  const deadlinePassed = !!stream && !beforeStreamArrivalsDeadline(stream)

  const bacentaTiles: BacentaTile[] = [
    {
      key: 'no-activity',
      label: 'No Activity',
      value: stream?.bacentasNoActivityCount,
      icon: AlertOctagon,
      tone: 'defaulters',
      to: '/arrivals/bacentas-no-activity',
    },
    {
      key: 'mobilising',
      label: 'Mobilising',
      value: stream?.bacentasMobilisingCount,
      icon: Megaphone,
      tone: 'warning',
      to: '/arrivals/bacentas-mobilising',
    },
    {
      key: 'on-the-way',
      label: 'On The Way',
      value: stream?.bacentasOnTheWayCount,
      icon: BusFront,
      tone: 'arrivals',
      to: '/arrivals/bacentas-on-the-way',
    },
    {
      key: 'didnt-bus',
      label: "Didn't Bus",
      value: stream?.bacentasBelow8Count,
      icon: AlertTriangle,
      tone: 'destructive',
      to: '/arrivals/bacentas-below-8',
    },
    {
      key: 'arrived',
      label: 'Have Arrived',
      value: stream?.bacentasHaveArrivedCount,
      icon: CheckCircle2,
      tone: 'success',
      to: '/arrivals/bacentas-have-arrived',
    },
  ]

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error}>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            {/* ── Page header ── */}
            <div className="mb-6 space-y-4 lg:mb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <LiveDot />
                    <span>Live Dashboard</span>
                  </div>
                  {loading && !stream ? (
                    <Skeleton className="h-9 w-72" />
                  ) : (
                    <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                      {stream?.name}{' '}
                      <span className="text-arrivals">Arrivals</span>
                    </h1>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Real-time bussing dashboard · refreshes every {POLL_SECONDS}
                    s
                  </p>
                </div>

                {/* Settings dropdown */}
                <RoleView roles={STREAM_ADMIN_ROLES}>
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
                        onSelect={() =>
                          navigate('/stream/arrivals-counters')
                        }
                      >
                        Arrivals Counters
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => navigate('/stream/arrival-times')}
                      >
                        Arrival Times
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          navigate('/stream/arrival-excel-data')
                        }
                      >
                        Download Arrivals Payment Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </RoleView>
              </div>

            </div>

            {deadlinePassed && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  Arrival deadline is up. Thank you very much.
                </AlertDescription>
              </Alert>
            )}

            {/* ── 2-column grid ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
              {/* LEFT — admin + overview + bacenta status + financial */}
              <div className="space-y-6">
                {/* Arrivals admin */}
                <section className="space-y-3">
                  <SectionLabel>Arrivals Admin</SectionLabel>
                  <Card>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      {loading && !stream ? (
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ) : stream?.arrivalsAdmin ? (
                        <>
                          <MemberAvatarWithName member={stream.arrivalsAdmin} />
                          <Badge
                            variant="outline"
                            className="border-arrivals/30 bg-arrivals/10 text-arrivals"
                          >
                            Admin
                          </Badge>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No arrivals admin assigned
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </section>

                {/* Sub-church count */}
                <section className="space-y-3">
                  <SectionLabel>Overview</SectionLabel>
                  <DefaulterInfoCard
                    defaulter={{
                      title: 'Councils',
                      data: stream?.councilCount,
                      link: '/arrivals/stream-by-council',
                    }}
                  />
                </section>

                {/* Date selector + download (mobile placement) */}
                <div className="lg:hidden">
                  <ArrivalsHeader level="Stream" churchId={streamId} />
                </div>

                {/* Bacenta status grid */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Bacenta Status</SectionLabel>
                    <span className="text-xs text-muted-foreground">
                      Tap a tile to drill in
                    </span>
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
                        label="To Be Counted"
                        value={stream?.vehiclesNotCountedCount}
                        icon={ClipboardList}
                        tone="warning"
                        onClick={() => navigate('/arrivals/bacentas-to-count')}
                        loading={loading && !stream}
                      />
                    </RoleView>
                  </div>
                </section>

                {/* Financial data */}
                <RoleView
                  roles={[
                    ...permitArrivals('Campus'),
                    ...permitLeaderAdmin('Stream'),
                  ]}
                >
                  <section className="space-y-3">
                    <SectionLabel>Financial Data</SectionLabel>
                    <Card className="overflow-hidden">
                      <div className="divide-y divide-border">
                        <LiveRow
                          label="Vehicles Paid"
                          value={stream?.vehiclesHaveBeenPaidCount}
                          icon={CheckCircle2}
                          tone="success"
                          loading={loading && !stream}
                        />
                        <LiveRow
                          label="Vehicles To Be Paid"
                          value={stream?.vehiclesToBePaidCount}
                          icon={BusFront}
                          tone="warning"
                          loading={loading && !stream}
                        />
                        <LiveRow
                          label="Amount Paid"
                          value={formatAmount(stream?.vehicleAmountHasBeenPaid)}
                          icon={Banknote}
                          tone="success"
                          loading={loading && !stream}
                        />
                        <LiveRow
                          label="Amount To Be Paid"
                          value={formatAmount(stream?.vehicleAmountToBePaid)}
                          icon={CreditCard}
                          tone="warning"
                          loading={loading && !stream}
                        />
                      </div>
                    </Card>
                  </section>
                </RoleView>
              </div>

              {/* RIGHT — date picker + live arrivals */}
              <aside className="space-y-6 lg:sticky lg:top-6">
                <div className="hidden lg:block">
                  <ArrivalsHeader level="Stream" churchId={streamId} />
                </div>
                <div className="space-y-3">
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
                      value={stream?.bussingMembersOnTheWayCount}
                      icon={UsersRound}
                      tone="warning"
                      loading={loading && !stream}
                    />
                    <LiveRow
                      label="Members Arrived"
                      value={stream?.bussingMembersHaveArrivedCount}
                      icon={Users}
                      tone="success"
                      loading={loading && !stream}
                    />
                    <LiveRow
                      label="Buses On The Way"
                      value={stream?.bussesOnTheWayCount}
                      icon={BusFront}
                      tone="warning"
                      loading={loading && !stream}
                    />
                    <LiveRow
                      label="Buses Arrived"
                      value={stream?.bussesThatArrivedCount}
                      icon={BusFront}
                      tone="success"
                      loading={loading && !stream}
                    />
                  </div>
                </Card>
                </div>
              </aside>
            </div>

            {/* ── Change Arrivals Admin dialog ── */}
            <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Arrivals Admin</DialogTitle>
                  <DialogDescription>
                    Search for the member you want to assign as the new
                    arrivals admin for this stream.
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

export default StreamDashboard
