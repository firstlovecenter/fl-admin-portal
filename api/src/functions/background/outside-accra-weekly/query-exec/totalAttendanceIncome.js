const { totalAttendanceIncomeQuery } = require('../cypher')
const { OVERSIGHT_NAME } = require('../utils/constants')

const totalAttendanceIncome = async (neoDriver, lastSunday) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(totalAttendanceIncomeQuery, {
        oversightName: OVERSIGHT_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Total Weekly Attendance', 'Total Weekly Income']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('TotalAttendance').toString(),
        record.get('TotalIncome').toString(),
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

// Use CommonJS exports for AWS Lambda compatibility
module.exports = totalAttendanceIncome
