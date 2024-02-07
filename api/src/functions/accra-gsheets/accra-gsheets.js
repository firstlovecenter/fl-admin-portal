const neo4j = require('neo4j-driver')
const { schedule } = require('@netlify/functions')
const { SECRETS } = require('./gsecrets.js')
const { writeToGsheet, clearGSheet } = require('./utils/writeToGSheet.js')
const { councilList } = require('./query-exec/councilList.js')
const { notifyBaseURL } = require('./utils/constants.js')
const { default: axios } = require('axios')
const { getWeekNumber } = require('@jaedag/admin-portal-types')
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
  ]).catch((error) => {
    console.error('Database query failed to complete\n', error.message)
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
  const anagkazoIncomeAttendanceData = response[10]
  const anagkazoAmountNotBankedData = response[11]
  const amountBankedData = response[12]

  const accraSheet = 'Accra Graph Data'

  await clearGSheet(accraSheet)

  await Promise.all([
    writeToGsheet(councilListData, accraSheet, 'A2:C'),
    writeToGsheet(bacentasThatDidntBusData, accraSheet, 'D2:D'),
    writeToGsheet(bacentasThatBussedData, accraSheet, 'E2:E'),
    writeToGsheet(numberOfBussesData, accraSheet, 'F2:F'),
    writeToGsheet(bussingAttendanceData, accraSheet, 'G2:G'),
    writeToGsheet(activeVacationFellowshipsData, accraSheet, 'J2:K'),
    writeToGsheet(servicesThisWeekData, accraSheet, 'M2:M'),
    writeToGsheet(servicesNotBankedData, accraSheet, 'N2:N'),
    writeToGsheet(weekdayIncomeAttendanceData, accraSheet, 'Q2:R'),
    writeToGsheet(amountNotBankedData, accraSheet, 'S2:S'),
    writeToGsheet(anagkazoIncomeAttendanceData, accraSheet, 'Q8:N8'),
    writeToGsheet(anagkazoAmountNotBankedData, accraSheet, 'S8'),
    writeToGsheet(amountBankedData, accraSheet, 'T2:T'),
    axios({
      method: 'post',
      baseURL: notifyBaseURL,
      url: '/send-sms',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': process.env.FLC_NOTIFY_KEY,
      },
      data: {
        recipient: ['233594760323'],
        sender: 'FLC Admin',
        message: `WEEK ${
          getWeekNumber() - 1
        } UPDATE\n\nAccra Google Sheets updated successfully on date ${
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

module.exports.handler = schedule('30 23 * * 0', handler)