const { bussingAttendanceQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const bussingAttendance = async (neoDriver) => {
  const functionName = 'bussingAttendance'
  console.log(`[${functionName}] Starting execution`)
  
  // Validate query before execution
  if (
    !bussingAttendanceQuery ||
    typeof bussingAttendanceQuery !== 'string' ||
    bussingAttendanceQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: bussingAttendanceQuery,
      type: typeof bussingAttendanceQuery,
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
      tx.run(bussingAttendanceQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = ['Bussing Attendance']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('bussingAttendance').toString(),
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
      query: bussingAttendanceQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { bussingAttendance }
module.exports.default = bussingAttendance
