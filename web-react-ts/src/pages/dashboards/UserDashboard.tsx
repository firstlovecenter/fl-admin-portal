import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Bus,
  Check,
  ClipboardCheck,
  Palmtree,
  type LucideIcon,
} from 'lucide-react'
import {
  IconBusStop,
  IconClipboardCheck,
  IconUsersPlus,
  IconBuildingBank,
  type Icon as TablerIcon,
} from '@tabler/icons-react'
import { getWeekNumber, getISOWeekYear } from 'global-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchRoleScopePicker } from 'components/shell/ChurchRoleScopePicker'
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

const TREND_HISTORY_WEEKS = 24

// Add as many as you like — one is picked at random each session.
// Each function receives the user's first name as `name`. Ignore it if you don't need it.
const GREETINGS: Array<(name: string) => string> = [
  (name) => `Hey, ${name}!`,
  () => `Welcome back, man of God.`,
  (name) => `Grace and peace, ${name}.`,
  () => `The Lord's servant is in the building.`,
  (name) => `Good to see you, ${name}.`,
  () => `Arise and shine!`,
  (name) => `Walk good, ${name}.`,
  () => `Another day, another blessing.`,
  (name) => `Ready to lead, ${name}?`,
  () => `The harvest is plentiful and so is the Wi-Fi.`,
  (name) => `Ah, ${name} has entered the chat.`,
  () => `Church admin hours — let's get it.`,
  (name) => `God is good, ${name}. All the time.`,
  () => `You showed up. Half the battle is won.`,
]

interface QuickAction {
  label: string
  icon: TablerIcon
  to: string
  accent: string
}

const quickActions: QuickAction[] = [
  {
    label: 'Record service',
    icon: IconClipboardCheck,
    to: '/services/church-list',
    accent: 'hsl(var(--arrivals))',
  },
  {
    label: 'Fill bussing',
    icon: IconBusStop,
    to: '/arrivals',
    accent: 'hsl(var(--brand))',
  },
  {
    label: 'Add member',
    icon: IconUsersPlus,
    to: '/directory/members/addmember',
    accent: 'hsl(var(--members))',
  },
  {
    label: 'Bank service',
    icon: IconBuildingBank,
    to: '/self-banking',
    accent: 'hsl(var(--banking))',
  },
]

const formatCurrency = (amount: number, currencyCode?: unknown) => {
  const normalizedCurrency =
    typeof currencyCode === 'string' ? currencyCode.trim().toUpperCase() : ''
  const currency = normalizedCurrency || 'GHS'

  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 0,
    }).format(amount)
  }
}

const getNeoWeekdayToday = () => {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Accra',
    weekday: 'short',
  }).format(new Date())

  const accraWeekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  }

  if (accraWeekdayMap[weekday]) {
    return accraWeekdayMap[weekday]
  }

  const jsDay = new Date().getDay()
  return jsDay === 0 ? 7 : jsDay
}

const hasMeetingDayStarted = (dayNumber?: number) => {
  if (!dayNumber) return true
  return getNeoWeekdayToday() >= dayNumber
}

const formatChurchLevel = (churchType?: string) => {
  if (!churchType) return ''
  return churchType.replace(/([a-z])([A-Z])/g, '$1 $2')
}

const getRoleRelationLabel = (authRole?: string, fallback = '') => {
  if (!authRole) return fallback

  if (authRole.startsWith('leader')) return 'Leader'
  if (authRole.startsWith('admin')) return 'Admin'
  if (authRole.startsWith('arrivalsAdmin')) return 'Arrivals Admin'
  if (authRole.startsWith('arrivalsCounter')) return 'Arrivals Counter'
  if (authRole.startsWith('teller')) return 'Teller'

  return fallback
}

const sectionStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
}

const UserDashboard = () => {
  const { currentUser, userJobs } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const { selectedScope, roleChurchOptions } = useChurchRoleScope()
  const navigate = useNavigate()
  const [trendMode, setTrendMode] = useState<'weekday' | 'bussing'>('bussing')

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

  let graphType: GraphTypes = 'serviceAggregate'

  if (assessmentChurch?.__typename === 'Bacenta') {
    graphType = 'serviceAggregate'
  }

  if (assessmentChurch?.__typename === 'Hub') {
    graphType = 'rehearsals'
  }

  const hasRehearsalAggregateField =
    !!assessmentChurch && 'aggregateRehearsalRecords' in assessmentChurch

  const hasServiceAggregateField =
    !!assessmentChurch && 'aggregateServiceRecords' in assessmentChurch

  const hasBussingAggregateField =
    !!assessmentChurch && 'aggregateBussingRecords' in assessmentChurch

  if (hasRehearsalAggregateField) {
    graphType = 'rehearsalAggregate'
  } else if (hasBussingAggregateField && !hasServiceAggregateField) {
    graphType = 'bussingAggregate'
  }

  const isBacentaScope = assessmentChurch?.__typename === 'Bacenta'
  const weekdayGraphType: GraphTypes = isBacentaScope ? 'services' : graphType
  const bussingGraphType: GraphTypes = isBacentaScope
    ? 'bussing'
    : 'bussingAggregate'

  const weekdayData =
    getServiceGraphData(
      assessmentChurch,
      weekdayGraphType,
      TREND_HISTORY_WEEKS
    ) || []
  const bussingData = hasBussingAggregateField
    ? getServiceGraphData(
        assessmentChurch,
        bussingGraphType,
        TREND_HISTORY_WEEKS
      ) || []
    : []
  // Drop stale records: Bacenta.bussing SDL has no recency filter,
  // so dormant Bacentas would otherwise leak years-old data into the average.
  const currentYear = new Date().getFullYear()
  const recentBussingData = bussingData.filter(
    (record: { year?: number | null; date?: string | null }) => {
      if (typeof record?.year === 'number' && Number.isFinite(record.year)) {
        return record.year >= currentYear - 1
      }
      if (record?.date) {
        const recordYear = new Date(record.date).getFullYear()
        if (Number.isFinite(recordYear)) return recordYear >= currentYear - 1
      }
      return false
    }
  )
  const hasBussingDataField = hasBussingAggregateField
  const hasWeekdayDataField =
    hasServiceAggregateField ||
    hasRehearsalAggregateField ||
    graphType === 'rehearsals'
  const canToggleTrendMode = assessmentChurch?.__typename === 'Bacenta'
  const shouldForceBussingMode = hasBussingDataField && !hasWeekdayDataField
  const activeTrendMode = shouldForceBussingMode
    ? 'bussing'
    : canToggleTrendMode
    ? trendMode
    : 'weekday'
  const trendData =
    activeTrendMode === 'bussing' ? recentBussingData : weekdayData

  const avgBussingAttendance = getMonthlyStatAverage(
    recentBussingData,
    'attendance'
  )
  const avgAttendance = getMonthlyStatAverage(weekdayData, 'attendance')
  const avgIncome = getMonthlyStatAverage(weekdayData, 'income')

  const activeRoles = userJobs?.length ?? 0
  const selectedScopeCurrency =
    typeof selectedScope?.currency === 'string'
      ? selectedScope.currency.trim().toUpperCase()
      : ''
  const currentUserCurrency =
    typeof currentUser?.currency === 'string'
      ? currentUser.currency.trim().toUpperCase()
      : ''
  const dashboardCurrency = selectedScopeCurrency || currentUserCurrency
  const selectedScopeSummary = selectedScope
    ? `${selectedScope.churchName} · ${formatChurchLevel(
        selectedScope.churchType
      )} · ${getRoleRelationLabel(
        selectedScope.authRole,
        selectedScope.roleName
      )}`
    : null

  const isLoading = !currentUser?.fullName
  const firstName = currentUser?.fullName?.trim().split(' ')[0] ?? 'there'
  const [greetingIdx] = useState(() =>
    Math.floor(Math.random() * GREETINGS.length)
  )
  const greeting =
    (GREETINGS[greetingIdx] ?? GREETINGS[0])?.(firstName) ??
    `Hello, ${firstName}.`
  const selectedScopeIncomeTracked =
    typeof selectedScope?.noIncomeTracking === 'boolean'
      ? !selectedScope.noIncomeTracking
      : undefined
  const incomeTracked =
    selectedScopeIncomeTracked ?? !currentUser?.noIncomeTracking
  const trendIncomeTracked =
    activeTrendMode === 'weekday' ? incomeTracked : false

  const hasAttendance = !!avgAttendance && avgAttendance !== 'NaN'
  const hasBussingAttendance =
    !!avgBussingAttendance && avgBussingAttendance !== 'NaN'
  const hasIncome = incomeTracked && !!avgIncome && avgIncome !== 'NaN'
  const fmtBussingAttendance = hasBussingAttendance
    ? Number(avgBussingAttendance).toLocaleString('en-GH', {
        maximumFractionDigits: 0,
      })
    : '—'
  const fmtAttendance = hasAttendance
    ? Number(avgAttendance).toLocaleString('en-GH', {
        maximumFractionDigits: 0,
      })
    : '—'
  const fmtIncome = hasIncome
    ? formatCurrency(Number(avgIncome), dashboardCurrency)
    : '—'

  const currentWeek = getWeekNumber()
  const currentISOWeekYear = getISOWeekYear()
  const recentServices =
    assessmentChurch && 'services' in assessmentChurch
      ? (
          assessmentChurch as unknown as {
            services?: Array<{
              id?: string
              createdAt?: string
              week?: string | number
              noServiceReason?: string
              bankingProof?: boolean
              transactionStatus?: string
              serviceDate?: { date?: string } | null
            }>
          }
        ).services ?? []
      : []
  const thisWeekServices = recentServices.filter(
    (service) =>
      service.week !== undefined &&
      Number(service.week) === currentWeek &&
      !service.noServiceReason &&
      (!service.serviceDate?.date ||
        getISOWeekYear(service.serviceDate.date) === currentISOWeekYear)
  )
  const thisWeekServiceForNavigation = [...thisWeekServices].sort((a, b) => {
    const aDate = a.createdAt ? Date.parse(a.createdAt) : NaN
    const bDate = b.createdAt ? Date.parse(b.createdAt) : NaN
    if (Number.isFinite(aDate) && Number.isFinite(bDate)) return bDate - aDate
    return 0
  })[0]
  const hasFilledServiceForWeek = thisWeekServices.length > 0
  const hasUnbankedServiceForWeek = thisWeekServices.some(
    (service) =>
      !(service.bankingProof || service.transactionStatus === 'success')
  )
  const serviceAwaitingBanking =
    hasFilledServiceForWeek && hasUnbankedServiceForWeek
  const canViewCurrentWeekService = !!thisWeekServiceForNavigation?.id

  const handleViewCurrentWeekService = () => {
    if (!assessmentChurch || !thisWeekServiceForNavigation?.id) return
    clickCard(assessmentChurch)
    clickCard({
      id: thisWeekServiceForNavigation.id,
      __typename: 'ServiceRecord',
    })
    navigate('/bacenta/service-details')
  }

  const handleTrendBarClick = (point: {
    id?: string
    category?: string
    week: number | null
    year: number | null
  }) => {
    if (!point?.id || !selectedScope || !point.category) return

    const isBussingPoint = point.category.includes('bussing')
    const serviceDetailRoutes: Record<string, string> = {
      Fellowship: '/fellowship/service-details',
      Bacenta: '/bacenta/service-details',
      Governorship: '/governorship/service-details',
      Council: '/council/service-details',
      Stream: '/stream/service-details',
      Campus: '/campus/service-details',
      Hub: '/hub/service-details',
    }

    const targetRoute = isBussingPoint
      ? selectedScope.churchType === 'Bacenta'
        ? '/bacenta/bussing-details'
        : undefined
      : serviceDetailRoutes[selectedScope.churchType]

    if (!targetRoute) return

    clickCard({
      id: selectedScope.churchId,
      __typename: selectedScope.churchType,
      name: selectedScope.churchName,
    })
    clickCard({
      id: point.id,
      week: point.week,
      year: point.year,
      __typename: isBussingPoint ? 'BussingRecord' : 'ServiceRecord',
    })
    navigate(targetRoute)
  }

  return (
    <div className="min-h-full bg-background">
        <motion.div
          variants={sectionStagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-6xl px-4 pt-4 pb-10 sm:px-6 md:pt-8 lg:px-10 lg:pt-12 lg:pb-14"
        >
          {/* ── Header ── */}
          <motion.header
            variants={fadeUp}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {isLoading ? (
                  <Skeleton className="h-10 w-40 max-w-full" />
                ) : (
                  <>{greeting}</>
                )}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedScopeSummary
                  ? selectedScopeSummary
                  : activeRoles
                  ? 'Select a church in focus to view role context.'
                  : 'No roles assigned yet.'}
              </p>
            </div>
            {roleChurchOptions.length > 0 && (
              <div className="w-full shrink-0 sm:w-56">
                <ChurchRoleScopePicker />
              </div>
            )}
          </motion.header>

          {/* ── Two-column layout on lg+: main content (left) + sticky quick-actions (right) ── */}
          <motion.div
            variants={sectionStagger}
            className="mt-8 lg:flex lg:items-start lg:gap-6"
          >
            <motion.div variants={fadeUp} className="space-y-6 lg:flex-1 lg:min-w-0">
          {/* ── Metrics — asymmetric: primary stat + divider + two secondaries ── */}
          <section
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            {/* Primary metric — full width with left accent bar */}
            <div className="flex items-stretch gap-0">
              <div
                className="w-1 shrink-0 rounded-l-2xl"
                style={{ background: 'hsl(var(--brand))' }}
              />
              <div className="flex-1 px-6 py-5">
                <p className="text-xs font-medium text-muted-foreground tracking-wide">
                  Avg. weekly bussing attendance
                </p>
                {isLoading ? (
                  <Skeleton className="mt-3 h-10 w-32" />
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

            {/* Divider + two secondary metrics */}
            <div className="border-t border-border">
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="px-6 py-4">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide">
                    Avg. attendance
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-7 w-20" />
                  ) : (
                    <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                      {fmtAttendance}
                    </p>
                  )}
                </div>
                <div className="px-6 py-4">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide">
                    Avg. income
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-7 w-24" />
                  ) : (
                    <p
                      className={cn(
                        'mt-1 text-2xl font-semibold tracking-tight tabular-nums',
                        !incomeTracked
                          ? 'text-muted-foreground/40'
                          : 'text-foreground'
                      )}
                    >
                      {incomeTracked ? fmtIncome : 'Not tracked'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Bacenta weekly tasks ── */}
          {assessmentChurch?.__typename === 'Bacenta' && (
            <div>
              <BacentaWeeklyTasks
                vacationStatus={
                  (assessmentChurch as unknown as { vacationStatus?: string })
                    .vacationStatus
                }
                services={
                  (
                    assessmentChurch as unknown as {
                      services?: Array<{
                        week?: number | string
                        serviceDate?: { date?: string } | null
                      }>
                    }
                  ).services ?? []
                }
                bussing={
                  (
                    assessmentChurch as unknown as {
                      bussing?: Array<{
                        week?: number | string
                        serviceDate?: { date?: string } | null
                      }>
                    }
                  ).bussing ?? []
                }
                serviceMeetingDay={
                  (
                    assessmentChurch as unknown as {
                      meetingDay?: { day?: string; dayNumber?: number }
                    }
                  ).meetingDay
                }
                bussingMeetingDay={
                  (
                    assessmentChurch as unknown as {
                      governorship?: {
                        council?: {
                          stream?: {
                            meetingDay?: { day?: string; dayNumber?: number }
                          }
                        }
                      }
                    }
                  ).governorship?.council?.stream?.meetingDay
                }
                onRecordService={() => navigate('/services/church-list')}
                onViewService={handleViewCurrentWeekService}
                canViewService={canViewCurrentWeekService}
                onRecordBussing={() => navigate('/arrivals')}
                serviceAwaitingBanking={serviceAwaitingBanking}
              />
            </div>
          )}

          {/* ── Trend chart ── */}
          <section
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-medium text-foreground">
                  Weekly trend
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {assessmentChurch?.name
                    ? `${assessmentChurch.name} · ${assessmentChurch.__typename}`
                    : 'Across your churches'}
                </p>

                {canToggleTrendMode && (
                  <div
                    className="mt-3 inline-flex w-full max-w-sm rounded-lg border border-border p-1 sm:w-auto"
                    role="group"
                    aria-label="Trend data mode"
                  >
                    <button
                      type="button"
                      onClick={() => setTrendMode('weekday')}
                      aria-pressed={activeTrendMode === 'weekday'}
                      className={cn(
                        'flex-1 min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:min-h-11',
                        activeTrendMode === 'weekday'
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Weekday service
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendMode('bussing')}
                      aria-pressed={activeTrendMode === 'bussing'}
                      className={cn(
                        'flex-1 min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:min-h-11',
                        activeTrendMode === 'bussing'
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Sunday bussing
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:justify-end">
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        activeTrendMode === 'bussing'
                          ? 'hsl(var(--destructive))'
                          : 'hsl(var(--arrivals))',
                    }}
                  />
                  {activeTrendMode === 'bussing'
                    ? 'Bussing'
                    : 'Weekday attendance'}
                </span>
                {trendIncomeTracked && (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: 'hsl(var(--success))' }}
                    />
                    Income
                  </span>
                )}
              </div>
            </div>
            <div className="mt-6">
              <TrendSpark
                data={trendData}
                incomeTracked={trendIncomeTracked}
                mode={activeTrendMode}
                onBarClick={handleTrendBarClick}
              />
            </div>
          </section>
            </motion.div>

            {/* ── Quick actions: right pane on lg+, full-width below trend on smaller screens ── */}
            <motion.aside
              variants={fadeUp}
              className="mt-6 lg:mt-0 lg:w-60 lg:shrink-0 lg:sticky lg:top-6"
            >
              <h3 className="hidden lg:mb-3 lg:block text-xs font-medium text-muted-foreground tracking-wide">
                Quick actions
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-1">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => navigate(action.to)}
                      className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left [transition:background-color_0.15s_ease,transform_0.1s_ease] hover:bg-accent active:scale-[0.97] active:translate-y-px lg:flex-row lg:items-center"
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: `color-mix(in srgb, ${action.accent} 12%, transparent)`,
                          color: action.accent,
                        }}
                      >
                        <Icon className="size-4" stroke={2} />
                      </div>
                      <span className="text-sm font-medium text-foreground leading-tight">
                        {action.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.aside>
          </motion.div>
        </motion.div>
    </div>
  )
}

interface BacentaWeeklyTasksProps {
  vacationStatus?: string
  services: Array<{ week?: number | string; serviceDate?: { date?: string } | null }>
  bussing: Array<{ week?: number | string; serviceDate?: { date?: string } | null }>
  serviceMeetingDay?: { day?: string; dayNumber?: number }
  bussingMeetingDay?: { day?: string; dayNumber?: number }
  onRecordService: () => void
  onViewService?: () => void
  canViewService?: boolean
  onRecordBussing: () => void
  serviceAwaitingBanking?: boolean
}

const BacentaWeeklyTasks = ({
  vacationStatus,
  services,
  bussing,
  serviceMeetingDay,
  bussingMeetingDay,
  onRecordService,
  onViewService,
  canViewService = false,
  onRecordBussing,
  serviceAwaitingBanking = false,
}: BacentaWeeklyTasksProps) => {
  const currentWeek = getWeekNumber()
  const currentISOWeekYear = getISOWeekYear()
  const onVacation = vacationStatus === 'Vacation'
  const matchesCurrentWeek = (
    w?: number | string,
    date?: string | null
  ) => {
    if (w === undefined || w === null || Number(w) !== currentWeek) return false
    if (date) return getISOWeekYear(date) === currentISOWeekYear
    return true
  }
  const serviceDone = services.some((s) =>
    matchesCurrentWeek(s.week, s.serviceDate?.date)
  )
  const bussingDone = bussing.some((b) =>
    matchesCurrentWeek(b.week, b.serviceDate?.date)
  )
  const serviceDueNow = hasMeetingDayStarted(serviceMeetingDay?.dayNumber)
  const bussingDueNow = hasMeetingDayStarted(bussingMeetingDay?.dayNumber)

  const serviceUpcoming = !onVacation && !serviceDone && !serviceDueNow
  const bussingUpcoming = !onVacation && !bussingDone && !bussingDueNow
  const serviceAction = serviceDone
    ? canViewService
      ? onViewService || onRecordService
      : onRecordService
    : onRecordService
  const serviceActionDisabled = serviceDone && !canViewService

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Week {currentWeek}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {onVacation
              ? 'Bacenta is on vacation. No records required.'
              : `Service on ${
                  serviceMeetingDay?.day || 'Bacenta meeting day'
                }, bussing on ${
                  bussingMeetingDay?.day || 'Stream meeting day'
                }.`}
          </p>
        </div>
        {onVacation && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning dark:bg-warning/20">
            <Palmtree className="size-3.5" />
            On vacation
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <WeeklyTaskCard
          icon={ClipboardCheck}
          label="Record service"
          done={serviceDone}
          awaitingBanking={serviceAwaitingBanking}
          upcoming={serviceUpcoming}
          waived={onVacation}
          actionLabel={
            serviceDone
              ? canViewService
                ? 'View service'
                : 'Recorded'
              : 'Record now'
          }
          onAction={serviceAction}
          actionDisabled={serviceActionDisabled}
        />
        <WeeklyTaskCard
          icon={Bus}
          label="Record bussing"
          done={bussingDone}
          upcoming={bussingUpcoming}
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
  awaitingBanking?: boolean
  upcoming: boolean
  waived: boolean
  actionLabel: string
  onAction: () => void
  actionDisabled?: boolean
}

const WeeklyTaskCard = ({
  icon: Icon,
  label,
  done,
  awaitingBanking = false,
  upcoming,
  waived,
  actionLabel,
  onAction,
  actionDisabled = false,
}: WeeklyTaskCardProps) => {
  const status = waived
    ? 'Waived'
    : awaitingBanking
    ? 'Bank pending'
    : done
    ? 'Done'
    : upcoming
    ? 'Upcoming'
    : 'Due'
  const statusClass = waived
    ? 'bg-muted text-muted-foreground'
    : awaitingBanking
    ? 'bg-warning/22 text-foreground ring-1 ring-warning/45'
    : done
    ? 'bg-success/15 text-success dark:bg-success/20'
    : upcoming
    ? 'bg-muted text-muted-foreground'
    : 'bg-destructive/10 text-destructive dark:bg-destructive/20'

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border p-4 transition-colors',
        waived
          ? 'border-border bg-muted/40'
          : awaitingBanking
          ? 'border-warning/45 bg-warning/12'
          : done
          ? 'border-success/30 bg-success/5'
          : upcoming
          ? 'border-border bg-muted/30'
          : 'border-border bg-card'
      )}
    >
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          awaitingBanking
            ? 'border border-warning/45 bg-warning/22 text-foreground'
            : done && !waived
            ? 'bg-success text-white'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {done && !waived && !awaitingBanking ? (
          <Check className="size-5" />
        ) : (
          <Icon className="size-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
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
          disabled={upcoming || actionDisabled}
          variant={done ? 'outline' : 'default'}
          onClick={onAction}
          className={cn(
            'shrink-0',
            done
              ? 'border-border bg-background text-foreground hover:bg-accent'
              : 'bg-brand text-brand-foreground hover:bg-brand/90'
          )}
        >
          {upcoming ? 'Not due yet' : actionLabel}
        </Button>
      )}
    </div>
  )
}

export default UserDashboard
