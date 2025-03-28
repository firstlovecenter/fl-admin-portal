const neo4j = require('neo4j-driver')
const { schedule } = require('@netlify/functions')
const { google } = require('googleapis')
const { default: axios } = require('axios')
const { getWeekNumber } = require('@jaedag/admin-portal-types')
const { GOOGLE_APPLICATION_CREDENTIALS, SECRETS } = require('./gsecrets.js')

const fetchData = `
MATCH (gs:Campus {name: $campusName})-[:HAS*2]->(council:Council)<-[:LEADS]-(pastor:Member)
MATCH (council)-[:HAS_HISTORY|HAS_SERVICE|HAS*2..5]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
WHERE record.noServiceReason IS NULL
          AND record.bankingSlip IS NULL
          AND (record.transactionStatus IS NULL OR record.transactionStatus <> 'success')
          AND record.tellerConfirmationTime IS NULL
      MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)-[:HAS_HISTORY]-(church) WHERE church:Bacenta OR church:Governorship OR church:Council
      MATCH (church)<-[:LEADS]-(leader:Member)
RETURN DISTINCT toString(date.date.week) AS week, toString(date.date) AS date, pastor.firstName, pastor.lastName,church.name AS churchName, leader.firstName, 
leader.lastName, labels(church), toString(record.attendance) AS attendance, record.income AS NotBanked ORDER BY pastor.firstName,
pastor.lastName, date, week
`

const executeQuery = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Running function on date', new Date().toISOString())

    const result = await session.executeRead(async (tx) =>
      tx.run(fetchData, {
        campusName: 'Accra',
      })
    )

    const headerRow = [
      'Week',
      'Date',
      'Pastor First Name',
      'Pastor Last Name',
      'Church Name',
      'Leader First Name',
      'Leader Last Name',
      'Labels',
      'Attendance',
      'NotBanked',
    ]

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('week'),
        record.get('date'),
        record.get('pastor.firstName'),
        record.get('pastor.lastName'),
        record.get('churchName'),
        record.get('leader.firstName'),
        record.get('leader.lastName'),
        record.get('labels(church)').toString(),
        record.get('attendance'),
        record.get('NotBanked'),
      ]),
    ]

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

const SPREADSHEET_ID = '1qaDQM5RlOPpSC9Gi78xfOGAETLhQyfZ1qsDxM4GUF68'
const googleAuth = new google.auth.GoogleAuth({
  credentials: GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const writeToGsheet = async (data, sheetName) => {
  const auth = await googleAuth.getClient()
  const sheets = google.sheets({ version: 'v4', auth })

  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    })

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: data },
    })

    console.log('Response from google sheets:', response.data)
  } catch (error) {
    console.error('Error adding data to google sheet:', error)
    throw error
  }
}

const initializeDatabase = (driver) =>
  executeQuery(driver).catch((error) => {
    console.error('Database query failed to complete\n', error.message)
  })

const handler = async () => {
  const driver = neo4j.driver(
    SECRETS.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    )
  )

  const init = async (neoDriver) => initializeDatabase(neoDriver)

  const data = await init(driver).catch((error) => {
    throw new Error(
      `Database initialization failed\n${error.message}\n${error.stack}`
    )
  })

  /*
   * We catch any errors that occur during initialization of the google client
   * In this case, ensure that the google client is authentication occurs
   */
  const sheetName = 'Accra Services'

  await writeToGsheet(data, sheetName).catch((error) => {
    throw new Error(
      `Error writing to google sheet\n${error.message}\n${error.stack}`
    )
  })

  await axios({
    method: 'post',
    baseURL: 'https://flc-microservices.netlify.app/.netlify/functions/notify',
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
      message: `WEEK ${
        getWeekNumber() - 1
      } UPDATE\n\nServices Not Banked Sheets updated successfully on date ${
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
    throw new Error(
      `Error writing to google sheet\n${error.message}\n${error.stack}`
    )
  })

  return {
    statusCode: 200,
  }
}

module.exports.handler = schedule('30 23 * * 1', handler)
