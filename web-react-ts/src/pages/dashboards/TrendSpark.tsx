import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TrendSparkProps {
  data?: {
    id?: string
    category?: string
    attendance?: string
    income?: string
    week?: number | string
    year?: number | string
    date?: string
  }[]
  incomeTracked: boolean
  mode?: 'weekday' | 'bussing'
  onBarClick?: (point: {
    id?: string
    category?: string
    week: number | null
    year: number | null
  }) => void
}

interface ChartPoint {
  id?: string
  category?: string
  week: number | null
  year: number | null
  weekLabel: string
  attendance: number
  income: number
}

const WEEK_WINDOW_SIZE = 4
const drillableCategories = new Set(['services', 'bussing', 'rehearsals'])

interface TooltipEntry {
  value?: number | string
  name?: string
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

interface ChartBarLabelProps {
  x?: number
  y?: number
  width?: number
  value?: number | string
}

const compactNumberFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const renderBarLabel = ({ x, y, width, value }: ChartBarLabelProps) => {
  const numericValue = typeof value === 'number' ? value : Number(value)

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0 ||
    x == null ||
    y == null ||
    width == null
  ) {
    return null
  }

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fill="hsl(var(--muted-foreground))"
      fontSize={11}
      fontWeight={600}
    >
      {compactNumberFormatter.format(numericValue)}
    </text>
  )
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-40 rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="flex items-center gap-2 text-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-foreground">
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString('en-GH')
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const TrendSpark = ({
  data,
  incomeTracked,
  mode = 'weekday',
  onBarClick,
}: TrendSparkProps) => {
  const hasData = !!data && data.length > 0

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
        {mode === 'bussing' ? 'No bussing data yet' : 'No service data yet'}
      </div>
    )
  }

  const chartData = useMemo(() => {
    const groupedByWeek = new Map<string, ChartPoint>()

    data.forEach((d, index) => {
      const parsedWeek = d.week == null ? NaN : Number(d.week)
      const week = Number.isFinite(parsedWeek) ? parsedWeek : null
      const parsedYear = d.year == null ? NaN : Number(d.year)
      const yearFromRecord = Number.isFinite(parsedYear) ? parsedYear : null
      const yearFromDate = d.date ? Number(d.date.slice(0, 4)) : NaN
      const year =
        yearFromRecord ?? (Number.isFinite(yearFromDate) ? yearFromDate : null)
      const key =
        week !== null && year !== null
          ? `${year}-${week}`
          : week !== null
          ? `week-${week}-${index}`
          : `unknown-${index}`

      const attendance = Number.isFinite(parseFloat(d.attendance ?? ''))
        ? parseFloat(d.attendance ?? '0')
        : 0
      const income =
        incomeTracked && Number.isFinite(parseFloat(d.income ?? ''))
          ? parseFloat(d.income ?? '0')
          : 0

      const prev = groupedByWeek.get(key)
      if (!prev) {
        groupedByWeek.set(key, {
          id: d.id,
          category: d.category,
          week,
          year,
          weekLabel: week !== null ? `Week ${week}` : 'Week N/A',
          attendance,
          income,
        })
        return
      }

      groupedByWeek.set(key, {
        ...prev,
        id: prev.id || d.id,
        category: prev.category || d.category,
        attendance: prev.attendance + attendance,
        income: prev.income + income,
      })
    })

    return Array.from(groupedByWeek.values()).sort((a, b) => {
      if (a.year !== null && b.year !== null && a.year !== b.year) {
        return a.year - b.year
      }

      if (a.week !== null && b.week !== null) {
        return a.week - b.week
      }

      if (a.week === null && b.week === null) return 0
      if (a.week === null) return -1
      if (b.week === null) return 1

      return 0
    })
  }, [data, incomeTracked])

  const [windowEndIndex, setWindowEndIndex] = useState(chartData.length)

  useEffect(() => {
    setWindowEndIndex(chartData.length)
  }, [chartData.length, mode])

  const windowStartIndex = Math.max(0, windowEndIndex - WEEK_WINDOW_SIZE)
  const visibleChartData = chartData.slice(windowStartIndex, windowEndIndex)
  const canViewOlder = windowStartIndex > 0
  const canViewNewer = windowEndIndex < chartData.length
  const hasClickableData = visibleChartData.some(
    (point) =>
      !!point.id && !!point.category && drillableCategories.has(point.category)
  )

  const viewOlder = () => {
    setWindowEndIndex((current) =>
      Math.max(WEEK_WINDOW_SIZE, current - WEEK_WINDOW_SIZE)
    )
  }

  const viewNewer = () => {
    setWindowEndIndex((current) =>
      Math.min(chartData.length, current + WEEK_WINDOW_SIZE)
    )
  }
  const showIncome =
    mode === 'weekday' &&
    incomeTracked &&
    visibleChartData.some((p) => p.income > 0)
  const hasRenderableValues = visibleChartData.some(
    (p) => p.attendance > 0 || (showIncome && p.income > 0)
  )
  const hasAnyRenderableValues = chartData.some(
    (p) =>
      p.attendance > 0 || (mode === 'weekday' && incomeTracked && p.income > 0)
  )

  if (!chartData.length || !hasAnyRenderableValues) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
        {mode === 'bussing' ? 'No bussing data yet' : 'No service data yet'}
      </div>
    )
  }

  const attendanceColor =
    mode === 'bussing' ? 'hsl(var(--destructive))' : 'hsl(var(--arrivals))'
  const incomeColor = 'hsl(var(--success))'
  const gridColor = 'hsl(var(--border))'
  const axisColor = 'hsl(var(--muted-foreground))'

  return (
    <div className="w-full">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visibleChartData}
            margin={{ top: 24, right: 12, left: 0, bottom: 10 }}
            barCategoryGap={visibleChartData.length <= 2 ? '28%' : '20%'}
          >
            <CartesianGrid
              stroke={gridColor}
              strokeDasharray="4 6"
              vertical={false}
              opacity={0.55}
            />

            <XAxis
              dataKey="weekLabel"
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
              interval={0}
              tickFormatter={(value) => value.replace('Week ', 'W')}
            />

            <YAxis hide />

            <Tooltip
              cursor={{ fill: 'hsl(var(--accent) / 0.24)' }}
              content={<ChartTooltip />}
            />

            <Bar
              dataKey="attendance"
              name={mode === 'bussing' ? 'Bussing' : 'Weekday attendance'}
              fill={attendanceColor}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              cursor={hasClickableData ? 'pointer' : 'default'}
              onClick={(point: ChartPoint) => {
                if (
                  !point?.id ||
                  !point?.category ||
                  !drillableCategories.has(point.category) ||
                  !onBarClick
                ) {
                  return
                }

                onBarClick({
                  id: point.id,
                  category: point.category,
                  week: point.week,
                  year: point.year,
                })
              }}
            >
              <LabelList
                dataKey="attendance"
                position="top"
                content={renderBarLabel}
              />
            </Bar>

            {showIncome && (
              <Bar
                dataKey="income"
                name="Income"
                fill={incomeColor}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                cursor={hasClickableData ? 'pointer' : 'default'}
                onClick={(point: ChartPoint) => {
                  if (
                    !point?.id ||
                    !point?.category ||
                    !drillableCategories.has(point.category) ||
                    !onBarClick
                  ) {
                    return
                  }

                  onBarClick({
                    id: point.id,
                    category: point.category,
                    week: point.week,
                    year: point.year,
                  })
                }}
              >
                <LabelList
                  dataKey="income"
                  position="top"
                  content={renderBarLabel}
                />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!hasRenderableValues && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          No values in this 4-week window. Use Previous to view older weeks.
        </p>
      )}

      {chartData.length > WEEK_WINDOW_SIZE && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={viewOlder}
            disabled={!canViewOlder}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="size-3.5" />
            Previous
          </button>

          <span className="text-xs text-muted-foreground">
            {visibleChartData[0]?.weekLabel} -{' '}
            {visibleChartData[visibleChartData.length - 1]?.weekLabel}
          </span>

          <button
            type="button"
            onClick={viewNewer}
            disabled={!canViewNewer}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default TrendSpark
