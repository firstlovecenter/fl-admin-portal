#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Remediation: delete "phantom" weekly aggregates that predate the church that
 * owns them.
 *
 * Background. The roll-up aggregators (service-graph-aggregator,
 * bacenta-graph-aggregator) walk the CURRENT church topology and only vary the
 * target week. The history backfill (aggregate-dev-history.js) replays those
 * queries for every historical (year, week) tuple, so a church that was created
 * *after* the start of the data window inherits its current descendants'
 * pre-creation records and ends up with AggregateServiceRecord /
 * AggregateBussingRecord snapshots for weeks in which it did not yet exist.
 *
 * The graph stores no point-in-time membership, so the only available creation
 * proxy is the earliest `HAS_HISTORY -> HistoryLog.timeStamp` on the church
 * (creation appends a "<name> <Level> History Begins" log). This proxy errs
 * conservative: HistoryLogs are append-only, so MIN can only be too early (it
 * never deletes legitimate post-creation data) — it may merely leave a few
 * phantoms behind.
 *
 * Safety:
 *   - Only aggregates whose id STARTS WITH the church id are touched, so a
 *     multi-church-reachable / shared aggregate (ADR-014 residual) is never
 *     collaterally deleted via another church's MIN timestamp.
 *   - `--margin-days N` shifts the creation threshold earlier by N days, so a
 *     larger margin deletes *fewer* aggregates (more conservative).
 *   - Refuses a production-looking NEO4J_URI unless `--allow-prod` is passed.
 *
 * Usage (dev):
 *   NEO4J_URI=bolt+ssc://dev-neo4j.firstlovecenter.com:7687 \
 *   NEO4J_USER=neo4j NEO4J_PASSWORD=*** \
 *   node api/src/scripts/remediate-pre-creation-aggregates.js --dry-run
 *
 * Usage (prod — explicit opt-in, dry-run first):
 *   NEO4J_URI=... NEO4J_PASSWORD=*** \
 *   node api/src/scripts/remediate-pre-creation-aggregates.js --allow-prod --dry-run
 *
 * Options:
 *   --dry-run        Report what would be deleted and exit without writing.
 *   --allow-prod     Permit a production-looking NEO4J_URI (still dry-run-safe).
 *   --margin-days N  Treat creation as N days earlier when comparing (default 0).
 *   --limit N        Cap the rows printed in the dry-run report (default 100).
 *   --min-created-after YYYY-MM-DD
 *                    Exclude churches whose MIN(HistoryLog.timeStamp) creation
 *                    proxy is before this date (default 2023-10-01) — guards
 *                    against deleting legitimate aggregates of original /
 *                    migration-era churches whose history logs were truncated.
 *                    Pass an early date (e.g. 1900-01-01) to disable.
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const allowProd = argv.includes('--allow-prod')

function readNum(flag, fallback) {
  const i = argv.indexOf(flag)
  if (i === -1) return fallback
  const v = Number(argv[i + 1])
  return Number.isFinite(v) ? v : fallback
}

function readStr(flag, fallback) {
  const i = argv.indexOf(flag)
  if (i === -1) return fallback
  return argv[i + 1] !== undefined ? argv[i + 1] : fallback
}

const marginDays = readNum('--margin-days', 0)
const printLimit = readNum('--limit', 100)

// Churches whose MIN(HistoryLog.timeStamp) creation proxy falls before this
// date are EXCLUDED from remediation. The earliest data predates the proxy for
// original / top-of-hierarchy churches whose history logs were truncated in the
// ~2023 graph migration (the Denomination, original Oversights/Streams, a few
// old Councils) — for them the "pre-creation" aggregates are legitimate, not
// phantoms, so deleting would destroy real data. Default keeps the destructive
// pass to churches demonstrably created after the migration window; the handful
// of excluded migration-era churches are reviewed manually. Pass an early date
// (e.g. 1900-01-01) to disable the cutoff.
const DEFAULT_MIN_CREATED_AFTER = '2023-10-01'
const minCreatedAfter = readStr(
  '--min-created-after',
  DEFAULT_MIN_CREATED_AFTER
)

// Churches that own roll-up aggregates. Bacenta is intentionally excluded —
// no per-Bacenta AggregateServiceRecord / AggregateBussingRecord is ever
// written (the aggregators only roll Bacenta data UP into Governorship+).
const AGG_CHURCH_PREDICATE = `(
  c:Governorship OR c:Council OR c:Stream OR
  c:Campus OR c:Oversight OR c:Denomination
)`

/* eslint-disable fl-cypher/no-interpolated-cypher --
 * The only interpolation here is `AGG_CHURCH_PREDICATE`, a compile-time
 * constant string of hardcoded labels — not request-derived input. The
 * margin/threshold values still flow through the $marginDays binding, so the
 * ADR-012 hazard (user-controlled interpolation) does not apply. */

// Shared match: per church, derive a creation week-key from the earliest
// HistoryLog timeStamp (minus an optional safety margin), then bind every
// aggregate it owns that predates that key.
//
// Comparison uses the SAME `year * 100 + week` integer key the read path uses
// (weekly-report-cypher.ts) rather than reconstructing a calendar date via
// `date({year, week})`. Aggregates are keyed `(calendarYear, isoWeek)`, but
// `date({year, week})` reads `year` as the ISO *week-year*; at year boundaries
// (e.g. a Monday of 2024-12-30 stored as week 1 / year 2024) those diverge and
// the reconstructed date lands ~52 weeks early — which for a DELETE risks
// removing a legitimate boundary-week aggregate. Staying in the integer-key
// space keeps the tool internally consistent with how the reports read these
// nodes and errs conservative (it may keep a phantom, never delete real data).
//
// `agg.id STARTS WITH c.id + '-'` keeps us to aggregates keyed to THIS church
// (ADR-014 `<churchId>-<week>-<year>`), so a multi-church-reachable / shared
// aggregate is never collaterally deleted via another church's MIN timestamp.
const PHANTOM_MATCH = `
  MATCH (c)-[:HAS_HISTORY]->(h:HistoryLog)
  WHERE ${AGG_CHURCH_PREDICATE}
  WITH c, labels(c)[0] AS level, min(datetime(h.timeStamp)) AS createdTs
  WHERE date(createdTs) >= date($minCreatedAfter)
  WITH c, level, (createdTs - duration({days: $marginDays})) AS adjustedTs
  WITH c, level, adjustedTs.year * 100 + adjustedTs.week AS createdKey
  MATCH (c)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE|HAS_BUSSING_AGGREGATE]->(agg)
  WHERE agg.year IS NOT NULL AND agg.week IS NOT NULL
    AND agg.id STARTS WITH c.id + '-'
    AND (agg.year * 100 + agg.week) < createdKey
`

const SELECT_PHANTOMS = `
  ${PHANTOM_MATCH}
  RETURN level,
         c.id AS churchId,
         c.name AS churchName,
         createdKey,
         agg.id AS aggId,
         labels(agg)[0] AS aggType,
         agg.year AS year,
         agg.week AS week,
         coalesce(agg.attendance, 0) AS attendance,
         coalesce(agg.income, 0) AS income
  ORDER BY level, churchName, year, week
`

// DETACH DELETE removes the aggregate node and its HAS_*_AGGREGATE edge(s).
// Shares PHANTOM_MATCH byte-for-byte with SELECT_PHANTOMS so the dry-run report
// can never diverge from what actually gets deleted.
const DELETE_PHANTOMS = `
  ${PHANTOM_MATCH}
  WITH DISTINCT agg
  DETACH DELETE agg
  RETURN count(*) AS deleted
`
/* eslint-enable fl-cypher/no-interpolated-cypher */

function num(v) {
  if (v === null || v === undefined) return 0
  return v.toNumber ? v.toNumber() : Number(v)
}

async function remediate(
  session,
  {
    marginDays: m = 0,
    minCreatedAfter: cutoff = DEFAULT_MIN_CREATED_AFTER,
    dryRun: dry = true,
  } = {}
) {
  const params = { marginDays: neo4j.int(m), minCreatedAfter: cutoff }
  const selectRes = await session.run(SELECT_PHANTOMS, params)

  const rows = selectRes.records.map((r) => ({
    level: r.get('level'),
    churchName: r.get('churchName'),
    churchId: r.get('churchId'),
    createdKey: num(r.get('createdKey')),
    aggType: r.get('aggType'),
    year: num(r.get('year')),
    week: num(r.get('week')),
    attendance: num(r.get('attendance')),
    income: num(r.get('income')),
  }))

  let deleted = 0
  if (!dry && rows.length) {
    const delRes = await session.run(DELETE_PHANTOMS, params)
    deleted = num(delRes.records[0].get('deleted'))
  }

  return { rows, deleted }
}

async function main() {
  const uri = process.env.NEO4J_URI
  const user = process.env.NEO4J_USER || 'neo4j'
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !password) {
    console.error('Refusing to run: NEO4J_URI and NEO4J_PASSWORD must be set.')
    process.exit(1)
  }

  const looksProd =
    uri.includes('neo4j.firstlovecenter.com') && !uri.includes('dev-')

  if (looksProd && !allowProd) {
    console.error(
      'Refusing to run: NEO4J_URI looks like production. Pass --allow-prod to override.'
    )
    process.exit(1)
  }

  if (looksProd) {
    console.warn('⚠️  Targeting a PRODUCTION-looking database.')
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  const session = driver.session()

  try {
    console.log(`Connected to ${uri}`)
    console.log(
      `Mode: ${
        dryRun ? 'DRY RUN (no writes)' : 'DELETE'
      } | margin-days: ${marginDays} | min-created-after: ${minCreatedAfter}`
    )

    const { rows, deleted } = await remediate(session, {
      marginDays,
      minCreatedAfter,
      dryRun,
    })

    const byChurch = rows.reduce((acc, r) => {
      const k = `${r.level}: ${r.churchName}`
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})

    console.log(`\nPhantom aggregates found: ${rows.length}`)
    console.log(`Affected churches: ${Object.keys(byChurch).length}`)
    console.table(byChurch)

    if (rows.length) {
      console.log(`\nDetail (first ${printLimit}):`)
      console.table(rows.slice(0, printLimit))
    }

    if (dryRun) {
      console.log('\nDry run — no writes performed.')
    } else {
      console.log(`\nDeleted ${deleted} phantom aggregate node(s).`)
    }
  } catch (err) {
    console.error('Remediation failed:', err)
    process.exitCode = 1
  } finally {
    await session.close()
    await driver.close()
  }
}

module.exports = { remediate, SELECT_PHANTOMS, DELETE_PHANTOMS }

if (require.main === module) {
  main()
}
