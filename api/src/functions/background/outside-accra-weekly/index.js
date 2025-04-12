const neo4j = require('neo4j-driver')
const { default: axios } = require('axios')
const { getSecrets } = require('./gsecrets.js')
const { clearGSheet, writeToGsheet } = require('./utils/writeToGSheet.js')
const { campusList } = require('./query-exec/campusList.js')
const totalAttendanceIncome = require('./query-exec/totalAttendanceIncome.js')
const totalNotBankedIncome = require('./query-exec/totalNotBankedIncome.js')
const totalBankedIncome = require('./query-exec/totalBankedIncome.js')
const campusAttendanceIncome = require('./query-exec/campusAttendanceIncome.js')
const fellowshipAttendanceIncome = require('./query-exec/fellowshipAttendanceIncome.js')
const { notifyBaseURL } = require('./utils/constants.js')

/**
 * Helper function to get the ISO week number for a given date
 * @param {Date} date - The date to calculate the week number for
 * @returns {number} - ISO week number
 */
const getWeekNumber = (date = new Date()) => {
  // Create a copy of the date to avoid modifying the input
  const targetDate = new Date(date.getTime())

  // Set hours to avoid daylight saving time issues
  targetDate.setHours(0, 0, 0, 0)

  // ISO week starts on Monday, so adjust the day number
  const dayNum = targetDate.getDay() || 7

  // Set to nearest Thursday (to match ISO 8601 definition)
  targetDate.setDate(targetDate.getDate() + 4 - dayNum)

  // Get first day of the year
  const yearStart = new Date(targetDate.getFullYear(), 0, 1)

  // Calculate week number: Week 1 is the week with the year's first Thursday
  const weekNumber = Math.ceil(((targetDate - yearStart) / 86400000 + 1) / 7)

  return weekNumber
}

/**
 * Main handler for the Outside Accra Weekly data update
 * Compatible with AWS Lambda
 */
const handler = async () => {
  console.log('Running function on date', new Date().toISOString())

  try {
    // Load secrets using AWS Secrets Manager
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

    const response = await Promise.all([
      campusList(driver),
      totalAttendanceIncome(driver),
      totalNotBankedIncome(driver),
      totalBankedIncome(driver),
      campusAttendanceIncome(driver),
      fellowshipAttendanceIncome(driver),
    ]).catch((error) => {
      console.error('Database query failed to complete\n', error.message)
      throw error
    })

    const campusListData = response[0]
    const totalAttendanceIncomeData = response[1]
    const totalNotBankedIncomeData = response[2]
    const totalBankedIncomeData = response[3]
    const campusAttendanceIncomeData = response[4]
    const fellowshipAttendanceIncomeData = response[5]

    const outsideAccraSheet = 'OA Campus'

    await clearGSheet(outsideAccraSheet)

    await Promise.all([
      writeToGsheet(campusListData, outsideAccraSheet, 'A:D'),
      writeToGsheet(totalAttendanceIncomeData, outsideAccraSheet, 'E:F'),
      writeToGsheet(totalNotBankedIncomeData, outsideAccraSheet, 'G:G'),
      writeToGsheet(totalBankedIncomeData, outsideAccraSheet, 'H:H'),
      writeToGsheet(campusAttendanceIncomeData, outsideAccraSheet, 'J:K'),
      writeToGsheet(fellowshipAttendanceIncomeData, outsideAccraSheet, 'M:N'),
      // Send notification SMS
      axios({
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
            '233592219407', // Latisha
            '233263995059', // Abigail Tay
          ],
          sender: 'FLC Admin',
          message: `WEEK ${
            getWeekNumber() - 1
          } UPDATE\n\nOutside Accra Google Sheets updated successfully on date ${
            new Date()
              .toLocaleString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
              .split('T')[0]
          }`,
        },
      }),
    ]).catch((error) => {
      throw new Error(
        `Error writing to google sheet\n${error.message}\n${error.stack}`
      )
    })

    // Close the Neo4j driver when done
    await driver.close()

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Outside Accra Campus data updated successfully',
      }),
    }
  } catch (error) {
    console.error('Error in Outside Accra Weekly function:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error updating Outside Accra Campus data',
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
