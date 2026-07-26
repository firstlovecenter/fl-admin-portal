import {
  useEffect,
  useState,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertOctagon,
  Bus,
  BusFront,
  CalendarRange,
  Download,
  Loader2,
  Network,
  Users,
} from 'lucide-react'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { cn } from 'components/lib/utils'
import RoleView from 'auth/RoleView'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { permitLeaderAdmin } from 'permission-utils'
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
  const { t } = useTranslation()
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
      aria-label={t('reports.home.tocAriaLabel')}
      className={cn(
        'lg:sticky lg:top-6 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-4',
        className
      )}
    >
      <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
        {t('reports.home.onThisPage')}
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
  pending: boolean
  onActivate: (to: string) => void
}

const ReportCard = ({
  icon,
  title,
  description,
  to,
  pending,
  onActivate,
}: ReportCardProps) => {
  const { t } = useTranslation()
  const unavailable = to === null
  const isLoading = pending && !unavailable

  return (
    <button
      type="button"
      disabled={unavailable || isLoading}
      aria-busy={isLoading || undefined}
      onClick={() => {
        if (to) onActivate(to)
      }}
      className={cn(
        'flex w-full items-start gap-4 rounded-xl border border-border bg-card p-5 text-left transition-[transform,box-shadow,background-color] duration-200',
        unavailable && 'cursor-not-allowed opacity-50',
        isLoading && 'cursor-progress',
        !unavailable &&
          !isLoading &&
          'hover:bg-accent/40 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md active:scale-[0.99]'
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-banking/10 text-banking">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {isLoading ? t('reports.home.opening') : description}
        </p>
        {unavailable && (
          <p className="mt-1 text-xs text-muted-foreground/70">
            {t('reports.home.unavailable')}
          </p>
        )}
      </div>
      {!unavailable &&
        (isLoading ? (
          <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-banking" />
        ) : (
          <Download className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        ))}
    </button>
  )
}

const ReportsPage = () => {
  const { t } = useTranslation()
  const { selectedScope } = useChurchRoleScope()
  const navigate = useNavigate()
  // `pendingTarget` gives the just-clicked card its own spinner so the
  // user gets immediate feedback while the lazy chunk + Suspense
  // fallback for the destination page resolve. `useTransition` keeps
  // ReportsPage mounted across the navigation so we have somewhere to
  // render that pending state — without it React would unmount us as
  // soon as `navigate()` runs and the user would just see a blank
  // screen until LoadingScreen takes over.
  const [isPending, startTransition] = useTransition()
  const [pendingTarget, setPendingTarget] = useState<string | null>(null)
  const handleCardActivate = (to: string) => {
    setPendingTarget(to)
    startTransition(() => navigate(to))
  }
  // Tiny wrapper so each card site doesn't have to thread pending/onActivate.
  const Card = (props: Omit<ReportCardProps, 'pending' | 'onActivate'>) => (
    <ReportCard
      {...props}
      pending={
        isPending && pendingTarget !== null && pendingTarget === props.to
      }
      onActivate={handleCardActivate}
    />
  )
  const churchType = selectedScope?.churchType ?? ''
  const churchName = selectedScope?.churchName ?? ''
  const churchPrefix = churchName ? `${churchName} ` : ''
  const churchFallback = churchName || t('reports.home.thisChurch')
  const bacentaFallback = churchName || t('reports.home.thisBacenta')
  const reportsAvailable = SUPPORTED_REPORT_LEVELS.has(churchType)
  const membershipPath = getMembershipDownloadPath(churchType)
  // Bacenta is the leaf level; sub-church breakdowns don't apply at this scope.
  const hasSubChurches = reportsAvailable && churchType !== 'Bacenta'

  // The metric "by Sub-Church" reports (Bussing/Weekday/Defaulters/Arrivals)
  // pick a target row level from the aggregate-backed set {Campus, Stream,
  // Council, Governorship}. Governorship scope's only descendant is Bacenta,
  // which is excluded by policy — so Governorship has no valid metric
  // sub-church target and we hide those cards there. (Directory sub-church
  // card is unaffected and still appears.)
  const hasMetricSubChurches = hasSubChurches && churchType !== 'Governorship'

  const directoryPath =
    reportsAvailable && hasSubChurches ? '/reports/directory' : null
  // Defaulters export is gated to Governorship+ on the route. The card stays
  // visible for those scopes; lower scopes (Bacenta) hide it.
  const defaultersAvailable =
    reportsAvailable &&
    ['Governorship', 'Council', 'Stream', 'Campus'].includes(churchType)
  const defaultersPath = defaultersAvailable ? '/reports/defaulters' : null
  // By-sub-church breakdown picks an aggregate-backed target — Bacenta is
  // out, so Governorship scope (whose only descendant is Bacenta) has no
  // valid target and the card is hidden.
  const defaultersSubChurchesAvailable =
    defaultersAvailable && hasMetricSubChurches
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
  const bussingSubChurchesPath = hasMetricSubChurches
    ? '/reports/bussing/sub-churches'
    : null
  // At Bacenta scope the Weekday card drills into per-service-record detail
  // (no-service reasons, treasurers, photo URLs, banking proof). Above
  // Bacenta the detail set explodes, so higher levels stay on the weekly
  // aggregate view.
  const weekdayPath = reportsAvailable
    ? churchType === 'Bacenta'
      ? '/reports/weekday/services'
      : '/reports/weekday'
    : null
  const weekdaySubChurchesPath = hasMetricSubChurches
    ? '/reports/weekday/sub-churches'
    : null

  const tocSections: TocSection[] = [
    { id: 'directory', label: t('reports.home.sections.directory') },
    { id: 'bussing', label: t('reports.home.sections.bussing') },
    ...(defaultersAvailable
      ? [{ id: 'defaulters', label: t('reports.home.sections.defaulters') }]
      : []),
    ...(arrivalsAvailable
      ? [{ id: 'arrivals', label: t('reports.home.sections.arrivals') }]
      : []),
    { id: 'weekday', label: t('reports.home.sections.weekday') },
  ]

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {churchPrefix}
          <span className="text-banking">{t('reports.home.title')}</span>
        </h1>
      </StickyPageHeader>
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start lg:gap-8">
          <ReportsTableOfContents
            sections={tocSections}
            className="lg:order-2"
          />
          <div className="space-y-6 lg:order-1">
            <section id="directory" className="space-y-3 scroll-mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('reports.home.sections.directory')}
              </p>
              <div className="space-y-3">
                <RoleView roles={permitLeaderAdmin(churchType as ChurchLevel)}>
                  <Card
                    icon={<Users className="size-5" />}
                    title={`${churchPrefix}${t(
                      'reports.home.cards.membershipList.title'
                    )}`}
                    description={t(
                      'reports.home.cards.membershipList.description',
                      { church: churchFallback }
                    )}
                    to={membershipPath}
                  />
                </RoleView>
                {hasSubChurches && (
                  <RoleView
                    roles={permitLeaderAdmin(churchType as ChurchLevel)}
                  >
                    <Card
                      icon={<Network className="size-5" />}
                      title={`${churchPrefix}${t(
                        'reports.home.cards.subChurchDirectory.title'
                      )}`}
                      description={t(
                        'reports.home.cards.subChurchDirectory.description',
                        { church: churchFallback }
                      )}
                      to={directoryPath}
                    />
                  </RoleView>
                )}
              </div>
            </section>

            <section id="bussing" className="space-y-3 scroll-mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('reports.home.sections.bussing')}
              </p>
              <div className="space-y-3">
                <Card
                  icon={<Bus className="size-5" />}
                  title={
                    churchType === 'Bacenta'
                      ? `${churchPrefix}${t(
                          'reports.home.cards.bussingRecords.title'
                        )}`
                      : `${churchPrefix}${t(
                          'reports.home.cards.bussing.title'
                        )}`
                  }
                  description={
                    churchType === 'Bacenta'
                      ? t('reports.home.cards.bussingRecords.description', {
                          church: bacentaFallback,
                        })
                      : t('reports.home.cards.bussing.description', {
                          church: churchFallback,
                        })
                  }
                  to={bussingPath}
                />
                {hasMetricSubChurches && (
                  <Card
                    icon={<Network className="size-5" />}
                    title={`${churchPrefix}${t(
                      'reports.home.cards.bussingBySubChurch.title'
                    )}`}
                    description={t(
                      'reports.home.cards.bussingBySubChurch.description',
                      { church: churchFallback }
                    )}
                    to={bussingSubChurchesPath}
                  />
                )}
              </div>
            </section>

            {defaultersAvailable && (
              <RoleView roles={permitLeaderAdmin(churchType as ChurchLevel)}>
                <section id="defaulters" className="space-y-3 scroll-mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('reports.home.sections.defaulters')}
                  </p>
                  <div className="space-y-3">
                    <Card
                      icon={<AlertOctagon className="size-5" />}
                      title={`${churchPrefix}${t(
                        'reports.home.cards.defaultersReport.title'
                      )}`}
                      description={t(
                        'reports.home.cards.defaultersReport.description'
                      )}
                      to={defaultersPath}
                    />
                    {defaultersSubChurchesAvailable && (
                      <Card
                        icon={<Network className="size-5" />}
                        title={`${churchPrefix}${t(
                          'reports.home.cards.defaultersBySubChurch.title'
                        )}`}
                        description={t(
                          'reports.home.cards.defaultersBySubChurch.description',
                          { church: churchFallback }
                        )}
                        to={defaultersSubChurchesPath}
                      />
                    )}
                  </div>
                </section>
              </RoleView>
            )}

            {arrivalsAvailable && (
              <section id="arrivals" className="space-y-3 scroll-mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('reports.home.sections.arrivals')}
                </p>
                <div className="space-y-3">
                  <Card
                    icon={<BusFront className="size-5" />}
                    title={`${churchPrefix}${t(
                      'reports.home.cards.arrivalsReport.title'
                    )}`}
                    description={t(
                      'reports.home.cards.arrivalsReport.description'
                    )}
                    to={arrivalsPath}
                  />
                  {arrivalsSubChurchesAvailable && (
                    <Card
                      icon={<Network className="size-5" />}
                      title={`${churchPrefix}${t(
                        'reports.home.cards.arrivalsBySubChurch.title'
                      )}`}
                      description={t(
                        'reports.home.cards.arrivalsBySubChurch.description',
                        { church: churchFallback }
                      )}
                      to={arrivalsSubChurchesPath}
                    />
                  )}
                </div>
              </section>
            )}

            <section id="weekday" className="space-y-3 scroll-mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('reports.home.sections.weekday')}
              </p>
              <RoleView roles={permitLeaderAdmin(churchType as ChurchLevel)}>
                <div className="space-y-3">
                  <Card
                    icon={<CalendarRange className="size-5" />}
                    title={
                      churchType === 'Bacenta'
                        ? `${churchPrefix}${t(
                            'reports.home.cards.weekdayServiceRecords.title'
                          )}`
                        : `${churchPrefix}${t(
                            'reports.home.cards.weekday.title'
                          )}`
                    }
                    description={
                      churchType === 'Bacenta'
                        ? t(
                            'reports.home.cards.weekdayServiceRecords.description',
                            { church: bacentaFallback }
                          )
                        : t('reports.home.cards.weekday.description', {
                            church: churchFallback,
                          })
                    }
                    to={weekdayPath}
                  />
                  {hasMetricSubChurches && (
                    <Card
                      icon={<Network className="size-5" />}
                      title={`${churchPrefix}${t(
                        'reports.home.cards.weekdayBySubChurch.title'
                      )}`}
                      description={t(
                        'reports.home.cards.weekdayBySubChurch.description',
                        { church: churchFallback }
                      )}
                      to={weekdaySubChurchesPath}
                    />
                  )}
                </div>
              </RoleView>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ReportsPage
