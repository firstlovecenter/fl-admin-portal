#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Repair: backfill `dollarIncome` on leaf ServiceRecords that have a positive
 * local `income` but no USD conversion stored.
 *
 * Background. `recordService` computes `dollarIncome = income / conversionRateToDollar`
 * at write time, but older / specially-recorded ServiceRecords predate that and
 * carry `income > 0` with `dollarIncome` null or 0. Because Oversight / Denomination
 * aggregates are SUM(dollarIncome) (the only meaningful cross-currency figure), any
 * leaf missing `dollarIncome` silently UNDER-counts those USD totals. This pass sets
 * `dollarIncome = round(income / campus.conversionRateToDollar, 2)` using the owning
 * Campus's rate.
 *
 * Resolution rule. A record's owning church is found via its ServiceLog
 * (`(r)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)`), then the Campus
 * ancestor via `<-[:HAS|HAS_MINISTRY*0..5]-(campus:Campus)` — the same path the
 * live `getCurrency` resolver uses, so Ministry-owned records resolve too. We
 * GROUP BY the record and require
 * EXACTLY ONE distinct Campus with a positive rate — records that resolve to zero or
 * multiple campuses (orphaned / mid-migration topology) are SKIPPED and reported,
 * never guessed.
 *
 * Safety:
 *   - Only touches records with income > 0 and (dollarIncome IS NULL OR = 0).
 *   - Idempotent: once dollarIncome is set (> 0) the record drops out of the match.
 *   - Never writes `income`; never deletes; never re-aggregates (run the aggregator
 *     afterwards to propagate corrected leaves into historical aggregates).
 *   - Refuses a production-looking NEO4J_URI unless `--allow-prod` is passed.
 *
 * NOTE: after this runs, historical AggregateServiceRecord `dollarIncome` (and, at
 * Oversight/Denomination, `income`) still reflect the old undercount until those
 * weeks are re-aggregated. Re-run the service aggregator for the affected weeks, or
 * the dev-history backfill, to propagate.
 *
 * Usage (dev):
 *   NEO4J_URI=bolt+ssc://dev-neo4j.firstlovecenter.com:7687 \
 *   NEO4J_USER=neo4j NEO4J_PASSWORD=*** \
 *   node api/src/scripts/repair-missing-dollar-income.js --dry-run
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
 * The only interpolation is `${RESOLVE_MATCH}`, a compile-time constant shared
 * verbatim across the SELECT/UPDATE/UNRESOLVABLE queries (so the dry-run report
 * cannot diverge from the write) — not request-derived input. No parameterised
 * values flow into these queries, so the ADR-012 hazard does not apply. */

// Records missing dollarIncome, grouped to their single owning Campus + rate.
// Grouping by `r` (collecting DISTINCT campus across every owning-church path)
// absorbs the HAS_HISTORY fan-in: an orphaned/rotated log that reaches no Campus
// simply contributes nothing, while the real owning path supplies the one Campus.
const RESOLVE_MATCH = `
  MATCH (r:ServiceRecord)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
  WHERE NOT r:NoService AND coalesce(r.income, 0) > 0
    AND (r.dollarIncome IS NULL OR r.dollarIncome = 0)
  OPTIONAL MATCH (church)<-[:HAS|HAS_MINISTRY*0..5]-(campus:Campus)
  WHERE campus.conversionRateToDollar > 0
  WITH r, collect(DISTINCT campus) AS campuses
  WITH r, campuses,
       CASE WHEN size(campuses) = 1 THEN campuses[0] ELSE null END AS campus
`

const SELECT_FIXABLE = `
  ${RESOLVE_MATCH}
  WHERE campus IS NOT NULL
  RETURN r.id AS recordId, r.income AS income,
         campus.name AS campus, campus.currency AS currency,
         campus.conversionRateToDollar AS rate,
         round(r.income / campus.conversionRateToDollar, 2) AS newDollarIncome
  ORDER BY campus, recordId
`

const UPDATE_FIXABLE = `
  ${RESOLVE_MATCH}
  WHERE campus IS NOT NULL
  SET r.dollarIncome = round(r.income / campus.conversionRateToDollar, 2)
  RETURN count(r) AS updated
`

// Records that cannot be resolved to exactly one rated Campus — reported only.
const SELECT_UNRESOLVABLE = `
  ${RESOLVE_MATCH}
  WHERE campus IS NULL
  RETURN r.id AS recordId, r.income AS income, size(campuses) AS campusMatches
  ORDER BY recordId
`
/* eslint-enable fl-cypher/no-interpolated-cypher */

function num(v) {
  if (v === null || v === undefined) return 0
  return v.toNumber ? v.toNumber() : Number(v)
}

async function repair(session, { dryRun: dry = true } = {}) {
  const fixableRes = await session.run(SELECT_FIXABLE)
  const rows = fixableRes.records.map((r) => ({
    recordId: r.get('recordId'),
    income: num(r.get('income')),
    campus: r.get('campus'),
    currency: r.get('currency'),
    rate: num(r.get('rate')),
    newDollarIncome: num(r.get('newDollarIncome')),
  }))

  const unresolvableRes = await session.run(SELECT_UNRESOLVABLE)
  const unresolvable = unresolvableRes.records.map((r) => ({
    recordId: r.get('recordId'),
    income: num(r.get('income')),
    campusMatches: num(r.get('campusMatches')),
  }))

  let updated = 0
  if (!dry && rows.length) {
    const updRes = await session.run(UPDATE_FIXABLE)
    updated = num(updRes.records[0].get('updated'))
  }

  return { rows, unresolvable, updated }
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

    const { rows, unresolvable, updated } = await repair(session, { dryRun })

    console.log(
      `\nRecords to repair (dollarIncome := income / rate): ${rows.length}`
    )
    if (rows.length) {
      console.log(`\nDetail (first ${printLimit}):`)
      console.table(rows.slice(0, printLimit))
    }

    if (unresolvable.length) {
      console.warn(
        `\n⚠️  ${unresolvable.length} record(s) have income but no unique rated Campus (orphaned or multi-campus topology) — skipped, not guessed:`
      )
      console.table(unresolvable.slice(0, printLimit))
    }

    if (dryRun) {
      console.log('\nDry run — no writes performed.')
    } else {
      console.log(
        `\nUpdated ${updated} record(s). Re-aggregate affected weeks to propagate.`
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

module.exports = { repair, SELECT_FIXABLE, UPDATE_FIXABLE, SELECT_UNRESOLVABLE }

if (require.main === module) {
  main()
}
