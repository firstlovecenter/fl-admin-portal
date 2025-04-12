const { bacentasThatBussedQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const bacentasThatBussed = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(bacentasThatBussedQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Bacentas That Bussed']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('bacentasThatBussed').toString(),
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

module.exports = { bacentasThatBussed }
module.exports.default = bacentasThatBussed
