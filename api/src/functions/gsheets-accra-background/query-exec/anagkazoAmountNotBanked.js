import { anagkazoAmountNotBankedQuery } from '../cypher'
import { CAMPUS_NAME, lastSunday } from '../utils/constants'

export const anagkazoAmountNotBanked = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(anagkazoAmountNotBankedQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const returnValues = [
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

export default anagkazoAmountNotBanked
