import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bus,
  CalendarRange,
  Download,
  Network,
  Users,
} from 'lucide-react'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { cn } from 'components/lib/utils'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'
import { getSubChurchLevel, plural } from 'global-utils'
import type { ChurchLevel } from 'global-types'

const MEMBERSHIP_PATHS: Record<string, string> = {
  Bacenta: '/download-reports/bacenta/membership',
  Governorship: '/download-reports/governorship/membership',
  Council: '/download-reports/council/membership',
  Stream: '/download-reports/stream/membership',
  Campus: '/download-reports/campus/membership',
  Oversight: '/download-reports/oversight/membership',
}

const SUPPORTED_REPORT_LEVELS = new Set([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
])

const getMembershipDownloadPath = (churchType: string | undefined) =>
  MEMBERSHIP_PATHS[churchType ?? ''] ?? null

type ReportCardProps = {
  icon: ReactNode
  title: string
  description: string
  to: string | null
}

const ReportCard = ({ icon, title, description, to }: ReportCardProps) => {
  const navigate = useNavigate()
  const unavailable = to === null

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => {
        if (to) navigate(to)
      }}
      className={cn(
        'flex w-full items-start gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors',
        unavailable
          ? 'cursor-not-allowed opacity-50'
          : 'hover:bg-accent/40 active:scale-[0.99]'
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-banking/10 text-banking">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        {unavailable && (
          <p className="mt-1 text-xs text-muted-foreground/70">
            Not available for your current church scope
          </p>
        )}
      </div>
      {!unavailable && (
        <Download className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  )
}

const ReportsPage = () => {
  const { selectedScope } = useChurchRoleScope()
  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchPrefix = churchName ? `${churchName} ` : ''
  const reportsAvailable = SUPPORTED_REPORT_LEVELS.has(churchType)
  const membershipPath = getMembershipDownloadPath(churchType)
  // Bacenta is the leaf level; sub-church breakdowns don't apply at this scope.
  const hasSubChurches = reportsAvailable && churchType !== 'Bacenta'
  const subChurchType = hasSubChurches
    ? getSubChurchLevel(churchType as ChurchLevel)
    : ''
  const subChurchPlural = subChurchType ? plural(subChurchType) : ''

  const directoryPath =
    reportsAvailable && hasSubChurches ? '/reports/directory' : null
  const bussingPath = reportsAvailable ? '/reports/bussing' : null
  const bussingSubChurchesPath =
    reportsAvailable && hasSubChurches ? '/reports/bussing/sub-churches' : null
  // At Bacenta scope the Weekday card drills into per-service-record detail
  // (no-service reasons, treasurers, photo URLs, banking proof). Above
  // Bacenta the detail set explodes, so higher levels stay on the weekly
  // aggregate view.
  const weekdayPath = reportsAvailable
    ? churchType === 'Bacenta'
      ? '/reports/weekday/services'
      : '/reports/weekday'
    : null
  const weekdaySubChurchesPath =
    reportsAvailable && hasSubChurches ? '/reports/weekday/sub-churches' : null

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {churchPrefix}
            <span className="text-banking">Reports</span>
          </h1>
        </header>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-6">
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Directory
              </p>
              <div className="space-y-3">
                <RoleView
                  roles={permitLeaderAdmin(churchType as ChurchLevel)}
                >
                  <ReportCard
                    icon={<Users className="size-5" />}
                    title={`${churchPrefix}Membership List`}
                    description={`Every member in ${
                      churchName || 'this church'
                    } as a CSV — name, contact details, ministry, and group assignments.`}
                    to={membershipPath}
                  />
                </RoleView>
                {hasSubChurches && (
                  <ReportCard
                    icon={<Network className="size-5" />}
                    title={`${churchPrefix}${subChurchPlural} Directory`}
                    description={`One row per ${subChurchType} in ${
                      churchName || 'this church'
                    } — leader's name and phone number.`}
                    to={directoryPath}
                  />
                )}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bussing
              </p>
              <div className="space-y-3">
                <ReportCard
                  icon={<Bus className="size-5" />}
                  title={
                    churchType === 'Bacenta'
                      ? `${churchPrefix}Bussing Records`
                      : `${churchPrefix}Bussing`
                  }
                  description={
                    churchType === 'Bacenta'
                      ? `Every Sunday bussing record for ${
                          churchName || 'this Bacenta'
                        } — attendance, leader declaration, vehicles, and top-up.`
                      : `Per-week Sunday bussing totals for ${
                          churchName || 'this church'
                        } — attendance, leader declaration, vehicles, and top-up.`
                  }
                  to={bussingPath}
                />
                {hasSubChurches && (
                  <ReportCard
                    icon={<Network className="size-5" />}
                    title={`${churchPrefix}Bussing by ${subChurchType}`}
                    description={`Per-week Sunday bussing totals broken down by each ${subChurchType} in ${
                      churchName || 'this church'
                    }.`}
                    to={bussingSubChurchesPath}
                  />
                )}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weekday
              </p>
              <div className="space-y-3">
                <ReportCard
                  icon={<CalendarRange className="size-5" />}
                  title={
                    churchType === 'Bacenta'
                      ? `${churchPrefix}Weekday Service Records`
                      : `${churchPrefix}Weekday`
                  }
                  description={
                    churchType === 'Bacenta'
                      ? `Every weekday service record for ${
                          churchName || 'this Bacenta'
                        } — attendance, income, no-service reasons, treasurers, photo URLs, and banking proof.`
                      : `Per-week weekday service totals for ${
                          churchName || 'this church'
                        } — attendance, count, and income (cedis and USD).`
                  }
                  to={weekdayPath}
                />
                {hasSubChurches && (
                  <ReportCard
                    icon={<Network className="size-5" />}
                    title={`${churchPrefix}Weekday by ${subChurchType}`}
                    description={`Per-week weekday service totals broken down by each ${subChurchType} in ${
                      churchName || 'this church'
                    }.`}
                    to={weekdaySubChurchesPath}
                  />
                )}
              </div>
            </section>
          </div>

          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </main>
    </div>
  )
}

export default ReportsPage
