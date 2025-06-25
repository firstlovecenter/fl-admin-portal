const { weekdayIncomeAttendanceQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const weekdayIncomeAttendance = async (neoDriver) => {
  const functionName = 'weekdayIncomeAttendance'
  console.log(`[${functionName}] Starting execution`)
  
  // Validate query before execution
  if (
    !weekdayIncomeAttendanceQuery ||
    typeof weekdayIncomeAttendanceQuery !== 'string' ||
    weekdayIncomeAttendanceQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: weekdayIncomeAttendanceQuery,
      type: typeof weekdayIncomeAttendanceQuery,
    })
    return []
  }

  console.log(`[${functionName}] Query validation passed. Parameters:`, {
    campusName: CAMPUS_NAME,
    bussingDate: lastSunday,
  })

  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(weekdayIncomeAttendanceQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = ['Weekday Attendance', 'Weekday Income']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('attendance').toString(),
        record.get('income').toString(),
      ]),
    ]

    console.log(
      `[${functionName}] Data processing completed. Returning ${returnValues.length} rows`
    )
    return returnValues
  } catch (error) {
    console.error(`[${functionName}] ERROR: Error reading data from the DB:`, {
      error: error.message,
      stack: error.stack,
      query: weekdayIncomeAttendanceQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { weekdayIncomeAttendance }
module.exports.default = weekdayIncomeAttendance
