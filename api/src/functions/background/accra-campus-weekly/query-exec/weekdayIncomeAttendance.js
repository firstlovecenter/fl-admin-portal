const { weekdayIncomeAttendanceQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const weekdayIncomeAttendance = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(weekdayIncomeAttendanceQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Weekday Attendance', 'Weekday Income']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('attendance').toString(),
        record.get('income').toString(),
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

module.exports = { weekdayIncomeAttendance }
module.exports.default = weekdayIncomeAttendance
