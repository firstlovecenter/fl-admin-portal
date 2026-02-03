import { average } from 'global-utils'

const numberOfWeeks = 4

export const getMonthlyStatAverage = (
  data?: {
    attendance: string
    income: string
    gatheringAttendance: string
    rehearsalAttendance: string
  }[],
  stat?: 'attendance' | 'income' | 'gatheringAttendance' | 'rehearsalAttendance'
) => {
  if (!data || !stat) {
    return
  }

  const statArray = data.map((service) =>
    parseFloat(service[`${stat || 'attendance'}`])
  )

  //filter and remove all zeros
  const nonZeroArray = statArray.filter((value) => {
    return value > 0
  })

  //Calculate average of the last four weeks of service
  return average(nonZeroArray.slice(-numberOfWeeks))?.toFixed(2)
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

const extractServiceDataWithDollars = (arr: any[]) =>
  arr.map(({ id, attendance, dollarIncome: income, week }) => ({
    id,
    attendance,
    income,
    week,
  }))

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
  category: GraphTypes
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
        attendance: record.attendance,
        income: record.income?.toFixed(2),
        target: record?.target,
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

  if (data.length <= 3) {
    return data
  }

  return data.slice(data.length - numberOfWeeks, data.length)
}
