const { numberOfBussesQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const numberOfBusses = async (neoDriver) => {
  const functionName = 'numberOfBusses'
  console.log(`[${functionName}] Starting execution`)

  // Validate query before execution
  if (
    !numberOfBussesQuery ||
    typeof numberOfBussesQuery !== 'string' ||
    numberOfBussesQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: numberOfBussesQuery,
      type: typeof numberOfBussesQuery,
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
      tx.run(numberOfBussesQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = ['Busses']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('numberOfBusses').toString(),
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
      query: numberOfBussesQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { numberOfBusses }
module.exports.default = numberOfBusses
