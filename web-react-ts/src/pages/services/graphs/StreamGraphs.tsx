import { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Tabs, TabsList, TabsTrigger } from 'components/ui/tabs'
import { StatCard } from 'components/ui/stat-card'

import { STREAM_GRAPHS } from './GraphsQueries'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'
import { getGraphPageLabels, higherChurchGraphOptions } from './graph-labels'

const TREND_HISTORY_WEEKS = 24
const WINDOW_SIZE = 4

const formatStat = (value: string | undefined) =>
  value && value !== 'NaN'
    ? Number(value).toLocaleString('en-GH', { maximumFractionDigits: 0 })
    : '—'

const StreamGraphs = () => {
  const { t } = useTranslation()
  const labels = getGraphPageLabels(t, 'Stream')
  const graphOptions = useMemo(() => higherChurchGraphOptions(t), [t])
  const { streamId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const [graphs, setGraphs] = useState<GraphTypes>('services')
  const [windowEnd, setWindowEnd] = useState<number | null>(null)

  const { data, loading, error } = useQuery(STREAM_GRAPHS, {
    variables: { streamId, limit: TREND_HISTORY_WEEKS, skip: 0 },
  })

  const stream = data?.streams?.[0]
  const incomeTracked = !currentUser?.noIncomeTracking

  const jointServiceData = useMemo(
    () =>
      getServiceGraphData(stream, 'services', TREND_HISTORY_WEEKS, t) || [],
    [stream, t]
  )
  const serviceData = useMemo(
    () =>
      getServiceGraphData(stream, 'serviceAggregate', TREND_HISTORY_WEEKS, t) ||
      [],
    [stream, t]
  )
  const rawBussingData = useMemo(
    () =>
      getServiceGraphData(stream, 'bussingAggregate', TREND_HISTORY_WEEKS, t) ||
      [],
    [stream, t]
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
  const isJointServiceTab = graphs === 'services'
  const avgBussing = formatStat(
    getMonthlyStatAverage(isBussingTab ? windowedData : bussingData, 'attendance')
  )
  const avgAttendance = formatStat(
    getMonthlyStatAverage(
      isBussingTab || isJointServiceTab ? serviceData : windowedData,
      'attendance'
    )
  )
  const avgIncome = formatStat(
    getMonthlyStatAverage(
      isBussingTab || isJointServiceTab ? serviceData : windowedData,
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
    if (!validEntries.length) return labels.noServiceData

    const sorted = [...validEntries].sort(
      (a, b) => a.year * 100 + a.week - (b.year * 100 + b.week)
    )
    const first = sorted[0]
    const last = sorted[sorted.length - 1]

    if (first.year === last.year) {
      return labels.weeksRange(first.week, last.week, first.year)
    }
    return `${labels.weekShort(first.week, first.year)} – ${labels.weekShort(last.week, last.year)}`
  }, [windowedData, labels])

  const showIncomeBar =
    !isBussingTab && !!getMonthlyStatAverage(windowedData, 'income')

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {stream?.name ?? labels.fallbackChurchName}{' '}
            <span className="text-churches">{labels.trends}</span>
          </h1>
        </StickyPageHeader>
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <Card>
            <CardContent className="px-4 py-3 sm:px-5">
              <LeaderAvatar
                leader={stream?.leader}
                leaderTitle={labels.leaderTitle}
                loading={!stream}
              />
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Link
              to="/stream/members"
              className="block h-full rounded-xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
            >
              <StatCard
                compact
                label={labels.membership}
                value={stream?.memberCount ?? 0}
                icon={Users}
                accent="members"
                hint={labels.tapToView}
                loading={!stream}
              />
            </Link>

            <StatCard
              compact
              label={labels.avgWeeklyBussing}
              value={avgBussing}
              icon={Bus}
              accent="defaulters"
              loading={loading && !stream}
            />

            <StatCard
              compact
              label={labels.avgWeeklyAttendance}
              value={avgAttendance}
              icon={TrendingUp}
              accent="churches"
              loading={loading && !stream}
            />

            <StatCard
              compact
              label={labels.avgWeeklyIncome}
              value={incomeTracked ? avgIncome : labels.notTracked}
              icon={Wallet}
              accent="banking"
              loading={loading && !stream}
            />
          </section>

          <Tabs value={graphs} onValueChange={handleTabChange}>
            <TabsList className="grid h-12 w-full grid-cols-3">
              {graphOptions.map((option) => (
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
                church="stream"
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
                {labels.older}
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
                {labels.newer}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default StreamGraphs
