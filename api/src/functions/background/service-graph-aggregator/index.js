const neo4j = require('neo4j-driver')
const { loadSecrets } = require('./secrets.js')
const { connectWithRetry } = require('./connect-with-retry.js')
const {
  aggregateBacentaOnGovernorship,
  aggregateGovernorshipOnCouncil,
  aggregateCouncilOnStream,
  aggregateStreamOnCampus,
  aggregateCampusOnOversight,
  aggregateOversightOnDenomination,
} = require('./query-exec/aggregateAllChurches.js')

// Per-attempt connect cap, and the time kept back for the aggregation queries
// once connect retries end (SYN-265)
const CONNECTION_TIMEOUT_MS = 10000
const QUERY_RESERVE_MS = 90000

/**
 * Execute all aggregation queries
 * @param {Object} neoDriver - Neo4j driver instance
 * @returns {Promise<void>}
 */
const executeQuery = async (neoDriver) => {
  try {
    await Promise.all([
      aggregateBacentaOnGovernorship(neoDriver),
      aggregateGovernorshipOnCouncil(neoDriver),
      aggregateCouncilOnStream(neoDriver),
      aggregateStreamOnCampus(neoDriver),
      aggregateCampusOnOversight(neoDriver),
      aggregateOversightOnDenomination(neoDriver),
    ])
    console.log('All Aggregations Complete!')
  } catch (error) {
    console.error('Error aggregating graphs', error)
    throw error
  }
}

/**
 * Initialize database and run aggregation queries
 * @param {Object} driver - Neo4j driver instance
 * @returns {Promise<void>}
 */
const initializeDatabase = (driver) => {
  return executeQuery(driver).catch((error) => {
    console.error('Database query failed to complete\n', error.message)
    throw error
  })
}

/**
 * Main handler for the Service Graph Aggregator
 * Compatible with both AWS Lambda and Netlify Functions
 * @param {Object} [context] - Lambda context; bounds the connect retries
 * @returns {Promise<Object>} - Response object
 */
const handler = async (context) => {
  console.log(
    'Running service graph aggregator on date',
    new Date().toISOString()
  )

  let driver

  try {
    // Load secrets (works in both AWS Lambda and Netlify Functions)
    const SECRETS = await loadSecrets()

    // Configure encrypted connection if required (for AWS)
    const uri =
      SECRETS.NEO4J_ENCRYPTED === 'true'
        ? SECRETS.NEO4J_URI?.replace('bolt://', 'neo4j+s://')
        : SECRETS.NEO4J_URI || 'bolt://localhost:7687'

    // Create Neo4j driver
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(
        SECRETS.NEO4J_USER || 'neo4j',
        SECRETS.NEO4J_PASSWORD || 'neo4j'
      ),
      // Cap each connect attempt (default 30s) so a host that drops packets
      // instead of refusing can't eat the 330s Lambda timeout across the
      // connect retries below (SYN-225)
      { connectionTimeout: CONNECTION_TIMEOUT_MS }
    )

    // Verify connection — retries a transient refusal instead of failing
    // the whole run on one blip (SYN-225), stopping in time to leave
    // QUERY_RESERVE_MS before the Lambda timeout (SYN-265)
    const deadline =
      typeof context?.getRemainingTimeInMillis === 'function'
        ? Date.now() + context.getRemainingTimeInMillis() - QUERY_RESERVE_MS
        : Infinity
    await connectWithRetry(driver, {
      deadline,
      attemptTimeoutMs: CONNECTION_TIMEOUT_MS,
    })
    console.log('[Neo4j] Connection established successfully')

    // Run aggregation queries
    await initializeDatabase(driver)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Service graphs aggregated successfully',
      }),
    }
  } catch (error) {
    console.error('Error in service graph aggregator function:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error aggregating service graphs',
        error: error.message,
      }),
    }
  } finally {
    // Close on every path (previously success-only, leaving sockets open on
    // failure). A failed close must not turn a finished run into a thrown
    // Lambda error that the scheduler retries (SYN-225)
    if (driver) {
      await driver.close().catch((error) => {
        console.warn('[Neo4j] Failed to close driver:', error.message)
      })
    }
  }
}

// Export for AWS Lambda
exports.handler = async (event, context) => {
  console.log('AWS Lambda handler invoked', { event })
  return handler(context)
}
