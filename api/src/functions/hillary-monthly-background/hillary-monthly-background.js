const neo4j = require('neo4j-driver')
const { schedule } = require('@netlify/functions')
const { default: axios } = require('axios')
const { SECRETS } = require('./gsecrets.js')

const { notifyBaseURL, lastMonth } = require('./utils/constants.js')
const {
  default: monthlyDataRetrieval,
} = require('./query-exec/monthly-data-query.js')

const handler = async () => {
  const driver = neo4j.driver(
    SECRETS.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    )
  )

  console.log('Running function on date', new Date().toISOString())

  const response = await monthlyDataRetrieval(driver).catch((error) => {
    console.error('Database query failed to complete\n', error.message)
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
      recipient: ['233594760323', '233248659695'],
      sender: 'FLC Admin',
      message: `Hi Hillary\n\n${getLastMonthName()} Data\n\nAccra Oversight\nBacentas: ${
        accraData.bacentas
      }\nAverage Attendance: ${accraData.averageAttendance}\nCampuses: ${
        accraData.campuses
      }\nPastors: ${accraData.pastors}\nReverends: ${
        accraData.reverends
      }\n\nOutside Accra Oversight\nBacentas: ${
        outsideAccraData.bacentas
      }\nAverage Attendance: ${outsideAccraData.averageAttendance}\nCampuses: ${
        outsideAccraData.campuses
      }\nPastors: ${outsideAccraData.pastors}\nReverends: ${
        outsideAccraData.reverends
      }`,
    },
  }).catch((error) => {
    throw new Error(`Error sending SMS\n${error.message}\n${error.stack}`)
  })

  return {
    statusCode: 200,
  }
}

module.exports.handler = schedule('0 6 1 * *', handler)
