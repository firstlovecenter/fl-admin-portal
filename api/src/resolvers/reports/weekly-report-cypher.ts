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

/* eslint-disable fl-cypher/no-interpolated-cypher --
 * Every `${...}` in this file is sourced from one of:
 *   - compile-time `ChurchLevel` literals validated by the `ScopeLevel` /
 *     `AggregateLevel` discriminated unions, OR
 *   - JS identifiers derived from those literals via `churchVar` / `leaderVar`
 *     (e.g. `bacentaLeader`), OR
 *   - calls to the static `weeklyEntryReturn` projection helper over the
 *     above literals.
 * The rule's `allowedIdentifiers` override only exempts bare-Identifier
 * fragments, so it cannot express this helper-call composition — hence a
 * file-level disable. None of the interpolated values come from request
 * payloads / JWT; the only runtime values ($id, $startWeekKey, $endWeekKey)
 * pass as $param bindings, so the ADR-012 hazard (user-controlled
 * interpolation) does not apply.
 * Reviewers: before approving changes to this disable, confirm every new
 * interpolation is a level literal, a `churchVar`/`leaderVar`-derived
 * identifier, or a `weeklyEntryReturn` call — never a resolver arg or JWT
 * field. */

/**
 * Projection helper. The two `*AggAlias` callers can be either an
 * `AggregateXxxRecord` node (higher levels) or a Cypher map literal (Bacenta).
 * In both shapes the helper reads these keys, so map-literal callers must
 * project them: service → `attendance, income, dollarIncome, currency,
 * numberOfServices, year, week`; bussing → `attendance, leaderDeclaration,
 * numberOfSprinters, numberOfUrvans, numberOfCars, bussingTopUp, year, week`.
 * The Bacenta callers intentionally omit `currency` — a leaf Bacenta is always
 * single-currency (GHS), so the null it yields is the correct native-currency
 * signal (the FE falls back to the church level). Renaming a key in the Bacenta
 * CALL blocks without updating this helper will silently null the corresponding
 * column in the response.
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
    serviceCurrency: ${serviceAggAlias}.currency,
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
    ORDER BY coalesce(serviceAgg.recomputedAt, datetime({epochSeconds: 0})) DESC, coalesce(serviceAgg.attendance, 0) DESC
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
    ORDER BY coalesce(bussingAgg.recomputedAt, datetime({epochSeconds: 0})) DESC, coalesce(bussingAgg.attendance, 0) DESC
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
    ORDER BY coalesce(serviceAgg.recomputedAt, datetime({epochSeconds: 0})) DESC, coalesce(serviceAgg.attendance, 0) DESC
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
    ORDER BY coalesce(bussingAgg.recomputedAt, datetime({epochSeconds: 0})) DESC, coalesce(bussingAgg.attendance, 0) DESC
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

/**
 * Generalised "sub-churches at a deeper target level" report. For any
 * (scope, target) pair where target is an aggregate-backed descendant of
 * scope (Campus / Stream / Council / Governorship — never Bacenta), return
 * one row per (target, week) with the in-between ancestor chain attached
 * as decorator entries.
 *
 * The picker on the FE lets the user choose `target` (deepest tick) and
 * which ancestor levels' columns to display; the cypher always projects
 * every in-between level so the response shape is stable per (scope,
 * target) and the FE drops what it doesn't want.
 *
 * Bacenta is intentionally excluded as a target — bacenta aggregates are
 * never written, so a Bacenta target would have to fall back to raw
 * `ServiceRecord`/`BussingRecord` aggregation, which is too heavy for this
 * code path. Bacenta-level CSVs remain available via the existing
 * `subChurchesReport` (Governorship scope) and the per-Bacenta drill-down.
 */
type AggregateLevel = 'Campus' | 'Stream' | 'Council' | 'Governorship'
type ScopeLevel = 'Oversight' | 'Campus' | 'Stream' | 'Council'

// In-between ancestor chain for each (scope -> target) walk. Top-down,
// EXCLUSIVE of both endpoints. Empty list means scope -> target is one
// HAS edge away.
const IN_BETWEEN: Record<
  ScopeLevel,
  Partial<Record<AggregateLevel, AggregateLevel[]>>
> = {
  Oversight: {
    Campus: [],
    Stream: ['Campus'],
    Council: ['Campus', 'Stream'],
    Governorship: ['Campus', 'Stream', 'Council'],
  },
  Campus: {
    Stream: [],
    Council: ['Stream'],
    Governorship: ['Stream', 'Council'],
  },
  Stream: {
    Council: [],
    Governorship: ['Council'],
  },
  Council: {
    Governorship: [],
  },
}

// Build JS identifier names (not Cypher) used by the template generator
// below. These produce Cypher variable names ('bacenta', 'bacentaLeader')
// from the compile-time level literals — never from request data.
// (The fl-cypher rule is disabled file-wide; see the header justification.)
const churchVar = (level: string) => level.toLowerCase()
const leaderVar = (level: string) => `${level.toLowerCase()}Leader`

const buildSubChurchesAtLevelCypher = (
  scope: ScopeLevel,
  target: AggregateLevel
): string => {
  const between = IN_BETWEEN[scope]?.[target]
  if (!between) {
    throw new Error(`Invalid sub-churches walk: ${scope} -> ${target}`)
  }

  const scopeVar = churchVar(scope)
  const targetVar = 'target'
  const chain = [scope, ...between, target]
  const walk = chain
    .map((lvl, i) => {
      if (i === 0) return `(${scopeVar}:${scope} {id: $id})`
      const v = lvl === target ? targetVar : churchVar(lvl)
      return `-[:HAS]->(${v}:${lvl})`
    })
    .join('')

  const leaderMatches = [target, ...between]
    .map(
      (lvl) =>
        `OPTIONAL MATCH (${
          lvl === target ? targetVar : churchVar(lvl)
        })<-[:LEADS]-(${leaderVar(lvl)}:Active:Member)`
    )
    .join('\n  ')

  const ancestorList =
    between.length === 0
      ? '[]'
      : `[${between
          .map(
            (lvl) =>
              `{level: '${lvl}', name: ${churchVar(
                lvl
              )}.name, leaderFirstName: ${leaderVar(
                lvl
              )}.firstName, leaderLastName: ${leaderVar(
                lvl
              )}.lastName, leaderPhone: ${leaderVar(lvl)}.phoneNumber}`
          )
          .join(', ')}]`

  const passthroughVars = [
    ...between.map(churchVar),
    targetVar,
    ...[target, ...between].map(leaderVar),
  ].join(', ')

  return `
  MATCH ${walk}
  ${leaderMatches}

  CALL {
    WITH ${targetVar}
    OPTIONAL MATCH (${targetVar})-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(serviceAgg:AggregateServiceRecord)
    WHERE (serviceAgg.year * 100 + serviceAgg.week) >= $startWeekKey
      AND (serviceAgg.year * 100 + serviceAgg.week) <= $endWeekKey
    WITH serviceAgg
    ORDER BY coalesce(serviceAgg.recomputedAt, datetime({epochSeconds: 0})) DESC, coalesce(serviceAgg.attendance, 0) DESC
    WITH serviceAgg.week AS week, serviceAgg.year AS year, head(collect(serviceAgg)) AS serviceAgg
    WITH week, year, serviceAgg
    WHERE serviceAgg IS NOT NULL
    RETURN collect({week: week, year: year, serviceAgg: serviceAgg}) AS serviceRows
  }

  CALL {
    WITH ${targetVar}
    OPTIONAL MATCH (${targetVar})-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING_AGGREGATE]->(bussingAgg:AggregateBussingRecord)
    WHERE (bussingAgg.year * 100 + bussingAgg.week) >= $startWeekKey
      AND (bussingAgg.year * 100 + bussingAgg.week) <= $endWeekKey
    WITH bussingAgg
    ORDER BY coalesce(bussingAgg.recomputedAt, datetime({epochSeconds: 0})) DESC, coalesce(bussingAgg.attendance, 0) DESC
    WITH bussingAgg.week AS week, bussingAgg.year AS year, head(collect(bussingAgg)) AS bussingAgg
    WITH week, year, bussingAgg
    WHERE bussingAgg IS NOT NULL
    RETURN collect({week: week, year: year, bussingAgg: bussingAgg}) AS bussingRows
  }

  WITH ${passthroughVars}, serviceRows, bussingRows
  WITH ${passthroughVars},
       [r IN serviceRows | r.year * 100 + r.week] +
       [r IN bussingRows | r.year * 100 + r.week] AS allKeys,
       serviceRows, bussingRows
  UNWIND allKeys AS weekKey
  WITH ${passthroughVars}, weekKey, serviceRows, bussingRows
  WITH ${passthroughVars}, weekKey,
       head([r IN serviceRows WHERE r.year * 100 + r.week = weekKey | r.serviceAgg]) AS serviceAgg,
       head([r IN bussingRows WHERE r.year * 100 + r.week = weekKey | r.bussingAgg]) AS bussingAgg
  WITH DISTINCT ${passthroughVars}, weekKey, serviceAgg, bussingAgg
  ORDER BY ${targetVar}.name ASC, weekKey DESC

  WITH collect({
    id: ${targetVar}.id + '-' + coalesce(serviceAgg.year, bussingAgg.year) + '-' + coalesce(serviceAgg.week, bussingAgg.week),
    churchId: ${targetVar}.id,
    churchName: ${targetVar}.name,
    churchLevel: '${target}',
    week: coalesce(serviceAgg.week, bussingAgg.week),
    year: coalesce(serviceAgg.year, bussingAgg.year),
    serviceAttendance: serviceAgg.attendance,
    serviceIncome: serviceAgg.income,
    serviceDollarIncome: serviceAgg.dollarIncome,
    numberOfServices: serviceAgg.numberOfServices,
    bussingAttendance: bussingAgg.attendance,
    bussingLeaderDeclaration: bussingAgg.leaderDeclaration,
    numberOfSprinters: bussingAgg.numberOfSprinters,
    numberOfUrvans: bussingAgg.numberOfUrvans,
    numberOfCars: bussingAgg.numberOfCars,
    bussingTopUp: bussingAgg.bussingTopUp,
    targetLeaderFirstName: ${leaderVar(target)}.firstName,
    targetLeaderLastName: ${leaderVar(target)}.lastName,
    targetLeaderPhone: ${leaderVar(target)}.phoneNumber,
    ancestors: ${ancestorList}
  }) AS entries
  RETURN entries
`
}
/* eslint-enable fl-cypher/no-interpolated-cypher */

// Pre-build all 10 templates at module load — fail fast on any (scope,
// target) typo rather than waiting for a user to hit a bad route.
export const SUB_CHURCHES_AT_LEVEL: Record<
  ScopeLevel,
  Partial<Record<AggregateLevel, string>>
> = {
  Oversight: {
    Campus: buildSubChurchesAtLevelCypher('Oversight', 'Campus'),
    Stream: buildSubChurchesAtLevelCypher('Oversight', 'Stream'),
    Council: buildSubChurchesAtLevelCypher('Oversight', 'Council'),
    Governorship: buildSubChurchesAtLevelCypher('Oversight', 'Governorship'),
  },
  Campus: {
    Stream: buildSubChurchesAtLevelCypher('Campus', 'Stream'),
    Council: buildSubChurchesAtLevelCypher('Campus', 'Council'),
    Governorship: buildSubChurchesAtLevelCypher('Campus', 'Governorship'),
  },
  Stream: {
    Council: buildSubChurchesAtLevelCypher('Stream', 'Council'),
    Governorship: buildSubChurchesAtLevelCypher('Stream', 'Governorship'),
  },
  Council: {
    Governorship: buildSubChurchesAtLevelCypher('Council', 'Governorship'),
  },
}

export type SubChurchesScope = ScopeLevel
export type SubChurchesTarget = AggregateLevel
