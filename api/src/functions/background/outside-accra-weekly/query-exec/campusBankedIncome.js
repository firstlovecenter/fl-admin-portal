const { campusBankedIncomeQuery } = require('../cypher')
const { OVERSIGHT_NAME } = require('../utils/constants')

const campusBankedIncome = async (neoDriver, lastSunday) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(campusBankedIncomeQuery, {
        oversightName: OVERSIGHT_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Campus Banked Income']

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

// Use CommonJS exports for AWS Lambda compatibility
module.exports = campusBankedIncome
