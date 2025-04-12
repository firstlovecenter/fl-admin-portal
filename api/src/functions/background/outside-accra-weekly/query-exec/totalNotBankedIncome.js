const { totalNotBankedIncomeQuery } = require('../cypher')
const { OVERSIGHT_NAME, lastSunday } = require('../utils/constants')

const totalNotBankedIncome = async (neoDriver) => {
  const session = neoDriver.session()

  try {
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

// Use CommonJS exports for AWS Lambda compatibility
module.exports = totalNotBankedIncome
