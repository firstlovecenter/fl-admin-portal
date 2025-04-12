const { councilListQuery } = require('../cypher')
const { CAMPUS_NAME } = require('../utils/constants')

const councilList = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(councilListQuery, {
        campusName: CAMPUS_NAME,
      })
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

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

module.exports = { councilList }
