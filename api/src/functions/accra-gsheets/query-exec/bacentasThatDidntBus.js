import { bacentasThatDidntBusQuery } from '../cypher'
import { CAMPUS_NAME, lastSunday } from '../utils/constants'

export const bacentasThatBussed = async (neoDriver) => {
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

export default bacentasThatBussed