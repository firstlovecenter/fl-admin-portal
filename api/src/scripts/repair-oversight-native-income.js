#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Repair: recompute `income` (and stamp `currency`) on historical
 * Oversight / Denomination AggregateServiceRecords so single-currency
 * oversights read in their native currency instead of USD.
 *
 * Background. The service graph aggregator used to store `income = SUM(dollarIncome)`
 * at EVERY Oversight and Denomination, assuming they always consolidate multiple
 * currencies. That is false for single-currency oversights (e.g. all-GHS
 * "Outside Accra" and "FL Accra"): their income was stored ~1/10th of the true
 * cedi total, so the graph no longer matched the campus figures or the weekly
 * report. The aggregator is now currency-aware; this pass fixes the snapshots it
 * already wrote (SYN-193).
 *
 * What it does, per Oversight / Denomination aggregate:
 *   - Resolve the church's income currency from its campuses (native when every
 *     campus shares one currency, else 'USD').
 *   - MULTI-CURRENCY (USD): stamp `currency = 'USD'` and set `income = dollarIncome`
 *     (a no-op numerically — those were already correct — but backfills the field).
 *   - SINGLE-CURRENCY: stamp `currency = <native>` and recompute native `income`.
 *       · Faithful path: SUM(income) over the snapshot's stored `componentServiceIds`.
 *         This is the primary path — the aggregator has stamped componentServiceIds
 *         on every aggregate it has written for a long time, so recent (in-window)
 *         aggregates all take it and are snapshot-exact.
 *       · Fallback (older aggregates with no componentServiceIds): recompute from
 *         the live topology for that (week, year) via the aggregator's own
 *         CURRENT_HISTORY traversal. This is OPT-IN (`--include-topology-fallback`)
 *         and OFF by default because it violates the Model-A snapshot rule
 *         (ADR-014 §5): it attributes *current* topology to a *past* week, so a
 *         church restructured since the aggregate was written can be mis-summed,
 *         and a CURRENT_HISTORY descent is blind to records on rotated-away logs
 *         (the SYN-153 trap) so it can under-count. Aggregates that resolve to zero
 *         live records are SKIPPED (left as-is), never zeroed. In practice these
 *         no-snapshot aggregates are old (out of the 24-week display window), so
 *         leaving them as-is is the safe default.
 *
 * `dollarIncome` is never touched (it was and stays the USD total).
 *
 * CAVEAT: currency is classified from each church's campus composition *as it is
 * now*. If an oversight's currency mix changed over time (e.g. a foreign campus
 * moved out), historical aggregates are reclassified under the current mix. This
 * is fine when composition is stable (the norm); confirm before a prod run.
 *
 * Safety:
 *   - Idempotent: re-running produces the same values.
 *   - Never writes `dollarIncome`, never deletes, never re-keys.
 *   - Refuses a production-looking NEO4J_URI unless `--allow-prod` is passed.
 *   - `--dry-run` reports the plan and exits without writing.
 *
 * Usage (dev):
 *   NEO4J_URI=bolt+ssc://dev-neo4j.firstlovecenter.com:7687 \
 *   NEO4J_USER=neo4j NEO4J_PASSWORD=*** \
 *   node api/src/scripts/repair-oversight-native-income.js --dry-run
 *
 * Options:
 *   --dry-run                    Report what would change and exit without writing.
 *   --allow-prod                 Permit a production-looking NEO4J_URI.
 *   --include-topology-fallback  Also recompute no-snapshot aggregates from live
 *                                topology (Model-A caveat above). Off by default.
 *   --limit N                    Cap the rows printed in the dry-run report (default 100).
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const allowProd = argv.includes('--allow-prod')
const includeTopologyFallback = argv.includes('--include-topology-fallback')

function readNum(flag, fallback) {
  const i = argv.indexOf(flag)
  if (i === -1) return fallback
  const v = Number(argv[i + 1])
  return Number.isFinite(v) ? v : fallback
}

const printLimit = readNum('--limit', 100)

/* eslint-disable fl-cypher/no-interpolated-cypher --
 * The only interpolation is `${RESOLVE_CURRENCY}`, a compile-time constant shared
 * verbatim across the SELECT/UPDATE queries so the dry-run report cannot diverge
 * from the write. No request-derived input flows into these queries — the
 * ADR-012 string-interpolation hazard does not apply. */

// Resolve each Oversight/Denomination aggregate to its income currency. Campuses
// sit at depth 1 under an Oversight and depth 2 under a Denomination, so `HAS*1..2`
// filtered on the :Campus label reaches exactly the campuses at either level.
const RESOLVE_CURRENCY = `
  MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(a:AggregateServiceRecord)
  WHERE church:Oversight OR church:Denomination
  WITH church, a,
       [(church)-[:HAS*1..2]->(cx:Campus) WHERE cx.currency IS NOT NULL | cx.currency] AS curs
  WITH church, a,
       CASE
         WHEN size(curs) > 0 AND size([c IN curs WHERE c <> curs[0]]) = 0
         THEN curs[0] ELSE 'USD'
       END AS resolvedCurrency
`

// 1. Multi-currency aggregates: backfill currency='USD', reassert income=dollarIncome.
const UPDATE_USD = `
  ${RESOLVE_CURRENCY}
  WHERE resolvedCurrency = 'USD'
  SET a.income = a.dollarIncome, a.currency = 'USD'
  RETURN count(a) AS updated
`

// 2. Single-currency aggregates WITH a stored snapshot: native income from components.
const UPDATE_NATIVE_COMPONENTS = `
  ${RESOLVE_CURRENCY}
  WHERE resolvedCurrency <> 'USD'
    AND a.componentServiceIds IS NOT NULL AND size(a.componentServiceIds) > 0
  OPTIONAL MATCH (r:ServiceRecord) WHERE r.id IN a.componentServiceIds
  WITH a, resolvedCurrency, round(toFloat(sum(coalesce(r.income, 0))), 2) AS nativeIncome
  SET a.income = nativeIncome, a.currency = resolvedCurrency
  RETURN count(a) AS updated
`

// 3. Single-currency aggregates WITHOUT a snapshot: recompute from live topology
//    for that (week, year). Skip (leave as-is) when no live records resolve.
const UPDATE_NATIVE_TOPOLOGY = `
  ${RESOLVE_CURRENCY}
  WHERE resolvedCurrency <> 'USD'
    AND (a.componentServiceIds IS NULL OR size(a.componentServiceIds) = 0)
  OPTIONAL MATCH (church)-[:CURRENT_HISTORY|HAS_SERVICE|HAS*2..8]->(rt:ServiceRecord)-[:SERVICE_HELD_ON]->(t:TimeGraph)
  WHERE NOT rt:NoService AND t.date.week = a.week AND t.date.year = a.year
  WITH a, resolvedCurrency, collect(DISTINCT rt) AS recs
  WITH a, resolvedCurrency, [x IN recs WHERE x IS NOT NULL] AS recs
  WHERE size(recs) > 0
  WITH a, resolvedCurrency,
       round(toFloat(reduce(s = 0.0, x IN recs | s + coalesce(x.income, 0))), 2) AS nativeIncome
  SET a.income = nativeIncome, a.currency = resolvedCurrency
  RETURN count(a) AS updated
`

// Report the plan without writing: how many aggregates land in each bucket.
const SELECT_PLAN = `
  ${RESOLVE_CURRENCY}
  WITH church, a, resolvedCurrency,
       CASE
         WHEN resolvedCurrency = 'USD' THEN 'usd-backfill'
         WHEN a.componentServiceIds IS NOT NULL AND size(a.componentServiceIds) > 0 THEN 'native-components'
         ELSE 'native-topology-fallback'
       END AS bucket
  RETURN labels(church)[0] AS level, church.name AS church, resolvedCurrency AS currency,
         bucket, count(a) AS aggregates
  ORDER BY church, bucket
`

/* eslint-enable fl-cypher/no-interpolated-cypher */

function num(v) {
  if (v === null || v === undefined) return 0
  return v.toNumber ? v.toNumber() : Number(v)
}

async function repair(
  session,
  { dryRun: dry = true, includeTopologyFallback: withFallback = false } = {}
) {
  const planRes = await session.run(SELECT_PLAN)
  const plan = planRes.records.map((r) => ({
    level: r.get('level'),
    church: r.get('church'),
    currency: r.get('currency'),
    bucket: r.get('bucket'),
    aggregates: num(r.get('aggregates')),
  }))

  const updated = { usd: 0, nativeComponents: 0, nativeTopology: 0 }
  if (!dry) {
    updated.usd = num((await session.run(UPDATE_USD)).records[0].get('updated'))
    updated.nativeComponents = num(
      (await session.run(UPDATE_NATIVE_COMPONENTS)).records[0].get('updated')
    )
    if (withFallback) {
      updated.nativeTopology = num(
        (await session.run(UPDATE_NATIVE_TOPOLOGY)).records[0].get('updated')
      )
    }
  }

  return { plan, updated, withFallback }
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
    console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'UPDATE'}`)

    const { plan, updated } = await repair(session, {
      dryRun,
      includeTopologyFallback,
    })

    console.log('\nPlan (aggregates per church + bucket):')
    console.table(plan.slice(0, printLimit))

    const fallbackCount = plan
      .filter((p) => p.bucket === 'native-topology-fallback')
      .reduce((s, p) => s + p.aggregates, 0)
    if (fallbackCount) {
      const fallbackNote = includeTopologyFallback
        ? 'They will be recomputed from live topology (Model-A caveat — see header); any resolving to zero live records are left unchanged.'
        : 'They are LEFT UNCHANGED (pass --include-topology-fallback to recompute them from live topology; off by default per the Model-A caveat in the header).'
      console.warn(
        `\nℹ️  ${fallbackCount} single-currency aggregate(s) have no stored componentServiceIds. ${fallbackNote}`
      )
    }

    if (dryRun) {
      console.log('\nDry run — no writes performed.')
    } else {
      const topologyNote = includeTopologyFallback
        ? '.'
        : ' (topology fallback skipped).'
      console.log(
        `\nUpdated: ${updated.usd} USD-backfill, ${updated.nativeComponents} native-from-components, ${updated.nativeTopology} native-from-topology${topologyNote}`
      )
    }
  } catch (err) {
    console.error('Repair failed:', err)
    process.exitCode = 1
  } finally {
    await session.close()
    await driver.close()
  }
}

module.exports = {
  repair,
  RESOLVE_CURRENCY,
  UPDATE_USD,
  UPDATE_NATIVE_COMPONENTS,
  UPDATE_NATIVE_TOPOLOGY,
  SELECT_PLAN,
}

if (require.main === module) {
  main()
}
