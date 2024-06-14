const neo4j = require('neo4j-driver')
const { schedule } = require('@netlify/functions')
const { default: axios } = require('axios')
const { SECRETS } = require('./gsecrets.js')

const { notifyBaseURL } = require('./utils/constants.js')
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

  const response = await Promise.all([monthlyDataRetrieval(driver)]).catch(
    (error) => {
      console.error('Database query failed to complete\n', error.message)
    }
  )

  await driver.close()

  console.log('Response from database', response)

  const demoted = response[0].map((bacenta) => bacenta)

  await Promise.all([
    ...demoted.map((bacenta) => {
      return axios({
        method: 'post',
        baseURL: notifyBaseURL,
        url: '/send-sms',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-key': SECRETS.FLC_NOTIFY_KEY,
        },
        data: {
          recipient: [bacenta.leaderPhone],
          sender: 'FLC Admin',
          message: `Hi ${bacenta.leaderFirstName}\n\nSorry! You have not been bussing for four consecutive weeks. Your bacenta ${bacenta.name} has been demoted to IC status`,
        },
      })
    }),
  ]).catch((error) => {
    throw new Error(`Error sending SMS\n${error.message}\n${error.stack}`)
  })

  return {
    statusCode: 200,
  }
}

module.exports.handler = schedule('30 10 * * 1', handler)
