const { google } = require('googleapis')
const { GOOGLE_APPLICATION_CREDENTIALS } = require('../gsecrets.js')

const SPREADSHEET_ID = '1v0N6YAv1Ov3JnZ10QmM2kochZHAdlNVtnCS6SgTuHII'
const googleAuth = new google.auth.GoogleAuth({
  credentials: GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

export const clearGSheet = async (sheetName) => {
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
