const neo4j = require('neo4j-driver')
const { default: axios } = require('axios')
const { getSecrets } = require('./gsecrets.js')
const {
  clearGSheet,
  clearGSheetRange,
  writeToGsheet,
} = require('./utils/writeToGSheet.js')
const { campusList } = require('./query-exec/campusList.js')
const campusAttendanceIncome = require('./query-exec/campusAttendanceIncome.js')
const fellowshipAttendanceIncome = require('./query-exec/fellowshipAttendanceIncome.js')
const campusBankedIncome = require('./query-exec/campusBankedIncome.js')
const campusNotBankedIncome = require('./query-exec/campusNotBankedIncome.js')
const weekdayBankedIncome = require('./query-exec/weekdayBankedIncome.js')
const weekdayNotBankedIncome = require('./query-exec/weekdayNotBankedIncome.js')
const {
  notifyBaseURL,
  getLastSunday,
  toLocalIsoDateString,
} = require('./utils/constants.js')
const {
  generateCombinedCSV,
  generateSundayServicesCSV,
  generateFellowshipCSV,
} = require('./utils/generateCSV.js')

const REPORT_MODES = {
  COMBINED: 'combined',
  FELLOWSHIP: 'fellowship',
  SUNDAY: 'sunday',
}

/**
 * Helper function to get the ISO week number for a given date
 * @param {Date} date - The date to calculate the week number for
 * @returns {number} - ISO week number
 */
const getWeekNumber = (date = new Date()) => {
  const targetDate = new Date(date.getTime())
  targetDate.setHours(0, 0, 0, 0)

  const dayNum = targetDate.getDay() || 7
  targetDate.setDate(targetDate.getDate() + 4 - dayNum)

  const yearStart = new Date(targetDate.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((targetDate - yearStart) / 86400000 + 1) / 7)

  return weekNumber
}

const parseIsoDateString = (isoDateString) => {
  const [year, month, day] = String(isoDateString)
    .split('-')
    .map((value) => Number(value))

  return new Date(year, month - 1, day)
}

const normalizeInputDate = (value) => {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseIsoDateString(value)
  }

  return new Date(value)
}

const parseBodyParams = (event = {}) => {
  if (!event.body) return {}

  if (typeof event.body === 'string') {
    try {
      return JSON.parse(event.body)
    } catch (error) {
      console.warn(
        'Invalid JSON body received. Falling back to empty body params.'
      )
      return {}
    }
  }

  return event.body
}

const normalizeReportMode = (mode, reportDate) => {
  const requestedMode = String(mode || '')
    .trim()
    .toLowerCase()

  if (
    requestedMode === REPORT_MODES.FELLOWSHIP ||
    requestedMode === 'weekday' ||
    requestedMode === 'fellowship-only'
  ) {
    return REPORT_MODES.FELLOWSHIP
  }

  if (
    requestedMode === REPORT_MODES.SUNDAY ||
    requestedMode === 'sunday-services' ||
    requestedMode === 'sunday-only'
  ) {
    return REPORT_MODES.SUNDAY
  }

  if (requestedMode) {
    return REPORT_MODES.COMBINED
  }

  // No mode specified — auto-detect from day of week.
  // Saturday runs report fellowship data; other days report the full combined set.
  if (reportDate && reportDate.getDay() === 6) {
    return REPORT_MODES.FELLOWSHIP
  }

  return REPORT_MODES.COMBINED
}

const buildEmailTemplate = ({
  title,
  weekNumber,
  reportDateString,
  description,
  sections,
}) => {
  const sectionMarkup = sections
    .map((section) => `<li style="margin-bottom:8px;">${section}</li>`)
    .join('')

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="background:#f4f4f5;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:10px;padding:28px;">
      <tr>
        <td>
          <h1 style="margin:0 0 10px 0;color:#991b1b;font-size:26px;">${title}</h1>
          <p style="margin:0 0 6px 0;color:#334155;font-size:15px;">Week ${weekNumber} - ${reportDateString}</p>
          <p style="margin:0 0 16px 0;color:#475569;font-size:14px;line-height:1.5;">${description}</p>
          <div style="background:#f8fafc;border-radius:8px;padding:16px;">
            <p style="margin:0 0 10px 0;font-weight:700;color:#0f172a;">Included in this report:</p>
            <ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.45;">
              ${sectionMarkup}
            </ul>
          </div>
          <p style="margin:20px 0 0 0;color:#64748b;font-size:12px;">First Love Church - Outside Accra Business Intelligence Team</p>
        </td>
      </tr>
    </table>
  </body>
</html>
  `
}

const getModeConfig = (mode, weekNumber, reportDateString) => {
  if (mode === REPORT_MODES.FELLOWSHIP) {
    return {
      smsLabel: 'Fellowship',
      subject: `Outside Accra Fellowship Weekly Report - Week ${weekNumber}, ${reportDateString}`,
      filenamePrefix: 'outside-accra-fellowship-week',
      description:
        'This report contains only fellowship (weekday) attendance and income metrics for Outside Accra campuses.',
      sections: [
        'Campus list (context)',
        'Fellowship attendance and income',
        'Weekday banked income',
        'Weekday not banked income',
      ],
    }
  }

  if (mode === REPORT_MODES.SUNDAY) {
    return {
      smsLabel: 'Sunday Services',
      subject: `Outside Accra Sunday Services Weekly Report - Week ${weekNumber}, ${reportDateString}`,
      filenamePrefix: 'outside-accra-sunday-services-week',
      description:
        'This report contains only Sunday service attendance and income metrics for Outside Accra campuses.',
      sections: [
        'Campus list (context)',
        'Campus attendance and income',
        'Campus banked income',
        'Campus not banked income',
      ],
    }
  }

  return {
    smsLabel: 'Combined',
    subject: `Outside Accra Weekly Report - Week ${weekNumber}, ${reportDateString}`,
    filenamePrefix: 'outside-accra-week',
    description:
      'This report contains Sunday service and fellowship (weekday) performance and income metrics for Outside Accra campuses.',
    sections: [
      'Campus list',
      'Sunday attendance and income',
      'Sunday banked and not banked income',
      'Fellowship attendance and income',
      'Weekday banked and not banked income',
    ],
  }
}

const writeDataToSheet = async (mode, outsideAccraSheet, datasets) => {
  const {
    campusListData,
    campusAttendanceIncomeData,
    campusBankedIncomeData,
    campusNotBankedIncomeData,
    fellowshipAttendanceIncomeData,
    weekdayBankedIncomeData,
    weekdayNotBankedIncomeData,
  } = datasets

  if (mode === REPORT_MODES.FELLOWSHIP) {
    await Promise.all([
      clearGSheetRange(outsideAccraSheet, 'A:D'),
      clearGSheetRange(outsideAccraSheet, 'J:M'),
    ])

    await Promise.all([
      writeToGsheet(campusListData, outsideAccraSheet, 'A:D'),
      writeToGsheet(fellowshipAttendanceIncomeData, outsideAccraSheet, 'J:K'),
      writeToGsheet(weekdayBankedIncomeData, outsideAccraSheet, 'L:L'),
      writeToGsheet(weekdayNotBankedIncomeData, outsideAccraSheet, 'M:M'),
    ])

    return
  }

  if (mode === REPORT_MODES.SUNDAY) {
    await Promise.all([
      clearGSheetRange(outsideAccraSheet, 'A:D'),
      clearGSheetRange(outsideAccraSheet, 'E:H'),
    ])

    await Promise.all([
      writeToGsheet(campusListData, outsideAccraSheet, 'A:D'),
      writeToGsheet(campusAttendanceIncomeData, outsideAccraSheet, 'E:F'),
      writeToGsheet(campusBankedIncomeData, outsideAccraSheet, 'G:G'),
      writeToGsheet(campusNotBankedIncomeData, outsideAccraSheet, 'H:H'),
    ])

    return
  }

  await clearGSheet(outsideAccraSheet)

  await Promise.all([
    writeToGsheet(campusListData, outsideAccraSheet, 'A:D'),
    writeToGsheet(campusAttendanceIncomeData, outsideAccraSheet, 'E:F'),
    writeToGsheet(campusBankedIncomeData, outsideAccraSheet, 'G:G'),
    writeToGsheet(campusNotBankedIncomeData, outsideAccraSheet, 'H:H'),
    writeToGsheet(fellowshipAttendanceIncomeData, outsideAccraSheet, 'J:K'),
    writeToGsheet(weekdayBankedIncomeData, outsideAccraSheet, 'L:L'),
    writeToGsheet(weekdayNotBankedIncomeData, outsideAccraSheet, 'M:M'),
  ])
}

const generateCsvForMode = (mode, datasets) => {
  const {
    campusListData,
    campusAttendanceIncomeData,
    campusBankedIncomeData,
    campusNotBankedIncomeData,
    fellowshipAttendanceIncomeData,
    weekdayBankedIncomeData,
    weekdayNotBankedIncomeData,
  } = datasets

  if (mode === REPORT_MODES.FELLOWSHIP) {
    return generateFellowshipCSV(
      campusListData,
      fellowshipAttendanceIncomeData,
      weekdayBankedIncomeData,
      weekdayNotBankedIncomeData
    )
  }

  if (mode === REPORT_MODES.SUNDAY) {
    return generateSundayServicesCSV(
      campusListData,
      campusAttendanceIncomeData,
      campusBankedIncomeData,
      campusNotBankedIncomeData
    )
  }

  return generateCombinedCSV(
    campusListData,
    campusAttendanceIncomeData,
    campusBankedIncomeData,
    campusNotBankedIncomeData,
    fellowshipAttendanceIncomeData,
    weekdayBankedIncomeData,
    weekdayNotBankedIncomeData
  )
}

/**
 * Main handler for the Outside Accra Weekly data update
 * Compatible with AWS Lambda
 *
 * Accepts query/body parameters:
 * - date: ISO date string (YYYY-MM-DD) to generate report for (defaults to today)
 * - mode: combined | fellowship | sunday
 */
const handler = async (event = {}, targetDate = null) => {
  let reportDate = targetDate ? normalizeInputDate(targetDate) : null

  const queryParams = event.queryStringParameters || {}
  const bodyParams = parseBodyParams(event)
  const params = { ...queryParams, ...bodyParams, ...event }

  if (!reportDate && params.date) {
    const parsedDate = normalizeInputDate(params.date)
    if (!isNaN(parsedDate.getTime())) {
      reportDate = parsedDate
    }
  }

  if (!reportDate) {
    reportDate = new Date()
  }

  const mode = normalizeReportMode(
    params.mode || params.reportMode || params.serviceType,
    reportDate
  )
  const lastSunday = getLastSunday(reportDate)
  const reportDateQueryString = toLocalIsoDateString(reportDate)
  // Fellowship mode uses the current week; combined uses the same week as lastSunday
  const fellowshipQueryDate =
    mode === REPORT_MODES.FELLOWSHIP ? reportDateQueryString : lastSunday
  const labelQueryDate =
    mode === REPORT_MODES.FELLOWSHIP ? fellowshipQueryDate : lastSunday
  const labelDate = parseIsoDateString(labelQueryDate)
  const outsideAccraSheet = 'OA Campus'

  console.log('Running function for date', reportDate.toISOString())
  console.log('Day of week:', reportDate.getDay(), '(0=Sun, 6=Sat)')
  console.log('Using lastSunday (Sunday services):', lastSunday)
  console.log(
    'Using fellowshipQueryDate (fellowship/weekday services):',
    fellowshipQueryDate
  )
  console.log('Label source date:', labelQueryDate)
  console.log('Report mode:', mode)

  let driver

  try {
    const SECRETS = await getSecrets()

    const uri =
      SECRETS.NEO4J_ENCRYPTED === 'true'
        ? SECRETS.NEO4J_URI?.replace('bolt://', 'neo4j+s://')
        : SECRETS.NEO4J_URI || 'bolt://localhost:7687'

    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(
        SECRETS.NEO4J_USER || 'neo4j',
        SECRETS.NEO4J_PASSWORD || 'neo4j'
      )
    )

    await driver.verifyConnectivity()
    console.log('[Neo4j] Connection established successfully')

    const campusListData = await campusList(driver)

    let campusAttendanceIncomeData = []
    let campusBankedIncomeData = []
    let campusNotBankedIncomeData = []
    let fellowshipAttendanceIncomeData = []
    let weekdayBankedIncomeData = []
    let weekdayNotBankedIncomeData = []

    if (mode === REPORT_MODES.COMBINED || mode === REPORT_MODES.SUNDAY) {
      ;[
        campusAttendanceIncomeData,
        campusBankedIncomeData,
        campusNotBankedIncomeData,
      ] = await Promise.all([
        campusAttendanceIncome(driver, lastSunday),
        campusBankedIncome(driver, lastSunday),
        campusNotBankedIncome(driver, lastSunday),
      ])
    }

    if (mode === REPORT_MODES.COMBINED || mode === REPORT_MODES.FELLOWSHIP) {
      ;[
        fellowshipAttendanceIncomeData,
        weekdayBankedIncomeData,
        weekdayNotBankedIncomeData,
      ] = await Promise.all([
        fellowshipAttendanceIncome(driver, fellowshipQueryDate),
        weekdayBankedIncome(driver, fellowshipQueryDate),
        weekdayNotBankedIncome(driver, fellowshipQueryDate),
      ])
    }

    const datasets = {
      campusListData,
      campusAttendanceIncomeData,
      campusBankedIncomeData,
      campusNotBankedIncomeData,
      fellowshipAttendanceIncomeData,
      weekdayBankedIncomeData,
      weekdayNotBankedIncomeData,
    }

    const weekNumber = getWeekNumber(labelDate)
    const reportDateString = labelDate.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    await writeDataToSheet(mode, outsideAccraSheet, datasets).catch((error) => {
      throw new Error(
        `Error writing to google sheet\n${error.message}\n${error.stack}`
      )
    })

    console.log('[Google Sheets] Sheets updated successfully')

    const csvContent = generateCsvForMode(mode, datasets)
    const csvBase64 = Buffer.from(csvContent).toString('base64')

    const modeConfig = getModeConfig(mode, weekNumber, reportDateString)

    await axios({
      method: 'post',
      baseURL: notifyBaseURL,
      url: '/send-sms',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': SECRETS.FLC_NOTIFY_KEY,
      },
      data: {
        recipient: ['233592219407', '233263995059'],
        sender: 'FLC Admin',
        message: `WEEK ${weekNumber} ${modeConfig.smsLabel.toUpperCase()} UPDATE\n\nOutside Accra Google Sheets updated successfully on date ${reportDateString}`,
      },
    }).catch((error) => {
      console.error(
        'SMS sending failed:',
        error.response?.status,
        error.response?.data
      )
      throw new Error(
        `SMS sending failed (${error.response?.status}): ${JSON.stringify(
          error.response?.data
        )}`
      )
    })

    console.log('[SMS] Notification sent successfully')

    const html = buildEmailTemplate({
      title: modeConfig.subject.split(' - Week')[0],
      weekNumber,
      reportDateString,
      description: modeConfig.description,
      sections: modeConfig.sections,
    })

    await axios({
      method: 'post',
      baseURL: notifyBaseURL,
      url: '/send-email',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': SECRETS.FLC_NOTIFY_KEY,
      },
      data: {
        to: ['flcexpense22@gmail.com'],
        subject: modeConfig.subject,
        html,
        attachments: [
          {
            filename: `${modeConfig.filenamePrefix}-${weekNumber}-${reportDateString}.csv`,
            content: csvBase64,
            encoding: 'base64',
          },
        ],
      },
    }).catch((error) => {
      console.error(
        'Email sending failed:',
        error.response?.status,
        error.response?.data
      )
      throw new Error(
        `Email sending failed (${error.response?.status}): ${JSON.stringify(
          error.response?.data
        )}`
      )
    })

    console.log('[Email] Notification sent successfully')

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Outside Accra Campus data updated successfully (${mode})`,
      }),
    }
  } catch (error) {
    console.error('Error in Outside Accra Weekly function:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error updating Outside Accra Campus data',
        error: error.message,
      }),
    }
  } finally {
    if (driver) {
      await driver.close()
    }
  }
}

const withModeInEvent = (mode, event = {}) => ({
  ...event,
  mode,
  queryStringParameters: {
    ...(event.queryStringParameters || {}),
    mode,
  },
})

// Export default and mode-specific handlers for AWS Lambda
exports.handler = async (event) => {
  console.log('AWS Lambda handler invoked', { event })
  return handler(event)
}

exports.fellowshipHandler = async (event = {}) => {
  console.log('AWS Lambda fellowship handler invoked', { event })
  return handler(withModeInEvent(REPORT_MODES.FELLOWSHIP, event))
}

exports.sundayServicesHandler = async (event = {}) => {
  console.log('AWS Lambda sunday services handler invoked', { event })
  return handler(withModeInEvent(REPORT_MODES.SUNDAY, event))
}
