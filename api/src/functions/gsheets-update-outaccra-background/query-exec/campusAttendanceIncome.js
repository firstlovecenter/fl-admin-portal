import { campusAttendanceIncomeQuery } from '../cypher'
import { OVERSIGHT_NAME, lastSunday } from '../utils/constants'

export const campusAttendanceIncome = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(campusAttendanceIncomeQuery, {
        oversightName: OVERSIGHT_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Campus Attendance', 'Campus Income']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('Attendance').toString(),
        record.get('Income').toString(),
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

export default campusAttendanceIncome
