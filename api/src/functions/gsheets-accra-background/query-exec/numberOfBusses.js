import { numberOfBussesQuery } from '../cypher'
import { CAMPUS_NAME, lastSunday } from '../utils/constants'

export const numberOfBusses = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(numberOfBussesQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Busses']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('numberOfBusses').toString(),
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

export default numberOfBusses
