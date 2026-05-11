import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertOctagon,
  Bus,
  BusFront,
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
import { getMembershipDownloadPath } from './membership-paths'

type TocSection = { id: string; label: string }

const ReportsTableOfContents = ({
  sections,
  className,
}: {
  sections: TocSection[]
  className?: string
}) => {
  const [activeId, setActiveId] = useState<string | null>(
    sections[0]?.id ?? null
  )

  useEffect(() => {
    if (sections.length === 0) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top
          )
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -65% 0px', threshold: 0 }
    )
    sections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  const handleClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  if (sections.length === 0) return null

  return (
    <nav
      aria-label="Report sections"
      className={cn(
        'lg:sticky lg:top-6 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-4',
        className
      )}
    >
      <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
        On this page
      </p>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:p-0">
        {sections.map((section) => {
          const isActive = activeId === section.id
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                onClick={(e) => handleClick(e, section.id)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'block min-h-11 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
                  'lg:min-h-0 lg:rounded-md lg:border-transparent lg:px-3 lg:py-2',
                  isActive
                    ? 'border-banking bg-banking/10 text-banking'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground lg:bg-transparent'
                )}
              >
                {section.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const SUPPORTED_REPORT_LEVELS = new Set([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
])

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
  // Defaulters export is gated to Governorship+ on the route. The card stays
  // visible for those scopes; lower scopes (Bacenta) hide it.
  const defaultersAvailable =
    reportsAvailable &&
    ['Governorship', 'Council', 'Stream', 'Campus'].includes(churchType)
  const defaultersPath = defaultersAvailable ? '/reports/defaulters' : null
  // By-sub-church breakdown only matters when there *is* a sub-church layer
  // between the scope and the Bacenta detail — so Council+ (skip Governorship
  // where the sub-church IS the Bacenta and the main workbook covers it).
  const defaultersSubChurchesAvailable =
    defaultersAvailable && hasSubChurches
  const defaultersSubChurchesPath = defaultersSubChurchesAvailable
    ? '/reports/defaulters/sub-churches'
    : null
  // Arrivals export shares the same level gate as defaulters — Governorship+.
  const arrivalsAvailable = defaultersAvailable
  const arrivalsPath = arrivalsAvailable ? '/reports/arrivals' : null
  const arrivalsSubChurchesAvailable = defaultersSubChurchesAvailable
  const arrivalsSubChurchesPath = arrivalsSubChurchesAvailable
    ? '/reports/arrivals/sub-churches'
    : null
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

  const tocSections: TocSection[] = [
    { id: 'directory', label: 'Directory' },
    { id: 'bussing', label: 'Bussing' },
    ...(defaultersAvailable
      ? [{ id: 'defaulters', label: 'Defaulters' }]
      : []),
    ...(arrivalsAvailable ? [{ id: 'arrivals', label: 'Arrivals' }] : []),
    { id: 'weekday', label: 'Weekday' },
  ]

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {churchPrefix}
            <span className="text-banking">Reports</span>
          </h1>
        </header>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start lg:gap-8">
          <ReportsTableOfContents
            sections={tocSections}
            className="lg:order-2"
          />
          <div className="space-y-6 lg:order-1">
            <section id="directory" className="space-y-3 scroll-mt-6">
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

            <section id="bussing" className="space-y-3 scroll-mt-6">
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

            {defaultersAvailable && (
              <section id="defaulters" className="space-y-3 scroll-mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Defaulters
                </p>
                <div className="space-y-3">
                  <ReportCard
                    icon={<AlertOctagon className="size-5" />}
                    title={`${churchPrefix}Defaulters Report`}
                    description={`Comprehensive defaulters list for any week — banking status, form submission, attendance, and a per-${
                      subChurchType || 'sub-church'
                    } summary at Council and above.`}
                    to={defaultersPath}
                  />
                  {defaultersSubChurchesAvailable && (
                    <ReportCard
                      icon={<Network className="size-5" />}
                      title={`${churchPrefix}Defaulters by ${subChurchType}`}
                      description={`One row per ${subChurchType} in ${
                        churchName || 'this church'
                      } — services filed, form defaulters, banked, banking defaulters, and cancelled.`}
                      to={defaultersSubChurchesPath}
                    />
                  )}
                </div>
              </section>
            )}

            {arrivalsAvailable && (
              <section id="arrivals" className="space-y-3 scroll-mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Arrivals
                </p>
                <div className="space-y-3">
                  <ReportCard
                    icon={<BusFront className="size-5" />}
                    title={`${churchPrefix}Arrivals Report`}
                    description={`Per-Bacenta and per-vehicle bussing snapshot for any Sunday — attendance, leader declaration, vehicle counts, top-ups, and a per-${
                      subChurchType || 'sub-church'
                    } summary at Council and above.`}
                    to={arrivalsPath}
                  />
                  {arrivalsSubChurchesAvailable && (
                    <ReportCard
                      icon={<Network className="size-5" />}
                      title={`${churchPrefix}Arrivals by ${subChurchType}`}
                      description={`One row per ${subChurchType} in ${
                        churchName || 'this church'
                      } — bacentas bussed, attendance, vehicles, cost, and top-up.`}
                      to={arrivalsSubChurchesPath}
                    />
                  )}
                </div>
              </section>
            )}

            <section id="weekday" className="space-y-3 scroll-mt-6">
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
        </div>
      </main>
    </div>
  )
}

export default ReportsPage
