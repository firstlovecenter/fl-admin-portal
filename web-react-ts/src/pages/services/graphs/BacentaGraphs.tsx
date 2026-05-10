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

import { BACENTA_GRAPHS } from './GraphsQueries'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'

const TREND_HISTORY_WEEKS = 24
const WINDOW_SIZE = 4

const BACENTA_GRAPH_OPTIONS: { value: GraphTypes; label: string }[] = [
  { value: 'bussing', label: 'Bussing' },
  { value: 'services', label: 'Services' },
]

const formatStat = (value: string | undefined) =>
  value && value !== 'NaN'
    ? Number(value).toLocaleString('en-GH', { maximumFractionDigits: 0 })
    : '—'

export const BacentaGraphs = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const [graphs, setGraphs] = useState<GraphTypes>('bussing')
  const [windowEnd, setWindowEnd] = useState<number | null>(null)

  const { data, loading, error } = useQuery(BACENTA_GRAPHS, {
    variables: { id: bacentaId, limit: TREND_HISTORY_WEEKS, skip: 0 },
  })

  const bacenta = data?.bacentas?.[0]
  const incomeTracked = !currentUser?.noIncomeTracking

  const weekdayData = useMemo(
    () => getServiceGraphData(bacenta, 'services', TREND_HISTORY_WEEKS) || [],
    [bacenta]
  )
  const bussingData = useMemo(
    () => getServiceGraphData(bacenta, 'bussing', TREND_HISTORY_WEEKS) || [],
    [bacenta]
  )

  const recentBussingData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return bussingData.filter(
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
  }, [bussingData])

  const activeDataset = graphs === 'bussing' ? recentBussingData : weekdayData
  const datasetLength = activeDataset.length
  const effectiveWindowEnd = windowEnd ?? datasetLength
  const clampedWindowEnd = Math.min(
    Math.max(effectiveWindowEnd, WINDOW_SIZE),
    datasetLength
  )
  const windowStart = Math.max(0, clampedWindowEnd - WINDOW_SIZE)
  const windowedData = activeDataset.slice(windowStart, clampedWindowEnd)

  // Active tab's averages reflect the visible window so they stay in sync with
  // what's drawn on the chart. Inactive tab's averages stay at the latest
  // 4 weeks of their full dataset.
  const isBussingActive = graphs === 'bussing'
  const avgBussing = formatStat(
    getMonthlyStatAverage(
      isBussingActive ? windowedData : recentBussingData,
      'attendance'
    )
  )
  const avgAttendance = formatStat(
    getMonthlyStatAverage(
      isBussingActive ? weekdayData : windowedData,
      'attendance'
    )
  )
  const avgIncome = formatStat(
    getMonthlyStatAverage(
      isBussingActive ? weekdayData : windowedData,
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

  const validWeeks = windowedData
    .map((d: { week?: number | string }) => Number(d.week ?? 0))
    .filter((n: number) => Number.isFinite(n) && n > 0)
  const weekRangeLabel = validWeeks.length
    ? `Weeks ${Math.min(...validWeeks)} – ${Math.max(...validWeeks)}`
    : 'No service data'

  const showIncomeBar =
    graphs !== 'bussing' && !!getMonthlyStatAverage(weekdayData, 'income')

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {bacenta?.name ?? 'Bacenta'}{' '}
              <span className="text-churches">Trends</span>
            </h1>
          </header>

          <Card>
            <CardContent className="px-4 py-3 sm:px-5">
              <LeaderAvatar
                leader={bacenta?.leader}
                leaderTitle="Bacenta Leader"
                loading={!bacenta}
              />
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Link
              to="/bacenta/members"
              className="block h-full rounded-xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
            >
              <StatCard
                compact
                label="Membership"
                value={bacenta?.memberCount ?? 0}
                icon={Users}
                accent="members"
                hint="Tap to view"
                loading={!bacenta}
              />
            </Link>

            <StatCard
              compact
              label="Avg Weekly Bussing"
              value={avgBussing}
              icon={Bus}
              accent="defaulters"
              loading={loading && !bacenta}
            />

            <StatCard
              compact
              label="Avg Weekly Attendance"
              value={avgAttendance}
              icon={TrendingUp}
              accent="churches"
              loading={loading && !bacenta}
            />

            <StatCard
              compact
              label="Avg Weekly Income"
              value={incomeTracked ? avgIncome : 'Not tracked'}
              icon={Wallet}
              accent="banking"
              loading={loading && !bacenta}
            />
          </section>

          <Tabs value={graphs} onValueChange={handleTabChange}>
            <TabsList className="grid h-12 w-full grid-cols-2">
              {BACENTA_GRAPH_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
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
                church="bacenta"
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

export default BacentaGraphs
