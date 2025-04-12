const neo4j = require('neo4j-driver')
const { loadSecrets } = require('./secrets.js')
const {
  aggregateBacentaOnGovernorship,
  aggregateGovernorshipOnCouncil,
  aggregateCouncilOnStream,
  aggregateStreamOnCampus,
  aggregateCampusOnOversight,
  aggregateOversightOnDenomination,
} = require('./query-exec/aggregateAllChurches.js')

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
 * @returns {Promise<Object>} - Response object
 */
const handler = async () => {
  console.log(
    'Running service graph aggregator on date',
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

    // Run aggregation queries
    await initializeDatabase(driver)

    // Close the Neo4j driver when done
    await driver.close()

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
  }
}

// Export for AWS Lambda
exports.handler = async (event, context) => {
  console.log('AWS Lambda handler invoked', { event })
  return handler()
}
