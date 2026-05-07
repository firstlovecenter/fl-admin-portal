import { gql } from '@apollo/client'
import { LEVEL_COLLECTION_KEY, type ReportLevel } from './report-types'

export type { ReportLevel }

const DIRECTORY_FIELDS = `
  id
  name
  directoryReport {
    id
    level
    name
    parentName
    leaderName
    leaderPhone
    leaderWhatsApp
  }
`

const SERVICE_ONLY_FIELDS = `
  id
  churchId
  churchName
  churchLevel
  week
  year
  serviceAttendance
  numberOfServices
`

const INCOME_BUSSING_FIELDS = `
  id
  churchId
  churchName
  churchLevel
  week
  year
  serviceAttendance
  serviceIncome
  serviceDollarIncome
  numberOfServices
  bussingAttendance
  bussingLeaderDeclaration
  numberOfSprinters
  numberOfUrvans
  numberOfCars
  bussingTopUp
`

const SUB_CHURCH_FIELDS = `
  id
  churchId
  churchName
  churchLevel
  week
  year
  serviceAttendance
  serviceIncome
  numberOfServices
  bussingAttendance
`

const buildDirectoryQuery = (level: ReportLevel) => {
  const collection = LEVEL_COLLECTION_KEY[level]
  return gql`
    query Directory${level}Report($id: ID!) {
      ${collection}(where: { id: $id }) {
        ${DIRECTORY_FIELDS}
      }
    }
  `
}

const buildWeeklyQuery = (
  level: ReportLevel,
  field:
    | 'servicesHeldReport'
    | 'weekdayIncomeBussingReport'
    | 'subChurchesReport',
  alias: string,
  selection: string
) => {
  const collection = LEVEL_COLLECTION_KEY[level]
  return gql`
    query ${alias}${level}($id: ID!, $startWeekKey: Int!, $endWeekKey: Int!) {
      ${collection}(where: { id: $id }) {
        id
        name
        ${field}(startWeekKey: $startWeekKey, endWeekKey: $endWeekKey) {
          ${selection}
        }
      }
    }
  `
}

export const DIRECTORY_REPORT_QUERIES: Record<ReportLevel, ReturnType<typeof gql>> = {
  Bacenta: buildDirectoryQuery('Bacenta'),
  Governorship: buildDirectoryQuery('Governorship'),
  Council: buildDirectoryQuery('Council'),
  Stream: buildDirectoryQuery('Stream'),
  Campus: buildDirectoryQuery('Campus'),
  Oversight: buildDirectoryQuery('Oversight'),
}

export const SERVICES_HELD_REPORT_QUERIES: Record<
  ReportLevel,
  ReturnType<typeof gql>
> = {
  Bacenta: buildWeeklyQuery(
    'Bacenta',
    'servicesHeldReport',
    'ServicesHeld',
    SERVICE_ONLY_FIELDS
  ),
  Governorship: buildWeeklyQuery(
    'Governorship',
    'servicesHeldReport',
    'ServicesHeld',
    SERVICE_ONLY_FIELDS
  ),
  Council: buildWeeklyQuery(
    'Council',
    'servicesHeldReport',
    'ServicesHeld',
    SERVICE_ONLY_FIELDS
  ),
  Stream: buildWeeklyQuery(
    'Stream',
    'servicesHeldReport',
    'ServicesHeld',
    SERVICE_ONLY_FIELDS
  ),
  Campus: buildWeeklyQuery(
    'Campus',
    'servicesHeldReport',
    'ServicesHeld',
    SERVICE_ONLY_FIELDS
  ),
  Oversight: buildWeeklyQuery(
    'Oversight',
    'servicesHeldReport',
    'ServicesHeld',
    SERVICE_ONLY_FIELDS
  ),
}

export const WEEKDAY_INCOME_BUSSING_QUERIES: Record<
  ReportLevel,
  ReturnType<typeof gql>
> = {
  Bacenta: buildWeeklyQuery(
    'Bacenta',
    'weekdayIncomeBussingReport',
    'WeekdayIncomeBussing',
    INCOME_BUSSING_FIELDS
  ),
  Governorship: buildWeeklyQuery(
    'Governorship',
    'weekdayIncomeBussingReport',
    'WeekdayIncomeBussing',
    INCOME_BUSSING_FIELDS
  ),
  Council: buildWeeklyQuery(
    'Council',
    'weekdayIncomeBussingReport',
    'WeekdayIncomeBussing',
    INCOME_BUSSING_FIELDS
  ),
  Stream: buildWeeklyQuery(
    'Stream',
    'weekdayIncomeBussingReport',
    'WeekdayIncomeBussing',
    INCOME_BUSSING_FIELDS
  ),
  Campus: buildWeeklyQuery(
    'Campus',
    'weekdayIncomeBussingReport',
    'WeekdayIncomeBussing',
    INCOME_BUSSING_FIELDS
  ),
  Oversight: buildWeeklyQuery(
    'Oversight',
    'weekdayIncomeBussingReport',
    'WeekdayIncomeBussing',
    INCOME_BUSSING_FIELDS
  ),
}

export const SUB_CHURCHES_REPORT_QUERIES: Record<
  ReportLevel,
  ReturnType<typeof gql>
> = {
  Bacenta: buildWeeklyQuery(
    'Bacenta',
    'subChurchesReport',
    'SubChurches',
    SUB_CHURCH_FIELDS
  ),
  Governorship: buildWeeklyQuery(
    'Governorship',
    'subChurchesReport',
    'SubChurches',
    SUB_CHURCH_FIELDS
  ),
  Council: buildWeeklyQuery(
    'Council',
    'subChurchesReport',
    'SubChurches',
    SUB_CHURCH_FIELDS
  ),
  Stream: buildWeeklyQuery(
    'Stream',
    'subChurchesReport',
    'SubChurches',
    SUB_CHURCH_FIELDS
  ),
  Campus: buildWeeklyQuery(
    'Campus',
    'subChurchesReport',
    'SubChurches',
    SUB_CHURCH_FIELDS
  ),
  Oversight: buildWeeklyQuery(
    'Oversight',
    'subChurchesReport',
    'SubChurches',
    SUB_CHURCH_FIELDS
  ),
}
