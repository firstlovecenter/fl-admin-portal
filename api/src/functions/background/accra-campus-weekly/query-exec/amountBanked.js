import { amountBankedQuery } from '../cypher'
import { CAMPUS_NAME, lastSunday } from '../utils/constants'

export const amountBanked = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(amountBankedQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['ACTUAL MONEY']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [record.get('Banked').toString()]),
    ]

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

export default amountBanked
