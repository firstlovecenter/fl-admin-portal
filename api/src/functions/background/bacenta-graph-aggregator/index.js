const neo4j = require('neo4j-driver')
const { loadSecrets } = require('./secrets.js')
const {
  aggregateBussingOnCouncil,
  aggregateBussingOnStream,
  aggregateBussingOnCampus,
  aggregateBussingOnOversight,
  aggregateBussingOnDenomination,
  aggregateBussingOnGovernorship,
  zeroAllNullBussingRecords,
} = require('./query-exec/aggregateAllChurches.js')

/**
 * Execute the main graph aggregation queries
 * @param {Object} neoDriver - Neo4j Driver instance
 */
const executeQuery = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    await Promise.all([
      aggregateBussingOnGovernorship(neoDriver),
      aggregateBussingOnCouncil(neoDriver),
      aggregateBussingOnStream(neoDriver),
      aggregateBussingOnCampus(neoDriver),
      aggregateBussingOnOversight(neoDriver),
      aggregateBussingOnDenomination(neoDriver),
    ])
    console.log('All Aggregations Complete!')

    await zeroAllNullBussingRecords(neoDriver)
    console.log('Zeroed all null bussing records')
  } catch (error) {
    console.error('Error aggregating graphs', error)
    throw error
  } finally {
    await session.close()
  }
}

/**
 * Initialize database and run the aggregation queries
 * @param {Object} driver - Neo4j Driver instance
 */
const initializeDatabase = (driver) => {
  return executeQuery(driver).catch((error) => {
    console.error('Database query failed to complete\n', error.message)
    throw error
  })
}

/**
 * Main handler for the bacenta graph aggregator
 * Compatible with both AWS Lambda and Netlify Functions
 * @returns {Promise<Object>} - Response object
 */
const handler = async () => {
  console.log(
    'Running bacenta graph aggregator on date',
    new Date().toISOString()
  )

  try {
    // Load secrets (works in both AWS Lambda and Netlify Functions)
    const SECRETS = await loadSecrets()

    // Configure encrypted connection if required (for AWS)
    const uri =
      SECRETS.NEO4J_ENCRYPTED === 'true'
        ? SECRETS.NEO4J_URI?.replace('bolt://', 'neo4j+s://')
        : SECRETS.NEO4J_URI || 'bolt://localhost:7687'

    // Create Neo4j driver
    const driver = neo4j.driver(
      uri,
      neo4j.auth.basic(
        SECRETS.NEO4J_USER || 'neo4j',
        SECRETS.NEO4J_PASSWORD || 'neo4j'
      )
    )

    // Verify connection
    await driver.verifyConnectivity()
    console.log('[Neo4j] Connection established successfully')

    // Initialize database and run aggregation queries
    await initializeDatabase(driver)

    // Close the Neo4j driver when done
    await driver.close()

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Bacenta Graph Aggregation completed successfully',
      }),
    }
  } catch (error) {
    console.error('Error in Bacenta Graph Aggregator function:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error running Bacenta Graph Aggregation',
        error: error.message,
      }),
    }
  }
}

// Export for AWS Lambda
exports.handler = async (event, context) => {
  console.log('AWS Lambda handler invoked', { event })
  return handler()
}
