import { getBacentasToPromote } from '../cypher'
import { CAMPUS_NAME, lastSunday } from '../utils/constants'

export const ICToBacentaChecker = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeWrite(async (tx) =>
      tx.run(getBacentasToPromote, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const returnValues = result.records.map((record) => ({
      name: record.get('ToPromoteName').toString(),
      leaderFirstName: record.get('LeaderFirstName').toString(),
      leaderFullName: record.get('LeaderName').toString(),
      leaderPhone: record.get('LeaderPhone').toString(),
    }))

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

export default ICToBacentaChecker