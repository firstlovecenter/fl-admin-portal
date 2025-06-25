const { anagkazoAmountBankedQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const anagkazoAmountBanked = async (neoDriver) => {
  const functionName = 'anagkazoAmountBanked'
  console.log(`[${functionName}] Starting execution`)
  
  // Validate query before execution
  if (
    !anagkazoAmountBankedQuery ||
    typeof anagkazoAmountBankedQuery !== 'string' ||
    anagkazoAmountBankedQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: anagkazoAmountBankedQuery,
      type: typeof anagkazoAmountBankedQuery,
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
      tx.run(anagkazoAmountBankedQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const returnValues = [
      ...result.records.map((record) => [record.get('Banked').toString()]),
    ]

    console.log(
      `[${functionName}] Data processing completed. Returning ${returnValues.length} rows`
    )
    return returnValues
  } catch (error) {
    console.error(`[${functionName}] ERROR: Error reading data from the DB:`, {
      error: error.message,
      stack: error.stack,
      query: anagkazoAmountBankedQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { anagkazoAmountBanked }
module.exports.default = anagkazoAmountBanked
