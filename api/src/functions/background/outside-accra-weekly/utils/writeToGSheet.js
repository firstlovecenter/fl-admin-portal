const { google } = require('googleapis')
const { getGoogleCredentials } = require('../gsecrets.js')

const SPREADSHEET_ID = '14YuUSVf_SFWZEcwx3AuchQ_0-ZTNaHCHcf9-cGQaPl4'

export const clearGSheet = async (sheetName) => {
  // Get credentials using AWS Secrets Manager compatible helper
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

export const writeToGsheet = async (data, sheetName, writeRange) => {
  // Get credentials using AWS Secrets Manager compatible helper
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
  } catch (error) {
    console.error('Error adding data to google sheet:', error)
    throw error
  }
}

export default writeToGsheet
