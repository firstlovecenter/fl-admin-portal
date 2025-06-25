const { servicesThisWeekQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const servicesThisWeek = async (neoDriver) => {
  const functionName = 'servicesThisWeek'
  console.log(`[${functionName}] Starting execution`)
  
  // Validate query before execution
  if (
    !servicesThisWeekQuery ||
    typeof servicesThisWeekQuery !== 'string' ||
    servicesThisWeekQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: servicesThisWeekQuery,
      type: typeof servicesThisWeekQuery,
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
      tx.run(servicesThisWeekQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = ['Services This Week']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('servicesThisWeek').toString(),
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
      query: servicesThisWeekQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { servicesThisWeek }
module.exports.default = servicesThisWeek
