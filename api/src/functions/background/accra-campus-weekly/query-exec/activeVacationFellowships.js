const { activeVacationFellowshipsQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const activeVacationFellowships = async (neoDriver) => {
  const functionName = 'activeVacationFellowships'
  console.log(`[${functionName}] Starting execution`)
  
  // Validate query before execution
  if (
    !activeVacationFellowshipsQuery ||
    typeof activeVacationFellowshipsQuery !== 'string' ||
    activeVacationFellowshipsQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: activeVacationFellowshipsQuery,
      type: typeof activeVacationFellowshipsQuery,
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
      tx.run(activeVacationFellowshipsQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = ['Active Fellowships', 'Vacation Fellowships']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('Active').toString(),
        record.get('Vacation').toString(),
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
      query: activeVacationFellowshipsQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { activeVacationFellowships }
module.exports.default = activeVacationFellowships
