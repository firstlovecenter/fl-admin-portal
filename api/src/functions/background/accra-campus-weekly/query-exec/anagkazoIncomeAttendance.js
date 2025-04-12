const { anagkazoIncomeAttendanceQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const anagkazoIncomeAttendance = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(anagkazoIncomeAttendanceQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const returnValues = [
      ...result.records.map((record) => [
        record.get('anagkazoAttendance').toString(),
        record.get('anagkazoIncome').toString(),
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

module.exports = { anagkazoIncomeAttendance }
module.exports.default = anagkazoIncomeAttendance
