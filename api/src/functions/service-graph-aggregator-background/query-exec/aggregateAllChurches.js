import {
  aggregateBacentaOnGovernorshipQuery,
  aggregateCampusOnOversightQuery,
  aggregateCouncilOnStreamQuery,
  aggregateGovernorshipOnCouncilQuery,
  aggregateOversightOnDenominationQuery,
  aggregateStreamOnCampusQuery,
} from '../sevice-cypher'

export const aggregateBacentaOnGovernorship = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Bacenta on Governorship')
    const result = await session.run(aggregateBacentaOnGovernorshipQuery)

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

export const aggregateGovernorshipOnCouncil = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Governorship on Council')
    const result = await session.run(aggregateGovernorshipOnCouncilQuery)

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

export const aggregateCouncilOnStream = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Council on Stream')
    const result = await session.run(aggregateCouncilOnStreamQuery)

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

export const aggregateStreamOnCampus = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Stream on Campus')
    const result = await session.run(aggregateStreamOnCampusQuery)

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

export const aggregateCampusOnOversight = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Campus on Oversight')
    const result = await session.run(aggregateCampusOnOversightQuery)

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

export const aggregateOversightOnDenomination = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    console.log('Aggregating Oversight on Denomination')
    const result = await session.run(aggregateOversightOnDenominationQuery)

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
