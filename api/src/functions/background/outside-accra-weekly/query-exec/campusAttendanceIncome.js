const { campusAttendanceIncomeQuery } = require('../cypher')
const { OVERSIGHT_NAME } = require('../utils/constants')

const campusAttendanceIncome = async (neoDriver, lastSunday) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(campusAttendanceIncomeQuery, {
        oversightName: OVERSIGHT_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Campus Attendance', 'Campus Income']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('Attendance').toString(),
        record.get('Income').toString(),
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
module.exports = campusAttendanceIncome
