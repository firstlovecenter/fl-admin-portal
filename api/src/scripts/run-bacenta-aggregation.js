#!/usr/bin/env node

/**
 * Command line script to run the bacenta aggregation process
 *
 * Usage:
 *   node run-bacenta-aggregation.js [options]
 *
 * Options:
 *   --help, -h          Show help information
 *   --all               Run all aggregations (default)
 *   --governorship      Run only governorship aggregation
 *   --council           Run only council aggregation
 *   --stream            Run only stream aggregation
 *   --campus            Run only campus aggregation
 *   --oversight         Run only oversight aggregation
 *   --denomination      Run only denomination aggregation
 *   --zero-nulls        Zero out null bussing records
 *   --week <number>     Specify week (defaults to current week)
 *   --year <number>     Specify year (defaults to current year)
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

// Import the aggregation queries
const {
  aggregateBussingOnGovernorshipQuery,
  aggregateBussingOnCouncilQuery,
  aggregateBussingOnStreamQuery,
  aggregateBussingOnCampusQuery,
  aggregateBussingOnOversightQuery,
  aggregateBussingOnDenominationQuery,
  zeroAllNullBussingRecordsCypher,
} = require('../functions/bacenta-graph-aggregator-background/bacenta-cypher')

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  help: args.includes('--help') || args.includes('-h'),
  all: args.includes('--all') || args.length === 0, // default if no specific action
  governorship: args.includes('--governorship'),
  council: args.includes('--council'),
  stream: args.includes('--stream'),
  campus: args.includes('--campus'),
  oversight: args.includes('--oversight'),
  denomination: args.includes('--denomination'),
  zeroNulls: args.includes('--zero-nulls'),
  week: getArgValue(args, '--week'),
  year: getArgValue(args, '--year'),
}

function getArgValue(args, flag) {
  const index = args.indexOf(flag)
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null
}

// Show help and exit
if (options.help) {
  console.log(`
    Bacenta Aggregation CLI
    
    Usage:
      node run-bacenta-aggregation.js [options]
    
    Options:
      --help, -h          Show this help message
      --all               Run all aggregations (default)
      --governorship      Run only governorship aggregation
      --council           Run only council aggregation
      --stream            Run only stream aggregation
      --campus            Run only campus aggregation
      --oversight         Run only oversight aggregation
      --denomination      Run only denomination aggregation
      --zero-nulls        Zero out null bussing records
      --week <number>     Specify week (defaults to current week)
      --year <number>     Specify year (defaults to current year)
    
    Examples:
      node run-bacenta-aggregation.js --all
      node run-bacenta-aggregation.js --governorship --council
      node run-bacenta-aggregation.js --zero-nulls
      node run-bacenta-aggregation.js --all --week 42 --year 2023
  `)
  process.exit(0)
}

async function runAggregations() {
  console.log('Starting bacenta aggregation...')

  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687'
  const user = process.env.NEO4J_USER || 'neo4j'
  const password = process.env.NEO4J_PASSWORD || 'neo4j'

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))

  let session
  try {
    session = driver.session()
    console.log(`Connected to Neo4j at ${uri}`)

    // If week or year is specified, we need to modify the date context
    let dateContext = ''
    if (options.week || options.year) {
      const week = options.week || new Date().getWeek()
      const year = options.year || new Date().getFullYear()

      await session.run(`
        CALL apoc.date.convertFormat('${year}-${week}', 'yyyy-w', 'yyyy-MM-dd') YIELD date
        CALL apoc.util.sleep(100)
        RETURN date
      `)

      console.log(`Setting date context to week ${week}, year ${year}`)
      dateContext = `USING PERIODIC COMMIT 500
                    CALL apoc.date.convertFormat('${year}-${week}', 'yyyy-w', 'yyyy-MM-dd') YIELD date AS dateString
                    WITH apoc.date.parse(dateString, 'ms', 'yyyy-MM-dd') AS timestamp
                    WITH datetime({epochMillis: timestamp}) AS queryDate `
    }

    // Run the selected aggregations
    const results = {}

    // Run all aggregations if --all is specified or no specific aggregation is selected
    if (options.all || options.governorship) {
      console.log('Running governorship aggregation...')
      const result = await session.run(
        dateContext + aggregateBussingOnGovernorshipQuery
      )
      results.governorshipCount = result.records[0]
        .get('governorshipCount')
        .toNumber()
    }

    if (options.all || options.council) {
      console.log('Running council aggregation...')
      const result = await session.run(
        dateContext + aggregateBussingOnCouncilQuery
      )
      results.councilCount = result.records[0].get('councilCount').toNumber()
    }

    if (options.all || options.stream) {
      console.log('Running stream aggregation...')
      const result = await session.run(
        dateContext + aggregateBussingOnStreamQuery
      )
      results.streamCount = result.records[0].get('streamCount').toNumber()
    }

    if (options.all || options.campus) {
      console.log('Running campus aggregation...')
      const result = await session.run(
        dateContext + aggregateBussingOnCampusQuery
      )
      results.campusCount = result.records[0].get('campusCount').toNumber()
    }

    if (options.all || options.oversight) {
      console.log('Running oversight aggregation...')
      const result = await session.run(
        dateContext + aggregateBussingOnOversightQuery
      )
      results.oversightCount = result.records[0]
        .get('oversightCount')
        .toNumber()
    }

    if (options.all || options.denomination) {
      console.log('Running denomination aggregation...')
      const result = await session.run(
        dateContext + aggregateBussingOnDenominationQuery
      )
      results.denominationCount = result.records[0]
        .get('denominationCount')
        .toNumber()
    }

    if (options.all || options.zeroNulls) {
      console.log('Zeroing out null bussing records...')
      const result = await session.run(zeroAllNullBussingRecordsCypher)
      results.nullRecordsZeroed = result.records[0]
        .get('aggregateCount')
        .toNumber()
    }

    console.log('\nAggregation Results:')
    console.table(results)
    console.log('\nBackenta aggregation completed successfully!')
  } catch (error) {
    console.error('Error running bacenta aggregation:', error)
  } finally {
    if (session) {
      await session.close()
    }
    await driver.close()
  }
}

// Add helper method to Date prototype for getting week number
Date.prototype.getWeek = function () {
  const date = new Date(this.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  )
}

// Run the aggregations
runAggregations()
