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
  Calendar,
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
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import { ChurchContext } from 'contexts/ChurchContext'

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

const POLL_SECONDS = Math.max(1, Math.round(SHORT_POLL_INTERVAL / 1000))

const GovernorshipDashboard = () => {
  const navigate = useNavigate()
  const { arrivalDate, setArrivalDate, governorshipId } =
    useContext(ChurchContext)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const effectiveDate = arrivalDate || today

  const { data, loading, error, refetch, startPolling, stopPolling } =
    useQuery(GOVERNORSHIP_ARRIVALS_DASHBOARD, {
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
      <ApolloWrapper data={data} loading={loading} error={error}>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            {/* ── Header ── */}
            <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <LiveDot />
                  <span>Live Dashboard</span>
                </div>
                {loading && !governorship ? (
                  <Skeleton className="h-9 w-72" />
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                    {governorship?.name}{' '}
                    <span className="text-arrivals">Arrivals</span>
                  </h1>
                )}
                <p className="text-sm text-muted-foreground">
                  Real-time bussing dashboard · refreshes every {POLL_SECONDS}s
                </p>
              </div>

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="arrivalDate"
                  className="flex h-11 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
                >
                  <Calendar
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="arrivalDate"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="bg-transparent text-sm text-foreground tabular-nums outline-none"
                    aria-label="Arrivals date"
                  />
                </label>

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
              </div>
            </header>

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
              {/* LEFT — admin + bacenta status */}
              <div className="space-y-6">
                {/* Arrivals admin */}
                <section className="space-y-3">
                  <SectionLabel>Arrivals Admin</SectionLabel>
                  <Card>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      {loading && !governorship ? (
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ) : governorship?.arrivalsAdmin ? (
                        <>
                          <MemberAvatarWithName
                            member={governorship.arrivalsAdmin}
                          />
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
                        loading={loading && !governorship}
                      />
                    ))}
                  </div>
                </section>
              </div>

              {/* RIGHT — live arrivals */}
              <aside className="space-y-3 lg:sticky lg:top-6">
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
              </aside>
            </div>

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
