import { useContext, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link } from 'react-router-dom'
import {
  Bus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'

import ApolloWrapper from 'components/base-component/ApolloWrapper'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Tabs, TabsList, TabsTrigger } from 'components/ui/tabs'
import { StatCard } from 'components/ui/stat-card'

import { OVERSIGHT_GRAPHS } from './GraphsQueries'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'

const TREND_HISTORY_WEEKS = 24
const WINDOW_SIZE = 4

// Oversight has joint services plus aggregates of all campuses and levels below, in GHS and USD.
const OVERSIGHT_GRAPH_OPTIONS: { value: GraphTypes; label: string }[] = [
  { value: 'services', label: 'Joint Service' },
  { value: 'serviceAggregate', label: 'All Services' },
  { value: 'serviceAggregateWithDollar', label: 'All Services (USD)' },
  { value: 'bussingAggregate', label: 'All Bussing' },
]

const formatStat = (value: string | undefined) =>
  value && value !== 'NaN'
    ? Number(value).toLocaleString('en-GH', { maximumFractionDigits: 0 })
    : '—'

const OversightGraphs = () => {
  const { oversightId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const [graphs, setGraphs] = useState<GraphTypes>('services')
  const [windowEnd, setWindowEnd] = useState<number | null>(null)

  const { data, loading, error } = useQuery(OVERSIGHT_GRAPHS, {
    variables: { oversightId, limit: TREND_HISTORY_WEEKS, skip: 0 },
  })

  const oversight = data?.oversights?.[0]
  const incomeTracked = !currentUser?.noIncomeTracking

  const jointServiceData = useMemo(
    () => getServiceGraphData(oversight, 'services', TREND_HISTORY_WEEKS) || [],
    [oversight]
  )
  const serviceData = useMemo(
    () =>
      getServiceGraphData(oversight, 'serviceAggregate', TREND_HISTORY_WEEKS) ||
      [],
    [oversight]
  )
  const serviceWithDollarData = useMemo(
    () =>
      getServiceGraphData(
        oversight,
        'serviceAggregateWithDollar',
        TREND_HISTORY_WEEKS
      ) || [],
    [oversight]
  )
  const rawBussingData = useMemo(
    () =>
      getServiceGraphData(oversight, 'bussingAggregate', TREND_HISTORY_WEEKS) ||
      [],
    [oversight]
  )

  const bussingData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return rawBussingData.filter(
      (record: { year?: number | null; date?: string | null }) => {
        if (
          typeof record?.year === 'number' &&
          Number.isFinite(record.year) &&
          record.year > 0
        )
          return record.year >= currentYear - 1
        return false
      }
    )
  }, [rawBussingData])

  const activeDataset =
    graphs === 'services'
      ? jointServiceData
      : graphs === 'serviceAggregate'
      ? serviceData
      : graphs === 'serviceAggregateWithDollar'
      ? serviceWithDollarData
      : bussingData

  const datasetLength = activeDataset.length
  const effectiveWindowEnd = windowEnd ?? datasetLength
  const clampedWindowEnd = Math.min(
    Math.max(effectiveWindowEnd, WINDOW_SIZE),
    datasetLength
  )
  const windowStart = Math.max(0, clampedWindowEnd - WINDOW_SIZE)
  const windowedData = activeDataset.slice(windowStart, clampedWindowEnd)

  const isBussingTab = graphs === 'bussingAggregate'
  const isUsdTab = graphs === 'serviceAggregateWithDollar'
  const avgBussing = formatStat(
    getMonthlyStatAverage(isBussingTab ? windowedData : bussingData, 'attendance')
  )
  const avgAttendance = formatStat(
    getMonthlyStatAverage(
      isBussingTab ? serviceData : windowedData,
      'attendance'
    )
  )
  const avgIncome = formatStat(
    getMonthlyStatAverage(
      isBussingTab || isUsdTab ? serviceData : windowedData,
      'income'
    )
  )

  const canGoOlder = windowStart > 0
  const canGoNewer = clampedWindowEnd < datasetLength

  const handleOlder = () =>
    setWindowEnd(Math.max(WINDOW_SIZE, clampedWindowEnd - WINDOW_SIZE))
  const handleNewer = () =>
    setWindowEnd(Math.min(datasetLength, clampedWindowEnd + WINDOW_SIZE))

  const handleTabChange = (value: string) => {
    setGraphs(value as GraphTypes)
    setWindowEnd(null)
  }

  const weekRangeLabel = useMemo(() => {
    const validEntries = windowedData
      .map((d: { week?: number | string; year?: number | string }) => ({
        week: Number(d.week ?? 0),
        year: Number(d.year ?? 0),
      }))
      .filter((e) => Number.isFinite(e.week) && e.week > 0)
    if (!validEntries.length) return 'No service data'

    const sorted = [...validEntries].sort(
      (a, b) => a.year * 100 + a.week - (b.year * 100 + b.week)
    )
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const formatWeekYear = (w: number, y: number) =>
      y ? `W${w}'${String(y).slice(-2)}` : `W${w}`

    if (first.year === last.year) {
      return `Weeks ${first.week} – ${last.week} (${first.year})`
    }
    return `${formatWeekYear(first.week, first.year)} – ${formatWeekYear(last.week, last.year)}`
  }, [windowedData])

  const showIncomeBar =
    !isBussingTab &&
    !isUsdTab &&
    !!getMonthlyStatAverage(windowedData, 'income')

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {oversight?.name ?? 'Oversight'}{' '}
              <span className="text-churches">Trends</span>
            </h1>
          </header>

          <Card>
            <CardContent className="px-4 py-3 sm:px-5">
              <LeaderAvatar
                leader={oversight?.leader}
                leaderTitle="Oversight Leader"
                loading={!oversight}
              />
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Link
              to="/oversight/members"
              className="block h-full rounded-xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
            >
              <StatCard
                compact
                label="Membership"
                value={oversight?.memberCount ?? 0}
                icon={Users}
                accent="members"
                hint="Tap to view"
                loading={!oversight}
              />
            </Link>

            <StatCard
              compact
              label="Avg Weekly Bussing"
              value={avgBussing}
              icon={Bus}
              accent="defaulters"
              loading={loading && !oversight}
            />

            <StatCard
              compact
              label="Avg Weekly Attendance"
              value={avgAttendance}
              icon={TrendingUp}
              accent="churches"
              loading={loading && !oversight}
            />

            <StatCard
              compact
              label="Avg Weekly Income"
              value={incomeTracked ? avgIncome : 'Not tracked'}
              icon={Wallet}
              accent="banking"
              loading={loading && !oversight}
            />
          </section>

          {/* 4 options: 2×2 grid so each tap target stays ≥ 44 px tall */}
          <Tabs value={graphs} onValueChange={handleTabChange}>
            <TabsList className="grid h-auto w-full grid-cols-2">
              {OVERSIGHT_GRAPH_OPTIONS.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="h-11"
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Card>
            <CardContent className="px-3 pb-2 pt-4 sm:px-5 sm:pt-5">
              <ChurchGraph
                stat1="attendance"
                stat2={showIncomeBar && incomeTracked ? 'income' : null}
                churchData={windowedData}
                church="oversight"
                graphType={graphs}
              />
            </CardContent>
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-3 sm:px-5">
              <Button
                variant="outline"
                onClick={handleOlder}
                disabled={!canGoOlder}
                className="min-h-[44px] flex-1 sm:flex-none"
              >
                <ChevronLeft className="size-4" />
                Older
              </Button>

              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {weekRangeLabel}
              </span>

              <Button
                variant="outline"
                onClick={handleNewer}
                disabled={!canGoNewer}
                className="min-h-[44px] flex-1 sm:flex-none"
              >
                Newer
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default OversightGraphs
