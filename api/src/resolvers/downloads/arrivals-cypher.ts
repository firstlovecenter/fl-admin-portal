// Cypher for the comprehensive arrivals export.
//
// Three sheets per export:
//   1. DETAIL_BY_LEVEL — one row per Bacenta in scope for the chosen
//      `$arrivalDate`, with bussing summary columns.
//   2. VEHICLE_BY_LEVEL — one row per VehicleRecord on that date. Useful
//      for treasurers reconciling individual vehicle payments.
//   3. SUMMARY_BY_LEVEL (Council+) — one row per direct child of the
//      queried level, rolling up the per-Bacenta detail.
//
// `$arrivalDate` is a YYYY-MM-DD string (matches the existing
// `bacentasNoActivity(arrivalDate: String!)` pattern in arrivals.graphql).
// Cypher wraps it in `date(...)` so a string parameter is normalised to a
// Cypher Date — the same load-bearing wrap we needed for `$weekStart` on
// the defaulters export.

import type { ChurchLevel } from '../utils/types'

export type ArrivalsDownloadLevel = Extract<
  ChurchLevel,
  'Governorship' | 'Council' | 'Stream' | 'Campus'
>

// Per-Bacenta context: governorship/council/stream + leader + meeting day.
// `OPTIONAL` on council/stream so Governorship-level exports keep all
// bacentas even if a parent traversal is shallower than required.
const BACENTA_CONTEXT = `
  MATCH (bacenta)<-[:HAS]-(governorship:Governorship)
  OPTIONAL MATCH (governorship)<-[:HAS]-(council:Council)
  OPTIONAL MATCH (council)<-[:HAS]-(stream:Stream)
  OPTIONAL MATCH (bacenta)<-[:LEADS]-(leader:Active:Member)
  OPTIONAL MATCH (bacenta)-[:MEETS_ON]->(meetingDay:ServiceDay)
`

// Single BussingRecord for this date (if any) — mirrors the new
// `Bacenta.bussingRecordForDate` field.
const BUSSING_PICK = `
  OPTIONAL MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(bussingDate:TimeGraph)
    WHERE date(bussingDate.date) = date($arrivalDate)
  WITH bacenta, governorship, council, stream, leader, meetingDay,
       collect(DISTINCT bussing) AS bussings
  WITH bacenta, governorship, council, stream, leader, meetingDay,
       bussings[0] AS bussing
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
  CASE WHEN bussing IS NOT NULL THEN 'Yes' ELSE 'No' END AS bussingRecorded,
  bussing.attendance AS attendance,
  bussing.leaderDeclaration AS leaderDeclaration,
  coalesce(bussing.numberOfSprinters, 0) AS sprinters,
  coalesce(bussing.numberOfUrvans, 0) AS urvans,
  coalesce(bussing.numberOfCars, 0) AS cars,
  bussing.bussingCost AS bussingCost,
  bussing.bussingTopUp AS bussingTopUp
ORDER BY stream, council, governorship, bacenta
`

export const governorshipDetailRows = `
  MATCH (this:Governorship {id: $id})-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${BUSSING_PICK}
  ${DETAIL_RETURN}
`

export const councilDetailRows = `
  MATCH (this:Council {id: $id})-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${BUSSING_PICK}
  ${DETAIL_RETURN}
`

export const streamDetailRows = `
  MATCH (this:Stream {id: $id})-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${BUSSING_PICK}
  ${DETAIL_RETURN}
`

export const campusDetailRows = `
  MATCH (this:Campus {id: $id})-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${BUSSING_PICK}
  ${DETAIL_RETURN}
`

// Vehicle-level rows: one row per VehicleRecord in scope on this date.
// `momoNumber` is intentionally NOT returned — treasurers see the masked
// last-4 in the spreadsheet so a leaked export does not leak full mobile
// money numbers. The full number is still on the screen for the payer
// flow inside the app.
const VEHICLE_RETURN = `
RETURN
  stream.name AS stream,
  council.name AS council,
  governorship.name AS governorship,
  bacenta.name AS bacenta,
  vehicle.vehicle AS vehicleType,
  vehicle.attendance AS attendance,
  vehicle.leaderDeclaration AS leaderDeclaration,
  vehicle.vehicleCost AS vehicleCost,
  vehicle.vehicleTopUp AS vehicleTopUp,
  CASE
    WHEN vehicle.momoNumber IS NULL THEN NULL
    ELSE '****' + right(vehicle.momoNumber, 4)
  END AS momoNumberMasked,
  vehicle.mobileNetwork AS mobileNetwork,
  vehicle.transactionStatus AS transactionStatus,
  CASE WHEN vehicle.outbound = true THEN 'Outbound' ELSE 'Inbound' END AS direction,
  toString(vehicle.arrivalTime) AS arrivalTime,
  vehicle.comments AS comments
ORDER BY stream, council, governorship, bacenta, vehicle.vehicle
`

const VEHICLE_PICK = `
  OPTIONAL MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(bussingDate:TimeGraph)
    WHERE date(bussingDate.date) = date($arrivalDate)
  OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(vehicle:VehicleRecord)
  WITH stream, council, governorship, bacenta, vehicle
  WHERE vehicle IS NOT NULL
`

export const governorshipVehicleRows = `
  MATCH (this:Governorship {id: $id})-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${VEHICLE_PICK}
  ${VEHICLE_RETURN}
`

export const councilVehicleRows = `
  MATCH (this:Council {id: $id})-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${VEHICLE_PICK}
  ${VEHICLE_RETURN}
`

export const streamVehicleRows = `
  MATCH (this:Stream {id: $id})-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${VEHICLE_PICK}
  ${VEHICLE_RETURN}
`

export const campusVehicleRows = `
  MATCH (this:Campus {id: $id})-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${BACENTA_CONTEXT}
  ${VEHICLE_PICK}
  ${VEHICLE_RETURN}
`

// Per-child rollup. Each child node yields one row aggregating its bacentas
// for the chosen date.
const SUMMARY_RETURN = `
  RETURN
    childName AS child,
    childLeader,
    activeBacentas,
    bacentasWithBussing,
    totalAttendance,
    totalLeaderDeclaration,
    totalSprinters,
    totalUrvans,
    totalCars,
    totalBussingTopUp,
    totalBussingCost
  ORDER BY childName
`

const CHILD_BUCKETS = `
  WITH child, collect(DISTINCT bacenta) AS bacentaList
  UNWIND bacentaList AS bacenta
  OPTIONAL MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(bussingDate:TimeGraph)
    WHERE date(bussingDate.date) = date($arrivalDate)
  // Dedupe bussing records per bacenta — schema doesn't enforce uniqueness
  // on (bacenta, date), so a re-recorded bussing day could yield duplicate
  // BussingRecord nodes that would double-count attendance, top-up, etc.
  // The detail/vehicle queries dedupe via collect(...)[0]; do the same here.
  WITH child, bacentaList, bacenta, collect(DISTINCT bussing)[0] AS bussing
  WITH child,
       size(bacentaList) AS activeBacentas,
       count(bussing) AS bacentasWithBussing,
       sum(coalesce(bussing.attendance, 0)) AS totalAttendance,
       sum(coalesce(bussing.leaderDeclaration, 0)) AS totalLeaderDeclaration,
       sum(coalesce(bussing.numberOfSprinters, 0)) AS totalSprinters,
       sum(coalesce(bussing.numberOfUrvans, 0)) AS totalUrvans,
       sum(coalesce(bussing.numberOfCars, 0)) AS totalCars,
       sum(coalesce(bussing.bussingTopUp, 0)) AS totalBussingTopUp,
       sum(coalesce(bussing.bussingCost, 0)) AS totalBussingCost
  WITH child, activeBacentas, bacentasWithBussing, totalAttendance,
       totalLeaderDeclaration, totalSprinters, totalUrvans, totalCars,
       totalBussingTopUp, totalBussingCost,
       child.name AS childName,
       head([(child)<-[:LEADS]-(m:Active:Member) | m.firstName + ' ' + m.lastName]) AS childLeader
`

export const councilSummaryByGovernorship = `
  MATCH (this:Council {id: $id})-[:HAS]->(child:Governorship)
  OPTIONAL MATCH (child)-[:HAS]->(bacenta:Active:Bacenta)
  ${CHILD_BUCKETS}
  ${SUMMARY_RETURN}
`

export const streamSummaryByCouncil = `
  MATCH (this:Stream {id: $id})-[:HAS]->(child:Council)
  OPTIONAL MATCH (child)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${CHILD_BUCKETS}
  ${SUMMARY_RETURN}
`

export const campusSummaryByStream = `
  MATCH (this:Campus {id: $id})-[:HAS]->(child:Stream)
  OPTIONAL MATCH (child)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)
  ${CHILD_BUCKETS}
  ${SUMMARY_RETURN}
`

export const ARRIVALS_DETAIL_BY_LEVEL: Record<ArrivalsDownloadLevel, string> = {
  Governorship: governorshipDetailRows,
  Council: councilDetailRows,
  Stream: streamDetailRows,
  Campus: campusDetailRows,
}

export const ARRIVALS_VEHICLE_BY_LEVEL: Record<ArrivalsDownloadLevel, string> =
  {
    Governorship: governorshipVehicleRows,
    Council: councilVehicleRows,
    Stream: streamVehicleRows,
    Campus: campusVehicleRows,
  }

// Governorship has no children to roll up — bacentas are the leaf.
export const ARRIVALS_SUMMARY_BY_LEVEL: Partial<
  Record<ArrivalsDownloadLevel, string>
> = {
  Council: councilSummaryByGovernorship,
  Stream: streamSummaryByCouncil,
  Campus: campusSummaryByStream,
}

export const ARRIVALS_NAME_QUERY_BY_LEVEL: Record<
  ArrivalsDownloadLevel,
  string
> = {
  Governorship: `MATCH (n:Governorship {id: $id}) RETURN n.name AS name`,
  Council: `MATCH (n:Council {id: $id}) RETURN n.name AS name`,
  Stream: `MATCH (n:Stream {id: $id}) RETURN n.name AS name`,
  Campus: `MATCH (n:Campus {id: $id}) RETURN n.name AS name`,
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-church summary "at level" — pick row granularity + ancestor columns.
// Same shape as DEFAULTERS_SUMMARY_AT_LEVEL, see comment block in
// defaulters-cypher.ts. Bacenta is not a valid target (per-Bacenta detail
// is already on the existing `detail` rows in this same payload).
// ────────────────────────────────────────────────────────────────────────────

export type ArrivalsScopeLevel = Extract<
  ArrivalsDownloadLevel,
  'Campus' | 'Stream' | 'Council'
>

export type ArrivalsTargetLevel = Extract<
  ChurchLevel,
  'Stream' | 'Council' | 'Governorship'
>

const ARR_IN_BETWEEN: Record<
  ArrivalsScopeLevel,
  Partial<Record<ArrivalsTargetLevel, ArrivalsTargetLevel[]>>
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

const arrChurchVarFor = (level: string) => level.toLowerCase()
const arrLeaderVarFor = (level: string) =>
  // eslint-disable-next-line fl-cypher/no-interpolated-cypher
  `${level.toLowerCase()}Leader`

/* eslint-disable fl-cypher/no-interpolated-cypher --
 * Every `${...}` is sourced from compile-time ChurchLevel literals validated
 * by the `ArrivalsScopeLevel` / `ArrivalsTargetLevel` discriminated unions,
 * OR identifier names derived from those literals via `arrChurchVarFor` /
 * `arrLeaderVarFor`. No user input reaches the template. Runtime params
 * ($id, $arrivalDate) still pass as bindings. */
const buildArrivalsSummaryAtLevelCypher = (
  scope: ArrivalsScopeLevel,
  target: ArrivalsTargetLevel
): string => {
  const between = ARR_IN_BETWEEN[scope]?.[target]
  if (!between) {
    throw new Error(`Invalid arrivals walk: ${scope} -> ${target}`)
  }

  const targetVar = 'target'
  const intermediates = [scope, ...between]
  const upperWalk = intermediates
    .map((lvl, i) => {
      if (i === 0) return `(${arrChurchVarFor(lvl)}:${lvl} {id: $id})`
      return `-[:HAS]->(${arrChurchVarFor(lvl)}:${lvl})`
    })
    .concat([`-[:HAS]->(${targetVar}:${target})`])
    .join('')

  const TAIL_BY_TARGET: Record<ArrivalsTargetLevel, string> = {
    Governorship: `(${targetVar})-[:HAS]->(bacenta:Active:Bacenta)`,
    Council: `(${targetVar})-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)`,
    Stream: `(${targetVar})-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)`,
  }

  const leaderMatches = [target, ...between]
    .map(
      (lvl) =>
        `OPTIONAL MATCH (${
          lvl === target ? targetVar : arrChurchVarFor(lvl)
        })<-[:LEADS]-(${arrLeaderVarFor(lvl)}:Active:Member)`
    )
    .join('\n  ')

  const ancestorList =
    between.length === 0
      ? '[]'
      : `[${between
          .map(
            (lvl) =>
              `{level: '${lvl}', name: ${arrChurchVarFor(
                lvl
              )}.name, leaderFirstName: ${arrLeaderVarFor(
                lvl
              )}.firstName, leaderLastName: ${arrLeaderVarFor(
                lvl
              )}.lastName, leaderPhone: ${arrLeaderVarFor(lvl)}.phoneNumber}`
          )
          .join(', ')}]`

  const decoratorVars = [
    ...between.map(arrChurchVarFor),
    ...[target, ...between].map(arrLeaderVarFor),
  ]
  const passthroughVars = [targetVar, ...decoratorVars].join(', ')

  // Bacenta-bucket logic mirrors CHILD_BUCKETS above. We inline the
  // dedup `collect(DISTINCT bussing)[0]` so duplicate bussing nodes
  // (schema doesn't enforce uniqueness on (bacenta, date)) don't
  // double-count attendance / top-up.
  return `
  MATCH ${upperWalk}
  ${leaderMatches}

  CALL {
    WITH ${targetVar}
    OPTIONAL MATCH ${TAIL_BY_TARGET[target]}
    OPTIONAL MATCH (bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(bussingDate:TimeGraph)
      WHERE date(bussingDate.date) = date($arrivalDate)
    WITH bacenta, collect(DISTINCT bussing)[0] AS bussing
    WITH
      count(DISTINCT bacenta) AS activeBacentas,
      count(bussing) AS bacentasWithBussing,
      sum(coalesce(bussing.attendance, 0)) AS totalAttendance,
      sum(coalesce(bussing.leaderDeclaration, 0)) AS totalLeaderDeclaration,
      sum(coalesce(bussing.numberOfSprinters, 0)) AS totalSprinters,
      sum(coalesce(bussing.numberOfUrvans, 0)) AS totalUrvans,
      sum(coalesce(bussing.numberOfCars, 0)) AS totalCars,
      sum(coalesce(bussing.bussingTopUp, 0)) AS totalBussingTopUp,
      sum(coalesce(bussing.bussingCost, 0)) AS totalBussingCost
    RETURN activeBacentas, bacentasWithBussing, totalAttendance,
           totalLeaderDeclaration, totalSprinters, totalUrvans, totalCars,
           totalBussingTopUp, totalBussingCost
  }

  WITH ${passthroughVars}, activeBacentas, bacentasWithBussing,
       totalAttendance, totalLeaderDeclaration, totalSprinters,
       totalUrvans, totalCars, totalBussingTopUp, totalBussingCost
  ORDER BY ${targetVar}.name ASC
  RETURN
    ${targetVar}.id AS targetId,
    ${targetVar}.name AS targetName,
    '${target}' AS targetLevel,
    ${arrLeaderVarFor(target)}.firstName AS targetLeaderFirstName,
    ${arrLeaderVarFor(target)}.lastName AS targetLeaderLastName,
    ${arrLeaderVarFor(target)}.phoneNumber AS targetLeaderPhone,
    activeBacentas,
    bacentasWithBussing,
    totalAttendance,
    totalLeaderDeclaration,
    totalSprinters,
    totalUrvans,
    totalCars,
    totalBussingTopUp,
    totalBussingCost,
    ${ancestorList} AS ancestors
`
}
/* eslint-enable fl-cypher/no-interpolated-cypher */

export const ARRIVALS_SUMMARY_AT_LEVEL: Record<
  ArrivalsScopeLevel,
  Partial<Record<ArrivalsTargetLevel, string>>
> = {
  Council: {
    Governorship: buildArrivalsSummaryAtLevelCypher('Council', 'Governorship'),
  },
  Stream: {
    Council: buildArrivalsSummaryAtLevelCypher('Stream', 'Council'),
    Governorship: buildArrivalsSummaryAtLevelCypher('Stream', 'Governorship'),
  },
  Campus: {
    Stream: buildArrivalsSummaryAtLevelCypher('Campus', 'Stream'),
    Council: buildArrivalsSummaryAtLevelCypher('Campus', 'Council'),
    Governorship: buildArrivalsSummaryAtLevelCypher('Campus', 'Governorship'),
  },
}

export const isArrivalsScopeLevel = (
  value: string
): value is ArrivalsScopeLevel =>
  value === 'Council' || value === 'Stream' || value === 'Campus'

export const isArrivalsTargetLevel = (
  value: string
): value is ArrivalsTargetLevel =>
  value === 'Stream' || value === 'Council' || value === 'Governorship'
