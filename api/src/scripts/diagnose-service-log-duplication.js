#!/usr/bin/env node
/**
 * SYN-59 Diagnosis Script — HAS_SERVICE edge duplication audit
 *
 * Checks whether any ServiceRecord is reachable from more than one ServiceLog
 * via HAS_SERVICE, and reports which churches have multiple ServiceLogs each
 * with their own HAS_SERVICE records for the same week (causing income inflation
 * in queries that traverse all HAS_HISTORY logs instead of CURRENT_HISTORY only).
 *
 * Usage:
 *   node diagnose-service-log-duplication.js [--week N] [--year N]
 *
 * Options:
 *   --week=N   ISO week number to check (default: current week)
 *   --year=N   Year to check (default: current year)
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')
const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const args = process.argv.slice(2)
const parsedWeek = args.find((a) => a.startsWith('--week'))
const parsedYear = args.find((a) => a.startsWith('--year'))

const now = new Date()
const currentWeek = parsedWeek
  ? parseInt(parsedWeek.split('=')[1], 10)
  : getISOWeek(now)
const currentYear = parsedYear
  ? parseInt(parsedYear.split('=')[1], 10)
  : now.getFullYear()

function getISOWeek(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

// Finds ServiceRecord nodes that have HAS_SERVICE from more than one ServiceLog
// (true shared-edge duplication — worst-case scenario).
const sharedEdgeQuery = `
MATCH (record:ServiceRecord)<-[:HAS_SERVICE]-(log:ServiceLog)
WITH record, count(DISTINCT log) AS logCount, collect(DISTINCT log.id) AS logIds
WHERE logCount > 1
RETURN record.id AS recordId, logCount, logIds
ORDER BY logCount DESC
LIMIT 50
`

// Finds churches with multiple ServiceLog nodes each having HAS_SERVICE records
// in a given week — these churches produce inflated income in HAS_HISTORY queries.
const multiLogPerWeekQuery = `
MATCH (church)-[:HAS_HISTORY]->(log:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
WHERE (church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus)
  AND date.date.week = $week
  AND date.date.year = $year
  AND NOT record:NoService
WITH church, count(DISTINCT log) AS logCount, count(DISTINCT record) AS recordCount,
     collect(DISTINCT log.id) AS logIds, sum(coalesce(record.income, 0)) AS inflatedIncome,
     [l IN collect(DISTINCT log) WHERE (church)-[:CURRENT_HISTORY]->(l)] AS currentLogs
WHERE logCount > 1
WITH church, logCount, recordCount, logIds, inflatedIncome,
     head(currentLogs) AS currentLog
OPTIONAL MATCH (currentLog)-[:HAS_SERVICE]->(currentRecord:ServiceRecord)-[:SERVICE_HELD_ON]->(d:TimeGraph)
WHERE d.date.week = $week AND d.date.year = $year AND NOT currentRecord:NoService
WITH church, logCount, recordCount, logIds, inflatedIncome,
     coalesce(sum(currentRecord.income), 0) AS correctIncome
UNWIND labels(church) AS label
WITH church, logCount, recordCount, logIds, inflatedIncome, correctIncome, label
WHERE label IN ['Bacenta','Governorship','Council','Stream','Campus']
RETURN church.id AS churchId, church.name AS churchName, label AS churchLevel,
       logCount, recordCount, logIds,
       round(inflatedIncome, 2) AS inflatedIncome,
       round(correctIncome, 2) AS correctIncome,
       round(inflatedIncome - correctIncome, 2) AS inflation
ORDER BY inflation DESC
LIMIT 100
`

async function main() {
  console.log(`\nSYN-59 Service Log Duplication Audit`)
  console.log(`Week: ${currentWeek}, Year: ${currentYear}\n`)

  const SECRETS = await loadSecrets()
  const uri =
    SECRETS.NEO4J_ENCRYPTED === 'true'
      ? SECRETS.NEO4J_URI?.replace('bolt://', 'neo4j+s://')
      : SECRETS.NEO4J_URI || 'bolt://localhost:7687'

  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    )
  )

  let session
  try {
    session = driver.session()
    console.log(`Connected to Neo4j at ${uri}\n`)

    // Check 1: True shared HAS_SERVICE edges (same ServiceRecord from multiple logs)
    console.log(
      '=== Check 1: ServiceRecords with HAS_SERVICE from multiple ServiceLogs ==='
    )
    const sharedResult = await session.executeRead((tx) =>
      tx.run(sharedEdgeQuery)
    )
    if (sharedResult.records.length === 0) {
      console.log(
        '✅ No ServiceRecord found with HAS_SERVICE from more than one ServiceLog.'
      )
      console.log(
        '   (Shared-edge duplication is NOT the issue — data integrity is intact.)\n'
      )
    } else {
      console.log(
        `⚠️  Found ${sharedResult.records.length} ServiceRecord(s) with shared HAS_SERVICE edges:`
      )
      sharedResult.records.forEach((r) => {
        console.log(
          `   Record ${r.get('recordId')} ← ${r.get('logCount')} logs: ${r
            .get('logIds')
            .join(', ')}`
        )
      })
      console.log()
    }

    // Check 2: Churches with multiple logs each having records in the given week
    console.log(
      `=== Check 2: Churches with multiple ServiceLogs each having records in week ${currentWeek}/${currentYear} ===`
    )
    const multiLogResult = await session.executeRead((tx) =>
      tx.run(multiLogPerWeekQuery, {
        week: neo4j.int(currentWeek),
        year: neo4j.int(currentYear),
      })
    )
    if (multiLogResult.records.length === 0) {
      console.log(
        `✅ No churches found with multi-log income inflation in week ${currentWeek}/${currentYear}.\n`
      )
    } else {
      console.log(
        `⚠️  Found ${multiLogResult.records.length} church(es) with income inflation in week ${currentWeek}/${currentYear}:`
      )
      console.log()
      multiLogResult.records.forEach((r) => {
        console.log(
          `   [${r.get('churchLevel')}] ${r.get('churchName')} (${r.get(
            'churchId'
          )})`
        )
        console.log(
          `     Logs with records this week: ${r.get(
            'logCount'
          )} | Records: ${r.get('recordCount')}`
        )
        console.log(
          `     Inflated income (HAS_HISTORY sum): GHS ${r.get(
            'inflatedIncome'
          )}`
        )
        console.log(
          `     Correct income (CURRENT_HISTORY): GHS ${r.get('correctIncome')}`
        )
        console.log(`     Inflation delta: GHS ${r.get('inflation')}`)
        console.log()
      })
    }

    console.log('Diagnosis complete.')
  } catch (error) {
    console.error('Error running diagnosis:', error)
    process.exit(1)
  } finally {
    if (session) await session.close()
    await driver.close()
  }
}

main()
