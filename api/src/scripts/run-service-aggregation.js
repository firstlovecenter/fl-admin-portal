#!/usr/bin/env node

/**
 * Command line script to run the service aggregation process
 *
 * Usage:
 *   node run-service-aggregation.js [options]
 *
 * Options:
 *   --help, -h          Show help information
 *   --all               Run all aggregations (default)
 *   --governorship      Run only bacenta→governorship aggregation
 *   --council           Run only governorship→council aggregation
 *   --stream            Run only council→stream aggregation
 *   --campus            Run only stream→campus aggregation
 *   --oversight         Run only campus→oversight aggregation
 *   --denomination      Run only oversight→denomination aggregation
 */

const neo4j = require('neo4j-driver')
const path = require('path')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const {
  loadSecrets,
} = require('../functions/background/service-graph-aggregator/secrets')

const {
  aggregateBacentaOnGovernorshipQuery,
  aggregateGovernorshipOnCouncilQuery,
  aggregateCouncilOnStreamQuery,
  aggregateStreamOnCampusQuery,
  aggregateCampusOnOversightQuery,
  aggregateOversightOnDenominationQuery,
} = require('../functions/background/service-graph-aggregator/sevice-cypher')

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  help: args.includes('--help') || args.includes('-h'),
  all: args.includes('--all') || args.length === 0,
  governorship: args.includes('--governorship'),
  council: args.includes('--council'),
  stream: args.includes('--stream'),
  campus: args.includes('--campus'),
  oversight: args.includes('--oversight'),
  denomination: args.includes('--denomination'),
}

if (options.help) {
  console.log(`
    Service Aggregation CLI

    Usage:
      node run-service-aggregation.js [options]

    Options:
      --help, -h          Show this help message
      --all               Run all aggregations (default)
      --governorship      Run only bacenta→governorship aggregation
      --council           Run only governorship→council aggregation
      --stream            Run only council→stream aggregation
      --campus            Run only stream→campus aggregation
      --oversight         Run only campus→oversight aggregation
      --denomination      Run only oversight→denomination aggregation

    Examples:
      node run-service-aggregation.js
      node run-service-aggregation.js --all
      node run-service-aggregation.js --governorship --council
      node run-service-aggregation.js --denomination
  `)
  process.exit(0)
}

async function runAggregations() {
  console.log('Starting service aggregation...')

  const SECRETS = await loadSecrets()

  const uri =
    SECRETS.NEO4J_ENCRYPTED === 'true'
      ? SECRETS.NEO4J_URI?.replace('bolt://', 'neo4j+s://')
      : SECRETS.NEO4J_URI || 'bolt://localhost:7687'
  const user = SECRETS.NEO4J_USER || 'neo4j'
  const password = SECRETS.NEO4J_PASSWORD || 'neo4j'

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))

  let session
  try {
    session = driver.session()
    console.log(`Connected to Neo4j at ${uri}`)

    const results = {}

    if (options.all || options.governorship) {
      console.log('Aggregating Bacenta on Governorship...')
      const result = await session.run(aggregateBacentaOnGovernorshipQuery)
      results.governorshipCount = result.records[0]
        .get('governorshipCount')
        .toNumber()
    }

    if (options.all || options.council) {
      console.log('Aggregating Governorship on Council...')
      const result = await session.run(aggregateGovernorshipOnCouncilQuery)
      results.councilCount = result.records[0].get('councilCount').toNumber()
    }

    if (options.all || options.stream) {
      console.log('Aggregating Council on Stream...')
      const result = await session.run(aggregateCouncilOnStreamQuery)
      results.streamCount = result.records[0].get('streamCount').toNumber()
    }

    if (options.all || options.campus) {
      console.log('Aggregating Stream on Campus...')
      const result = await session.run(aggregateStreamOnCampusQuery)
      results.campusCount = result.records[0].get('campusCount').toNumber()
    }

    if (options.all || options.oversight) {
      console.log('Aggregating Campus on Oversight...')
      const result = await session.run(aggregateCampusOnOversightQuery)
      results.oversightCount = result.records[0]
        .get('oversightCount')
        .toNumber()
    }

    if (options.all || options.denomination) {
      console.log('Aggregating Oversight on Denomination...')
      const result = await session.run(aggregateOversightOnDenominationQuery)
      results.denominationCount = result.records[0]
        .get('denominationCount')
        .toNumber()
    }

    console.log('\nAggregation Results:')
    console.table(results)
    console.log('\nService aggregation completed successfully!')
  } catch (error) {
    console.error('Error running service aggregation:', error)
    process.exit(1)
  } finally {
    if (session) {
      await session.close()
    }
    await driver.close()
  }
}

runAggregations()
