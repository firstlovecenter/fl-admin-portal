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

/**
 * Projection helper. The two `*AggAlias` callers can be either an
 * `AggregateXxxRecord` node (higher levels) or a Cypher map literal (Bacenta).
 * In both shapes the helper reads these keys, so map-literal callers must
 * project them: service → `attendance, income, dollarIncome, numberOfServices,
 * year, week`; bussing → `attendance, leaderDeclaration, numberOfSprinters,
 * numberOfUrvans, numberOfCars, bussingTopUp, year, week`. Renaming a key in
 * the Bacenta CALL blocks without updating this helper will silently null
 * the corresponding column in the response.
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
    WITH week, year, serviceAgg
    WHERE serviceAgg IS NOT NULL
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
    WITH week, year, bussingAgg
    WHERE bussingAgg IS NOT NULL
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

/**
 * Bacenta-specific weekly report. Bacenta is the leaf of the directory and no
 * job writes per-Bacenta `AggregateServiceRecord` / `AggregateBussingRecord`
 * (the aggregators only roll Bacenta data UP into Governorship+ aggregates).
 * So we read raw `ServiceRecord` / `BussingRecord` directly via the TimeGraph
 * date and project the same `WeeklyChurchReportEntry` shape. `:NoService`
 * markers are excluded on the service side to mirror the higher-level
 * aggregators; `BussingRecord` has no equivalent marker label, so the
 * bussing branch has no analogous filter by design.
 *
 * The `WHERE year IS NOT NULL AND week IS NOT NULL` guard after each
 * grouping is load-bearing: when the OPTIONAL MATCH yields no rows, the
 * subsequent aggregation still emits one synthetic `(year=null, week=null,
 * sums=0)` row. Without the guard, that row's null weekKey carries through
 * UNWIND and produces an entry whose non-nullable `id` would be null.
 */
export const bacentaWeeklyReport = `
  MATCH (church:Bacenta {id: $id})

  CALL {
    WITH church
    OPTIONAL MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(t:TimeGraph)
    WHERE NOT record:NoService
      AND (t.date.year * 100 + t.date.week) >= $startWeekKey
      AND (t.date.year * 100 + t.date.week) <= $endWeekKey
    WITH DISTINCT t.date.year AS year, t.date.week AS week, record
    WITH year, week,
         count(DISTINCT record) AS numberOfServices,
         round(toFloat(sum(coalesce(record.attendance, 0))), 2) AS attendance,
         round(toFloat(sum(coalesce(record.income, 0))), 2) AS income,
         round(toFloat(sum(coalesce(record.dollarIncome, 0))), 2) AS dollarIncome
    WITH year, week, numberOfServices, attendance, income, dollarIncome
    WHERE year IS NOT NULL AND week IS NOT NULL
    RETURN collect({
      week: week, year: year,
      numberOfServices: numberOfServices,
      attendance: attendance,
      income: income,
      dollarIncome: dollarIncome
    }) AS serviceRows
  }

  CALL {
    WITH church
    OPTIONAL MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(t:TimeGraph)
    WHERE (t.date.year * 100 + t.date.week) >= $startWeekKey
      AND (t.date.year * 100 + t.date.week) <= $endWeekKey
    WITH DISTINCT t.date.year AS year, t.date.week AS week, record
    WITH year, week,
         round(toFloat(sum(coalesce(record.attendance, 0))), 2) AS attendance,
         round(toFloat(sum(coalesce(record.leaderDeclaration, 0))), 2) AS leaderDeclaration,
         sum(coalesce(record.numberOfSprinters, 0)) AS numberOfSprinters,
         sum(coalesce(record.numberOfUrvans, 0)) AS numberOfUrvans,
         sum(coalesce(record.numberOfCars, 0)) AS numberOfCars,
         round(toFloat(sum(coalesce(record.bussingTopUp, 0))), 2) AS bussingTopUp
    WITH year, week, attendance, leaderDeclaration, numberOfSprinters, numberOfUrvans, numberOfCars, bussingTopUp
    WHERE year IS NOT NULL AND week IS NOT NULL
    RETURN collect({
      week: week, year: year,
      attendance: attendance,
      leaderDeclaration: leaderDeclaration,
      numberOfSprinters: numberOfSprinters,
      numberOfUrvans: numberOfUrvans,
      numberOfCars: numberOfCars,
      bussingTopUp: bussingTopUp
    }) AS bussingRows
  }

  WITH church, serviceRows, bussingRows
  WITH church,
       [r IN serviceRows | r.year * 100 + r.week] +
       [r IN bussingRows | r.year * 100 + r.week] AS allKeys,
       serviceRows, bussingRows
  UNWIND allKeys AS weekKey
  WITH church, weekKey, serviceRows, bussingRows
  WITH church, weekKey,
       head([r IN serviceRows WHERE r.year * 100 + r.week = weekKey | r]) AS serviceAgg,
       head([r IN bussingRows WHERE r.year * 100 + r.week = weekKey | r]) AS bussingAgg
  WITH DISTINCT church, weekKey, serviceAgg, bussingAgg
  ORDER BY weekKey DESC

  WITH collect(${weeklyEntryReturn(
    'church',
    'Bacenta',
    'serviceAgg',
    'bussingAgg'
  )}) AS entries
  RETURN entries
`
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
    WITH week, year, serviceAgg
    WHERE serviceAgg IS NOT NULL
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
    WITH week, year, bussingAgg
    WHERE bussingAgg IS NOT NULL
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
 * Per-Bacenta-child weekly report. Aggregators only roll Bacenta data UP into
 * Governorship+ aggregates — no `AggregateServiceRecord` /
 * `AggregateBussingRecord` is ever written for a Bacenta. So the
 * Governorship → Bacenta sub-churches view must read raw `ServiceRecord` /
 * `BussingRecord` per child, mirroring `bacentaWeeklyReport`'s shape.
 *
 * The two `WHERE year IS NOT NULL AND week IS NOT NULL` guards mirror the
 * Bacenta-self path: when an OPTIONAL MATCH yields no rows, the subsequent
 * aggregation still emits one synthetic null-keyed row that would otherwise
 * leak through with a null `id`.
 */
const governorshipBacentaSubChurchesCypher = `
  MATCH (parent:Governorship {id: $id})-[:HAS]->(child:Bacenta)

  CALL {
    WITH child
    OPTIONAL MATCH (child)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(t:TimeGraph)
    WHERE NOT record:NoService
      AND (t.date.year * 100 + t.date.week) >= $startWeekKey
      AND (t.date.year * 100 + t.date.week) <= $endWeekKey
    WITH DISTINCT t.date.year AS year, t.date.week AS week, record
    WITH year, week,
         count(DISTINCT record) AS numberOfServices,
         round(toFloat(sum(coalesce(record.attendance, 0))), 2) AS attendance,
         round(toFloat(sum(coalesce(record.income, 0))), 2) AS income,
         round(toFloat(sum(coalesce(record.dollarIncome, 0))), 2) AS dollarIncome
    WITH year, week, numberOfServices, attendance, income, dollarIncome
    WHERE year IS NOT NULL AND week IS NOT NULL
    RETURN collect({
      week: week, year: year,
      numberOfServices: numberOfServices,
      attendance: attendance,
      income: income,
      dollarIncome: dollarIncome
    }) AS serviceRows
  }

  CALL {
    WITH child
    OPTIONAL MATCH (child)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(record:BussingRecord)-[:BUSSED_ON]->(t:TimeGraph)
    WHERE (t.date.year * 100 + t.date.week) >= $startWeekKey
      AND (t.date.year * 100 + t.date.week) <= $endWeekKey
    WITH DISTINCT t.date.year AS year, t.date.week AS week, record
    WITH year, week,
         round(toFloat(sum(coalesce(record.attendance, 0))), 2) AS attendance,
         round(toFloat(sum(coalesce(record.leaderDeclaration, 0))), 2) AS leaderDeclaration,
         sum(coalesce(record.numberOfSprinters, 0)) AS numberOfSprinters,
         sum(coalesce(record.numberOfUrvans, 0)) AS numberOfUrvans,
         sum(coalesce(record.numberOfCars, 0)) AS numberOfCars,
         round(toFloat(sum(coalesce(record.bussingTopUp, 0))), 2) AS bussingTopUp
    WITH year, week, attendance, leaderDeclaration, numberOfSprinters, numberOfUrvans, numberOfCars, bussingTopUp
    WHERE year IS NOT NULL AND week IS NOT NULL
    RETURN collect({
      week: week, year: year,
      attendance: attendance,
      leaderDeclaration: leaderDeclaration,
      numberOfSprinters: numberOfSprinters,
      numberOfUrvans: numberOfUrvans,
      numberOfCars: numberOfCars,
      bussingTopUp: bussingTopUp
    }) AS bussingRows
  }

  WITH child, serviceRows, bussingRows
  WITH child,
       [r IN serviceRows | r.year * 100 + r.week] +
       [r IN bussingRows | r.year * 100 + r.week] AS allKeys,
       serviceRows, bussingRows
  UNWIND allKeys AS weekKey
  WITH child, weekKey, serviceRows, bussingRows
  WITH child, weekKey,
       head([r IN serviceRows WHERE r.year * 100 + r.week = weekKey | r]) AS serviceAgg,
       head([r IN bussingRows WHERE r.year * 100 + r.week = weekKey | r]) AS bussingAgg
  WITH DISTINCT child, weekKey, serviceAgg, bussingAgg
  ORDER BY child.name ASC, weekKey DESC

  WITH collect(${weeklyEntryReturn(
    'child',
    'Bacenta',
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
export const governorshipSubChurchesReport =
  governorshipBacentaSubChurchesCypher
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
