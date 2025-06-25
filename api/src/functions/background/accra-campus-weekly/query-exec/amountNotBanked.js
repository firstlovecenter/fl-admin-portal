const { amountNotBankedQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const amountNotBanked = async (neoDriver) => {
  const functionName = 'amountNotBanked'
  console.log(`[${functionName}] Starting execution`)
  
  // Validate query before execution
  if (
    !amountNotBankedQuery ||
    typeof amountNotBankedQuery !== 'string' ||
    amountNotBankedQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: amountNotBankedQuery,
      type: typeof amountNotBankedQuery,
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
      tx.run(amountNotBankedQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = ['Not Banked']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [record.get('notBanked').toString()]),
    ]

    console.log(
      `[${functionName}] Data processing completed. Returning ${returnValues.length} rows`
    )
    return returnValues
  } catch (error) {
    console.error(`[${functionName}] ERROR: Error reading data from the DB:`, {
      error: error.message,
      stack: error.stack,
      query: amountNotBankedQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { amountNotBanked }
module.exports.default = amountNotBanked
