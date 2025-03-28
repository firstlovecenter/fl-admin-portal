const neo4j = require('neo4j-driver')
const { schedule } = require('@netlify/functions')
const { default: axios } = require('axios')
const { getWeekNumber } = require('@jaedag/admin-portal-types')
const { SECRETS } = require('./gsecrets.js')
const { writeToGsheet, clearGSheet } = require('./utils/writeToGSheet.js')
const { newMembersList } = require('./query-exec/newMembersList.js')
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

  const response = await Promise.all([newMembersList(driver)]).catch(
    (error) => {
      console.error('Database query failed to complete\n', error.message)
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

  await Promise.all([
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
          '233594760323', // Me John-Dag
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

module.exports.handler = schedule('00 08 * * 3', handler)
