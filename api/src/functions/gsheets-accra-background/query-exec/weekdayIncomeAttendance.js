import { weekdayIncomeAttendanceQuery } from '../cypher'
import { CAMPUS_NAME, lastSunday } from '../utils/constants'

export const weekdayIncomeAttendance = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    const result = await session.executeRead(async (tx) =>
      tx.run(weekdayIncomeAttendanceQuery, {
        campusName: CAMPUS_NAME,
        bussingDate: lastSunday,
      })
    )

    const headerRow = ['Weekday Attendance', 'Weekday Income']

    const returnValues = [
      headerRow,
      ...result.records.map((record) => [
        record.get('attendance').toString(),
        record.get('income').toString(),
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

export default weekdayIncomeAttendance
