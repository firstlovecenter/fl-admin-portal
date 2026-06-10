#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Backfill: align existing Oversight / Denomination weekly service aggregates
 * to the USD-display rule (income == dollarIncome).
 *
 * Background. Oversight and Denomination consolidate campuses that may legitimately
 * use different currencies (GHS, BDT, GMD, MGA, SLL, XAF, ZMW). A raw SUM(income)
 * across those campuses adds unlike currencies, so the only meaningful money figure
 * at these two levels is the USD-converted total. The aggregator
 * (service-graph-aggregator/sevice-cypher.js) now stores `income = SUM(dollarIncome)`
 * at Oversight + Denomination, but only recomputes the CURRENT week (Model-A
 * snapshots, ADR-014). Historical aggregates still carry the old mixed-currency
 * `income`. This one-off pass rewrites every existing Oversight/Denomination
 * aggregate so income == dollarIncome, matching the new live behaviour.
 *
 * What it does NOT touch:
 *   - `dollarIncome` (the authoritative USD field) is left exactly as-is — this only
 *     copies it onto `income`.
 *   - Campus and below (single-currency levels) — their `income` stays local.
 *   - Records already satisfying income == dollarIncome (e.g. the 2026 wk11–22
 *     legacy block) are no-ops via the `abs(...) >= 0.01` guard.
 *
 * Safety:
 *   - Scoped strictly to aggregates hung off an Oversight or Denomination ServiceLog.
 *   - Idempotent: re-running changes nothing once income == dollarIncome.
 *   - Skips rows where dollarIncome is null (cannot derive a USD figure) and reports
 *     them so the underlying leaf-data gap can be cleaned up separately.
 *   - Refuses a production-looking NEO4J_URI unless `--allow-prod` is passed.
 *
 * Usage (dev):
 *   NEO4J_URI=bolt+ssc://dev-neo4j.firstlovecenter.com:7687 \
 *   NEO4J_USER=neo4j NEO4J_PASSWORD=*** \
 *   node api/src/scripts/backfill-oversight-denomination-dollar-income.js --dry-run
 *
 * Usage (prod — explicit opt-in, dry-run first):
 *   NEO4J_URI=... NEO4J_PASSWORD=*** \
 *   node api/src/scripts/backfill-oversight-denomination-dollar-income.js --allow-prod --dry-run
 *
 * Options:
 *   --dry-run      Report what would change and exit without writing.
 *   --allow-prod   Permit a production-looking NEO4J_URI (still dry-run-safe).
 *   --limit N      Cap the rows printed in the dry-run report (default 100).
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

const printLimit = readNum('--limit', 100)

/* eslint-disable fl-cypher/no-interpolated-cypher --
 * The only interpolation below is `${TARGET_MATCH}`, a compile-time constant
 * string of hardcoded labels shared verbatim between the SELECT and UPDATE so
 * the dry-run report cannot diverge from the write — not request-derived input.
 * There are no parameterised values in these queries, so the ADR-012 hazard
 * (user-controlled interpolation) does not apply. */

// Aggregates whose owning church is Oversight or Denomination, where income does
// not yet match dollarIncome and a dollarIncome figure exists to copy from.
const TARGET_MATCH = `
  MATCH (c)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(a:AggregateServiceRecord)
  WHERE (c:Oversight OR c:Denomination)
    AND a.dollarIncome IS NOT NULL
    AND abs(coalesce(a.income, 0) - a.dollarIncome) >= 0.01
`

// WITH DISTINCT a, c collapses the HAS_HISTORY fan-in: a church reached through
// several rotated ServiceLogs yields one row per log for the same aggregate, so
// without DISTINCT the report (and the redundant SET writes) would over-count.
// Each aggregate belongs to exactly one church, so DISTINCT a,c == DISTINCT a.
const SELECT_TARGETS = `
  ${TARGET_MATCH}
  WITH DISTINCT a, c
  RETURN labels(c)[0] AS level,
         c.name AS churchName,
         a.id AS aggId,
         a.year AS year,
         a.week AS week,
         coalesce(a.income, 0) AS oldIncome,
         a.dollarIncome AS newIncome
  ORDER BY level, churchName, year, week
`

// Shares TARGET_MATCH byte-for-byte with SELECT_TARGETS (plus the same DISTINCT)
// so the dry-run report can never diverge from what actually gets written, and
// each aggregate is written exactly once.
const UPDATE_TARGETS = `
  ${TARGET_MATCH}
  WITH DISTINCT a
  SET a.income = a.dollarIncome
  RETURN count(a) AS updated
`

// Rows where dollarIncome is missing entirely — cannot be aligned by this pass.
// Surfaced for a separate leaf-data cleanup, never mutated here.
const SELECT_UNFIXABLE = `
  MATCH (c)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE_AGGREGATE]->(a:AggregateServiceRecord)
  WHERE (c:Oversight OR c:Denomination) AND a.dollarIncome IS NULL AND coalesce(a.income, 0) <> 0
  WITH DISTINCT a, c
  RETURN labels(c)[0] AS level, c.name AS churchName, a.id AS aggId,
         a.year AS year, a.week AS week, a.income AS income
  ORDER BY level, churchName, year, week
`
/* eslint-enable fl-cypher/no-interpolated-cypher */

function num(v) {
  if (v === null || v === undefined) return 0
  return v.toNumber ? v.toNumber() : Number(v)
}

async function backfill(session, { dryRun: dry = true } = {}) {
  const selectRes = await session.run(SELECT_TARGETS)
  const rows = selectRes.records.map((r) => ({
    level: r.get('level'),
    churchName: r.get('churchName'),
    aggId: r.get('aggId'),
    year: num(r.get('year')),
    week: num(r.get('week')),
    oldIncome: num(r.get('oldIncome')),
    newIncome: num(r.get('newIncome')),
  }))

  const unfixableRes = await session.run(SELECT_UNFIXABLE)
  const unfixable = unfixableRes.records.map((r) => ({
    level: r.get('level'),
    churchName: r.get('churchName'),
    aggId: r.get('aggId'),
    year: num(r.get('year')),
    week: num(r.get('week')),
    income: num(r.get('income')),
  }))

  let updated = 0
  if (!dry && rows.length) {
    const updRes = await session.run(UPDATE_TARGETS)
    updated = num(updRes.records[0].get('updated'))
  }

  return { rows, unfixable, updated }
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

    const { rows, unfixable, updated } = await backfill(session, { dryRun })

    const byChurch = rows.reduce((acc, r) => {
      const k = `${r.level}: ${r.churchName}`
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})

    console.log(
      `\nAggregates to align (income := dollarIncome): ${rows.length}`
    )
    console.log(`Affected churches: ${Object.keys(byChurch).length}`)
    console.table(byChurch)

    if (rows.length) {
      console.log(`\nDetail (first ${printLimit}):`)
      console.table(rows.slice(0, printLimit))
    }

    if (unfixable.length) {
      console.warn(
        `\n⚠️  ${unfixable.length} Oversight/Denomination aggregate(s) have a non-zero income but NO dollarIncome — cannot be aligned here. These need a separate leaf-data fix (a sub-record was saved without a USD conversion):`
      )
      console.table(unfixable.slice(0, printLimit))
    }

    if (dryRun) {
      console.log('\nDry run — no writes performed.')
    } else {
      console.log(
        `\nUpdated ${updated} aggregate(s): income now equals dollarIncome.`
      )
    }
  } catch (err) {
    console.error('Backfill failed:', err)
    process.exitCode = 1
  } finally {
    await session.close()
    await driver.close()
  }
}

module.exports = { backfill, SELECT_TARGETS, UPDATE_TARGETS, SELECT_UNFIXABLE }

if (require.main === module) {
  main()
}
