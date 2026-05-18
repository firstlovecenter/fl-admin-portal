// Cypher for the comprehensive defaulters export.
//
// Two queries per level:
//   - DETAIL_BY_LEVEL: one row per Bacenta in scope, for the target week.
//   - SUMMARY_BY_LEVEL: one row per direct child of the queried level
//     (per-Governorship for Council, per-Council for Stream, per-Stream for
//     Campus). Returns counts that mirror the dashboard aggregates.
//
// `$weekStart` (Date) is optional; null means "current week" — same semantics
// as the GraphQL `*ThisWeek*` fields in services.graphql. The shared
// week-range CTE (Tue–Sun of the chosen week) is duplicated rather than
// extracted into a procedure — Neo4j 5 cannot hoist Cypher snippets across
// queries, and inlining keeps each query self-contained for the
// `cypher-reviewer` agent to audit.

import type { ChurchLevel } from '../utils/types'

export type DefaultersDownloadLevel = Extract<
  ChurchLevel,
  'Governorship' | 'Council' | 'Stream' | 'Campus'
>

// Tuesday-through-Sunday range derived from the chosen `today`. Mirrors the
// `WITH coalesce(date($weekStart), date()) AS today` pattern in
// services.graphql so historical defaulter computation here matches the
// dashboard exactly. The `date(...)` wrap is load-bearing — the GraphQL
// `Date` scalar (when sent as a `weekStart` query var) arrives in Cypher as
// a string, and `today.weekDay` on a string returns null, causing the
// week range to silently collapse back to the current week.
const WEEK_RANGE = `
  WITH this, coalesce(date($weekStart), date()) AS today
  WITH this, today, today.weekDay AS theDay
  WITH this, today, date(today) - duration({days: (theDay - 2)}) AS startDate
  WITH this, today, [day IN range(0, 5) | startDate + duration({days: day})] AS dates
`

// Picks the Bacenta's service record for the target week, if any. There can
// be at most one per week per Bacenta in practice (Sunday service); we still
// `collect` defensively and pull the first non-cancelled record so the
// pivot does not duplicate rows on bad historical data.
const RECORD_PICK = `
  OPTIONAL MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(serviceDate:TimeGraph)
    USING INDEX serviceDate:TimeGraph(date)
    WHERE serviceDate.date IN dates
  WITH bacenta, governorship, council, stream, leader, meetingDay, today,
       collect(DISTINCT record) AS records, collect(DISTINCT serviceDate.date) AS recordDates
  WITH bacenta, governorship, council, stream, leader, meetingDay, today, recordDates,
       [r IN records WHERE r.attendance IS NOT NULL][0] AS filledRecord,
       [r IN records WHERE r.noServiceReason IS NOT NULL][0] AS cancelRecord
`

// Bacenta -> {governorship, council, stream} resolution. `OPTIONAL` on
// council/stream so Governorship-level exports don't drop bacentas just
// because a parent traversal is shallower than required.
const BACENTA_CONTEXT = `
  MATCH (bacenta)<-[:HAS]-(governorship:Governorship)
  OPTIONAL MATCH (governorship)<-[:HAS]-(council:Council)
  OPTIONAL MATCH (council)<-[:HAS]-(stream:Stream)
  OPTIONAL MATCH (bacenta)<-[:LEADS]-(leader:Active:Member)
  OPTIONAL MATCH (bacenta)-[:MEETS_ON]->(meetingDay:ServiceDay)
`

const DETAIL_RETURN = `
RETURN
  stream.name AS stream,
  council.name AS council,
  governorship.name AS governorship,
  bacenta.name AS bacenta,
  CASE WHEN leader IS NOT NULL THEN leader.firstName + ' ' + leader.lastName ELSE NULL END AS leader,
  leader.phoneNumber AS leaderPhone,
  leader.whatsappNumber AS leaderWhatsapp,
  meetingDay.day AS meetingDay,
  bacenta.vacationStatus AS vacationStatus,
  CASE
    WHEN cancelRecord IS NOT NULL THEN 'Cancelled'
    WHEN filledRecord IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END AS serviceHeld,
  cancelRecord.noServiceReason AS cancellationReason,
  CASE WHEN size(recordDates) > 0 THEN toString(recordDates[0]) ELSE NULL END AS serviceDate,
  filledRecord.attendance AS attendance,
  filledRecord.income AS income,
  filledRecord.foreignCurrency AS foreignCurrency,
  CASE WHEN filledRecord IS NOT NULL THEN 'Yes' ELSE 'No' END AS formSubmitted,
  CASE
    WHEN filledRecord IS NULL THEN 'N/A'
    WHEN filledRecord.bankingSlip IS NOT NULL
       OR filledRecord.transactionStatus = 'success'
       OR filledRecord.tellerConfirmationTime IS NOT NULL THEN 'Yes'
    WHEN filledRecord.transactionStatus = 'reversed' THEN 'Reversed'
    WHEN filledRecord.transactionStatus = 'failed' THEN 'Failed'
    ELSE 'No'
  END AS bankingStatus
ORDER BY stream, council, governorship, bacenta
`

export const governorshipDetailRows = `
  MATCH (this:Governorship {id: $id})
  ${WEEK_RANGE}
  MATCH (this)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${RECORD_PICK}
  ${DETAIL_RETURN}
`

export const councilDetailRows = `
  MATCH (this:Council {id: $id})
  ${WEEK_RANGE}
  MATCH (this)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${RECORD_PICK}
  ${DETAIL_RETURN}
`

export const streamDetailRows = `
  MATCH (this:Stream {id: $id})
  ${WEEK_RANGE}
  MATCH (this)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${RECORD_PICK}
  ${DETAIL_RETURN}
`

export const campusDetailRows = `
  MATCH (this:Campus {id: $id})
  ${WEEK_RANGE}
  MATCH (this)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${RECORD_PICK}
  ${DETAIL_RETURN}
`

// Per-child rollup. The `WITH bacentas` step expands the children once and
// then matches their bacentas; the per-record subquery counts buckets the
// same way the dashboard does (services / form / banked / banking-defaulter
// / cancelled).
//
// Caveat (current week only): `formDefaulters` here is computed as
// `activeBacentas - servicesFiled - cancelled`, which counts a bacenta whose
// meeting day hasn't passed yet as a defaulter. The dashboard's
// `formDefaultersThisWeek` SDL field excludes those by gating on
// `day.dayNumber < date().dayOfWeek`. This means: for past weeks the export
// summary matches the dashboard exactly; for the current week mid-week, the
// export shows "end-of-week" projection which can overcount form defaulters
// for bacentas that haven't met yet. Acceptable for an export — the
// dashboard remains the live source of truth.
const CHILD_BACENTA_BUCKETS = `
  WITH child, today, dates,
       collect(DISTINCT bacenta) AS bacentas
  // For each bacenta in this child, find its service record (if any) for the week.
  UNWIND bacentas AS bacenta
  OPTIONAL MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    USING INDEX date:TimeGraph(date)
    WHERE date.date IN dates
  WITH child, bacentas, bacenta, collect(DISTINCT record) AS records
  WITH child, bacentas, bacenta,
       [r IN records WHERE r.attendance IS NOT NULL][0] AS filledRecord,
       [r IN records WHERE r.noServiceReason IS NOT NULL][0] AS cancelRecord
  WITH child, bacentas,
       count(filledRecord) AS servicesFiled,
       count(cancelRecord) AS cancelled,
       count(CASE
         WHEN filledRecord IS NOT NULL AND (
           filledRecord.bankingSlip IS NOT NULL
           OR filledRecord.transactionStatus = 'success'
           OR filledRecord.tellerConfirmationTime IS NOT NULL
         ) THEN 1 END) AS banked,
       count(CASE
         WHEN filledRecord IS NOT NULL
           AND filledRecord.bankingSlip IS NULL
           AND (filledRecord.transactionStatus IS NULL OR filledRecord.transactionStatus <> 'success')
           AND filledRecord.tellerConfirmationTime IS NULL THEN 1 END) AS bankingDefaulters
`

const SUMMARY_RETURN = `
  RETURN
    childName AS child,
    childLeader,
    size(bacentas) AS activeBacentas,
    servicesFiled,
    cancelled,
    banked,
    bankingDefaulters,
    size(bacentas) - servicesFiled - cancelled AS formDefaulters
  ORDER BY childName
`

// Council -> Governorship rollup.
export const councilSummaryByGovernorship = `
  MATCH (this:Council {id: $id})
  ${WEEK_RANGE}
  MATCH (this)-[:HAS]->(child:Governorship)
  OPTIONAL MATCH (child)-[:HAS]->(bacenta:Active:Bacenta)
  WITH child, today, dates, bacenta
  ${CHILD_BACENTA_BUCKETS}
  WITH child, bacentas, servicesFiled, cancelled, banked, bankingDefaulters,
       child.name AS childName,
       head([(child)<-[:LEADS]-(m:Active:Member) | m.firstName + ' ' + m.lastName]) AS childLeader
  ${SUMMARY_RETURN}
`

// Stream -> Council rollup.
export const streamSummaryByCouncil = `
  MATCH (this:Stream {id: $id})
  ${WEEK_RANGE}
  MATCH (this)-[:HAS]->(child:Council)
  OPTIONAL MATCH (child)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  WITH child, today, dates, bacenta
  ${CHILD_BACENTA_BUCKETS}
  WITH child, bacentas, servicesFiled, cancelled, banked, bankingDefaulters,
       child.name AS childName,
       head([(child)<-[:LEADS]-(m:Active:Member) | m.firstName + ' ' + m.lastName]) AS childLeader
  ${SUMMARY_RETURN}
`

// Campus -> Stream rollup.
export const campusSummaryByStream = `
  MATCH (this:Campus {id: $id})
  ${WEEK_RANGE}
  MATCH (this)-[:HAS]->(child:Stream)
  OPTIONAL MATCH (child)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  WITH child, today, dates, bacenta
  ${CHILD_BACENTA_BUCKETS}
  WITH child, bacentas, servicesFiled, cancelled, banked, bankingDefaulters,
       child.name AS childName,
       head([(child)<-[:LEADS]-(m:Active:Member) | m.firstName + ' ' + m.lastName]) AS childLeader
  ${SUMMARY_RETURN}
`

export const DEFAULTERS_DETAIL_BY_LEVEL: Record<
  DefaultersDownloadLevel,
  string
> = {
  Governorship: governorshipDetailRows,
  Council: councilDetailRows,
  Stream: streamDetailRows,
  Campus: campusDetailRows,
}

// Governorship has no children (Bacentas are the leaf), so no summary.
export const DEFAULTERS_SUMMARY_BY_LEVEL: Partial<
  Record<DefaultersDownloadLevel, string>
> = {
  Council: councilSummaryByGovernorship,
  Stream: streamSummaryByCouncil,
  Campus: campusSummaryByStream,
}

export const DEFAULTERS_NAME_QUERY_BY_LEVEL: Record<
  DefaultersDownloadLevel,
  string
> = {
  Governorship: `MATCH (n:Governorship {id: $id}) RETURN n.name AS name`,
  Council: `MATCH (n:Council {id: $id}) RETURN n.name AS name`,
  Stream: `MATCH (n:Stream {id: $id}) RETURN n.name AS name`,
  Campus: `MATCH (n:Campus {id: $id}) RETURN n.name AS name`,
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-church summary "at level" — pick row granularity + ancestor columns.
// Mirrors the GraphQL `subChurchesReportAtLevel` shape used by Bussing /
// Weekday (see `weekly-report-cypher.ts`). Bacenta is intentionally NOT a
// valid target — Bacenta-level detail is already in the per-Bacenta `detail`
// rows on this same payload, so emitting it here would just duplicate work.
// ────────────────────────────────────────────────────────────────────────────

export type DefaultersScopeLevel = Extract<
  DefaultersDownloadLevel,
  'Campus' | 'Stream' | 'Council'
>

export type DefaultersTargetLevel = Extract<
  ChurchLevel,
  'Stream' | 'Council' | 'Governorship'
>

// In-between ancestor chain for each (scope -> target) walk. Top-down,
// EXCLUSIVE of both endpoints. Empty list means scope -> target is one
// HAS edge away.
const DEF_IN_BETWEEN: Record<
  DefaultersScopeLevel,
  Partial<Record<DefaultersTargetLevel, DefaultersTargetLevel[]>>
> = {
  Council: {
    Governorship: [],
  },
  Stream: {
    Council: [],
    Governorship: ['Council'],
  },
  Campus: {
    Stream: [],
    Council: ['Stream'],
    Governorship: ['Stream', 'Council'],
  },
}

const churchVarFor = (level: string) => level.toLowerCase()
const leaderVarFor = (level: string) =>
  // eslint-disable-next-line fl-cypher/no-interpolated-cypher
  `${level.toLowerCase()}Leader`

/* eslint-disable fl-cypher/no-interpolated-cypher --
 * Every `${...}` is sourced from compile-time ChurchLevel literals validated
 * by the `DefaultersScopeLevel` / `DefaultersTargetLevel` discriminated
 * unions above, OR identifier names derived from those literals via
 * `churchVarFor` / `leaderVarFor`. No user input reaches the template. The
 * runtime params ($id, $weekStart) still pass as bindings. */
const buildDefaultersSummaryAtLevelCypher = (
  scope: DefaultersScopeLevel,
  target: DefaultersTargetLevel
): string => {
  const between = DEF_IN_BETWEEN[scope]?.[target]
  if (!between) {
    throw new Error(`Invalid defaulters walk: ${scope} -> ${target}`)
  }

  // Path: scope -> [...between] -> target -> ... -> Governorship -> Bacenta
  // The bacenta tail varies: it's always exactly enough HAS edges to reach
  // an `Active:Bacenta` from the target.
  const targetVar = 'target'
  const intermediates = [scope, ...between]
  const upperWalk = intermediates
    .map((lvl, i) => {
      if (i === 0) return `(${churchVarFor(lvl)}:${lvl} {id: $id})`
      return `-[:HAS]->(${churchVarFor(lvl)}:${lvl})`
    })
    .concat([`-[:HAS]->(${targetVar}:${target})`])
    .join('')

  // From `target` down to Bacenta — the chain depends on what target is.
  // Governorship -> Bacenta (1 hop). Council -> Governorship -> Bacenta (2).
  // Stream -> Council -> Governorship -> Bacenta (3).
  const TAIL_BY_TARGET: Record<DefaultersTargetLevel, string> = {
    Governorship: `(${targetVar})-[:HAS]->(bacenta:Active:Bacenta)`,
    Council: `(${targetVar})-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)`,
    Stream: `(${targetVar})-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)`,
  }

  const leaderMatches = [target, ...between]
    .map(
      (lvl) =>
        `OPTIONAL MATCH (${
          lvl === target ? targetVar : churchVarFor(lvl)
        })<-[:LEADS]-(${leaderVarFor(lvl)}:Active:Member)`
    )
    .join('\n  ')

  const ancestorList =
    between.length === 0
      ? '[]'
      : `[${between
          .map(
            (lvl) =>
              `{level: '${lvl}', name: ${churchVarFor(
                lvl
              )}.name, leaderFirstName: ${leaderVarFor(
                lvl
              )}.firstName, leaderLastName: ${leaderVarFor(
                lvl
              )}.lastName, leaderPhone: ${leaderVarFor(lvl)}.phoneNumber}`
          )
          .join(', ')}]`

  // Variables threaded through the bacenta-bucket WITH steps. We need to
  // keep the target + its leader + every in-between church + its leader
  // available all the way to the RETURN map.
  const decoratorVars = [
    ...between.map(churchVarFor),
    ...[target, ...between].map(leaderVarFor),
  ]
  const passthroughVars = [targetVar, ...decoratorVars].join(', ')

  // The bacenta-bucket logic mirrors `CHILD_BACENTA_BUCKETS` above. Date
  // math lives inside the CALL subquery so the outer chain doesn't need
  // to thread `dates` through every `WITH` (which would otherwise force
  // us to repeat every decorator variable on each WITH step).
  return `
  MATCH ${upperWalk}
  ${leaderMatches}

  CALL {
    WITH ${targetVar}
    WITH ${targetVar}, coalesce(date($weekStart), date()) AS today
    WITH ${targetVar}, today, today.weekDay AS theDay
    WITH ${targetVar}, today, date(today) - duration({days: (theDay - 2)}) AS startDate
    WITH ${targetVar}, [day IN range(0, 5) | startDate + duration({days: day})] AS dates
    OPTIONAL MATCH ${TAIL_BY_TARGET[target]}
    OPTIONAL MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
      USING INDEX date:TimeGraph(date)
      WHERE date.date IN dates
    WITH bacenta, collect(DISTINCT record) AS records
    WITH bacenta,
         [r IN records WHERE r.attendance IS NOT NULL][0] AS filledRecord,
         [r IN records WHERE r.noServiceReason IS NOT NULL][0] AS cancelRecord
    WITH
      count(DISTINCT bacenta) AS activeBacentas,
      count(filledRecord) AS servicesFiled,
      count(cancelRecord) AS cancelled,
      count(CASE
        WHEN filledRecord IS NOT NULL AND (
          filledRecord.bankingSlip IS NOT NULL
          OR filledRecord.transactionStatus = 'success'
          OR filledRecord.tellerConfirmationTime IS NOT NULL
        ) THEN 1 END) AS banked,
      count(CASE
        WHEN filledRecord IS NOT NULL
          AND filledRecord.bankingSlip IS NULL
          AND (filledRecord.transactionStatus IS NULL OR filledRecord.transactionStatus <> 'success')
          AND filledRecord.tellerConfirmationTime IS NULL THEN 1 END) AS bankingDefaulters
    RETURN activeBacentas, servicesFiled, cancelled, banked, bankingDefaulters
  }

  WITH ${passthroughVars}, activeBacentas, servicesFiled, cancelled, banked, bankingDefaulters
  ORDER BY ${targetVar}.name ASC
  RETURN
    ${targetVar}.id AS targetId,
    ${targetVar}.name AS targetName,
    '${target}' AS targetLevel,
    ${leaderVarFor(target)}.firstName AS targetLeaderFirstName,
    ${leaderVarFor(target)}.lastName AS targetLeaderLastName,
    ${leaderVarFor(target)}.phoneNumber AS targetLeaderPhone,
    activeBacentas,
    servicesFiled,
    cancelled,
    banked,
    bankingDefaulters,
    activeBacentas - servicesFiled - cancelled AS formDefaulters,
    ${ancestorList} AS ancestors
`
}
/* eslint-enable fl-cypher/no-interpolated-cypher */

// Pre-built map for all 6 (scope, target) combos. Failure at module load
// rather than runtime if any combo is wired wrong.
export const DEFAULTERS_SUMMARY_AT_LEVEL: Record<
  DefaultersScopeLevel,
  Partial<Record<DefaultersTargetLevel, string>>
> = {
  Council: {
    Governorship: buildDefaultersSummaryAtLevelCypher(
      'Council',
      'Governorship'
    ),
  },
  Stream: {
    Council: buildDefaultersSummaryAtLevelCypher('Stream', 'Council'),
    Governorship: buildDefaultersSummaryAtLevelCypher('Stream', 'Governorship'),
  },
  Campus: {
    Stream: buildDefaultersSummaryAtLevelCypher('Campus', 'Stream'),
    Council: buildDefaultersSummaryAtLevelCypher('Campus', 'Council'),
    Governorship: buildDefaultersSummaryAtLevelCypher('Campus', 'Governorship'),
  },
}

export const isDefaultersScopeLevel = (
  value: string
): value is DefaultersScopeLevel =>
  value === 'Council' || value === 'Stream' || value === 'Campus'

export const isDefaultersTargetLevel = (
  value: string
): value is DefaultersTargetLevel =>
  value === 'Stream' || value === 'Council' || value === 'Governorship'
