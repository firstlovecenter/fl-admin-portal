const { campusListQuery } = require('../cypher')
const { OVERSIGHT_NAME } = require('../utils/constants')

const campusList = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(campusListQuery, {
        oversightName: OVERSIGHT_NAME,
      })
    )

    const headerRow = ['Oversight', 'Oversight Bishop', 'Campus Head', 'Campus']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('CampusName'),
        record.get('OversightBishop'),
        record.get('CampusHead'),
        record.get('StreamName'),
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

// Use CommonJS exports for AWS Lambda compatibility
module.exports = {
  campusList,
}
