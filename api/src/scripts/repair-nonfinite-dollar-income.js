#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Repair: replace non-finite `dollarIncome` (Infinity / NaN) on one Campus's
 * ServiceRecords and on the AggregateServiceRecords built from them.
 *
 * Background. Before the conversion-rate guard in `RecordService`, a Campus
 * with conversionRateToDollar = 0 stored `income / 0` as Infinity. La Belle
 * Eglise did this for W32-W36 of 2026. One such value fails GraphQL Float
 * serialization, and the aggregates that summed it carry the same Infinity.
 * `repair-missing-dollar-income.js` only handles null / 0, so it skips these.
 *
 * What it does, in ONE transaction:
 *   1. ServiceRecord: dollarIncome := round(income / rate, 2), only for records
 *      resolving to exactly one Campus, which must be --expect-campus at
 *      --expect-rate. The operator asserts both because the rate is the one
 *      input that cannot be reconstructed later. Anything else is left alone
 *      and reported.
 *   2. AggregateServiceRecord: re-sum dollarIncome over the aggregate's own
 *      `componentServiceIds`, and set income to the same total where income is
 *      non-finite and the aggregate is in USD. Historical aggregates are
 *      snapshots (ADR-014), so this deliberately does NOT re-walk the live
 *      hierarchy: a church that has moved since must keep its original
 *      membership. An aggregate is only repaired when every component exists,
 *      none is unresolved, at least one was repaired here, and any non-finite
 *      income is in USD, so an Infinity this repair cannot explain is reported
 *      rather than overwritten.
 *   3. On --apply only: one summary HistoryLog on the Denomination.
 *
 * Safety:
 *   - DRY RUN BY DEFAULT. A dry run performs the same writes inside the
 *     transaction and rolls back. Note it still takes write locks until then,
 *     so run it off-peak.
 *   - --apply requires --expect-records N, and aborts unless exactly N records
 *     repaired and nothing stays non-finite (--allow-remaining relaxes the
 *     second check).
 *   - Anything but a known local or dev host counts as production and needs
 *     --allow-prod.
 *   - Idempotent: repaired values are finite and drop out of the match.
 *   - Never writes ServiceRecord.income and never deletes. Leaves `recomputedAt`
 *     alone, since nothing was recomputed from live data.
 *
 * Usage:
 *   NEO4J_URI=... NEO4J_USER=neo4j NEO4J_PASSWORD=*** \
 *   node api/src/scripts/repair-nonfinite-dollar-income.js \
 *     --expect-campus "La Belle Église" --expect-rate 10
 *
 * Options:
 *   --expect-campus NAME  Required. The only Campus whose records are repaired.
 *   --expect-rate N       Required. Must equal that Campus's current rate.
 *   --expect-records N    Required with --apply.
 *   --apply               Commit. Without this the transaction rolls back.
 *   --allow-remaining     Permit --apply while other nodes stay non-finite.
 *   --allow-prod          Permit a production-looking NEO4J_URI.
 *   --limit N             Cap the rows printed in the report (default 200).
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const TRANSACTION_TIMEOUT_MS = 120000
const NON_PROD_HOSTS = [
  'localhost',
  '127.0.0.1',
  'neo4j',
  'dev-neo4j.firstlovecenter.com',
]

/* eslint-disable fl-cypher/no-interpolated-cypher --
 * The only interpolation is `isNonFinite`, a compile-time helper called with
 * literal property names below. Runtime values are $param bindings, so the
 * ADR-012 hazard does not apply. */

// True for Inf, -Inf and NaN, false for null. The IS NOT NULL arm matters:
// null is the other repair script's job, and must not be matched here.
const isNonFinite = (property) =>
  `(${property} IS NOT NULL AND NOT coalesce(abs(toFloat(${property})) < 1.0e308, false))`

const NON_FINITE_RECORD = `
  NOT r:NoService AND ${isNonFinite('r.dollarIncome')}
`

const NON_FINITE_AGGREGATE = `
  (${isNonFinite('a.dollarIncome')} OR ${isNonFinite('a.income')})
`

// Campuses are collected unfiltered: a zero-rate Campus is what caused this,
// so filtering on rate first could hide the true owner and let a second,
// rated Campus pass the uniqueness check.
const REPAIR_RECORDS = `
  MATCH (r:ServiceRecord)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
  WHERE ${NON_FINITE_RECORD}
    AND r.income IS NOT NULL
    AND NOT ${isNonFinite('r.income')}
  OPTIONAL MATCH (church)<-[:HAS|HAS_MINISTRY*0..5]-(campus:Campus)
  WITH r, collect(DISTINCT campus) AS campuses
  WHERE size(campuses) = 1
    AND campuses[0].name = $campusName
    AND campuses[0].conversionRateToDollar = $rate
  WITH r, campuses[0] AS campus
  OPTIONAL MATCH (r)-[:SERVICE_HELD_ON]->(serviceDate:TimeGraph)
  WITH r, campus, head(collect(serviceDate)) AS serviceDate
  SET r.dollarIncome = round(toFloat(r.income) / $rate, 2),
      r.dollarIncomeRepairedAt = datetime(),
      r.dollarIncomeRepairRate = $rate
  RETURN r.id AS recordId,
         toString(serviceDate.date) AS date,
         r.income AS income,
         campus.name AS campus,
         campus.currency AS currency,
         $rate AS rate,
         r.dollarIncome AS newDollarIncome
  ORDER BY date, recordId
`

const REPAIR_AGGREGATES = `
  MATCH (a:AggregateServiceRecord)
  WHERE ${NON_FINITE_AGGREGATE}
    AND (NOT ${isNonFinite('a.income')} OR a.currency = 'USD')
  WITH a, coalesce(a.componentServiceIds, []) AS ids
  OPTIONAL MATCH (r:ServiceRecord)
  WHERE r.id IN ids
  WITH a, ids, collect(DISTINCT r) AS records
  WHERE size(ids) > 0
    AND size(records) = size(ids)
    AND any(x IN records WHERE x.dollarIncomeRepairedAt IS NOT NULL)
    AND all(x IN records WHERE
      (x.dollarIncome IS NOT NULL OR coalesce(x.income, 0) = 0)
      AND NOT ${isNonFinite('x.dollarIncome')})
  WITH a, records, a.dollarIncome AS oldDollarIncome, a.income AS oldIncome,
       round(toFloat(reduce(s = 0.0, x IN records | s + coalesce(x.dollarIncome, 0))), 2) AS total,
       reduce(s = 0, x IN records | s + coalesce(x.attendance, 0)) AS resummedAttendance
  SET a.dollarIncome = CASE
        WHEN ${isNonFinite('a.dollarIncome')} THEN total
        ELSE a.dollarIncome
      END,
      a.income = CASE
        WHEN ${isNonFinite('a.income')} THEN total
        ELSE a.income
      END,
      a.dollarIncomeRepairedAt = datetime()
  RETURN a.id AS aggregateId,
         a.week AS week,
         a.year AS year,
         a.currency AS currency,
         a.numberOfServices AS numberOfServices,
         size(records) AS components,
         a.attendance AS attendance,
         resummedAttendance,
         toString(oldDollarIncome) AS oldDollarIncome,
         toString(oldIncome) AS oldIncome,
         a.dollarIncome AS newDollarIncome,
         a.income AS newIncome
  ORDER BY year, week, aggregateId
`

// Whatever the two repairs above left behind, with enough detail to see why.
// Runs in the same transaction, so a dry run shows what an apply would leave.
const SELECT_REMAINING = `
  CALL {
    MATCH (r:ServiceRecord)
    WHERE ${NON_FINITE_RECORD}
    RETURN 'ServiceRecord' AS type, r.id AS id, null AS currency,
           null AS components, null AS found, null AS unresolvedComponents
    UNION ALL
    MATCH (a:AggregateServiceRecord)
    WHERE ${NON_FINITE_AGGREGATE}
    WITH a, coalesce(a.componentServiceIds, []) AS ids
    OPTIONAL MATCH (r:ServiceRecord)
    WHERE r.id IN ids
    WITH a, ids, collect(DISTINCT r) AS records
    RETURN 'AggregateServiceRecord' AS type, a.id AS id, a.currency AS currency,
           size(ids) AS components, size(records) AS found,
           size([x IN records WHERE ${isNonFinite(
             'x.dollarIncome'
           )}]) AS unresolvedComponents
  }
  RETURN type, id, currency, components, found, unresolvedComponents
  ORDER BY type, id
`

const WRITE_HISTORY_LOG = `
  MATCH (denomination:Denomination)-[:HAS*2]->(:Campus {name: $campusName})
  WITH DISTINCT denomination
  CREATE (h:HistoryLog)
  SET h.id = apoc.create.uuid(),
      h.timeStamp = datetime(),
      h.historyRecord = $historyRecord
  MERGE (date:TimeGraph {date: date()})
  MERGE (denomination)-[:HAS_HISTORY]->(h)
  MERGE (h)-[:RECORDED_ON]->(date)
  RETURN h.id AS historyLogId
`
/* eslint-enable fl-cypher/no-interpolated-cypher */

function parseArgs(argv) {
  const value = (flag) => {
    const i = argv.indexOf(flag)
    return i === -1 ? undefined : argv[i + 1]
  }
  const number = (flag) => {
    const raw = value(flag)
    return raw === undefined ? undefined : Number(raw)
  }

  const options = {
    apply: argv.includes('--apply'),
    allowProd: argv.includes('--allow-prod'),
    allowRemaining: argv.includes('--allow-remaining'),
    campusName: value('--expect-campus'),
    rate: number('--expect-rate'),
    expectRecords: number('--expect-records'),
    limit: number('--limit') ?? 200,
  }

  if (!Number.isInteger(options.limit) || options.limit < 0) {
    throw new Error('--limit must be a non-negative integer.')
  }
  if (options.apply && argv.includes('--dry-run')) {
    throw new Error('--apply and --dry-run contradict each other.')
  }
  if (!options.campusName) throw new Error('--expect-campus is required.')
  if (!(options.rate > 0) || !Number.isFinite(options.rate)) {
    throw new Error('--expect-rate must be a positive number.')
  }
  if (options.apply && !Number.isInteger(options.expectRecords)) {
    throw new Error('--apply requires --expect-records N.')
  }

  return options
}

// Fails closed: a host this does not recognise is treated as production.
function looksLikeProd(uri) {
  const host = /^[a-z0-9+]+:\/\/(?:[^@/]*@)?([^:/?]+)/i.exec(uri)?.[1]
  return !NON_PROD_HOSTS.includes(host?.toLowerCase())
}

function assertTargetAllowed(uri, { allowProd }) {
  if (looksLikeProd(uri) && !allowProd) {
    throw new Error(
      'NEO4J_URI looks like production. Pass --allow-prod to override.'
    )
  }
}

function plain(value) {
  return value && value.toNumber ? value.toNumber() : value
}

function toRows(result) {
  return result.records.map((record) =>
    Object.fromEntries(record.keys.map((key) => [key, plain(record.get(key))]))
  )
}

function buildHistoryRecord({ campusName, rate, records, aggregates }) {
  const weeks = [...new Set(aggregates.map((a) => `W${a.week}/${a.year}`))]
  return `Repaired non-finite dollarIncome for ${campusName} at rate ${rate}: ${
    records.length
  } service record(s), ${aggregates.length} aggregate(s), weeks ${weeks.join(
    ', '
  )}`
}

function assertSafeToCommit(
  { records, remaining },
  { expectRecords, allowRemaining }
) {
  if (records.length !== expectRecords) {
    throw new Error(
      `Expected ${expectRecords} repaired record(s) but found ${records.length}. Rolled back.`
    )
  }
  if (remaining.length && !allowRemaining) {
    throw new Error(
      `${remaining.length} node(s) would stay non-finite. Rolled back. Pass --allow-remaining to accept this.`
    )
  }
}

async function repair(session, options) {
  const { apply = false, campusName, rate } = options
  const tx = session.beginTransaction({ timeout: TRANSACTION_TIMEOUT_MS })

  try {
    const records = toRows(await tx.run(REPAIR_RECORDS, { campusName, rate }))
    const aggregates = toRows(await tx.run(REPAIR_AGGREGATES))
    const remaining = toRows(await tx.run(SELECT_REMAINING))
    const report = { records, aggregates, remaining, committed: false }

    if (!apply) {
      await tx.rollback()
      return report
    }

    assertSafeToCommit(report, options)
    if (!records.length && !aggregates.length) {
      await tx.rollback()
      return report
    }

    const historyLog = await tx.run(WRITE_HISTORY_LOG, {
      campusName,
      historyRecord: buildHistoryRecord({ ...options, ...report }),
    })
    if (historyLog.records.length !== 1) {
      throw new Error(
        `Expected 1 audit HistoryLog but wrote ${historyLog.records.length}. Rolled back.`
      )
    }
    await tx.commit()
    return { ...report, committed: true }
  } catch (error) {
    // The driver closes the transaction itself when a query or commit fails.
    if (tx.isOpen()) {
      try {
        await tx.rollback()
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message)
      }
    }
    throw error
  }
}

function printReport({ records, aggregates, remaining, committed }, limit) {
  console.log(`\nServiceRecords repaired: ${records.length}`)
  console.table(records.slice(0, limit))

  console.log(`\nAggregateServiceRecords repaired: ${aggregates.length}`)
  console.table(aggregates.slice(0, limit))

  if (remaining.length) {
    console.warn(`\n⚠️  ${remaining.length} node(s) left non-finite:`)
    console.table(remaining.slice(0, limit))
  } else {
    console.log('\nNothing left non-finite.')
  }

  console.log(
    committed
      ? '\nCommitted.'
      : '\nDry run — rolled back, nothing written. Re-run with --apply to commit.'
  )
}

async function run(driver, options) {
  const session = driver.session()

  try {
    const report = await repair(session, options)
    printReport(report, options.limit)
  } catch (err) {
    console.error('Repair failed:', err.message)
    console.error('If this was a commit, re-run the dry run to see the state.')
    process.exitCode = 1
  } finally {
    try {
      await session.close()
    } finally {
      await driver.close()
    }
  }
}

async function main() {
  const uri = process.env.NEO4J_URI
  const user = process.env.NEO4J_USER || 'neo4j'
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !password) {
    console.error('Refusing to run: NEO4J_URI and NEO4J_PASSWORD must be set.')
    process.exit(1)
  }

  let options
  try {
    options = parseArgs(process.argv.slice(2))
    assertTargetAllowed(uri, options)
  } catch (err) {
    console.error(`Refusing to run: ${err.message}`)
    process.exit(1)
  }

  if (looksLikeProd(uri)) {
    console.warn('⚠️  Targeting a PRODUCTION-looking database.')
  }

  console.log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN (rolled back)'}`)
  await run(neo4j.driver(uri, neo4j.auth.basic(user, password)), options)
}

module.exports = {
  repair,
  run,
  parseArgs,
  looksLikeProd,
  assertTargetAllowed,
  isNonFinite,
  REPAIR_RECORDS,
  REPAIR_AGGREGATES,
  SELECT_REMAINING,
  WRITE_HISTORY_LOG,
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Repair failed:', err.message)
    process.exitCode = 1
  })
}
