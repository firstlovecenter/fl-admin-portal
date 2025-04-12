const neo4j = require('neo4j-driver')
const { default: axios } = require('axios')
const { getSecrets } = require('../den-office-monthly-report/gsecrets.js')
const { writeToGsheet, clearGSheet } = require('./utils/writeToGSheet.js')
const { newMembersList } = require('./query-exec/newMembersList.js')
const { notifyBaseURL } = require('./utils/constants.js')

/**
 * Calculate the week number of the year for a given date
 * @param {Date} [date=new Date()] - The date to get the week number for (defaults to current date)
 * @returns {number} The week number of the year (1-53)
 */
const getWeekNumber = (date = new Date()) => {
  // Copy date to avoid modifying the original
  const targetDate = new Date(date.getTime())

  // Find Thursday in this week
  targetDate.setDate(targetDate.getDate() + 4 - (targetDate.getDay() || 7))

  // January 1st of the year
  const yearStart = new Date(targetDate.getFullYear(), 0, 1)

  // Calculate full weeks to the nearest Thursday
  const weekNumber = Math.ceil(((targetDate - yearStart) / 86400000 + 1) / 7)

  return weekNumber
}

/**
 * Main handler for the Accra New Members data update
 * AWS Lambda function handler
 */
const handler = async () => {
  console.log('Running function on date', new Date().toISOString())

  try {
    // Load secrets from AWS Secrets Manager
    const SECRETS = await getSecrets()

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

    const response = await Promise.all([newMembersList(driver)]).catch(
      (error) => {
        console.error('Database query failed to complete\n', error.message)
        throw error
      }
    )
    const newMembersListData = response[0]

    const accraSheet = 'New Members'

    await clearGSheet(accraSheet)

    await Promise.all([
      writeToGsheet(newMembersListData, accraSheet, 'A1:L'),
    ]).catch((error) => {
      throw new Error(
        `Error writing to google sheet\n${error.message}\n${error.stack}`
      )
    })

    await axios({
      method: 'post',
      baseURL: notifyBaseURL,
      url: '/send-sms',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': SECRETS.FLC_NOTIFY_KEY,
      },
      data: {
        recipient: [
          '233594760323', // JD
          '233541805641', // Becks
          '233596075970', // B Daniel
          '233248659695', // Hillary
        ],
        sender: 'FLC Admin',
        message: `WEEK ${
          getWeekNumber() - 1
        } UPDATE\n\nNew Members List has been updated on the sheet https://rebrand.ly/members-lw for date ${
          new Date()
            .toLocaleString('en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
            .split('T')[0]
        }`,
      },
    }).catch((error) => {
      console.error('Error sending notification SMS:', error.message)
    })

    // Close the Neo4j driver when done
    await driver.close()

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'New Members List updated successfully',
      }),
    }
  } catch (error) {
    console.error('Error in Accra New Members function:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error updating New Members List',
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
