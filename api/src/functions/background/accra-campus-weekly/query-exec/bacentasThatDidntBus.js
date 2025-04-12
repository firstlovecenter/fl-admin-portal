const { bacentasThatDidntBusQuery } = require('../cypher')
const { CAMPUS_NAME, lastSunday } = require('../utils/constants')

const bacentasThatDidntBus = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(bacentasThatDidntBusQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Bacentas That Didnt Bus']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('bacentasThatDidntBus').toString(),
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

module.exports = { bacentasThatDidntBus }
module.exports.default = bacentasThatDidntBus
