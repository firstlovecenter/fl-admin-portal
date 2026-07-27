import { useLazyQuery } from '@apollo/client'
import { ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Banknote,
  CalendarCheck,
  Users,
} from 'lucide-react'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import PullToRefresh from 'components/base-component/PullToRefresh'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { ChurchLevel } from 'global-types'
import useSontaLevel from 'hooks/useSontaLevel'
import useSelectedWeek from 'hooks/useSelectedWeek'
import WeekSelector from 'components/WeekSelector/WeekSelector'
import { formatChurchLevel } from 'lib/scope-display'

import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { StatCard } from 'components/ui/stat-card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'components/ui/tabs'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'

import {
  GOVERNORSHIP_DEFAULTERS,
  COUNCIL_DEFAULTERS,
  STREAM_DEFAULTERS,
  CAMPUS_DEFAULTERS,
  OVERSIGHT_DEFAULTERS,
  DENOMINATION_DEFAULTERS,
} from './DefaultersQueries'
import DefaulterInfoCard, { Defaulter as Tile } from './DefaulterInfoCard'
import DownloadDefaultersButton from './DownloadDefaultersButton'
import { isDefaultersDownloadLevel } from './utils/buildDefaultersWorkbook'
import {
  DefaultersUseChurchType,
  HigherChurchWithDefaulters,
} from './defaulters-types'

type DashboardTab = 'bacenta' | 'stream' | 'joint'

// Denomination intentionally omitted — `Denomination` SDL has no
// `oversightCount` field, so the sub-church aggregate card cannot render
// at that level. Drop the entry so the mapping reflects what's queryable.
const SUB_CHURCH_BY_LEVEL: Partial<Record<ChurchLevel, ChurchLevel>> = {
  Council: 'Governorship',
  Stream: 'Council',
  Campus: 'Stream',
  Oversight: 'Campus',
}

const DEFAULT_TAB_BY_LEVEL: Partial<Record<ChurchLevel, DashboardTab>> = {
  Governorship: 'bacenta',
  Council: 'bacenta',
  Stream: 'bacenta',
  Campus: 'bacenta',
  Oversight: 'stream',
  Denomination: 'stream',
}

const safeNumber = (value: number | null | undefined): number => value ?? 0

const SectionHeader = ({
  title,
  subtitle,
  loading,
  action,
}: {
  title: string
  subtitle: string
  loading: boolean
  action?: ReactNode
}) => (
  <div className="flex items-end justify-between gap-3">
    <div className="min-w-0">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {loading ? (
        <Skeleton className="mt-1 h-4 w-40" />
      ) : (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)

const TileGrid = ({ tiles, loading }: { tiles: Tile[]; loading: boolean }) => {
  const slots = loading ? Array.from({ length: 5 }) : tiles
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
      {slots.map((item, i) => (
        <DefaulterInfoCard
          key={(item as Tile)?.title ?? i}
          defaulter={
            loading
              ? { title: '—', data: undefined, link: '#', color: 'neutral' }
              : (item as Tile)
          }
        />
      ))}
    </div>
  )
}

const DefaultersDashboard = () => {
  const { t } = useTranslation()
  const { currentUser } = useContext(MemberContext)
  const { selectedScope } = useChurchRoleScope()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clickCard } = useContext(ChurchContext) as any
  const navigate = useNavigate()
  const { weekStart, isCurrent, weekLabel, linkWith } = useSelectedWeek()
  const [governorshipDefaulters, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_DEFAULTERS)
  const [councilDefaulters, { refetch: councilRefetch }] =
    useLazyQuery(COUNCIL_DEFAULTERS)
  const [streamDefaulters, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_DEFAULTERS)
  const [campusDefaulters, { refetch: campusRefetch }] =
    useLazyQuery(CAMPUS_DEFAULTERS)
  const [oversightDefaulters, { refetch: oversightRefetch }] =
    useLazyQuery(OVERSIGHT_DEFAULTERS)
  const [denominationDefaulters, { refetch: denominationRefetch }] =
    useLazyQuery(DENOMINATION_DEFAULTERS)

  const data = useSontaLevel({
    governorshipFunction: governorshipDefaulters,
    governorshipRefetch,
    councilFunction: councilDefaulters,
    councilRefetch,
    streamFunction: streamDefaulters,
    streamRefetch,
    campusFunction: campusDefaulters,
    campusRefetch,
    oversightFunction: oversightDefaulters,
    oversightRefetch,
    denominationFunction: denominationDefaulters,
    denominationRefetch,
    weekStart,
  })

  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  // SYN-191: `currentChurch` is the source of truth (drill-down writes it; the
  // picker mirrors into it). Prefer it over `selectedScope` so the level shown
  // while the query is in flight matches the drilled church, not the home scope.
  const level = (church?.__typename ??
    (currentUser?.currentChurch?.__typename as ChurchLevel | undefined) ??
    (selectedScope?.churchType as ChurchLevel | undefined)) as
    | ChurchLevel
    | undefined
  const subChurch = level ? SUB_CHURCH_BY_LEVEL[level] : undefined

  const showStreamSection =
    !!level && ['Campus', 'Oversight', 'Denomination'].includes(level)
  const showBacentaSection =
    !!level && ['Governorship', 'Council', 'Stream', 'Campus'].includes(level)
  const showJointSection =
    !!level && ['Council', 'Stream', 'Campus'].includes(level)

  const initialTab: DashboardTab = level
    ? DEFAULT_TAB_BY_LEVEL[level] ?? 'bacenta'
    : 'bacenta'
  const [tab, setTab] = useState<DashboardTab>(initialTab)
  // Reset to the level's canonical default tab when the level resolves
  // (cold-load case — `church.__typename` is undefined on first paint).
  useEffect(() => {
    setTab(initialTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  const streamTiles = useMemo<Tile[]>(
    () => [
      {
        title: t('services.defaulters.servicesThisWeek'),
        data: church?.streamServicesThisWeekCount,
        color: church?.streamServicesThisWeekCount ? 'good' : 'bad',
        link: church?.streamServicesThisWeekCount
          ? linkWith('/stream-services/filled-services')
          : '#',
      },
      {
        title: t('services.defaulters.notFilledForms'),
        data: church?.streamFormDefaultersThisWeekCount,
        color: church?.streamFormDefaultersThisWeekCount ? 'bad' : 'good',
        link: church?.streamFormDefaultersThisWeekCount
          ? linkWith('/stream-services/form-defaulters')
          : '#',
      },
      {
        title: t('services.defaulters.haveBanked'),
        data: church?.streamBankedThisWeekCount,
        color:
          safeNumber(church?.streamBankedThisWeekCount) ===
          safeNumber(church?.streamServicesThisWeekCount)
            ? 'good'
            : safeNumber(church?.streamBankedThisWeekCount) > 0
            ? 'yellow'
            : 'bad',
        link: church?.streamBankedThisWeekCount
          ? linkWith('/stream-services/banked')
          : '#',
      },
      {
        title: t('services.defaulters.haveNotBanked'),
        data: church?.streamBankingDefaultersThisWeekCount,
        color: church?.streamBankingDefaultersThisWeekCount ? 'bad' : 'good',
        link: church?.streamBankingDefaultersThisWeekCount
          ? linkWith('/stream-services/banking-defaulters')
          : '#',
      },
      {
        title: t('services.defaulters.cancelledService'),
        data: church?.streamCancelledServicesThisWeekCount,
        color: church?.streamCancelledServicesThisWeekCount ? 'bad' : 'good',
        link: church?.streamCancelledServicesThisWeekCount
          ? linkWith('/stream-services/cancelled-services')
          : '#',
      },
    ],
    [church, linkWith, t]
  )

  const bacentaTiles = useMemo<Tile[]>(
    () => [
      {
        title: t('services.defaulters.servicesThisWeek'),
        data: church?.servicesThisWeekCount,
        color: church?.servicesThisWeekCount ? 'good' : 'bad',
        link: church?.servicesThisWeekCount
          ? linkWith('/services/filled-services')
          : '#',
      },
      {
        title: t('services.defaulters.notFilledForms'),
        data: church?.formDefaultersThisWeekCount,
        color: church?.formDefaultersThisWeekCount ? 'bad' : 'good',
        link: church?.formDefaultersThisWeekCount
          ? linkWith('/services/form-defaulters')
          : '#',
      },
      {
        title: t('services.defaulters.haveBanked'),
        data: church?.bankedThisWeekCount,
        color:
          safeNumber(church?.bankedThisWeekCount) ===
          safeNumber(church?.servicesThisWeekCount)
            ? 'good'
            : safeNumber(church?.bankedThisWeekCount) > 0
            ? 'yellow'
            : 'bad',
        link: church?.bankedThisWeekCount ? linkWith('/services/banked') : '#',
      },
      {
        title: t('services.defaulters.haveNotBanked'),
        data: church?.bankingDefaultersThisWeekCount,
        color: church?.bankingDefaultersThisWeekCount ? 'bad' : 'good',
        link: church?.bankingDefaultersThisWeekCount
          ? linkWith('/services/banking-defaulters')
          : '#',
      },
      {
        title: t('services.defaulters.cancelledService'),
        data: church?.cancelledServicesThisWeekCount,
        color: church?.cancelledServicesThisWeekCount ? 'bad' : 'good',
        link: church?.cancelledServicesThisWeekCount
          ? linkWith('/services/cancelled-services')
          : '#',
      },
    ],
    [church, linkWith, t]
  )

  const jointTiles = useMemo<Tile[]>(
    () =>
      (
        [
          {
            title: t('services.defaulters.bankedAtLevel', {
              level: t('shared.churchLevel.Governorship'),
            }),
            data: church?.governorshipBankedThisWeekCount,
            color: church?.governorshipBankedThisWeekCount ? 'good' : 'bad',
            link: church?.governorshipBankedThisWeekCount
              ? linkWith('/services/governorship-banked')
              : '#',
          },
          {
            title: t('services.defaulters.notBankedAtLevel', {
              level: t('shared.churchLevel.Governorship'),
            }),
            data: church?.governorshipBankingDefaultersThisWeekCount,
            color: church?.governorshipBankingDefaultersThisWeekCount
              ? 'bad'
              : 'good',
            link: church?.governorshipBankingDefaultersThisWeekCount
              ? linkWith('/services/governorship-banking-defaulters')
              : '#',
          },
          {
            title: t('services.defaulters.bankedAtLevel', {
              level: t('shared.churchLevel.Council'),
            }),
            data: church?.councilBankedThisWeekCount,
            color: church?.councilBankedThisWeekCount ? 'good' : 'bad',
            link: church?.councilBankedThisWeekCount
              ? linkWith('/services/council-banked')
              : '#',
          },
          {
            title: t('services.defaulters.notBankedAtLevel', {
              level: t('shared.churchLevel.Council'),
            }),
            data: church?.councilBankingDefaultersThisWeekCount,
            color: church?.councilBankingDefaultersThisWeekCount
              ? 'bad'
              : 'good',
            link: church?.councilBankingDefaultersThisWeekCount
              ? linkWith('/services/council-banking-defaulters')
              : '#',
          },
        ] as Tile[]
      ).filter((tile) => tile.data !== undefined && tile.data !== null),
    [church, linkWith, t]
  )

  // Headline KPIs track the active tab so the summary always reconciles to
  // what's drawn in the breakdown grid below. At Campus the user can switch
  // between Bacenta and Stream tabs and the summary follows.
  const summaryUsesBacenta = tab === 'bacenta' && showBacentaSection
  const totalServices = summaryUsesBacenta
    ? safeNumber(church?.servicesThisWeekCount)
    : safeNumber(church?.streamServicesThisWeekCount)
  const totalBanked = summaryUsesBacenta
    ? safeNumber(church?.bankedThisWeekCount)
    : safeNumber(church?.streamBankedThisWeekCount)
  const totalFormDefaulters = summaryUsesBacenta
    ? safeNumber(church?.formDefaultersThisWeekCount)
    : safeNumber(church?.streamFormDefaultersThisWeekCount)
  const totalBankingDefaulters = summaryUsesBacenta
    ? safeNumber(church?.bankingDefaultersThisWeekCount)
    : safeNumber(church?.streamBankingDefaultersThisWeekCount)
  const totalCancelled = summaryUsesBacenta
    ? safeNumber(church?.cancelledServicesThisWeekCount)
    : safeNumber(church?.streamCancelledServicesThisWeekCount)
  const outstanding =
    totalFormDefaulters + totalBankingDefaulters + totalCancelled

  const activeUnitPlural = summaryUsesBacenta
    ? t('shared.churchLevelPlural.Bacenta')
    : t('shared.churchLevelPlural.Stream')
  const activeUnitLabel = t('services.defaulters.activeUnits', {
    units: activeUnitPlural,
  })
  const activeUnitValue = summaryUsesBacenta
    ? safeNumber(church?.activeBacentaCount)
    : safeNumber(church?.activeStreamCount)

  // /bacenta/displayall reads governorshipId from ChurchContext;
  // /stream/displayall reads campusId. Only wire the click when the
  // current level matches a destination that exists.
  const activeUnitLink: string | null = summaryUsesBacenta
    ? level === 'Governorship'
      ? '/bacenta/displayall'
      : null
    : level === 'Campus'
    ? '/stream/displayall'
    : null

  const subChurchAggregate = useMemo<Tile | null>(() => {
    if (!subChurch || !church) return null
    const countKey = `${subChurch.toLowerCase()}Count` as const
    const value = (church as Record<string, unknown>)[countKey]
    if (typeof value !== 'number') return null
    return {
      title: t(`shared.churchLevelPlural.${subChurch}`),
      data: value,
      color: 'neutral',
      link: linkWith(
        `/services/${church?.__typename?.toLowerCase()}-by-${subChurch?.toLowerCase()}`
      ),
    }
  }, [church, subChurch, linkWith, t])

  // Stream-only: second drill-down by Governorship (one level deeper than Council)
  const streamGovernorshipAggregate = useMemo<Tile | null>(() => {
    if (level !== 'Stream' || !church) return null
    const value = (church as Record<string, unknown>).governorshipCount
    if (typeof value !== 'number') return null
    return {
      title: t('shared.churchLevelPlural.Governorship'),
      data: value,
      color: 'neutral',
      link: linkWith('/services/stream-by-governorship'),
    }
  }, [church, level, linkWith, t])

  const tabsCount = [
    showBacentaSection,
    showStreamSection,
    showJointSection && jointTiles.length > 0,
  ].filter(Boolean).length

  const downloadAction =
    isDefaultersDownloadLevel(church?.__typename) && church?.id ? (
      <DownloadDefaultersButton
        level={church.__typename}
        churchId={church.id}
        disabled={!church}
      />
    ) : null

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <StickyPageHeader>
            {church ? (
              <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                {church.name}{' '}
                <span className="text-defaulters">
                  {formatChurchLevel(
                    (church as HigherChurchWithDefaulters).__typename,
                    t
                  )}{' '}
                  {t('services.defaulters.title')}
                </span>
              </h1>
            ) : (
              <Skeleton className="h-9 w-72" />
            )}
            <p className="text-sm text-muted-foreground">
              {isCurrent
                ? t('services.defaulters.subtitle')
                : t('services.defaulters.subtitleWithWeek', { weekLabel })}
            </p>
          </StickyPageHeader>
          <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {activeUnitLink ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!church) return
                    clickCard(church)
                    navigate(activeUnitLink)
                  }}
                  disabled={!church}
                  aria-label={t('services.defaulters.viewUnitsListAria', {
                    units: activeUnitPlural,
                  })}
                  className="block h-full rounded-xl text-left outline-none transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <StatCard
                    compact
                    label={activeUnitLabel}
                    value={activeUnitValue.toLocaleString('en-GH')}
                    icon={Users}
                    accent="members"
                    hint={t('services.defaulters.tapToViewList')}
                    loading={!church}
                  />
                </button>
              ) : (
                <StatCard
                  compact
                  label={activeUnitLabel}
                  value={activeUnitValue.toLocaleString('en-GH')}
                  icon={Users}
                  accent="members"
                  loading={!church}
                />
              )}
              <StatCard
                compact
                label={t('services.defaulters.servicesFiled')}
                value={totalServices.toLocaleString('en-GH')}
                icon={CalendarCheck}
                accent="churches"
                loading={!church}
              />
              <StatCard
                compact
                label={t('services.defaulters.haveBanked')}
                value={totalBanked.toLocaleString('en-GH')}
                icon={Banknote}
                accent="banking"
                loading={!church}
              />
              <StatCard
                compact
                label={t('services.defaulters.outstanding')}
                value={outstanding.toLocaleString('en-GH')}
                icon={AlertTriangle}
                accent="defaulters"
                hint={t('services.defaulters.outstandingHint')}
                loading={!church}
              />
            </section>

            {/* 2-column body on lg+, stacked on mobile.
                Sidebar uses order-first on mobile so the WeekSelector still
                appears before the tabs in the natural reading order. */}
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
              <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
                <WeekSelector />
                <RoleView roles={permitLeaderAdmin('Council')}>
                  {subChurchAggregate && (
                    <Card>
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {subChurchAggregate.title}
                          </p>
                          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">
                            {subChurchAggregate.data}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => navigate(subChurchAggregate.link)}
                        >
                          {t('services.defaulters.viewList')}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  {streamGovernorshipAggregate && (
                    <Card>
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {streamGovernorshipAggregate.title}
                          </p>
                          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">
                            {streamGovernorshipAggregate.data}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate(streamGovernorshipAggregate.link)
                          }
                        >
                          {t('services.defaulters.viewList')}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </RoleView>
              </aside>

              <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as DashboardTab)}
                className="space-y-4 lg:col-start-1 lg:row-start-1"
              >
                {tabsCount > 1 && (
                  <TabsList
                    className="grid h-12 w-full"
                    style={{
                      gridTemplateColumns: `repeat(${tabsCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {showBacentaSection && (
                      <TabsTrigger value="bacenta">
                        {t('services.defaulters.levelServices', {
                          level: t('shared.churchLevel.Bacenta'),
                        })}
                      </TabsTrigger>
                    )}
                    {showStreamSection && (
                      <TabsTrigger value="stream">
                        {t('services.defaulters.levelServices', {
                          level: t('shared.churchLevel.Stream'),
                        })}
                      </TabsTrigger>
                    )}
                    {showJointSection && jointTiles.length > 0 && (
                      <TabsTrigger value="joint">
                        {t('services.defaulters.jointServices')}
                      </TabsTrigger>
                    )}
                  </TabsList>
                )}

                {showBacentaSection && (
                  <TabsContent value="bacenta" className="space-y-3">
                    <SectionHeader
                      title={t('services.defaulters.levelServices', {
                        level: t('shared.churchLevel.Bacenta'),
                      })}
                      subtitle={t('services.defaulters.activeUnitsThisWeek', {
                        count: activeUnitValue.toLocaleString('en-GH'),
                        units: t('shared.churchLevelPlural.Bacenta'),
                      })}
                      loading={!church}
                      action={downloadAction}
                    />
                    <TileGrid tiles={bacentaTiles} loading={!church} />
                  </TabsContent>
                )}

                {showStreamSection && (
                  <TabsContent value="stream" className="space-y-3">
                    <SectionHeader
                      title={t('services.defaulters.levelServices', {
                        level: t('shared.churchLevel.Stream'),
                      })}
                      subtitle={t('services.defaulters.activeUnitsThisWeek', {
                        count: safeNumber(
                          church?.activeStreamCount
                        ).toLocaleString('en-GH'),
                        units: t('shared.churchLevelPlural.Stream'),
                      })}
                      loading={!church}
                      action={downloadAction}
                    />
                    <TileGrid tiles={streamTiles} loading={!church} />
                  </TabsContent>
                )}

                {showJointSection && jointTiles.length > 0 && (
                  <TabsContent value="joint" className="space-y-3">
                    <SectionHeader
                      title={t('services.defaulters.jointServices')}
                      subtitle={t('services.defaulters.jointSubtitle')}
                      loading={!church}
                      action={downloadAction}
                    />
                    <TileGrid tiles={jointTiles} loading={!church} />
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default DefaultersDashboard
