const { anagkazoAttendanceIncomeQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const anagkazoIncomeAttendance = async (neoDriver) => {
  const functionName = 'anagkazoIncomeAttendance'
  console.log(`[${functionName}] Starting execution`)

  // Validate query before execution
  if (
    !anagkazoAttendanceIncomeQuery ||
    typeof anagkazoAttendanceIncomeQuery !== 'string' ||
    anagkazoAttendanceIncomeQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: anagkazoAttendanceIncomeQuery,
      type: typeof anagkazoAttendanceIncomeQuery,
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
      tx.run(anagkazoAttendanceIncomeQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const returnValues = [
      ...result.records.map((record) => [
        record.get('anagkazoAttendance').toString(),
        record.get('anagkazoIncome').toString(),
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
      query: anagkazoAttendanceIncomeQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { anagkazoIncomeAttendance }
module.exports.default = anagkazoIncomeAttendance
