import { amountNotBankedQuery } from '../cypher'
import { CAMPUS_NAME, lastSunday } from '../utils/constants'

export const amountNotBanked = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(amountNotBankedQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Not Banked']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [record.get('notBanked').toString()]),
    ]

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

export default amountNotBanked
