import { totalBankedIncomeQuery } from '../cypher'
import { OVERSIGHT_NAME, lastSunday } from '../utils/constants'

export const totalBankedIncome = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(totalBankedIncomeQuery, {
        oversightName: OVERSIGHT_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Banked Income']

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

export default totalBankedIncome
