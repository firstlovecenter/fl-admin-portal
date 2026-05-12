import { useMemo } from 'react'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import { ChurchLevelLower } from 'global-types'
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
  METRIC_LABEL,
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
  ])

  const sameUnit =
    metricB != null && METRIC_UNIT[metricA] === METRIC_UNIT[metricB]
  const secondaryTitle = metricB
    ? `${METRIC_LABEL[metricA]} + ${METRIC_LABEL[metricB]}${
        sameUnit ? '' : ' (dual axis)'
      }`
    : METRIC_LABEL[metricA]

  return (
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
  )
}

export default ProjectionChart
