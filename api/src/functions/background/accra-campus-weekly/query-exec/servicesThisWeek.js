const { servicesThisWeekQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const servicesThisWeek = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(servicesThisWeekQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Services This Week']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('servicesThisWeek').toString(),
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

module.exports = { servicesThisWeek }
module.exports.default = servicesThisWeek
