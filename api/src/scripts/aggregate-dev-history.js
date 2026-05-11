#!/usr/bin/env node
/* eslint-disable no-await-in-loop, no-console, no-restricted-syntax */

/**
 * One-off: aggregate ServiceRecord + BussingRecord history on the dev Neo4j.
 *
 * The Lambda aggregators only run against prod, so dev's
 * AggregateServiceRecord / AggregateBussingRecord snapshots can be stale or
 * missing. This script:
 *
 *   1. Discovers every (year, week) tuple with source records on dev.
 *   2. For each tuple, runs the same 6 service + 6 bussing roll-up queries
 *      the Lambdas run — but parameterised on $week/$year/$month instead of
 *      Neo4j's date() server clock.
 *   3. Runs the global zero-nulls cleanup once at the end.
 *
 * Idempotent: MERGE on `<church.id>-<week>-<year>` (ADR-014). Safe to re-run.
 *
 * Usage (dev only):
 *   NEO4J_URI=bolt+ssc://dev-neo4j.firstlovecenter.com:7687 \
 *   NEO4J_USER=neo4j \
 *   NEO4J_PASSWORD=*** \
 *   node api/src/scripts/aggregate-dev-history.js [--dry-run] [--year 2025] [--week 36]
 *
 * Options:
 *   --dry-run        List the (year, week) tuples that would be processed and exit.
 *   --year <n>       Only process this year. May be repeated; pairs with --week.
 *   --week <n>       Only process this week (with --year). If neither flag is
 *                    set, all historical (year, week) tuples are processed.
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

const {
  aggregateBacentaOnGovernorshipQuery,
  aggregateGovernorshipOnCouncilQuery,
  aggregateCouncilOnStreamQuery,
  aggregateStreamOnCampusQuery,
  aggregateCampusOnOversightQuery,
  aggregateOversightOnDenominationQuery,
} = require('../functions/background/service-graph-aggregator/sevice-cypher')

const {
  aggregateBussingOnGovernorshipQuery,
  aggregateBussingOnCouncilQuery,
  aggregateBussingOnStreamQuery,
  aggregateBussingOnCampusQuery,
  aggregateBussingOnOversightQuery,
  aggregateBussingOnDenominationQuery,
  zeroAllNullBussingRecordsCypher,
} = require('../functions/background/bacenta-graph-aggregator/bacenta-cypher')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')

function readNum(flag) {
  const i = argv.indexOf(flag)
  if (i === -1) return null
  const v = argv[i + 1]
  if (v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const onlyYear = readNum('--year')
const onlyWeek = readNum('--week')

// Replace `date().<field>` references with bound parameters so the same
// queries can target any week/year, not just the server's current date.
function parameterise(cypher) {
  return cypher
    .replace(/date\(\)\.week/g, '$week')
    .replace(/date\(\)\.year/g, '$year')
    .replace(/date\(\)\.month/g, '$month')
}

const SERVICE_QUERIES = [
  ['governorship', aggregateBacentaOnGovernorshipQuery, 'governorshipCount'],
  ['council', aggregateGovernorshipOnCouncilQuery, 'councilCount'],
  ['stream', aggregateCouncilOnStreamQuery, 'streamCount'],
  ['campus', aggregateStreamOnCampusQuery, 'campusCount'],
  ['oversight', aggregateCampusOnOversightQuery, 'oversightCount'],
  ['denomination', aggregateOversightOnDenominationQuery, 'denominationCount'],
].map(([level, q, key]) => [level, parameterise(q), key])

const BUSSING_QUERIES = [
  ['governorship', aggregateBussingOnGovernorshipQuery, 'governorshipCount'],
  ['council', aggregateBussingOnCouncilQuery, 'councilCount'],
  ['stream', aggregateBussingOnStreamQuery, 'streamCount'],
  ['campus', aggregateBussingOnCampusQuery, 'campusCount'],
  ['oversight', aggregateBussingOnOversightQuery, 'oversightCount'],
  ['denomination', aggregateBussingOnDenominationQuery, 'denominationCount'],
].map(([level, q, key]) => [level, parameterise(q), key])

function int(n) {
  return neo4j.int(n)
}

function resolveMonth(year, week) {
  // Cypher's date({year, week}) returns the Monday of the given ISO week.
  // Replicate the same .month derivation in JS so we can bind $month.
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7 // 1..7, Monday = 1
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1))
  const target = new Date(week1Monday)
  target.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)
  return target.getUTCMonth() + 1
}

async function discoverTuples(session) {
  if (onlyYear !== null && onlyWeek !== null) {
    return [{ year: onlyYear, week: onlyWeek }]
  }

  const res = await session.run(`
    MATCH (d:TimeGraph)
    WHERE EXISTS { (r:ServiceRecord)-[:SERVICE_HELD_ON]->(d) WHERE NOT r:NoService }
       OR EXISTS { (r:BussingRecord)-[:BUSSED_ON]->(d) }
    WITH DISTINCT d.date.year AS year, d.date.week AS week
    ${onlyYear !== null ? 'WHERE year = $onlyYear' : ''}
    RETURN year, week
    ORDER BY year, week
  `, onlyYear !== null ? { onlyYear: int(onlyYear) } : {})

  return res.records.map((r) => ({
    year: r.get('year').toNumber ? r.get('year').toNumber() : r.get('year'),
    week: r.get('week').toNumber ? r.get('week').toNumber() : r.get('week'),
  }))
}

async function runForTuple(session, { year, week }) {
  const month = resolveMonth(year, week)
  const params = { year: int(year), week: int(week), month: int(month) }
  const summary = { year, week, month, service: {}, bussing: {} }

  for (const [level, query, key] of SERVICE_QUERIES) {
    const r = await session.run(query, params)
    const val = r.records[0]?.get(key)
    summary.service[level] = val?.toNumber ? val.toNumber() : Number(val ?? 0)
  }

  for (const [level, query, key] of BUSSING_QUERIES) {
    const r = await session.run(query, params)
    const val = r.records[0]?.get(key)
    summary.bussing[level] = val?.toNumber ? val.toNumber() : Number(val ?? 0)
  }

  return summary
}

async function main() {
  const uri = process.env.NEO4J_URI
  const user = process.env.NEO4J_USER || 'neo4j'
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !password) {
    console.error(
      'Refusing to run: NEO4J_URI and NEO4J_PASSWORD must be set in the env.'
    )
    console.error(
      'This is a dev-only utility. Pass dev creds inline; do not use AWS Secrets defaults.'
    )
    process.exit(1)
  }

  if (uri.includes('neo4j.firstlovecenter.com') && !uri.includes('dev-')) {
    console.error('Refusing to run: NEO4J_URI looks like production.')
    process.exit(1)
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  const session = driver.session()

  try {
    console.log(`Connected to ${uri}`)
    const tuples = await discoverTuples(session)
    console.log(`Found ${tuples.length} (year, week) tuples to process.`)

    if (dryRun) {
      console.table(tuples)
      console.log('Dry run — no writes performed.')
      return
    }

    const summaries = []
    for (let i = 0; i < tuples.length; i += 1) {
      const t = tuples[i]
      const tag = `[${i + 1}/${tuples.length}] ${t.year}-W${String(t.week).padStart(2, '0')}`
      process.stdout.write(`${tag} ... `)
      const start = Date.now()
      const summary = await runForTuple(session, t)
      const ms = Date.now() - start
      summaries.push(summary)
      console.log(`done in ${ms}ms`)
    }

    console.log('\nZeroing null bussing aggregates...')
    const zRes = await session.run(zeroAllNullBussingRecordsCypher)
    const zeroed = zRes.records[0].get('aggregateCount')
    console.log(`Zeroed ${zeroed?.toNumber ? zeroed.toNumber() : zeroed} aggregates.`)

    console.log('\nPer-week summary:')
    console.table(
      summaries.map((s) => ({
        year: s.year,
        week: s.week,
        month: s.month,
        gov_svc: s.service.governorship,
        gov_bus: s.bussing.governorship,
        council_svc: s.service.council,
        council_bus: s.bussing.council,
        stream_svc: s.service.stream,
        stream_bus: s.bussing.stream,
        campus_svc: s.service.campus,
        campus_bus: s.bussing.campus,
        oversight_svc: s.service.oversight,
        oversight_bus: s.bussing.oversight,
        denom_svc: s.service.denomination,
        denom_bus: s.bussing.denomination,
      }))
    )
    console.log('Done.')
  } catch (err) {
    console.error('Aggregation failed:', err)
    process.exitCode = 1
  } finally {
    await session.close()
    await driver.close()
  }
}

main()
