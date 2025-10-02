const neo4j = require('neo4j-driver')
const { default: axios } = require('axios')
const { getSecrets } = require('./gsecrets.js')
const { writeToGsheet, clearGSheet } = require('./utils/writeToGSheet.js')
const { councilList } = require('./query-exec/councilList.js')
const { notifyBaseURL } = require('./utils/constants.js')
const {
  default: bacentasThatBussed,
} = require('./query-exec/bacentasThatBussed.js')
const {
  default: bacentasThatDidntBus,
} = require('./query-exec/bacentasThatDidntBus.js')
const { default: numberOfBusses } = require('./query-exec/numberOfBusses.js')
const {
  default: bussingAttendance,
} = require('./query-exec/bussingAttendance.js')
const {
  default: activeVacationFellowships,
} = require('./query-exec/activeVacationFellowships.js')
const {
  default: servicesThisWeek,
} = require('./query-exec/servicesThisWeek.js')
const {
  default: servicesNotBanked,
} = require('./query-exec/servicesNotBanked.js')
const {
  default: weekdayIncomeAttendance,
} = require('./query-exec/weekdayIncomeAttendance.js')
const { amountNotBanked } = require('./query-exec/amountNotBanked.js')
const {
  default: anagkazoIncomeAttendance,
} = require('./query-exec/anagkazoIncomeAttendance.js')
const {
  default: anagkazoAmountNotBanked,
} = require('./query-exec/anagkazoAmountNotBanked.js')
const { default: amountBanked } = require('./query-exec/amountBanked.js')
const {
  default: anagkazoAmountBanked,
} = require('./query-exec/anagkazoAmountBanked.js')

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
 * Main handler for the Accra Campus Weekly data update
 * Compatible with both AWS Lambda and Netlify Functions
 */
const handler = async () => {
  console.log('Running function on date', new Date().toISOString())

  try {
    // Load secrets (works in both AWS Lambda and Netlify Functions)
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
      councilList(driver),
      bacentasThatBussed(driver),
      bacentasThatDidntBus(driver),
      numberOfBusses(driver),
      bussingAttendance(driver),
      activeVacationFellowships(driver),
      servicesThisWeek(driver),
      servicesNotBanked(driver),
      weekdayIncomeAttendance(driver),
      amountNotBanked(driver),
      anagkazoIncomeAttendance(driver),
      anagkazoAmountNotBanked(driver),
      amountBanked(driver),
      anagkazoAmountBanked(driver),
    ]).catch((error) => {
      console.error('Database query failed to complete\n', error.message)
      throw error
    })

    const councilListData = response[0]
    const bacentasThatBussedData = response[1]
    const bacentasThatDidntBusData = response[2]
    const numberOfBussesData = response[3]
    const bussingAttendanceData = response[4]
    const activeVacationFellowshipsData = response[5]
    const servicesThisWeekData = response[6]
    const servicesNotBankedData = response[7]
    const weekdayIncomeAttendanceData = response[8]
    const amountNotBankedData = response[9]
    // const anagkazoIncomeAttendanceData = response[10]
    // const anagkazoAmountNotBankedData = response[11]
    const amountBankedData = response[12]
    // const anagkazoAmountBankedData = response[13]

    const accraSheet = 'ALL Accra Graph Data'

    await clearGSheet(accraSheet)

    await Promise.all([
      writeToGsheet(councilListData, accraSheet, 'A2:F'),
      writeToGsheet(bacentasThatDidntBusData, accraSheet, 'G2:G'),
      writeToGsheet(bacentasThatBussedData, accraSheet, 'H2:H'),
      writeToGsheet(numberOfBussesData, accraSheet, 'I2:I'),
      writeToGsheet(bussingAttendanceData, accraSheet, 'J2:J'),
      writeToGsheet(activeVacationFellowshipsData, accraSheet, 'M2:N'),
      writeToGsheet(servicesThisWeekData, accraSheet, 'O2:O'),
      writeToGsheet(servicesNotBankedData, accraSheet, 'P2:P'),
      writeToGsheet(weekdayIncomeAttendanceData, accraSheet, 'R2:S'),
      writeToGsheet(amountNotBankedData, accraSheet, 'T2:T'),
      writeToGsheet(amountBankedData, accraSheet, 'U2:U'),
    ]).catch((error) => {
      throw new Error(
        `Error writing to google sheet\n${error.message}\n${error.stack}`
      )
    })

    // Send notification SMS
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
          '233596075970', // Daniel
          '233248659695', // Hillary
        ],
        sender: 'FLC Admin',
        message: `WEEK ${getWeekNumber()} UPDATE\n\nAccra Google Sheets updated successfully on date ${
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
        message: 'Accra Campus data updated successfully',
      }),
    }
  } catch (error) {
    console.error('Error in Accra Campus Weekly function:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error updating Accra Campus data',
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
