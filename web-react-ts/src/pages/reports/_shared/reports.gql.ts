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
    leaderFirstName
    leaderLastName
    leaderPhone
    leaderWhatsApp
    ancestors {
      id
      level
      name
      leaderFirstName
      leaderLastName
      leaderPhone
      leaderWhatsApp
    }
    latitude
    longitude
  }
`

const WEEKDAY_FIELDS = `
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
`

const BUSSING_FIELDS = `
  id
  churchId
  churchName
  churchLevel
  week
  year
  bussingAttendance
  bussingLeaderDeclaration
  numberOfSprinters
  numberOfUrvans
  numberOfCars
  bussingTopUp
`

const buildDirectoryQuery = (level: ReportLevel) => {
  const collection = LEVEL_COLLECTION_KEY[level]
  return gql`
    query Directory${level}Report($id: ID!) {
      ${collection}(where: { id: { eq: $id } }) {
        ${DIRECTORY_FIELDS}
      }
    }
  `
}

const buildWeeklyQuery = (
  level: ReportLevel,
  field: 'weekdayIncomeBussingReport' | 'subChurchesReport',
  alias: string,
  selection: string
) => {
  const collection = LEVEL_COLLECTION_KEY[level]
  return gql`
    query ${alias}${level}($id: ID!, $startWeekKey: Int!, $endWeekKey: Int!) {
      ${collection}(where: { id: { eq: $id } }) {
        id
        name
        ${field}(startWeekKey: $startWeekKey, endWeekKey: $endWeekKey) {
          ${selection}
        }
      }
    }
  `
}

const buildLevelMap = (
  field: 'weekdayIncomeBussingReport' | 'subChurchesReport',
  alias: string,
  selection: string
): Record<ReportLevel, ReturnType<typeof gql>> => ({
  Bacenta: buildWeeklyQuery('Bacenta', field, alias, selection),
  Governorship: buildWeeklyQuery('Governorship', field, alias, selection),
  Council: buildWeeklyQuery('Council', field, alias, selection),
  Stream: buildWeeklyQuery('Stream', field, alias, selection),
  Campus: buildWeeklyQuery('Campus', field, alias, selection),
  Oversight: buildWeeklyQuery('Oversight', field, alias, selection),
})

export const DIRECTORY_REPORT_QUERIES: Record<ReportLevel, ReturnType<typeof gql>> = {
  Bacenta: buildDirectoryQuery('Bacenta'),
  Governorship: buildDirectoryQuery('Governorship'),
  Council: buildDirectoryQuery('Council'),
  Stream: buildDirectoryQuery('Stream'),
  Campus: buildDirectoryQuery('Campus'),
  Oversight: buildDirectoryQuery('Oversight'),
}

export const WEEKDAY_REPORT_QUERIES = buildLevelMap(
  'weekdayIncomeBussingReport',
  'WeekdayReport',
  WEEKDAY_FIELDS
)

export const BUSSING_REPORT_QUERIES = buildLevelMap(
  'weekdayIncomeBussingReport',
  'BussingReport',
  BUSSING_FIELDS
)

export const WEEKDAY_SUB_CHURCHES_QUERIES = buildLevelMap(
  'subChurchesReport',
  'WeekdaySubChurches',
  WEEKDAY_FIELDS
)

export const BUSSING_SUB_CHURCHES_QUERIES = buildLevelMap(
  'subChurchesReport',
  'BussingSubChurches',
  BUSSING_FIELDS
)

export const BACENTA_SERVICE_RECORDS_QUERY = gql`
  query BacentaWeekdayServiceRecords(
    $id: ID!
    $startWeekKey: Int!
    $endWeekKey: Int!
  ) {
    bacentas(where: { id: { eq: $id } }) {
      id
      name
      weekdayServiceRecordsReport(
        startWeekKey: $startWeekKey
        endWeekKey: $endWeekKey
      ) {
        id
        churchId
        churchName
        serviceDate
        week
        year
        attendance
        income
        cash
        onlineGiving
        numberOfTithers
        dollarIncome
        foreignCurrency
        noServiceReason
        createdAt
        recordedByName
        recordedByPhone
        treasurers {
          id
          name
          phone
          whatsapp
        }
        familyPicture
        treasurerSelfie
        bankingSlip
        transactionStatus
        bankingProof
        bankedByName
        bankedByPhone
      }
    }
  }
`
