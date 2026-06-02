import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronRight, ListChecks } from 'lucide-react'
import { ChurchRoleScopePicker } from 'components/shell/ChurchRoleScopePicker'
import { Badge } from 'components/ui/badge'
import { Skeleton } from 'components/ui/skeleton'
import { Separator } from 'components/ui/separator'
import { cn } from 'components/lib/utils'
import { MemberContext } from 'contexts/MemberContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import {
  getMonthlyStatAverage,
  getServiceGraphData,
} from 'pages/services/graphs/graphs-utils'
import useComponentQuery from './useComponentQuery'
import TrendSpark from './TrendSpark'
import {
  fadeUp,
  filterRecentRecords,
  formatChurchLevel,
  getRoleRelationLabel,
  highlightName,
  sectionStagger,
  useHourlyGreeting,
} from './dashboard-shared'

const TREND_HISTORY_WEEKS = 24

const ArrivalsCounterDashboard = () => {
  const { currentUser } = useContext(MemberContext)
  const { selectedScope, roleChurchOptions } = useChurchRoleScope()
  const navigate = useNavigate()

  const { assessmentChurch } = useComponentQuery(
    selectedScope
      ? {
          servant: undefined,
          scope: {
            authRole: selectedScope.authRole,
            churchId: selectedScope.churchId,
          },
        }
      : undefined
  )

  const isLoading = !currentUser?.fullName
  const firstName = currentUser?.fullName?.trim().split(' ')[0] ?? 'there'
  const userKey = currentUser?.fullName ?? firstName
  const greeting = useHourlyGreeting(firstName, userKey)

  const hasBussingAggregateField =
    !!assessmentChurch && 'aggregateBussingRecords' in assessmentChurch
  const bussingData = hasBussingAggregateField
    ? getServiceGraphData(
        assessmentChurch,
        'bussingAggregate',
        TREND_HISTORY_WEEKS
      ) || []
    : []
  const recentBussingData = filterRecentRecords(bussingData)

  const avgBussingAttendance = getMonthlyStatAverage(
    recentBussingData,
    'attendance'
  )
  const hasBussingAttendance =
    !!avgBussingAttendance && avgBussingAttendance !== 'NaN'
  const fmtBussingAttendance = hasBussingAttendance
    ? Number(avgBussingAttendance).toLocaleString('en-GH', {
        maximumFractionDigits: 0,
      })
    : '—'

  // Bussing drilldown isn't supported above Bacenta level, and the counter
  // never sees non-bussing points — so bars are inert by design.
  const handleTrendBarClick = () => undefined

  const scopeRoleLabel = getRoleRelationLabel(
    selectedScope?.authRole,
    'Arrivals Counter'
  )
  const churchName = selectedScope?.churchName ?? assessmentChurch?.name

  return (
    <div className="min-h-full bg-background">
      <motion.div
        variants={sectionStagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-6xl px-4 pt-4 pb-10 sm:px-6 md:pt-8 lg:px-10 lg:pt-10 lg:pb-14"
      >
        {/* ── Header band ── */}
        <motion.header
          variants={fadeUp}
          className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {isLoading ? (
                <Skeleton className="h-10 w-56 max-w-full" />
              ) : (
                <>{highlightName(greeting, firstName)}</>
              )}
            </h1>
            {churchName ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  {churchName}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-xs font-normal text-muted-foreground"
                >
                  {formatChurchLevel(selectedScope?.churchType ?? 'Stream')}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-xs font-normal text-muted-foreground"
                >
                  {scopeRoleLabel}
                </Badge>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Select a stream to start counting arrivals.
              </p>
            )}
          </div>
          {roleChurchOptions.length > 0 && (
            <div className="w-full shrink-0 sm:w-64">
              <ChurchRoleScopePicker />
            </div>
          )}
        </motion.header>

        {/* ── Primary CTA: Start counting ── */}
        <motion.section variants={fadeUp} className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/arrivals/bacentas-to-count')}
            className={cn(
              'group flex w-full items-center gap-4 rounded-2xl border border-arrivals/30 bg-arrivals/10 p-5 text-left transition-colors',
              'hover:bg-arrivals/15 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arrivals/60'
            )}
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-arrivals/20 text-arrivals">
              <ListChecks className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-foreground sm:text-lg">
                Start counting
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Open the list of vehicles waiting to be counted at the centre.
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-arrivals transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.section>

        {/* ── Bussing average + chart ── */}
        <motion.div
          variants={sectionStagger}
          className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start"
        >
          <motion.div variants={fadeUp} className="min-w-0 space-y-6">
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-stretch">
                <div
                  className={cn(
                    'w-1 shrink-0 rounded-l-2xl',
                    !hasBussingAttendance && !isLoading && 'opacity-30'
                  )}
                  style={{ background: 'hsl(var(--brand))' }}
                />
                <div className="flex-1 px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Avg. weekly bussing attendance
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-3 h-12 w-32" />
                  ) : (
                    <p
                      className={cn(
                        'mt-1.5 font-semibold tracking-tight',
                        hasBussingAttendance
                          ? 'text-5xl tracking-tighter tabular-nums text-foreground'
                          : 'text-2xl text-muted-foreground/40'
                      )}
                    >
                      {hasBussingAttendance
                        ? fmtBussingAttendance
                        : 'No recent bussing'}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-base font-medium text-foreground">
                  Sunday bussing — weekly trend
                </h2>
                <p className="text-xs text-muted-foreground">
                  {churchName ? `${churchName} · Stream` : 'Stream-level totals'}
                </p>
              </div>
              <div className="mt-6">
                <TrendSpark
                  data={recentBussingData}
                  incomeTracked={false}
                  mode="bussing"
                  onBarClick={handleTrendBarClick}
                />
              </div>
            </section>
          </motion.div>

          {/* ── Sidebar info card ── */}
          {selectedScope && (
            <motion.aside
              variants={fadeUp}
              className="space-y-4 lg:sticky lg:top-6"
            >
              <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your post
                  </h3>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Stream</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      {selectedScope.churchName}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {scopeRoleLabel}
                    </p>
                  </div>
                </div>
              </section>
            </motion.aside>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default ArrivalsCounterDashboard
