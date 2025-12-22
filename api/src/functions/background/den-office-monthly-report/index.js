const neo4j = require('neo4j-driver')
const { default: axios } = require('axios')
const { getSecrets } = require('./gsecrets.js')

const { notifyBaseURL, lastMonth } = require('./utils/constants.js')
const monthlyDataRetrieval = require('./query-exec/monthly-data-query.js')

/**
 * Main handler for the Hillary's Monthly Report data update
 * AWS Lambda function handler
 */
const handler = async () => {
  console.log('Running function on date', new Date().toISOString())

  try {
    // Load secrets from AWS Secrets Manager
    const SECRETS = await getSecrets()

    // Configure encrypted connection if required
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

    const response = await monthlyDataRetrieval(driver).catch((error) => {
      console.error('Database query failed to complete\n', error.message)
      throw error
    })

    await driver.close()

    console.log('Response from database', response)

    const accraData = {
      ...response[0],
      campuses: 1,
      pastors: 183,
      reverends: 29,
    }

    const outsideAccraData = {
      ...response[1],
      campuses: 37,
      pastors: 21,
      reverends: 3,
    }

    const getLastMonthName = () => {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]
      return monthNames[lastMonth - 1]
    }

    await axios({
      method: 'post',
      baseURL: notifyBaseURL,
      url: '/send-sms',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': SECRETS.FLC_NOTIFY_KEY,
      },
      data: {
        recipient: ['233248659695'],
        sender: 'FLC Admin',
        message: `Hi Hillary\n\n${getLastMonthName()} Data\n\nAccra Oversight\nBacentas: ${
          accraData.bacentas
        }\nAverage Attendance: ${accraData.averageAttendance}\nCampuses: ${
          accraData.campuses
        }\nPastors: ${accraData.pastors}\nReverends: ${
          accraData.reverends
        }\n\nOutside Accra Oversight\nBacentas: ${
          outsideAccraData.bacentas
        }\nAverage Attendance: ${
          outsideAccraData.averageAttendance
        }\nCampuses: ${outsideAccraData.campuses}\nPastors: ${
          outsideAccraData.pastors
        }\nReverends: ${outsideAccraData.reverends}`,
      },
    }).catch((error) => {
      console.error('Error sending SMS:', error.message, error.stack)
      throw error
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Hillary's monthly report sent successfully",
      }),
    }
  } catch (error) {
    console.error("Error in Hillary's Monthly Report function:", error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error sending Hillary's monthly report",
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
