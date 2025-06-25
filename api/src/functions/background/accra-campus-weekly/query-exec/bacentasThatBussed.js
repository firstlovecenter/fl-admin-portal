const { bacentasThatBussedQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const bacentasThatBussed = async (neoDriver) => {
  const functionName = 'bacentasThatBussed'
  console.log(`[${functionName}] Starting execution`)
  
  // Validate query before execution
  if (
    !bacentasThatBussedQuery ||
    typeof bacentasThatBussedQuery !== 'string' ||
    bacentasThatBussedQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: bacentasThatBussedQuery,
      type: typeof bacentasThatBussedQuery,
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
      tx.run(bacentasThatBussedQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = ['Bacentas That Bussed']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('bacentasThatBussed').toString(),
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
      query: bacentasThatBussedQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { bacentasThatBussed }
module.exports.default = bacentasThatBussed
