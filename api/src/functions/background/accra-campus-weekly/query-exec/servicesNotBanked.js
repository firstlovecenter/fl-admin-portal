const { servicesNotBankedQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const servicesNotBanked = async (neoDriver) => {
  const functionName = 'servicesNotBanked'
  console.log(`[${functionName}] Starting execution`)
  
  // Validate query before execution
  if (
    !servicesNotBankedQuery ||
    typeof servicesNotBankedQuery !== 'string' ||
    servicesNotBankedQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: servicesNotBankedQuery,
      type: typeof servicesNotBankedQuery,
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
      tx.run(servicesNotBankedQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = ['Services Not Banked']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('servicesNotBanked').toString(),
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
      query: servicesNotBankedQuery,
      parameters: { campusName: CAMPUS_NAME, bussingDate: lastSunday },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { servicesNotBanked }
module.exports.default = servicesNotBanked
