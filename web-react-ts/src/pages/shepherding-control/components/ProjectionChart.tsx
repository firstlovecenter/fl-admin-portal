import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import { ChurchLevelLower } from 'global-types'
import { weekLabelFor } from 'pages/services/graphs/graphs-utils'
import {
  AggregateRecord,
  AnchorWeekYear,
  MetricKey,
  ShepherdingLevel,
  WindowWeeks,
} from 'pages/shepherding-control/shepherding-control-types'
import {
  METRIC_COLOR,
  METRIC_DATAKEY,
  METRIC_DATASET,
  METRIC_UNIT,
  sliceWindowedRecords,
} from 'pages/shepherding-control/shepherding-control-utils'

type Props = {
  level: ShepherdingLevel
  serviceRecords: AggregateRecord[]
  bussingRecords: AggregateRecord[]
  metricA: MetricKey
  metricB: MetricKey | null
  anchor: AnchorWeekYear
  windowWeeks: WindowWeeks
  loading?: boolean
}

type ChartRow = {
  week: number | null
  year: number | null
  // `ChurchGraph` reads its category axis off `weekLabel`. Without it every row
  // resolves to `undefined`, the axis domain comes out empty and recharts draws
  // neither ticks nor bars — the projection chart rendered a blank plot area.
  weekLabel: string
  attendance: number | null
  income: number | null
  target: number | null
}

const churchKeyFor = (level: ShepherdingLevel): ChurchLevelLower | 'bacenta' =>
  level === 'Bacenta' ? 'bacenta' : (level.toLowerCase() as ChurchLevelLower)

const ProjectionChart = ({
  level,
  serviceRecords,
  bussingRecords,
  metricA,
  metricB,
  anchor,
  windowWeeks,
  loading,
}: Props) => {
  const { t } = useTranslation()
  // When the two metrics share the same dataKey (both attendance, both
  // income), we route metricB into the `target` slot so ChurchGraph can
  // draw a second bar without collapsing into a single key. The slot name
  // is internal — the chart legend is driven by `stat1`/`stat2` labels in
  // ChurchGraph itself.
  const dataKeyA = METRIC_DATAKEY[metricA]
  const dataKeyB = metricB ? METRIC_DATAKEY[metricB] : null
  const collision = dataKeyB != null && dataKeyA === dataKeyB
  const stat2Slot: 'attendance' | 'income' | 'target' | null = dataKeyB
    ? collision
      ? 'target'
      : dataKeyB
    : null

  const chartData = useMemo<ChartRow[]>(() => {
    const datasetA = METRIC_DATASET[metricA]
    const recordsA = sliceWindowedRecords(
      datasetA === 'service' ? serviceRecords : bussingRecords,
      anchor,
      windowWeeks
    )
    const datasetB = metricB ? METRIC_DATASET[metricB] : null
    const recordsB = metricB
      ? sliceWindowedRecords(
          datasetB === 'service' ? serviceRecords : bussingRecords,
          anchor,
          windowWeeks
        )
      : []

    const keyOf = (r: AggregateRecord) => `${r.year}-${r.week}`
    const recordsByKeyB = new Map(recordsB.map((r) => [keyOf(r), r]))

    return recordsA.map((rA) => {
      const rB = dataKeyB ? recordsByKeyB.get(keyOf(rA)) : undefined
      const row: ChartRow = {
        week: rA.week ?? null,
        year: rA.year ?? null,
        // Labelled through the trends graphs' own helper so both charts read
        // `W12` / `W52'25` identically.
        weekLabel: rA.week == null ? '' : weekLabelFor(rA.week, rA.year, t),
        attendance: null,
        income: null,
        target: null,
      }

      row[dataKeyA] = (rA[dataKeyA] as number | null | undefined) ?? null

      if (stat2Slot && rB) {
        row[stat2Slot] = (rB[dataKeyB!] as number | null | undefined) ?? null
      }

      return row
    })
  }, [
    serviceRecords,
    bussingRecords,
    metricA,
    metricB,
    anchor,
    windowWeeks,
    dataKeyA,
    dataKeyB,
    stat2Slot,
    t,
  ])

  const sameUnit =
    metricB != null && METRIC_UNIT[metricA] === METRIC_UNIT[metricB]
  const secondaryTitle = metricB
    ? sameUnit
      ? undefined
      : t('shepherding.dualAxis')
    : undefined

  const legend: Array<{ key: MetricKey; color: string; label: string }> = [
    {
      key: metricA,
      color: METRIC_COLOR[metricA],
      label: t(`shepherding.metrics.${metricA}`),
    },
  ]
  if (metricB) {
    legend.push({
      key: metricB,
      color: METRIC_COLOR[metricB],
      label: t(`shepherding.metrics.${metricB}`),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xl">
        {legend.map((entry) => (
          <span key={entry.key} className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block size-4 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-foreground">{entry.label}</span>
          </span>
        ))}
      </div>
      <ChurchGraph
        stat1={dataKeyA}
        stat2={stat2Slot}
        churchData={chartData}
        church={churchKeyFor(level)}
        graphType="serviceAggregate"
        loading={loading}
        secondaryTitle={secondaryTitle}
        stat1Color={METRIC_COLOR[metricA]}
        stat2Color={metricB ? METRIC_COLOR[metricB] : undefined}
      />
    </div>
  )
}

export default ProjectionChart
