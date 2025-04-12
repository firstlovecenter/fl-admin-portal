const { activeVacationFellowshipsQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const activeVacationFellowships = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(activeVacationFellowshipsQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Active Fellowships', 'Vacation Fellowships']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('Active').toString(),
        record.get('Vacation').toString(),
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

module.exports = { activeVacationFellowships }
module.exports.default = activeVacationFellowships
