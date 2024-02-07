import { totalNotBankedIncomeQuery } from '../cypher'
import { OVERSIGHT_NAME, lastSunday } from '../utils/constants'

export const totalNotBankedIncome = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Running function on date', new Date().toISOString())

    const result = await session.executeRead(async (tx) =>
      tx.run(totalNotBankedIncomeQuery, {
        oversightName: OVERSIGHT_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Not Banked Income']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [record.get('NotBanked').toString()]),
    ]

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

export default totalNotBankedIncome
