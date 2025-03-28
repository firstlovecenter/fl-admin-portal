const neo4j = require('neo4j-driver')
const { schedule } = require('@netlify/functions')
const { default: axios } = require('axios')
const { getWeekNumber } = require('@jaedag/admin-portal-types')
const { SECRETS } = require('./gsecrets.js')
const { writeToGsheet, clearGSheet } = require('./utils/writeToGSheet.js')
const { campusList } = require('./query-exec/campusList.js')
const {
  default: totalAttendanceIncome,
} = require('./query-exec/totalAttendanceIncome.js')
const {
  default: totalNotBankedIncome,
} = require('./query-exec/totalNotBankedIncome.js')
const {
  default: totalBankedIncome,
} = require('./query-exec/totalBankedIncome.js')
const {
  default: campusAttendanceIncome,
} = require('./query-exec/campusAttendanceIncome.js')
const {
  default: fellowshipAttendanceIncome,
} = require('./query-exec/fellowshipAttendanceIncome.js')
const { notifyBaseURL } = require('./utils/constants.js')

const handler = async () => {
  const driver = neo4j.driver(
    SECRETS.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    )
  )

  console.log('Running function on date', new Date().toISOString())
  const response = await Promise.all([
    campusList(driver),
    totalAttendanceIncome(driver),
    totalNotBankedIncome(driver),
    totalBankedIncome(driver),
    campusAttendanceIncome(driver),
    fellowshipAttendanceIncome(driver),
  ]).catch((error) => {
    console.error('Database query failed to complete\n', error.message)
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

  return {
    statusCode: 200,
  }
}

module.exports.handler = schedule('0 23 * * 1', handler)
