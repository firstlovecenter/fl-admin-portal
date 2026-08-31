import type { TFunction } from 'i18next'
import { average, getWeekNumber } from 'global-utils'

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

// Oversight/Denomination income is native (e.g. GHS) when the church is
// single-currency and USD when it consolidates campuses across currencies. The
// currency travels on each aggregate, so format the stat in that currency rather
// than assuming dollars. Shared by the two consolidated graph pages.
export const formatIncomeStat = (
  avgIncome: string | undefined,
  incomeTracked: boolean,
  currency: string | null | undefined,
  t?: TFunction
): string => {
  if (!incomeTracked) {
    return t ? t('services.graphs.notTracked') : 'Not tracked'
  }
  if (avgIncome === undefined || avgIncome === 'NaN') return '—'
  const num = Number(avgIncome)
  if (!Number.isFinite(num)) return '—'
  const code = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(num)
  } catch {
    return `${code} ${num.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`
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

// The church week runs Monday→Sunday with Sunday as its LAST day
// (kb/01-glossary.md, "Church week"), so a week's figures are only due once its
// Sunday arrives. Charting the week we are still living through plots whatever
// partial or mis-dated records happen to carry its date — SYN-214, where that
// bar mirrored the previous week's figures.
//
// Scoped to the service categories named in that ticket. Rehearsals, ministry
// meetings and on-stage attendance genuinely happen mid-week, so gating them
// would hide data that really was submitted. Bussing is Sunday-only and has the
// same exposure, but it is a separate tab and is left to a follow-up.
const SUNDAY_CADENCE_CATEGORIES = [
  'services',
  'serviceAggregate',
  'serviceAggregateWithDollar',
] as const satisfies readonly GraphTypes[]

/** The calendar years the ISO week containing `now` falls in — usually one, but
 *  a week straddling New Year spans two. Aggregates are keyed on Neo4j's
 *  `date().year` (calendar year, not ISO week-year), so such a week is stored
 *  under both; recognising only one leaves the phantom bar visible under the
 *  other for the few days either side of New Year. */
const calendarYearsOfIsoWeek = (now: Date): number[] => {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const first = monday.getFullYear()
  const last = sunday.getFullYear()
  return first === last ? [first] : [first, last]
}

/** True while `(week, year)` is the week we are currently living through and
 *  its Sunday has not arrived yet — i.e. nothing is due to have been submitted. */
export const isInProgressServiceWeek = (
  week: number | string | null | undefined,
  year: number | string | null | undefined,
  now: Date = new Date()
): boolean => {
  const recordWeek = Number(week)
  const recordYear = Number(year)
  if (!Number.isFinite(recordWeek) || !Number.isFinite(recordYear)) return false

  // From Sunday onwards the week's submissions are due, so its bar is real
  // data and must show — that is the point at which the week becomes visible.
  if (now.getDay() === 0) return false

  // `getWeekNumber` mutates the Date it is handed, hence the copy.
  if (recordWeek !== getWeekNumber(new Date(now))) return false
  return calendarYearsOfIsoWeek(now).includes(recordYear)
}

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
  windowSize = numberOfWeeks,
  t?: TFunction
) => {
  if (!church) {
    return
  }
  let data: any[] = []

  const currentYear = new Date().getFullYear()

  const pushIntoData = (array: any[]) => {
    if (!array || array?.length === 0) {
      return
    }

    array.forEach((record) => {
      const recordDate = record?.serviceDate?.date || record.date
      const week = record.week
      // Per-record types (ServiceRecord, BussingRecord) expose `week` but
      // not `year`. Derive year from the record date so cross-year datasets
      // sort and label correctly — without this, week 51/2025 and week 20/2026
      // get sorted purely by week number.
      let year: number | undefined =
        typeof record.year === 'number' && Number.isFinite(record.year)
          ? record.year
          : undefined
      if (year === undefined && recordDate) {
        // `serviceDate.date` arrives as `"YYYY-MM-DD"`. `new Date(...)` would
        // parse it as UTC midnight and `getFullYear()` then converts to local
        // time, which can shift Jan 1 back a year for users outside UTC+0.
        const parsed = new Date(recordDate).getUTCFullYear()
        if (Number.isFinite(parsed)) {
          year = parsed
        }
      }
      const yearSuffix =
        typeof year === 'number' && year !== currentYear
          ? String(year).slice(-2)
          : ''
      const weekLabel = week
        ? t
          ? yearSuffix
            ? t('services.graphs.weekShortYear', { week, yearSuffix })
            : t('services.graphs.weekShort', { week })
          : yearSuffix
            ? `W${week}'${yearSuffix}`
            : `W${week}`
        : null
      data.push({
        id: record?.id,
        category,
        date: recordDate,
        week,
        year,
        weekLabel,
        attendance: record.attendance,
        income: record.income?.toFixed(2),
        currency: record?.currency,
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

  if ((SUNDAY_CADENCE_CATEGORIES as readonly GraphTypes[]).includes(category)) {
    data = data.filter(
      (record) => !isInProgressServiceWeek(record?.week, record?.year)
    )
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
