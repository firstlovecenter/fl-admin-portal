const {
  aggregateBussingOnCampusQuery,
  aggregateBussingOnCouncilQuery,
  aggregateBussingOnDenominationQuery,
  aggregateBussingOnGovernorshipQuery,
  aggregateBussingOnOversightQuery,
  aggregateBussingOnStreamQuery,
  zeroAllNullBussingRecordsCypher,
} = require('../bacenta-cypher')

const zeroAllNullBussingRecords = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Zeroing all null bussing records')
    await session.run(zeroAllNullBussingRecordsCypher)

    console.log('Zeroed all null bussing records')
  } catch (error) {
    console.error('Error zeroing all null bussing records', error)
  } finally {
    await session.close()
  }
}

const aggregateBussingOnGovernorship = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Bussing on Governorship')
    const result = await session.run(aggregateBussingOnGovernorshipQuery)

    const returnValues = [
      ...result.records.map((record) => [
        record.get('governorshipCount').toString(),
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

const aggregateBussingOnCouncil = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Bussing on Council')
    const result = await session.run(aggregateBussingOnCouncilQuery)

    const returnValues = [
      ...result.records.map((record) => [
        record.get('councilCount').toString(),
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

const aggregateBussingOnStream = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Bussing on Stream')
    const result = await session.run(aggregateBussingOnStreamQuery)

    const returnValues = [
      ...result.records.map((record) => [record.get('streamCount').toString()]),
    ]

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

const aggregateBussingOnCampus = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Bussing on Campus')
    const result = await session.run(aggregateBussingOnCampusQuery)

    const returnValues = [
      ...result.records.map((record) => [record.get('campusCount').toString()]),
    ]

    return returnValues
  } catch (error) {
    console.error('Error reading data from the DB', error)
  } finally {
    await session.close()
  }

  return []
}

const aggregateBussingOnOversight = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Bussing on Oversight')
    const result = await session.run(aggregateBussingOnOversightQuery)

    const returnValues = [
      ...result.records.map((record) => [
        record.get('oversightCount').toString(),
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

const aggregateBussingOnDenomination = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Bussing on Denomination')
    const result = await session.run(aggregateBussingOnDenominationQuery)

    const returnValues = [
      ...result.records.map((record) => [
        record.get('denominationCount').toString(),
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

module.exports = {
  zeroAllNullBussingRecords,
  aggregateBussingOnGovernorship,
  aggregateBussingOnCouncil,
  aggregateBussingOnStream,
  aggregateBussingOnCampus,
  aggregateBussingOnOversight,
  aggregateBussingOnDenomination,
}
