const neo4j = require('neo4j-driver')
const { default: axios } = require('axios')
const { getSecrets } = require('./gsecrets.js')
const { clearGSheet, writeToGsheet } = require('./utils/writeToGSheet.js')
const { campusList } = require('./query-exec/campusList.js')
const campusAttendanceIncome = require('./query-exec/campusAttendanceIncome.js')
const campusBankedIncome = require('./query-exec/campusBankedIncome.js')
const campusNotBankedIncome = require('./query-exec/campusNotBankedIncome.js')
const fellowshipAttendanceIncome = require('./query-exec/fellowshipAttendanceIncome.js')
const weekdayBankedIncome = require('./query-exec/weekdayBankedIncome.js')
const weekdayNotBankedIncome = require('./query-exec/weekdayNotBankedIncome.js')
const { notifyBaseURL, getLastSunday } = require('./utils/constants.js')
const { generateCSV } = require('./utils/generateCSV.js')

/**
 * Helper function to get the ISO week number for a given date
 * @param {Date} date - The date to calculate the week number for
 * @returns {number} - ISO week number
 */
const getWeekNumber = (date = new Date()) => {
  // Create a copy of the date to avoid modifying the input
  const targetDate = new Date(date.getTime())

  // Set hours to avoid daylight saving time issues
  targetDate.setHours(0, 0, 0, 0)

  // ISO week starts on Monday, so adjust the day number
  const dayNum = targetDate.getDay() || 7

  // Set to nearest Thursday (to match ISO 8601 definition)
  targetDate.setDate(targetDate.getDate() + 4 - dayNum)

  // Get first day of the year
  const yearStart = new Date(targetDate.getFullYear(), 0, 1)

  // Calculate week number: Week 1 is the week with the year's first Thursday
  const weekNumber = Math.ceil(((targetDate - yearStart) / 86400000 + 1) / 7)

  return weekNumber
}

/**
 * Main handler for the Outside Accra Weekly data update
 * Compatible with AWS Lambda
 *
 * Accepts query parameters:
 * - date: ISO date string (YYYY-MM-DD) to generate report for (defaults to today)
 * - week: ISO week number override (if provided, date parameter is ignored)
 */
const handler = async (event = {}, targetDate = null) => {
  // Parse date from query parameters or use provided targetDate
  let reportDate = targetDate

  // Extract parameters from Lambda event - check multiple sources
  const queryParams = event.queryStringParameters || {}
  const bodyParams =
    (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) || {}
  const params = { ...queryParams, ...bodyParams, ...event }

  if (!reportDate && params.date) {
    // Parse the provided date string
    const parsedDate = new Date(params.date)
    if (!isNaN(parsedDate.getTime())) {
      reportDate = parsedDate
    }
  }

  // Default to today if no date provided
  if (!reportDate) {
    reportDate = new Date()
  }

  // Calculate lastSunday from the reportDate
  const lastSunday = getLastSunday(reportDate)
  console.log('Running function for date', reportDate.toISOString())
  console.log('Using lastSunday:', lastSunday)

  try {
    // Load secrets using AWS Secrets Manager
    const SECRETS = await getSecrets()

    // Configure encrypted connection if required (for AWS)
    const uri =
      SECRETS.NEO4J_ENCRYPTED === 'true'
        ? SECRETS.NEO4J_URI?.replace('bolt://', 'neo4j+s://')
        : SECRETS.NEO4J_URI || 'bolt://localhost:7687'

    // Create Neo4j driver
    const driver = neo4j.driver(
      uri,
      neo4j.auth.basic(
        SECRETS.NEO4J_USER || 'neo4j',
        SECRETS.NEO4J_PASSWORD || 'neo4j'
      )
    )

    // Verify connection
    await driver.verifyConnectivity()
    console.log('[Neo4j] Connection established successfully')

    const response = await Promise.all([
      campusList(driver),
      campusAttendanceIncome(driver, lastSunday),
      campusBankedIncome(driver, lastSunday),
      campusNotBankedIncome(driver, lastSunday),
      fellowshipAttendanceIncome(driver, lastSunday),
      weekdayBankedIncome(driver, lastSunday),
      weekdayNotBankedIncome(driver, lastSunday),
    ]).catch((error) => {
      console.error('Database query failed to complete\n', error.message)
      throw error
    })

    const campusListData = response[0]
    const campusAttendanceIncomeData = response[1]
    const campusBankedIncomeData = response[2]
    const campusNotBankedIncomeData = response[3]
    const fellowshipAttendanceIncomeData = response[4]
    const weekdayBankedIncomeData = response[5]
    const weekdayNotBankedIncomeData = response[6]

    const outsideAccraSheet = 'OA Campus'

    await clearGSheet(outsideAccraSheet)

    // Generate CSV from all collected data
    const csvContent = generateCSV(
      campusListData,
      campusAttendanceIncomeData,
      campusBankedIncomeData,
      campusNotBankedIncomeData,
      fellowshipAttendanceIncomeData,
      weekdayBankedIncomeData,
      weekdayNotBankedIncomeData
    )

    // Convert CSV to base64 for email attachment
    const csvBase64 = Buffer.from(csvContent).toString('base64')

    const weekNumber = getWeekNumber(reportDate) - 1
    const reportDateString = reportDate
      .toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      .split('T')[0]

    // Write to Google Sheets
    await Promise.all([
      writeToGsheet(campusListData, outsideAccraSheet, 'A:D'),
      writeToGsheet(campusAttendanceIncomeData, outsideAccraSheet, 'E:F'),
      writeToGsheet(campusBankedIncomeData, outsideAccraSheet, 'G:G'),
      writeToGsheet(campusNotBankedIncomeData, outsideAccraSheet, 'H:H'),
      writeToGsheet(fellowshipAttendanceIncomeData, outsideAccraSheet, 'J:K'),
      writeToGsheet(weekdayBankedIncomeData, outsideAccraSheet, 'L:L'),
      writeToGsheet(weekdayNotBankedIncomeData, outsideAccraSheet, 'M:M'),
    ]).catch((error) => {
      throw new Error(
        `Error writing to google sheet\n${error.message}\n${error.stack}`
      )
    })

    console.log('[Google Sheets] All sheets updated successfully')

    // Send notification SMS
    await axios({
      method: 'post',
      baseURL: notifyBaseURL,
      url: '/send-sms',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': SECRETS.FLC_NOTIFY_KEY,
      },
      data: {
        recipient: [
          '233592219407', // Latisha
          '233263995059', // Abigail Tay
        ],
        sender: 'FLC Admin',
        message: `WEEK ${weekNumber} UPDATE\n\nOutside Accra Google Sheets updated successfully on date ${reportDateString}`,
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

    // Send email with CSV attachment
    await axios({
      method: 'post',
      baseURL: notifyBaseURL,
      url: '/send-email',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': SECRETS.FLC_NOTIFY_KEY,
      },
      data: {
        to: ['john-dag@firstlovecenter.com', 'globalfirstlove@gmail.com'],
        subject: `Outside Accra Weekly Report - Week ${weekNumber}, ${reportDateString}`,
        html: `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body
    style='background-color:rgb(243,244,246);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <!--$-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Outside Accra Weekly Report - Week ${weekNumber}, ${reportDate}
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
      </div>
    </div>
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="background-color:rgb(255,255,255);margin-left:auto;margin-right:auto;padding-left:40px;padding-right:40px;padding-top:32px;padding-bottom:32px;max-width:600px;border-radius:8px">
      <tbody>
        <tr style="width:100%">
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="text-align:center;margin-bottom:32px">
              <tbody>
                <tr>
                  <td>
                    <div
                      class="from-red-600 to-red-900"
                      style="background-image:linear-gradient(to right, rgb(220,38,38), rgb(127,29,29));padding-left:24px;padding-right:24px;padding-top:20px;padding-bottom:20px;border-radius:8px;margin-bottom:24px">
                      <h1
                        style="color:rgb(255,255,255);font-size:28px;font-weight:700;margin:0px;line-height:1.2">
                        Outside Accra Weekly Report
                      </h1>
                    </div>
                    <p
                      style="color:rgb(153,27,27);font-size:18px;font-weight:600;margin:0px;margin-bottom:8px;line-height:24px;margin-top:0px;margin-left:0px;margin-right:0px">
                      Week ${weekNumber} - ${reportDateString}
                    </p>
                    <p
                      style="color:rgb(75,85,99);font-size:14px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                      Business Intelligence Summary
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <hr
              style="border-color:rgb(229,231,235);margin-top:24px;margin-bottom:24px;width:100%;border:none;border-top:1px solid #eaeaea" />
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="margin-bottom:32px">
              <tbody>
                <tr>
                  <td>
                    <p
                      style="color:rgb(55,65,81);font-size:16px;line-height:1.6;margin-bottom:16px;margin-top:16px">
                      Please find attached the comprehensive weekly report for
                      Outside Accra campuses. This report provides detailed
                      insights into campus performance and financial metrics.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="margin-bottom:32px">
              <tbody>
                <tr>
                  <td>
                    <h1
                      style="color:rgb(153,27,27);font-size:20px;font-weight:700;margin-bottom:16px;border-left-width:4px;border-color:rgb(220,38,38);padding-left:16px">
                      Report Contents
                    </h1>
                    <div
                      style="background-color:rgb(249,250,251);border-radius:8px;padding:20px">
                      <div style="display:grid;gap:12px">
                        <div style="display:flex;align-items:flex-start">
                          <div
                            style="width:8px;height:8px;background-color:rgb(220,38,38);border-radius:9999px;margin-top:8px;margin-right:12px;flex-shrink:0"></div>
                          <p
                            style="color:rgb(55,65,81);font-size:15px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                            <span style="font-weight:600;color:rgb(153,27,27)"
                              >Campus List</span
                            >
                            - Complete directory of all active campuses
                          </p>
                        </div>
                        <div style="display:flex;align-items:flex-start">
                          <div
                            style="width:8px;height:8px;background-color:rgb(220,38,38);border-radius:9999px;margin-top:8px;margin-right:12px;flex-shrink:0"></div>
                          <p
                            style="color:rgb(55,65,81);font-size:15px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                            <span style="font-weight:600;color:rgb(153,27,27)"
                              >Campus Attendance &amp; Income</span
                            >
                            - Weekly performance metrics
                          </p>
                        </div>
                        <div style="display:flex;align-items:flex-start">
                          <div
                            style="width:8px;height:8px;background-color:rgb(220,38,38);border-radius:9999px;margin-top:8px;margin-right:12px;flex-shrink:0"></div>
                          <p
                            style="color:rgb(55,65,81);font-size:15px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                            <span style="font-weight:600;color:rgb(153,27,27)"
                              >Campus Banked Income</span
                            >
                            - Processed financial transactions
                          </p>
                        </div>
                        <div style="display:flex;align-items:flex-start">
                          <div
                            style="width:8px;height:8px;background-color:rgb(220,38,38);border-radius:9999px;margin-top:8px;margin-right:12px;flex-shrink:0"></div>
                          <p
                            style="color:rgb(55,65,81);font-size:15px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                            <span style="font-weight:600;color:rgb(153,27,27)"
                              >Campus Not Banked Income</span
                            >
                            - Pending financial transactions
                          </p>
                        </div>
                        <div style="display:flex;align-items:flex-start">
                          <div
                            style="width:8px;height:8px;background-color:rgb(220,38,38);border-radius:9999px;margin-top:8px;margin-right:12px;flex-shrink:0"></div>
                          <p
                            style="color:rgb(55,65,81);font-size:15px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                            <span style="font-weight:600;color:rgb(153,27,27)"
                              >Fellowship Attendance &amp; Income</span
                            >
                            - Community engagement data
                          </p>
                        </div>
                        <div style="display:flex;align-items:flex-start">
                          <div
                            style="width:8px;height:8px;background-color:rgb(220,38,38);border-radius:9999px;margin-top:8px;margin-right:12px;flex-shrink:0"></div>
                          <p
                            style="color:rgb(55,65,81);font-size:15px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                            <span style="font-weight:600;color:rgb(153,27,27)"
                              >Weekday Banked Income</span
                            >
                            - Processed weekday transactions
                          </p>
                        </div>
                        <div style="display:flex;align-items:flex-start">
                          <div
                            style="width:8px;height:8px;background-color:rgb(220,38,38);border-radius:9999px;margin-top:8px;margin-right:12px;flex-shrink:0"></div>
                          <p
                            style="color:rgb(55,65,81);font-size:15px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                            <span style="font-weight:600;color:rgb(153,27,27)"
                              >Weekday Not Banked Income</span
                            >
                            - Pending weekday transactions
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="margin-bottom:32px">
              <tbody>
                <tr>
                  <td>
                    <div
                      style="background-color:rgb(240,253,244);border-left-width:4px;border-color:rgb(34,197,94);padding:16px;border-top-right-radius:8px;border-bottom-right-radius:8px">
                      <p
                        style="color:rgb(22,101,52);font-size:15px;font-weight:600;margin:0px;margin-bottom:4px;line-height:24px;margin-top:0px;margin-left:0px;margin-right:0px">
                        ✓ System Update Complete
                      </p>
                      <p
                        style="color:rgb(21,128,61);font-size:14px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                        The Google Sheets have been updated successfully with
                        the latest data.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <hr
              style="border-color:rgb(229,231,235);margin-top:24px;margin-bottom:24px;width:100%;border:none;border-top:1px solid #eaeaea" />
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="text-align:center">
              <tbody>
                <tr>
                  <td>
                    <p
                      style="color:rgb(107,114,128);font-size:12px;margin:0px;margin-bottom:8px;line-height:24px;margin-top:0px;margin-left:0px;margin-right:0px">
                      First Love Church - Outside Accra Business Intelligence Team
                    </p>
                    <p
                      style="color:rgb(107,114,128);font-size:12px;margin:0px;margin-bottom:16px;line-height:24px;margin-top:0px;margin-left:0px;margin-right:0px">
                      Accra, Ghana
                    </p>
                    <p
                      style="color:rgb(156,163,175);font-size:11px;margin:0px;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                      © 2026 First Love Church. All rights reserved.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
          `,
        attachments: [
          {
            filename: `outside-accra-week-${weekNumber}-${reportDateString}.csv`,
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

    // Close the Neo4j driver when done
    await driver.close()

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Outside Accra Campus data updated successfully',
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
  }
}

// Export for AWS Lambda
exports.handler = async (event) => {
  console.log('AWS Lambda handler invoked', { event })
  return handler(event)
}
