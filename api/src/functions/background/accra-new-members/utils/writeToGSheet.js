const { google } = require('googleapis')
const {
  getGoogleCredentials,
} = require('../../den-office-monthly-report/gsecrets.js')

const SPREADSHEET_ID = '1v0N6YAv1Ov3JnZ10QmM2kochZHAdlNVtnCS6SgTuHII'

/**
 * Clear all data from a Google Sheet
 * @param {string} sheetName - The name of the sheet to clear
 * @returns {Promise<void>}
 */
exports.clearGSheet = async (sheetName) => {
  // Get Google credentials
  const credentials = await getGoogleCredentials()

  const googleAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const auth = await googleAuth.getClient()
  const sheets = google.sheets({ version: 'v4', auth })

  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    })
  } catch (error) {
    console.error('Error clearing google sheet:', error)
    throw error
  }
}

/**
 * Write data to a Google Sheet
 * @param {Array<Array<string>>} data - The data to write
 * @param {string} sheetName - The name of the sheet
 * @param {string} writeRange - The range to write to (e.g. 'A1:B10')
 * @returns {Promise<void>}
 */
exports.writeToGsheet = async (data, sheetName, writeRange) => {
  // Get Google credentials
  const credentials = await getGoogleCredentials()

  const googleAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const auth = await googleAuth.getClient()
  const sheets = google.sheets({ version: 'v4', auth })

  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${writeRange}`,
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

// For compatibility with both import styles
exports.default = exports.writeToGsheet
