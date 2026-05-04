import { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowUpRight,
  Banknote,
  Bus,
  Check,
  ClipboardCheck,
  Palmtree,
  Plus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { getWeekNumber } from '@jaedag/admin-portal-types'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { UserJobs } from 'global-types'
import { AppShell } from 'components/shell/AppShell'
import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import { cn } from 'components/lib/utils'
import {
  GraphTypes,
  getMonthlyStatAverage,
  getServiceGraphData,
} from 'pages/services/graphs/graphs-utils'
import useComponentQuery from './useComponentQuery'
import TrendSpark from './TrendSpark'

interface QuickAction {
  label: string
  icon: LucideIcon
  to: string
}

const quickActions: QuickAction[] = [
  { label: 'Record service', icon: ClipboardCheck, to: '/services/church-list' },
  { label: 'Mark arrivals', icon: Bus, to: '/arrivals' },
  { label: 'Add member', icon: Users, to: '/directory/members/addmember' },
  { label: 'Banking', icon: Banknote, to: '/self-banking' },
]

const formatGhs = (n: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(n)

const UserDashboard = () => {
  const { currentUser, userJobs } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const { setUserChurch } = useSetUserChurch()
  const navigate = useNavigate()
  const { assessmentChurch } = useComponentQuery()

  let graphType: GraphTypes = 'serviceAggregate'
  if (assessmentChurch?.__typename === 'Bacenta') graphType = 'services'
  if (assessmentChurch?.__typename === 'Hub') graphType = 'rehearsals'
  if (assessmentChurch && 'aggregateBussingRecords' in assessmentChurch)
    graphType = 'bussingAggregate'
  if (assessmentChurch && 'aggregateRehearsalRecords' in assessmentChurch)
    graphType = 'rehearsalAggregate'

  const assessmentData = getServiceGraphData(assessmentChurch, graphType) || []
  const avgAttendance = getMonthlyStatAverage(assessmentData, 'attendance')
  const avgIncome = getMonthlyStatAverage(assessmentData, 'income')

  const totalChurches = useMemo(
    () =>
      userJobs?.reduce(
        (acc: number, role: UserJobs) =>
          acc + (typeof role.number === 'number' ? role.number : 0),
        0
      ) ?? 0,
    [userJobs]
  )
  const activeRoles = userJobs?.length ?? 0

  const goToRole = (role: UserJobs) => {
    if (!role.church?.length) return
    clickCard(currentUser)
    setUserChurch(role.church[0])
    clickCard(role.church[0])
    navigate(role.link)
  }

  const isLoading = !currentUser?.fullName
  const firstName = currentUser?.fullName?.trim().split(' ')[0] ?? 'there'
  const incomeTracked = !currentUser?.noIncomeTracking

  const hasAttendance = !!avgAttendance && avgAttendance !== 'NaN'
  const hasIncome = incomeTracked && !!avgIncome && avgIncome !== 'NaN'
  const fmtAttendance = hasAttendance
    ? Number(avgAttendance).toLocaleString('en-GH', { maximumFractionDigits: 0 })
    : '—'
  const fmtIncome = hasIncome ? formatGhs(Number(avgIncome)) : '—'

  return (
    <AppShell
      title=""
      subtitle=""
      userName={currentUser?.fullName}
    >
      {/* Page background uses the slate-gray --background token */}
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">

          {/* ── Header (on background, no card) ── */}
          <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {isLoading ? (
                  <Skeleton className="h-10 w-64" />
                ) : (
                  <>Hello, {firstName}.</>
                )}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeRoles
                  ? `Serving ${activeRoles} role${activeRoles === 1 ? '' : 's'} across ${totalChurches} church${totalChurches === 1 ? '' : 'es'}.`
                  : 'Welcome to your portal.'}
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 self-start rounded-full bg-foreground text-background hover:bg-foreground/90"
              onClick={() => navigate('/services/church-list')}
            >
              <Plus className="size-4" />
              Record service
            </Button>
          </header>

          {/* ── Metrics row — card surface ── */}
          <section className="mt-8 rounded-xl border border-border bg-card p-6">
            <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-3">
              <Metric
                label="Avg weekly attendance"
                value={fmtAttendance}
                loading={isLoading}
              />
              <Metric
                label={incomeTracked ? 'Avg weekly income' : 'Income'}
                value={incomeTracked ? fmtIncome : 'Not tracked'}
                loading={isLoading}
                dim={!incomeTracked}
              />
              <Metric
                label="Active focus"
                value={assessmentChurch?.name ?? '—'}
                sub={assessmentChurch?.__typename}
                loading={isLoading}
              />
            </div>
          </section>

          {/* ── Bacenta weekly tasks ── */}
          {assessmentChurch?.__typename === 'Bacenta' && (
            <BacentaWeeklyTasks
              vacationStatus={(assessmentChurch as unknown as { vacationStatus?: string })
                .vacationStatus}
              services={
                (assessmentChurch as unknown as { aggregateServiceRecords?: Array<{ week?: number | string }> })
                  .aggregateServiceRecords ?? []
              }
              bussing={
                (assessmentChurch as unknown as { aggregateBussingRecords?: Array<{ week?: number | string }> })
                  .aggregateBussingRecords ?? []
              }
              onRecordService={() => navigate('/services/church-list')}
              onRecordBussing={() => navigate('/arrivals')}
            />
          )}

          {/* ── Trend chart — card surface ── */}
          <section className="mt-6 rounded-xl border border-border bg-card p-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-base font-medium text-foreground">
                  Weekly trend
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {assessmentChurch?.name
                    ? `${assessmentChurch.name} · ${assessmentChurch.__typename}`
                    : 'Across your churches'}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-brand" />
                  Attendance
                </span>
                {incomeTracked && (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    Income
                  </span>
                )}
              </div>
            </div>
            <div className="mt-6">
              <TrendSpark data={assessmentData} incomeTracked={incomeTracked} />
            </div>
          </section>

          {/* ── Quick actions ── */}
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quick actions
            </h2>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate(action.to)}
                    className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Icon className="size-4 text-muted-foreground group-hover:text-accent-foreground" />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Roles list — card surface ── */}
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your roles
              </h2>
              <span className="text-xs text-muted-foreground">
                {activeRoles} active
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-4 py-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}

              {!isLoading &&
                userJobs?.map((role: UserJobs) => {
                  const churches = typeof role.number === 'number' ? role.number : 0
                  return (
                    <button
                      key={role.authRoles + role.name}
                      type="button"
                      onClick={() => goToRole(role)}
                      className="group flex w-full items-center gap-5 px-4 py-5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:bg-accent first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center text-2xl font-medium tabular-nums text-muted-foreground/60 group-hover:text-foreground">
                        {role.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {role.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {churches === 1 ? '1 church' : `${churches} churches`}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="size-4 shrink-0 text-border transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                      />
                    </button>
                  )
                })}

              {!isLoading && (!userJobs || userJobs.length === 0) && (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No roles assigned yet.
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </AppShell>
  )
}

interface BacentaWeeklyTasksProps {
  vacationStatus?: string
  services: Array<{ week?: number | string }>
  bussing: Array<{ week?: number | string }>
  onRecordService: () => void
  onRecordBussing: () => void
}

/** Weekly task panel for Bacenta leaders.
 *
 * Bacenta leaders have two weekly obligations: record one service and record
 * one bussing. If the Bacenta is on vacation, both are waived for the week.
 * This panel makes the weekly status obvious at a glance and gives one-tap
 * access to the relevant flow.
 */
const BacentaWeeklyTasks = ({
  vacationStatus,
  services,
  bussing,
  onRecordService,
  onRecordBussing,
}: BacentaWeeklyTasksProps) => {
  const currentWeek = getWeekNumber()
  const onVacation = vacationStatus === 'Vacation'
  const matchesCurrentWeek = (w?: number | string) =>
    w !== undefined && w !== null && Number(w) === currentWeek
  const serviceDone = services.some((s) => matchesCurrentWeek(s.week))
  const bussingDone = bussing.some((b) => matchesCurrentWeek(b.week))

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            This week
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {onVacation
              ? 'Bacenta is on vacation. No records required this week.'
              : `Week ${currentWeek} · Record one service and one bussing before Sunday.`}
          </p>
        </div>
        {onVacation && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning dark:bg-warning/20">
            <Palmtree className="size-3.5" />
            On vacation
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <WeeklyTaskCard
          icon={ClipboardCheck}
          label="Record service"
          done={serviceDone}
          waived={onVacation}
          actionLabel={serviceDone ? 'View service' : 'Record now'}
          onAction={onRecordService}
        />
        <WeeklyTaskCard
          icon={Bus}
          label="Record bussing"
          done={bussingDone}
          waived={onVacation}
          actionLabel={bussingDone ? 'View bussing' : 'Record now'}
          onAction={onRecordBussing}
        />
      </div>
    </section>
  )
}

interface WeeklyTaskCardProps {
  icon: LucideIcon
  label: string
  done: boolean
  waived: boolean
  actionLabel: string
  onAction: () => void
}

const WeeklyTaskCard = ({
  icon: Icon,
  label,
  done,
  waived,
  actionLabel,
  onAction,
}: WeeklyTaskCardProps) => {
  const status = waived ? 'Waived' : done ? 'Done' : 'Due'
  const statusClass = waived
    ? 'bg-muted text-muted-foreground'
    : done
      ? 'bg-success/15 text-success dark:bg-success/20'
      : 'bg-destructive/10 text-destructive dark:bg-destructive/20'

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4 transition-colors',
        waived
          ? 'border-border bg-muted/40'
          : done
            ? 'border-success/30 bg-success/5'
            : 'border-border bg-card'
      )}
    >
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg',
          done && !waived
            ? 'bg-success text-white'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {done && !waived ? <Check className="size-5" /> : <Icon className="size-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {label}
        </p>
        <span
          className={cn(
            'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            statusClass
          )}
        >
          {status}
        </span>
      </div>
      {!waived && (
        <Button
          size="sm"
          variant={done ? 'outline' : 'default'}
          onClick={onAction}
          className="shrink-0"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

interface MetricProps {
  label: string
  value: string
  sub?: string
  loading?: boolean
  dim?: boolean
}

const Metric = ({ label, value, sub, loading, dim }: MetricProps) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    {loading ? (
      <Skeleton className="mt-3 h-9 w-28" />
    ) : (
      <p
        className={cn(
          'mt-2 truncate text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl',
          dim ? 'text-muted-foreground/50' : 'text-foreground'
        )}
      >
        {value}
      </p>
    )}
    {sub && (
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    )}
  </div>
)

export default UserDashboard
