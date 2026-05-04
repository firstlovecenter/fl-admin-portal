interface TrendSparkProps {
  data?: { attendance?: string; income?: string; week?: number }[]
  incomeTracked: boolean
}

/** Weekly trend bar chart.
 *
 * Shows attendance as the primary brand-coloured bar, with a slim secondary
 * income bar beside it when income tracking is enabled. Pure SVG, no chart
 * library, so it stays small and matches the rest of the Tailwind/Shadcn
 * surface.
 */
const TrendSpark = ({ data, incomeTracked }: TrendSparkProps) => {
  const hasData = !!data && data.length > 0

  if (!hasData) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-zinc-200 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
        No service data yet
      </div>
    )
  }

  const recent = data.slice(-12)
  const points = recent.map((d) => ({
    week: d.week,
    attendance: Number.isFinite(parseFloat(d.attendance ?? ''))
      ? parseFloat(d.attendance ?? '0')
      : 0,
    income:
      incomeTracked && Number.isFinite(parseFloat(d.income ?? ''))
        ? parseFloat(d.income ?? '0')
        : 0,
  }))

  const maxAttendance = Math.max(...points.map((p) => p.attendance), 1)
  const maxIncome = Math.max(...points.map((p) => p.income), 1)

  const w = 800
  const h = 220
  const padX = 12
  const padTop = 12
  const padBottom = 28 // room for week labels
  const usableW = w - padX * 2
  const usableH = h - padTop - padBottom

  const groupW = usableW / points.length
  // Two bars per group when income is tracked, one otherwise.
  const showIncome = incomeTracked && points.some((p) => p.income > 0)
  const barsPerGroup = showIncome ? 2 : 1
  const barGap = 3
  const barW = Math.max(
    4,
    (groupW - barGap * (barsPerGroup + 1)) / barsPerGroup
  )

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-56 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Weekly attendance and income bar chart"
      >
        {/* Baseline */}
        <line
          x1={padX}
          x2={w - padX}
          y1={padTop + usableH}
          y2={padTop + usableH}
          className="stroke-zinc-200 dark:stroke-zinc-800"
          strokeWidth="1"
        />

        {points.map((p, i) => {
          const groupX = padX + i * groupW
          const attendanceH = (p.attendance / maxAttendance) * usableH
          const incomeH = showIncome ? (p.income / maxIncome) * usableH : 0
          const attendanceX = showIncome
            ? groupX + barGap
            : groupX + (groupW - barW) / 2
          const incomeX = groupX + barGap * 2 + barW

          return (
            <g key={`${p.week}-${i}`}>
              {/* Attendance bar (brand) */}
              <rect
                x={attendanceX}
                y={padTop + usableH - attendanceH}
                width={barW}
                height={Math.max(2, attendanceH)}
                rx={2}
                fill="hsl(var(--brand))"
              >
                <title>{`Week ${p.week ?? i + 1} · Attendance: ${
                  p.attendance
                }`}</title>
              </rect>

              {/* Income bar (muted) */}
              {showIncome && (
                <rect
                  x={incomeX}
                  y={padTop + usableH - incomeH}
                  width={barW}
                  height={Math.max(2, incomeH)}
                  rx={2}
                  className="fill-zinc-300 dark:fill-zinc-600"
                >
                  <title>{`Week ${p.week ?? i + 1} · Income: ${
                    p.income
                  }`}</title>
                </rect>
              )}

              {/* Week label */}
              {p.week !== undefined && (
                <text
                  x={groupX + groupW / 2}
                  y={h - 8}
                  textAnchor="middle"
                  className="fill-zinc-400 dark:fill-zinc-600"
                  style={{ fontSize: 10 }}
                >
                  W{p.week}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default TrendSpark
