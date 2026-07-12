import { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useQuery } from '@apollo/client'
import { ChevronRight, HandCoins, Settings as SettingsIcon } from 'lucide-react'
import { ChurchRoleScopePicker } from 'components/shell/ChurchRoleScopePicker'
import { Badge } from 'components/ui/badge'
import { Skeleton } from 'components/ui/skeleton'
import { Separator } from 'components/ui/separator'
import { cn } from 'components/lib/utils'
import { MemberContext } from 'contexts/MemberContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { UserJobs } from 'global-types'
import { resolveChurchFromUserJobs } from 'pages/dashboards/dashboard-utils'
import { STREAM_BANKING_DEFAULTERS_THIS_WEEK } from 'pages/services/banking/manual-banking/Treasury.gql'
import {
  fadeUp,
  formatChurchLevel,
  getRoleRelationLabel,
  highlightName,
  sectionStagger,
  useHourlyGreeting,
} from './dashboard-shared'

const RECEIVE_BANKING_PATH = '/manual-banking/receive-banking'

const StreamTellerDashboard = () => {
  const { currentUser, userJobs } = useContext(MemberContext)
  const { selectedScope, roleChurchOptions } = useChurchRoleScope()
  const navigate = useNavigate()

  // Resolve isManualBanking for the selected stream from userJobs — populated
  // at login from `isTellerForStream { isManualBanking }` so no extra query
  // is needed for the gate.
  const isStreamManualBanking = useMemo(
    () =>
      !!resolveChurchFromUserJobs(
        userJobs as UserJobs[] | undefined,
        selectedScope?.churchId
      )?.isManualBanking,
    [selectedScope?.churchId, userJobs]
  )

  const { data: pendingData, loading: pendingLoading } = useQuery(
    STREAM_BANKING_DEFAULTERS_THIS_WEEK,
    {
      variables: { id: selectedScope?.churchId },
      skip: !selectedScope?.churchId || !isStreamManualBanking,
      fetchPolicy: 'cache-and-network',
    }
  )

  // Tellers confirm BOTH Governorship-level AND Council-level pending
  // services — count both arrays so the CTA never undercounts.
  const stream = pendingData?.streams?.[0]
  const governorshipPending =
    stream?.governorshipBankingDefaultersThisWeek?.length ?? 0
  const councilPending =
    stream?.councilBankingDefaultersThisWeek?.length ?? 0
  const pendingCount = governorshipPending + councilPending

  const isLoading = !currentUser?.fullName
  const firstName = currentUser?.fullName?.trim().split(' ')[0] ?? 'there'
  const userKey = currentUser?.fullName ?? firstName
  const greeting = useHourlyGreeting(firstName, userKey)

  const churchName = selectedScope?.churchName
  const scopeRoleLabel = getRoleRelationLabel(
    selectedScope?.authRole,
    'Stream Teller'
  )

  const goToConfirmBanking = () => {
    if (!isStreamManualBanking) return
    navigate(RECEIVE_BANKING_PATH)
  }

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
                Select a stream to start confirming bankings.
              </p>
            )}
          </div>
          {roleChurchOptions.length > 0 && (
            <div className="w-full shrink-0 sm:w-64">
              <ChurchRoleScopePicker />
            </div>
          )}
        </motion.header>

        {/* ── Primary CTA / Empty state ── */}
        <motion.section variants={fadeUp} className="mt-6">
          {isStreamManualBanking ? (
            <button
              type="button"
              onClick={goToConfirmBanking}
              aria-label="Confirm bankings"
              className={cn(
                'group flex w-full items-center gap-4 rounded-2xl border border-banking/30 bg-banking/10 p-5 text-left transition-colors',
                'hover:bg-banking/15 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-banking/60'
              )}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-banking/20 text-banking">
                <HandCoins className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-foreground sm:text-lg">
                  Confirm bankings
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {pendingLoading
                    ? 'Checking what needs confirming this week…'
                    : pendingCount > 0
                    ? `${pendingCount} ${
                        pendingCount === 1 ? 'centre' : 'centres'
                      } awaiting your confirmation this week`
                    : 'No centres awaiting confirmation this week'}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-banking transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <div
              role="note"
              aria-label="Manual banking not active"
              className={cn(
                'flex w-full items-center gap-4 rounded-2xl border border-border bg-muted/30 p-5 text-left',
                'opacity-70'
              )}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <HandCoins className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-muted-foreground sm:text-lg">
                  Nothing to confirm
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  This stream isn&apos;t on manual banking, so there are no
                  offerings for you to receive.
                </p>
              </div>
            </div>
          )}
        </motion.section>

        {/* ── Two-column body: actions + post info ── */}
        <motion.div
          variants={sectionStagger}
          className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start"
        >
          <motion.div variants={fadeUp} className="min-w-0 space-y-4">
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick actions
                </h3>
              </div>
              <div className="divide-y divide-border">
                <DashboardActionRow
                  icon={<HandCoins className="size-4" />}
                  label="Services to confirm"
                  helperText={
                    isStreamManualBanking
                      ? 'By centre and governorship — confirm offerings handed in'
                      : 'Available once this stream is on manual banking'
                  }
                  accentClass="text-banking"
                  accentBg="bg-banking/12"
                  disabled={!isStreamManualBanking}
                  onClick={goToConfirmBanking}
                />
                <DashboardActionRow
                  icon={<SettingsIcon className="size-4" />}
                  label="Settings"
                  helperText="Profile, theme, sign out"
                  accentClass="text-muted-foreground"
                  accentBg="bg-muted"
                  onClick={() => navigate('/settings')}
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
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Banking method
                    </p>
                    <p
                      className={cn(
                        'mt-0.5 text-sm font-medium',
                        isStreamManualBanking
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {isStreamManualBanking ? 'Manual' : 'Not manual'}
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

interface DashboardActionRowProps {
  icon: React.ReactNode
  label: string
  helperText: string
  accentClass: string
  accentBg: string
  onClick: () => void
  disabled?: boolean
}

const DashboardActionRow = ({
  icon,
  label,
  helperText,
  accentClass,
  accentBg,
  onClick,
  disabled = false,
}: DashboardActionRowProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-disabled={disabled}
    className={cn(
      'group flex w-full items-center gap-3 px-4 py-4 text-left transition-colors min-h-11',
      disabled
        ? 'cursor-not-allowed opacity-50'
        : 'hover:bg-accent/60 active:scale-[0.997]'
    )}
  >
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl',
        accentBg,
        accentClass
      )}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium leading-tight text-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{helperText}</p>
    </div>
    <ChevronRight
      className={cn(
        'size-4 shrink-0 text-muted-foreground transition-transform',
        !disabled && 'group-hover:translate-x-0.5'
      )}
    />
  </button>
)

export default StreamTellerDashboard
