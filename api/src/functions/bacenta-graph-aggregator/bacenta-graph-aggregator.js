const neo4j = require('neo4j-driver')
const { schedule } = require('@netlify/functions')
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

const SECRETS = loadSecrets()

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
  } finally {
    await session.close()
  }
}

const initializeDatabase = (driver) => {
  return executeQuery(driver).catch((error) => {
    console.error('Database query failed to complete\n', error.message)
  })
}
// This module can be used to serve the GraphQL endpoint
// as a lambda function

// This module is copied during the build step
// Be sure to run `npm run build`

const handler = async () => {
  const driver = neo4j.driver(
    SECRETS.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    )
  )

  const init = async (neoDriver) => initializeDatabase(neoDriver)

  /*
   * We catch any errors that occur during initialization
   * to handle cases where we still want the API to start
   * regardless, such as running with a read only user.
   * In this case, ensure that any desired initialization steps
   * have occurred
   */

  await init(driver).catch((error) => {
    throw new Error(
      `Database initialization failed\n${error.message}\n${error.stack}`
    )
  })

  return {
    statusCode: 200,
  }
}

module.exports.handler = schedule('* * * * *', handler)
