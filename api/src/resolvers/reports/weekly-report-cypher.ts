/**
 * Weekly church report Cypher.
 *
 * Returns one row per (church, week) joining `AggregateServiceRecord` and
 * `AggregateBussingRecord` from the church's ServiceLog. The `weekKey` is
 * `year * 100 + week` so the range filter is a single comparable Int.
 *
 * Two shapes:
 *   - `<level>WeeklyReport` — single church (the `$id` itself). Used for both
 *     "Services Held" and "Weekday Income & Bussing" reports — the FE selects
 *     which columns to surface in each CSV.
 *   - `<level>SubChurchesWeeklyReport` — one row per (immediate child, week).
 *     For Bacenta this returns the bacenta itself (degenerate).
 */

const weeklyEntryReturn = (
  alias: string,
  levelLiteral: string,
  serviceAggAlias: string,
  bussingAggAlias: string
) => `
  ${alias} {
    id: ${alias}.id + '-' + coalesce(${serviceAggAlias}.year, ${bussingAggAlias}.year) + '-' + coalesce(${serviceAggAlias}.week, ${bussingAggAlias}.week),
    churchId: ${alias}.id,
    churchName: ${alias}.name,
    churchLevel: '${levelLiteral}',
    week: coalesce(${serviceAggAlias}.week, ${bussingAggAlias}.week),
    year: coalesce(${serviceAggAlias}.year, ${bussingAggAlias}.year),
    serviceAttendance: ${serviceAggAlias}.attendance,
    serviceIncome: ${serviceAggAlias}.income,
    serviceDollarIncome: ${serviceAggAlias}.dollarIncome,
    numberOfServices: ${serviceAggAlias}.numberOfServices,
    bussingAttendance: ${bussingAggAlias}.attendance,
    bussingLeaderDeclaration: ${bussingAggAlias}.leaderDeclaration,
    numberOfSprinters: ${bussingAggAlias}.numberOfSprinters,
    numberOfUrvans: ${bussingAggAlias}.numberOfUrvans,
    numberOfCars: ${bussingAggAlias}.numberOfCars,
    bussingTopUp: ${bussingAggAlias}.bussingTopUp
  }
`

/**
 * The single-church weekly report. Pulls every (week, year) pair from either
 * service OR bussing aggregate within the range and joins on the same
 * (week, year) pair so a row exists if EITHER aggregate is present.
 *
 * `recomputedAt` deduplication mirrors the existing aggregateServiceRecords
 * @cypher block: aggregates can have duplicates from earlier writes; we keep
 * the latest one per (week, year).
 */
const buildSelfWeeklyCypher = (level: string, label: string) => `
  MATCH (church:${level} {id: $id})

  CALL {
    WITH church
    OPTIONAL MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(serviceAgg:AggregateServiceRecord)
    WHERE (serviceAgg.year * 100 + serviceAgg.week) >= $startWeekKey
      AND (serviceAgg.year * 100 + serviceAgg.week) <= $endWeekKey
    WITH serviceAgg
    ORDER BY coalesce(serviceAgg.recomputedAt, datetime({epochSeconds: 0})) DESC
    WITH serviceAgg.week AS week, serviceAgg.year AS year, head(collect(serviceAgg)) AS serviceAgg
    RETURN collect({week: week, year: year, serviceAgg: serviceAgg}) AS serviceRows
  }

  CALL {
    WITH church
    OPTIONAL MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(bussingAgg:AggregateBussingRecord)
    WHERE (bussingAgg.year * 100 + bussingAgg.week) >= $startWeekKey
      AND (bussingAgg.year * 100 + bussingAgg.week) <= $endWeekKey
    WITH bussingAgg
    ORDER BY coalesce(bussingAgg.recomputedAt, datetime({epochSeconds: 0})) DESC
    WITH bussingAgg.week AS week, bussingAgg.year AS year, head(collect(bussingAgg)) AS bussingAgg
    RETURN collect({week: week, year: year, bussingAgg: bussingAgg}) AS bussingRows
  }

  WITH church, serviceRows, bussingRows
  WITH church,
       [r IN serviceRows | r.year * 100 + r.week] +
       [r IN bussingRows | r.year * 100 + r.week] AS allKeys,
       serviceRows, bussingRows
  UNWIND allKeys AS weekKey
  WITH church, weekKey, serviceRows, bussingRows
  WITH church, weekKey,
       head([r IN serviceRows WHERE r.year * 100 + r.week = weekKey | r.serviceAgg]) AS serviceAgg,
       head([r IN bussingRows WHERE r.year * 100 + r.week = weekKey | r.bussingAgg]) AS bussingAgg
  WITH DISTINCT church, weekKey, serviceAgg, bussingAgg
  ORDER BY weekKey DESC

  WITH collect(${weeklyEntryReturn(
    'church',
    label,
    'serviceAgg',
    'bussingAgg'
  )}) AS entries
  RETURN entries
`

export const bacentaWeeklyReport = buildSelfWeeklyCypher('Bacenta', 'Bacenta')
export const governorshipWeeklyReport = buildSelfWeeklyCypher(
  'Governorship',
  'Governorship'
)
export const councilWeeklyReport = buildSelfWeeklyCypher('Council', 'Council')
export const streamWeeklyReport = buildSelfWeeklyCypher('Stream', 'Stream')
export const campusWeeklyReport = buildSelfWeeklyCypher('Campus', 'Campus')
export const oversightWeeklyReport = buildSelfWeeklyCypher(
  'Oversight',
  'Oversight'
)

/**
 * Per-immediate-child weekly report. For each `parent → :HAS → child` edge,
 * return one row per (child, week-with-data). For Bacenta scope this returns
 * the bacenta's own rows (no children below).
 */
const buildChildrenWeeklyCypher = (parentLevel: string, childLevel: string) => `
  MATCH (parent:${parentLevel} {id: $id})-[:HAS]->(child:${childLevel})

  CALL {
    WITH child
    OPTIONAL MATCH (child)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(serviceAgg:AggregateServiceRecord)
    WHERE (serviceAgg.year * 100 + serviceAgg.week) >= $startWeekKey
      AND (serviceAgg.year * 100 + serviceAgg.week) <= $endWeekKey
    WITH serviceAgg
    ORDER BY coalesce(serviceAgg.recomputedAt, datetime({epochSeconds: 0})) DESC
    WITH serviceAgg.week AS week, serviceAgg.year AS year, head(collect(serviceAgg)) AS serviceAgg
    RETURN collect({week: week, year: year, serviceAgg: serviceAgg}) AS serviceRows
  }

  CALL {
    WITH child
    OPTIONAL MATCH (child)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(bussingAgg:AggregateBussingRecord)
    WHERE (bussingAgg.year * 100 + bussingAgg.week) >= $startWeekKey
      AND (bussingAgg.year * 100 + bussingAgg.week) <= $endWeekKey
    WITH bussingAgg
    ORDER BY coalesce(bussingAgg.recomputedAt, datetime({epochSeconds: 0})) DESC
    WITH bussingAgg.week AS week, bussingAgg.year AS year, head(collect(bussingAgg)) AS bussingAgg
    RETURN collect({week: week, year: year, bussingAgg: bussingAgg}) AS bussingRows
  }

  WITH child, serviceRows, bussingRows
  WITH child,
       [r IN serviceRows | r.year * 100 + r.week] +
       [r IN bussingRows | r.year * 100 + r.week] AS allKeys,
       serviceRows, bussingRows
  UNWIND allKeys AS weekKey
  WITH child, weekKey, serviceRows, bussingRows
  WITH child, weekKey,
       head([r IN serviceRows WHERE r.year * 100 + r.week = weekKey | r.serviceAgg]) AS serviceAgg,
       head([r IN bussingRows WHERE r.year * 100 + r.week = weekKey | r.bussingAgg]) AS bussingAgg
  WITH DISTINCT child, weekKey, serviceAgg, bussingAgg
  ORDER BY child.name ASC, weekKey DESC

  WITH collect(${weeklyEntryReturn(
    'child',
    childLevel,
    'serviceAgg',
    'bussingAgg'
  )}) AS entries
  RETURN entries
`

/**
 * Bacenta has no sub-churches in the directory hierarchy. Return its own
 * weekly rows so the FE doesn't need to special-case.
 */
export const bacentaSubChurchesReport = bacentaWeeklyReport
export const governorshipSubChurchesReport = buildChildrenWeeklyCypher(
  'Governorship',
  'Bacenta'
)
export const councilSubChurchesReport = buildChildrenWeeklyCypher(
  'Council',
  'Governorship'
)
export const streamSubChurchesReport = buildChildrenWeeklyCypher(
  'Stream',
  'Council'
)
export const campusSubChurchesReport = buildChildrenWeeklyCypher(
  'Campus',
  'Stream'
)
export const oversightSubChurchesReport = buildChildrenWeeklyCypher(
  'Oversight',
  'Campus'
)
