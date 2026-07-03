import { gql } from '@apollo/client'
import {
  LEVEL_COLLECTION_KEY,
  type ReportLevel,
  type SubChurchesAtLevelScope,
} from './report-types'

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

// Only the weekday self-report (`weekdayIncomeBussingReport`, typed
// WeeklyChurchReportEntry) collapses its income column by currency, so
// `serviceCurrency` lives here rather than in the shared WEEKDAY_FIELDS.
// The sub-churches-at-level query returns WeeklyChurchReportEntryWithAncestors,
// which has no `serviceCurrency` field — selecting it there would fail
// GraphQL validation.
const WEEKDAY_SELF_FIELDS = `
  ${WEEKDAY_FIELDS}
  serviceCurrency
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
  WEEKDAY_SELF_FIELDS
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

// Sub-churches-at-level: ancestor-decorated rows whose granularity is
// picked at request time via `targetLevel`. The ancestor shape is always
// returned in full; the FE picks which ancestor columns to display.
const ANCESTOR_FIELDS = `
  targetLeaderFirstName
  targetLeaderLastName
  targetLeaderPhone
  ancestors {
    level
    name
    leaderFirstName
    leaderLastName
    leaderPhone
  }
`

const buildSubChurchesAtLevelQuery = (
  scope: SubChurchesAtLevelScope,
  alias: string,
  metricFields: string
) => {
  const collection = LEVEL_COLLECTION_KEY[scope]
  return gql`
    query ${alias}${scope}(
      $id: ID!
      $startWeekKey: Int!
      $endWeekKey: Int!
      $targetLevel: String!
    ) {
      ${collection}(where: { id: { eq: $id } }) {
        id
        name
        subChurchesReportAtLevel(
          startWeekKey: $startWeekKey
          endWeekKey: $endWeekKey
          targetLevel: $targetLevel
        ) {
          ${metricFields}
          ${ANCESTOR_FIELDS}
        }
      }
    }
  `
}

const buildSubChurchesAtLevelMap = (
  alias: string,
  selection: string
): Record<SubChurchesAtLevelScope, ReturnType<typeof gql>> => ({
  Council: buildSubChurchesAtLevelQuery('Council', alias, selection),
  Stream: buildSubChurchesAtLevelQuery('Stream', alias, selection),
  Campus: buildSubChurchesAtLevelQuery('Campus', alias, selection),
  Oversight: buildSubChurchesAtLevelQuery('Oversight', alias, selection),
})

export const BUSSING_SUB_CHURCHES_AT_LEVEL_QUERIES =
  buildSubChurchesAtLevelMap('BussingSubChurchesAtLevel', BUSSING_FIELDS)

export const WEEKDAY_SUB_CHURCHES_AT_LEVEL_QUERIES =
  buildSubChurchesAtLevelMap('WeekdaySubChurchesAtLevel', WEEKDAY_FIELDS)

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
