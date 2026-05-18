import { average } from 'global-utils'

const numberOfWeeks = 4

export const getMonthlyStatAverage = (
  data?: {
    id?: string
    attendance: string
    income: string
    gatheringAttendance: string
    rehearsalAttendance: string
    week?: number | string
    year?: number | string
    date?: string
  }[],
  stat?:
    | 'attendance'
    | 'income'
    | 'gatheringAttendance'
    | 'rehearsalAttendance',
  windowSize: number = numberOfWeeks
) => {
  if (!data || !stat) {
    return
  }

  const sortedData = [...data]
    .map((service, index) => ({ service, index }))
    .sort((aItem, bItem) => {
      const a = aItem.service
      const b = bItem.service
      const aYear = Number(a.year ?? 0)
      const bYear = Number(b.year ?? 0)
      const aWeek = Number(a.week ?? 0)
      const bWeek = Number(b.week ?? 0)

      if (
        Number.isFinite(aYear) &&
        Number.isFinite(bYear) &&
        (aYear !== 0 || bYear !== 0)
      ) {
        if (bYear !== aYear) {
          return bYear - aYear
        }
        return bWeek - aWeek
      }

      const aDate = a.date ? Date.parse(a.date) : NaN
      const bDate = b.date ? Date.parse(b.date) : NaN

      if (Number.isFinite(aDate) && Number.isFinite(bDate)) {
        return bDate - aDate
      }

      if (Number.isFinite(aWeek) && Number.isFinite(bWeek)) {
        return bWeek - aWeek
      }

      if (a.id && b.id && a.id !== b.id) {
        return String(b.id).localeCompare(String(a.id))
      }

      return aItem.index - bItem.index
    })
    .map(({ service }) => service)

  const latestValues = sortedData
    .slice(0, windowSize)
    .map((service) => Number(service[stat]))
    .filter((value) => Number.isFinite(value))

  // Ignore zero values within the window so a single missed week doesn't drag
  // the average to zero.
  const nonZeroArray = latestValues.filter((value) => value > 0)

  return average(nonZeroArray)?.toFixed(2)
}

export const sortingFunction = (key: string, order = 'asc') => {
  //used for sorting services data according to date
  return function innerSort(
    a: { [x: string]: any; hasOwnProperty: (arg0: any) => any },
    b: { [x: string]: any; hasOwnProperty: (arg0: any) => any }
  ) {
    // eslint-disable-next-line no-prototype-builtins
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      //property doesn't exist on either object
      return 0
    }

    const varA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key]
    const varB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key]

    let comparison = 0
    if (varA > varB) {
      comparison = 1
    } else if (varA < varB) {
      comparison = -1
    }
    return order === 'desc' ? comparison * -1 : comparison
  }
}

const extractServiceDataWithDollars = (arr: any[] | undefined) => {
  if (!arr || arr.length === 0) return []
  return arr.map(
    ({
      id,
      attendance,
      dollarIncome: income,
      week,
      year,
      date,
      serviceDate,
    }) => ({
      id,
      attendance,
      income,
      week,
      year,
      date: serviceDate?.date || date,
    })
  )
}

export type GraphTypes =
  | 'bussing'
  | 'bussingAggregate'
  | 'serviceAggregate'
  | 'serviceAggregateWithDollar'
  | 'services'
  | 'rehearsals'
  | 'rehearsalAggregate'
  | 'ministryMeeting'
  | 'onStageAttendance'
  | 'onStageAttendanceAggregate'
  | 'multiplicationAggregate'
  | 'swellBussing'

export const getServiceGraphData = (
  church:
    | {
        bussing: any[]
        services: any[]
        rehearsals: any[]
        onStageAttendanceRecords: any[]
        aggregateStageAttendanceRecords: any[]
        aggregateRehearsalRecords: any[]
        aggregateServiceRecords: any[]
        aggregateBussingRecords: any[]
        aggregateMultiplicationRecords: any[]
        swellBussingRecords: any[]
      }
    | undefined,
  category: GraphTypes,
  windowSize = numberOfWeeks
) => {
  if (!church) {
    return
  }
  let data: any[] = []

  const pushIntoData = (array: any[]) => {
    if (!array || array?.length === 0) {
      return
    }

    array.forEach((record) => {
      data.push({
        id: record?.id,
        category,
        date: record?.serviceDate?.date || record.date,
        week: record.week,
        year: record.year,
        attendance: record.attendance,
        income: record.income?.toFixed(2),
        numberOfServices: record?.numberOfServices,
        numberOfUrvans: record?.numberOfUrvans,
        numberOfSprinters: record?.numberOfSprinters,
        numberOfCars: record?.numberOfCars,
      })
    })
  }

  if (category === 'services') {
    pushIntoData(church.services)
  }

  if (category === 'rehearsals') {
    pushIntoData(church.rehearsals)
  }
  if (category === 'rehearsalAggregate') {
    pushIntoData(church.aggregateRehearsalRecords)
  }

  if (category === 'onStageAttendance') {
    pushIntoData(church.onStageAttendanceRecords)
  }
  if (category === 'onStageAttendanceAggregate') {
    pushIntoData(church.aggregateStageAttendanceRecords)
  }

  if (category === 'bussing') {
    pushIntoData(church.bussing)
  }

  if (category === 'serviceAggregate') {
    pushIntoData(church.aggregateServiceRecords)
  }
  if (category === 'serviceAggregateWithDollar') {
    pushIntoData(extractServiceDataWithDollars(church.aggregateServiceRecords))
  }

  if (category === 'bussingAggregate') {
    pushIntoData(church.aggregateBussingRecords)
  }
  if (category === 'swellBussing') {
    pushIntoData(church.swellBussingRecords)
  }

  if (category === 'multiplicationAggregate') {
    pushIntoData(church.aggregateMultiplicationRecords)
  }

  if (!data.length) {
    return [
      {
        __typename: category,
        date: '',
        week: null,
        attendance: null,
        income: null,
      },
    ]
  }

  // Source @cypher fields return ORDER BY year DESC, week DESC. We sort
  // ascending here so every consumer gets "oldest → newest" left-to-right.
  // `.slice(length - windowSize, length)` then keeps the newest `windowSize`
  // records, which is what every *Graphs page actually wants to chart.
  const sorted = [...data].sort((a, b) => {
    const aYear = Number(a?.year ?? 0)
    const bYear = Number(b?.year ?? 0)
    if (Number.isFinite(aYear) && Number.isFinite(bYear) && aYear !== bYear) {
      return aYear - bYear
    }
    const aWeek = Number(a?.week ?? 0)
    const bWeek = Number(b?.week ?? 0)
    if (Number.isFinite(aWeek) && Number.isFinite(bWeek) && aWeek !== bWeek) {
      return aWeek - bWeek
    }
    const aDate = a?.date ? Date.parse(a.date) : NaN
    const bDate = b?.date ? Date.parse(b.date) : NaN
    if (Number.isFinite(aDate) && Number.isFinite(bDate)) {
      return aDate - bDate
    }
    return 0
  })

  if (sorted.length <= windowSize) {
    return sorted
  }

  return sorted.slice(sorted.length - windowSize, sorted.length)
}
