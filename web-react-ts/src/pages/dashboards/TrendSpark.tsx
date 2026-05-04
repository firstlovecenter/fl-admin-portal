import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface TrendSparkProps {
  data?: { attendance?: string; income?: string; week?: number | string }[]
  incomeTracked: boolean
  mode?: 'weekday' | 'bussing'
}

interface ChartPoint {
  week: number | null
  weekLabel: string
  attendance: number
  income: number
}

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

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-40 rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
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
}: TrendSparkProps) => {
  const hasData = !!data && data.length > 0

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
        {mode === 'bussing' ? 'No bussing data yet' : 'No service data yet'}
      </div>
    )
  }

  const recent = data.slice(-12)
  const groupedByWeek = new Map<string, ChartPoint>()

  recent.forEach((d, index) => {
    const parsedWeek = d.week == null ? NaN : Number(d.week)
    const week = Number.isFinite(parsedWeek) ? parsedWeek : null
    const key = week !== null ? String(week) : `unknown-${index}`

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
        week,
        weekLabel: week !== null ? `Week ${week}` : 'Week N/A',
        attendance,
        income,
      })
      return
    }

    groupedByWeek.set(key, {
      ...prev,
      attendance: prev.attendance + attendance,
      income: prev.income + income,
    })
  })

  const chartData = Array.from(groupedByWeek.values())
  const showIncome =
    mode === 'weekday' && incomeTracked && chartData.some((p) => p.income > 0)
  const hasRenderableValues = chartData.some(
    (p) => p.attendance > 0 || (showIncome && p.income > 0)
  )

  if (!chartData.length || !hasRenderableValues) {
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
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 12, left: 0, bottom: 10 }}
          barCategoryGap={chartData.length <= 2 ? '28%' : '20%'}
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
          />

          {showIncome && (
            <Bar
              dataKey="income"
              name="Income"
              fill={incomeColor}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TrendSpark
