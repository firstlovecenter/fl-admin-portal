const { councilListQuery } = require('../cypher')
const { CAMPUS_NAME } = require('../utils/constants')

const councilList = async (neoDriver) => {
  const functionName = 'councilList'
  console.log(`[${functionName}] Starting execution`)
  
  // Validate query before execution
  if (
    !councilListQuery ||
    typeof councilListQuery !== 'string' ||
    councilListQuery.trim() === ''
  ) {
    console.error(`[${functionName}] ERROR: Invalid or empty Cypher query:`, {
      query: councilListQuery,
      type: typeof councilListQuery,
    })
    return []
  }

  console.log(`[${functionName}] Query validation passed. Parameters:`, {
    campusName: CAMPUS_NAME,
  })

  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(councilListQuery, {
        campusName: CAMPUS_NAME,
      })
    )

    console.log(
      `[${functionName}] Query executed successfully. Records found: ${result.records.length}`
    )

    const headerRow = [
      'Pastor',
      'Stream',
      'Bishop',
      'Council',
      'Active Bacentas',
      'Vacation Bacentas',
    ]

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('Pastor'),
        record.get('Stream'),
        record.get('Bishop'),
        record.get('Council').join(', ').toString(),
        record.get('ActiveBacentas').toString(),
        record.get('VacationBacentas').toString(),
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
      query: councilListQuery,
      parameters: { campusName: CAMPUS_NAME },
    })
  } finally {
    await session.close()
    console.log(`[${functionName}] Session closed`)
  }

  return []
}

module.exports = { councilList }
