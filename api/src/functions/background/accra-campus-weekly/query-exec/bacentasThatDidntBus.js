const { bacentasThatDidntBusQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const bacentasThatDidntBus = async (neoDriver) => {
  const functionName = 'bacentasThatDidntBus'
  console.log(`[${functionName}] Starting execution`)

  // Validate query before execution
  if (
    !bacentasThatDidntBusQuery ||
    typeof bacentasThatDidntBusQuery !== 'string' ||
    bacentasThatDidntBusQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: bacentasThatDidntBusQuery,
      type: typeof bacentasThatDidntBusQuery,
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
      tx.run(bacentasThatDidntBusQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = ['Bacentas That Didnt Bus']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('bacentasThatDidntBus').toString(),
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
      query: bacentasThatDidntBusQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { bacentasThatDidntBus }
module.exports.default = bacentasThatDidntBus
