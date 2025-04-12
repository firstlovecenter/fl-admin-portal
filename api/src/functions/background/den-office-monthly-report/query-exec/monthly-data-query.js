const { getMonthlyData } = require('../cypher')
const { lastMonth } = require('../utils/constants')

const monthlyDataRetrieval = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.run(getMonthlyData, {
      month: lastMonth,
    })

    const returnValues = result.records.map((record) => ({
      oversight: record.get('Oversight').toString(),
      bacentas: record.get('Bacentas').toString(),
      averageAttendance: record.get('AverageAttendance').toString(),
    }))

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

module.exports = monthlyDataRetrieval
