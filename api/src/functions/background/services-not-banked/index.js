const neo4j = require('neo4j-driver')
const { google } = require('googleapis')
const { default: axios } = require('axios')
const { getWeekNumber } = require('@jaedag/admin-portal-types')
const { loadSecrets } = require('./secrets')
const { getGoogleCredentials } = require('./google-credentials')

const SPREADSHEET_ID = '1qaDQM5RlOPpSC9Gi78xfOGAETLhQyfZ1qsDxM4GUF68'

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
    throw error
  } finally {
    await session.close()
  }
}

const writeToGsheet = async (data, sheetName, googleCredentials) => {
  const googleAuth = new google.auth.GoogleAuth({
    credentials: googleCredentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

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
    return response.data
  } catch (error) {
    console.error('Error adding data to google sheet:', error)
    throw error
  }
}

const sendNotificationSMS = async (secrets) => {
  console.log('Sending notification SMS')

  const response = await axios({
    method: 'post',
    baseURL: 'https://flc-microservices.netlify.app/.netlify/functions/notify',
    url: '/send-sms',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-key': secrets.FLC_NOTIFY_KEY,
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
  })

  console.log('SMS notification sent successfully')
  return response.data
}

/**
 * AWS Lambda handler for updating services not banked data
 * This function is designed to be triggered by CloudWatch Events/EventBridge
 * Schedule: Runs weekly on Monday at 23:30 UTC
 */
exports.handler = async (event, context) => {
  console.log('Services not banked Lambda function invoked', { event })

  try {
    // Load secrets
    const SECRETS = await loadSecrets()

    // Configure encrypted connection if required
    const uri =
      SECRETS.NEO4J_ENCRYPTED === 'true'
        ? SECRETS.NEO4J_URI.replace('bolt://', 'neo4j+s://')
        : SECRETS.NEO4J_URI

    console.log(
      `[Neo4j] Connecting to ${uri.replace(/:\/\/.*@/, '://[REDACTED]@')}`
    )

    // Create Neo4j driver
    const driver = neo4j.driver(
      uri,
      neo4j.auth.basic(SECRETS.NEO4J_USER, SECRETS.NEO4J_PASSWORD),
      {
        maxConnectionPoolSize: 10,
        connectionTimeout: 30000,
      }
    )

    // Verify connection
    await driver.verifyConnectivity()
    console.log('[Neo4j] Connection established successfully')

    // Fetch data from Neo4j
    const data = await executeQuery(driver)
    console.log(`Retrieved ${data.length - 1} records from database`)

    // Format Google credentials
    const googleCredentials = getGoogleCredentials(SECRETS)

    // Write data to Google Sheet
    const sheetName = 'Accra Services'
    await writeToGsheet(data, sheetName, googleCredentials)
    console.log('Successfully wrote data to Google Sheet')

    // Send notification SMS
    await sendNotificationSMS(SECRETS)

    // Close the driver when done
    await driver.close()

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Services not banked data updated successfully',
      }),
    }
  } catch (error) {
    console.error('Error in services-not-banked Lambda function:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error updating services not banked data',
        error: error.message,
      }),
    }
  }
}
