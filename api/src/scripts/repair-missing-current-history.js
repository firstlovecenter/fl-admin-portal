#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * SYN-153 repair: restore CURRENT_HISTORY for churches that have a current
 * leader (incoming :LEADS) but no (church)-[:CURRENT_HISTORY]->(:ServiceLog).
 *
 * Root cause: `disconnectChurchLeader` (directory/servant-cypher.ts) DELETES
 * the church + leader CURRENT_HISTORY when a leader is removed, but
 * `connectChurchLeader` only re-adds :LEADS — the new ServiceLog +
 * CURRENT_HISTORY is created by the separate makeHistoryServiceLog /
 * connectServiceLog step. Any leader change that skipped that step leaves the
 * church leaderful but with no CURRENT_HISTORY, so the aggregation Lambdas
 * (which MATCH (church)-[:CURRENT_HISTORY]->(:ServiceLog)) silently skip it and
 * recordService cannot attach a record. The old log usually lingers via
 * HAS_HISTORY.
 *
 * Two repair modes, applied in order:
 *   1. REPOINT  — church still has an orphaned (church)-[:HAS_HISTORY]->(:ServiceLog).
 *                 Restore CURRENT_HISTORY (church + leader) to the most recent one.
 *                 Non-destructive: only MERGEs the deleted pointer back.
 *   2. CREATE   — church has no ServiceLog at all. Create one mirroring the
 *                 app's makeHistoryServiceLog + connectServiceLog essentials
 *                 (:HistoryLog:ServiceLog + Target{target:8} + RECORDED_ON +
 *                 LOGGED_BY + HAS_HISTORY + CURRENT_HISTORY for church & leader).
 *
 * `priority` is set per church level to match the values the app writes
 * (Bacenta 7 → Denomination 1; see LEVEL_PRIORITY, mirroring
 * setPriorityLevel in directory/utils.ts). LOGGED_BY is set to the
 * leader as a stand-in for the acting user (no request context in a script).
 *
 * After this runs, re-run the aggregation backfill so the repaired churches'
 * historical weeks get AggregateServiceRecord / AggregateBussingRecord nodes.
 *
 * Usage:
 *   NEO4J_URI=... NEO4J_USER=neo4j NEO4J_PASSWORD=*** \
 *   node api/src/scripts/repair-missing-current-history.js [--dry-run] [--urgent-only] [--allow-prod]
 *
 *   --dry-run       Report what would change; write nothing.
 *   --urgent-only   Only repair churches that already hold service/bussing data.
 *   --allow-prod    Required to run against the production URI (safety gate).
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const urgentOnly = argv.includes('--urgent-only')
const allowProd = argv.includes('--allow-prod')

// Church levels that own a ServiceLog, and the `priority` the app stamps on it.
const LEVEL_PRIORITY = {
  Bacenta: 7,
  Governorship: 6,
  Council: 5,
  Stream: 4,
  Campus: 3,
  Oversight: 2,
  Denomination: 1,
}

// Deterministic precedence for picking a church's level from labels().
const LEVEL_ORDER = [
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'Denomination',
]

// Churches that own a ServiceLog (mirrors connectServiceLog's WHERE clause).
const LEADER_CHURCH_PREDICATE = `(
  c:Bacenta OR c:Governorship OR c:Council OR c:Stream OR c:Campus OR c:Oversight
  OR c:Denomination
)`

// A church "has data" if it (or a descendant Bacenta) holds a real service or
// bussing record — used by --urgent-only to prioritise data-bearing churches.
const HAS_DATA_PREDICATE = `(
  EXISTS { (c)-[:CURRENT_HISTORY|HAS_HISTORY|HAS_SERVICE|HAS_BUSSING|HAS*1..7]->(r:ServiceRecord) WHERE NOT r:NoService }
  OR EXISTS { (c)-[:HAS*0..6]->(:Bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(:BussingRecord) }
)`

const dataGate = urgentOnly ? `AND ${HAS_DATA_PREDICATE}` : ''

// Mode 1 — restore CURRENT_HISTORY to the most recent existing ServiceLog.
// Interpolated fragments below are hardcoded module constants
// (LEADER_CHURCH_PREDICATE / dataGate), not untrusted input; every runtime
// value goes through $param bindings, so ADR-012's injection concern does not
// apply here.
// eslint-disable-next-line fl-cypher/no-interpolated-cypher
const repointQuery = `
  MATCH (leader:Member)-[:LEADS]->(c)
  WHERE ${LEADER_CHURCH_PREDICATE}
    AND NOT EXISTS { (c)-[:CURRENT_HISTORY]->() }
    AND EXISTS { (c)-[:HAS_HISTORY]->(:ServiceLog) }
    ${dataGate}
  WITH DISTINCT c, leader
  CALL (c) {
    MATCH (c)-[:HAS_HISTORY]->(sl:ServiceLog)
    RETURN sl ORDER BY coalesce(sl.timeStamp, datetime({epochSeconds: 0})) DESC LIMIT 1
  }
  MERGE (c)-[:CURRENT_HISTORY]->(sl)
  MERGE (leader)-[:CURRENT_HISTORY]->(sl)
  RETURN count(DISTINCT c) AS churchesRepointed
`

// Mode 2 — create a fresh ServiceLog for churches that have none.
// $priorities is a map { Bacenta: 7, ... } so one query covers every level.
// LEVEL_ORDER fixes a deterministic precedence for the level→priority lookup
// (labels() storage order is not guaranteed; a multi-level node must not pick
// a priority at random). A church with no known level label is skipped.
// Interpolated fragments are hardcoded constants (see Mode 1 note); runtime
// values use $param bindings.
// eslint-disable-next-line fl-cypher/no-interpolated-cypher
const createQuery = `
  MATCH (leader:Member)-[:LEADS]->(c)
  WHERE ${LEADER_CHURCH_PREDICATE}
    AND NOT EXISTS { (c)-[:CURRENT_HISTORY]->() }
    AND NOT EXISTS { (c)-[:HAS_HISTORY]->(:ServiceLog) }
    ${dataGate}
  WITH c, collect(DISTINCT leader) AS leaders,
       head([lv IN $levelOrder WHERE lv IN labels(c)]) AS lvl
  WHERE lvl IS NOT NULL
  MERGE (date:TimeGraph {date: date()})
  CREATE (log:HistoryLog:ServiceLog {
    id: apoc.create.uuid(),
    timeStamp: datetime(),
    priority: $priorities[lvl],
    historyRecord: 'ServiceLog restored by SYN-153 repair: church had a leader but no CURRENT_HISTORY'
  })
  CREATE (target:Target { id: apoc.create.uuid(), target: 8, date: date() })
  MERGE (log)-[:HAS_TARGET]->(target)
  MERGE (log)-[:RECORDED_ON]->(date)
  MERGE (c)-[:HAS_HISTORY]->(log)
  MERGE (c)-[:CURRENT_HISTORY]->(log)
  WITH c, log, leaders
  UNWIND leaders AS leader
  MERGE (leader)-[:HAS_HISTORY]->(log)
  MERGE (leader)-[:CURRENT_HISTORY]->(log)
  MERGE (log)-[:LOGGED_BY]->(leader)
  RETURN count(DISTINCT c) AS churchesGivenNewLog
`

// eslint-disable-next-line fl-cypher/no-interpolated-cypher
const countQuery = `
  MATCH (leader:Member)-[:LEADS]->(c)
  WHERE ${LEADER_CHURCH_PREDICATE}
    AND NOT EXISTS { (c)-[:CURRENT_HISTORY]->() }
    ${dataGate}
  WITH DISTINCT c, EXISTS { (c)-[:HAS_HISTORY]->(:ServiceLog) } AS repointable
  RETURN sum(CASE WHEN repointable THEN 1 ELSE 0 END) AS repointable,
         sum(CASE WHEN NOT repointable THEN 1 ELSE 0 END) AS needsNewLog
`

async function main() {
  const uri = process.env.NEO4J_URI
  const user = process.env.NEO4J_USER || 'neo4j'
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !password) {
    console.error('Refusing to run: NEO4J_URI and NEO4J_PASSWORD must be set.')
    process.exit(1)
  }

  const isProd =
    uri.includes('neo4j.firstlovecenter.com') && !uri.includes('dev-')
  if (isProd && !allowProd) {
    console.error('Refusing to run against production without --allow-prod.')
    process.exit(1)
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  const session = driver.session()

  try {
    console.log(`Connected to ${uri}${isProd ? '  [PRODUCTION]' : ''}`)
    console.log(
      `Mode: ${urgentOnly ? 'urgent-only' : 'all leaderful churches'}${
        dryRun ? '  (dry-run)' : ''
      }`
    )

    const c = await session.executeRead((tx) => tx.run(countQuery))
    const repointable = c.records[0].get('repointable')
    const needsNewLog = c.records[0].get('needsNewLog')
    console.log(
      `To repair: ${repointable} re-pointable, ${needsNewLog} need a new ServiceLog.`
    )

    if (dryRun) {
      console.log('Dry run — no writes performed.')
      return
    }

    const r1 = await session.executeWrite((tx) => tx.run(repointQuery))
    console.log(`Re-pointed: ${r1.records[0]?.get('churchesRepointed') ?? 0}`)

    const r2 = await session.executeWrite((tx) =>
      tx.run(createQuery, {
        priorities: LEVEL_PRIORITY,
        levelOrder: LEVEL_ORDER,
      })
    )
    console.log(
      `New ServiceLogs created: ${
        r2.records[0]?.get('churchesGivenNewLog') ?? 0
      }`
    )

    console.log(
      'Done. Re-run the aggregation backfill to populate the repaired churches.'
    )
  } catch (err) {
    console.error('Repair failed:', err)
    process.exitCode = 1
  } finally {
    await session.close()
    await driver.close()
  }
}

main()
