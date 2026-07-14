import { ChurchContext } from 'contexts/ChurchContext'
import { ChurchLevelLower } from 'global-types'
import { ReactElement, useContext, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  Bar,
  BarChart,
  BarRectangleItem,
  CartesianGrid,
  Cell,
  LabelList,
  RenderableText,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { capitalise } from '../../global-utils'
import { Skeleton } from 'components/ui/skeleton'
import { GraphTypes } from 'pages/services/graphs/graphs-utils'

type ChurchGraphProps = {
  loading?: boolean
  stat1: 'attendance' | 'income'
  stat2: 'attendance' | 'income' | 'target' | null
  churchData: any[]
  secondaryTitle?: string
  graphType: GraphTypes
  church: ChurchLevelLower | string
  swollenSunday?: boolean
  // Optional per-bar colour overrides. When omitted, fall back to the
  // graphType-driven palette (primary) and the fixed success accent
  // (secondary). Used by Shepherding Control to colour each metric
  // distinctly so the projection legend reads naturally.
  stat1Color?: string
  stat2Color?: string
}

// A single row from `churchData`. recharts 3 passes this under the bar
// click's `payload` field rather than the click argument itself, and it
// carries whatever fields the underlying GraphQL row has (attendance,
// income, numberOfServices, ...) beyond the ones `handleBarClick` reads.
type ChurchGraphRow = {
  id?: string
  category?: string
  week?: number
  year?: number
  [key: string]: unknown
}

const compactNumberFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

// Individual (first-class) records use the feature accent; aggregates (rollups) use a
// distinct hue so it's visually clear whether a chart shows "this church" vs "everything below".
const PRIMARY_COLOR_BY_TYPE: Record<GraphTypes, string> = {
  bussing: 'hsl(var(--destructive))',         // red  — individual bacenta bussing
  bussingAggregate: 'hsl(var(--defaulters))', // orange — all bussing rolled up
  swellBussing: 'hsl(var(--warning))',        // amber — swell-Sunday special

  services: 'hsl(var(--arrivals))',              // indigo — this level's own joint/weekday service
  serviceAggregate: 'hsl(var(--churches))',      // purple — all services aggregated
  serviceAggregateWithDollar: 'hsl(var(--banking))', // green  — aggregated in USD
  multiplicationAggregate: 'hsl(var(--arrivals))',

  rehearsals: 'hsl(var(--churches))',
  rehearsalAggregate: 'hsl(var(--churches))',
  ministryMeeting: 'hsl(var(--churches))',

  onStageAttendance: 'hsl(var(--campaigns))',
  onStageAttendanceAggregate: 'hsl(var(--campaigns))',
}

// Human-readable chart title labels — plain language, no camelCase type names.
// At Bacenta level "services" means "Service"; at every level above it is a joint service.
const GRAPH_TYPE_LABELS: Record<GraphTypes, string> = {
  bussing: 'Bussing',
  bussingAggregate: 'All Bussing',
  swellBussing: 'Swell Sunday',
  services: 'Service',
  serviceAggregate: 'All Services',
  serviceAggregateWithDollar: 'All Services (USD)',
  multiplicationAggregate: 'Multiplication Total',
  rehearsals: 'Rehearsal',
  rehearsalAggregate: 'All Rehearsals',
  ministryMeeting: 'Ministry Meeting',
  onStageAttendance: 'On-Stage',
  onStageAttendanceAggregate: 'On-Stage Total',
}

const SECONDARY_COLOR = 'hsl(var(--success))'

// Per-bar traffic-light palette (red → yellow → green). Requested by leadership
// as the standard dashboard bar colouring. Cycled across the bars of a series so
// every chart reads red/yellow/green. Uses existing design tokens so it stays
// consistent in light and dark themes. Explicit `stat1Color`/`stat2Color`
// overrides (e.g. Shepherding Control's projection legend) still take priority.
const RED_YELLOW_GREEN_PALETTE = [
  'hsl(var(--destructive))', // red
  'hsl(var(--warning))', // yellow
  'hsl(var(--success))', // green
]

// Per-level arrivals dashboard for bussing-aggregate bar clicks. Bacenta
// is intentionally absent — the bacenta-level "arrivals" view is the
// per-record bussing detail (already routed via the non-aggregate path).
const ARRIVALS_PATH_BY_CHURCH: Partial<Record<string, string>> = {
  campus: '/arrivals/campus',
  stream: '/arrivals/stream',
  council: '/arrivals/council',
  governorship: '/arrivals/governorship',
}

// ISO Sunday (last day of the ISO week) for a given week + year. Returns
// `null` for invalid inputs so the bar click is a no-op rather than
// navigating to a garbage date. The Neo4j aggregator returns the bar's
// `week` as an ISO week number — Sunday is day 7 of that week.
const isoSundayOfWeek = (
  week: number | undefined,
  year: number | undefined
): string | null => {
  if (!Number.isFinite(week) || !Number.isFinite(year)) return null
  const w = Number(week)
  const y = Number(year)
  if (w < 1 || w > 53 || y < 2000) return null

  const jan4 = new Date(Date.UTC(y, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7 // 1..7 with Sunday = 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))
  const sunday = new Date(week1Monday)
  // Monday of week W is week1Monday + (W-1)*7 days; Sunday = +6 days from
  // there.
  sunday.setUTCDate(week1Monday.getUTCDate() + (w - 1) * 7 + 6)
  return sunday.toISOString().slice(0, 10)
}

type LabelProps = {
  x?: number | string
  y?: number | string
  width?: number | string
  value?: RenderableText
}

const renderBarLabel = ({
  x,
  y,
  width,
  value,
}: LabelProps): ReactElement | RenderableText => {
  const numeric = typeof value === 'number' ? value : Number(value)
  const xNum = typeof x === 'number' ? x : Number(x)
  const yNum = typeof y === 'number' ? y : Number(y)
  const widthNum = typeof width === 'number' ? width : Number(width)
  if (
    !Number.isFinite(numeric) ||
    numeric <= 0 ||
    !Number.isFinite(xNum) ||
    !Number.isFinite(yNum) ||
    !Number.isFinite(widthNum)
  ) {
    return null
  }
  return (
    <text
      x={xNum + widthNum / 2}
      y={yNum - 8}
      textAnchor="middle"
      fill="hsl(var(--muted-foreground))"
      fontSize={11}
      fontWeight={600}
    >
      {compactNumberFormatter.format(numeric)}
    </text>
  )
}

type TooltipEntry = {
  value?: number | string
  name?: string
  color?: string
  payload?: {
    week?: number
    year?: number
    numberOfServices?: number
    numberOfUrvans?: number
    numberOfSprinters?: number
    numberOfCars?: number
  }
}

type ChartTooltipProps = {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  // The rendered rows (in bar order) so the tooltip dot for the primary
  // series can reflect that week's actual red/yellow/green cell colour
  // rather than the Bar's flat `fill`.
  data?: { weekLabel?: string }[]
  paletteForPrimary?: boolean
}

const ChartTooltip = ({
  active,
  payload,
  label,
  data,
  paletteForPrimary,
}: ChartTooltipProps) => {
  if (!active || !payload?.length) return null
  const meta = payload[0]?.payload ?? {}
  const headerLabel =
    meta.week && meta.year
      ? `Week ${meta.week}, ${meta.year}`
      : meta.week
      ? `Week ${meta.week}`
      : label || ''

  // Index of the hovered week within the data — used to pick the matching
  // palette colour for the primary series dot.
  const primaryIndex = data?.findIndex((row) => row.weekLabel === label) ?? -1

  return (
    <div className="min-w-44 rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {headerLabel}
      </p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry, index) => {
          const dotColor =
            index === 0 && paletteForPrimary && primaryIndex >= 0
              ? RED_YELLOW_GREEN_PALETTE[
                  primaryIndex % RED_YELLOW_GREEN_PALETTE.length
                ]
              : entry.color
          return (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="flex items-center gap-2 text-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                {entry.name}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {typeof entry.value === 'number'
                  ? entry.value.toLocaleString('en-GH')
                  : entry.value}
              </span>
            </div>
          )
        })}
        {!!meta.numberOfServices && (
          <p className="pt-1 text-xs text-muted-foreground">
            Services: {meta.numberOfServices}
          </p>
        )}
        {!!meta.numberOfUrvans && (
          <p className="text-xs text-muted-foreground">
            Urvans: {meta.numberOfUrvans}
          </p>
        )}
        {!!meta.numberOfSprinters && (
          <p className="text-xs text-muted-foreground">
            Sprinters: {meta.numberOfSprinters}
          </p>
        )}
        {!!meta.numberOfCars && (
          <p className="text-xs text-muted-foreground">
            Cars: {meta.numberOfCars}
          </p>
        )}
      </div>
    </div>
  )
}

const ChurchGraph = (props: ChurchGraphProps) => {
  const {
    loading,
    stat1,
    stat2,
    churchData,
    secondaryTitle,
    graphType,
    church,
    stat1Color,
    stat2Color,
  } = props
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  // Input is expected ascending (oldest → newest) — see `getServiceGraphData`
  // and the shepherding-control `sliceWindowedRecords`. Recharts renders the
  // array left-to-right verbatim, so ASC input = oldest-on-left, which is
  // what the FL dashboards have always promised.
  const sortedData = useMemo(() => [...(churchData ?? [])], [churchData])

  const dataMax = useMemo(() => {
    const safeMax = (key: string) => {
      const values = (churchData ?? [])
        .map((row: any) => Number(row?.[key]))
        .filter((n) => Number.isFinite(n) && n > 0)
      return values.length ? Math.max(...values) * 1.2 : 0
    }
    return {
      attendance: safeMax('attendance'),
      income: safeMax('income'),
      target: safeMax('target'),
    }
  }, [churchData])

  const primaryColor = stat1Color ?? PRIMARY_COLOR_BY_TYPE[graphType]
  const secondaryColor = stat2Color ?? SECONDARY_COLOR

  // At levels above Bacenta, individual "services" records are joint/combined services.
  const isJointServiceLevel = !['bacenta'].includes(church)
  const graphLabel =
    graphType === 'services' && isJointServiceLevel
      ? 'Joint Service'
      : (GRAPH_TYPE_LABELS[graphType] ?? capitalise(graphType))

  const graphTitle = stat2
    ? `${graphLabel} — Attendance & Income`
    : graphLabel

  const handleBarClick = (row: ChurchGraphRow | undefined, statKey: string) => {
    // Bussing aggregate bars don't have a single source record to drill
    // into, but each bar represents one ISO week — clicking jumps to the
    // arrivals summary dashboard for that week's Sunday so the user can
    // see "what was the bussing state on that day".
    if (graphType === 'bussingAggregate') {
      const sundayYmd = isoSundayOfWeek(row?.week, row?.year)
      if (!sundayYmd) return
      const arrivalsPath = ARRIVALS_PATH_BY_CHURCH[props.church]
      if (!arrivalsPath) return
      navigate(`${arrivalsPath}?date=${sundayYmd}`)
      return
    }

    if (!row?.id || row?.category?.includes('Aggregate')) return

    const routes: Record<string, { typename: string; route: string }> = {
      bussing: { typename: 'BussingRecord', route: 'bussing-details' },
      onStageAttendance: {
        typename: 'StageAttendanceRecord',
        route: 'onstage-attendance-details',
      },
    }
    const fallback = { typename: 'ServiceRecord', route: 'service-details' }
    const action =
      statKey === 'income' && graphType === 'bussing'
        ? fallback
        : routes[graphType] ?? fallback

    clickCard({ ...row, __typename: action.typename })
    navigate(`/${props.church}/${action.route}`)
  }

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-3">
        {loading ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <p className="text-sm font-medium text-foreground">{graphTitle}</p>
        )}
        {secondaryTitle && (
          <p className="truncate text-xs text-muted-foreground">
            {secondaryTitle}
          </p>
        )}
      </div>

      <div className="mt-3 h-72 w-full">
        {loading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              margin={{ top: 24, right: 12, left: 0, bottom: 10 }}
              barCategoryGap={sortedData.length <= 2 ? '28%' : '20%'}
            >
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeDasharray="4 6"
                vertical={false}
                opacity={0.55}
              />

              <XAxis
                dataKey="weekLabel"
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  fontWeight: 500,
                }}
                interval={0}
                tickFormatter={(label) => label || '—'}
              />
              <YAxis
                hide
                type="number"
                domain={[0, dataMax[stat1] || 'auto']}
                yAxisId="left"
                orientation="left"
              />
              <YAxis
                hide
                type="number"
                domain={[0, stat2 ? dataMax[stat2] || 'auto' : 'auto']}
                yAxisId="right"
                orientation="right"
              />

              <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.24)' }}
                content={
                  <ChartTooltip
                    data={sortedData}
                    paletteForPrimary={!stat1Color}
                  />
                }
              />

              <Bar
                name={capitalise(stat1)}
                dataKey={stat1}
                yAxisId="left"
                fill={primaryColor}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                cursor="pointer"
                onClick={(item: BarRectangleItem) =>
                  handleBarClick(item.payload as ChurchGraphRow, stat1)
                }
              >
                {!stat1Color &&
                  sortedData.map((row, index) => (
                    <Cell
                      key={`stat1-${row?.id ?? index}`}
                      fill={
                        RED_YELLOW_GREEN_PALETTE[
                          index % RED_YELLOW_GREEN_PALETTE.length
                        ]
                      }
                    />
                  ))}
                <LabelList
                  dataKey={stat1}
                  position="top"
                  content={renderBarLabel}
                />
              </Bar>

              {stat2 && (
                <Bar
                  name={capitalise(stat2)}
                  dataKey={stat2}
                  yAxisId="right"
                  fill={secondaryColor}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                  cursor="pointer"
                  onClick={(item: BarRectangleItem) =>
                    handleBarClick(item.payload as ChurchGraphRow, stat2)
                  }
                >
                  <LabelList
                    dataKey={stat2}
                    position="top"
                    content={renderBarLabel}
                  />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default ChurchGraph
