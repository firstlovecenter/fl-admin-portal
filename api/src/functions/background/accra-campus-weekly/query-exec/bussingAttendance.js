import { bussingAttendanceQuery } from '../cypher'
import { CAMPUS_NAME, lastSunday } from '../utils/constants'

export const bussingAttendance = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(bussingAttendanceQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Bussing Attendance']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('bussingAttendance').toString(),
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

export default bussingAttendance
