import { gql } from '@apollo/client'

export const CAMPUS_STAT_FOR_YEAR_TILL_DATE = gql`
  query campusStatForYearTillDate(
    $campusId: ID
    $startDate: String!
    $endDate: String!
  ) {
    campuses(where: { id: $campusId }) {
      id
      name
      statsForYearTillDate(startDate: $startDate, endDate: $endDate) {
        income
        attendance
        bussing
        avgWeeklyIncome
      }
    }
  }
`

export const STREAM_STAT_FOR_YEAR_TILL_DATE = gql`
  query streamStatForYearTillDate(
    $streamId: ID
    $startDate: String!
    $endDate: String!
  ) {
    streams(where: { id: $streamId }) {
      id
      name
      statsForYearTillDate(startDate: $startDate, endDate: $endDate) {
        income
        attendance
        bussing
        avgWeeklyIncome
      }
    }
  }
`

export const COUNCIL_STAT_FOR_YEAR_TILL_DATE = gql`
  query councilStatForYearTillDate(
    $councilId: ID
    $startDate: String!
    $endDate: String!
  ) {
    councils(where: { id: $councilId }) {
      id
      name
      statsForYearTillDate(startDate: $startDate, endDate: $endDate) {
        income
        attendance
        bussing
        avgWeeklyIncome
      }
    }
  }
`

export const GOVERNORSHIP_STAT_FOR_YEAR_TILL_DATE = gql`
  query governorshipStatForYearTillDate(
    $governorshipId: ID
    $startDate: String!
    $endDate: String!
  ) {
    governorships(where: { id: $governorshipId }) {
      id
      name
      statsForYearTillDate(startDate: $startDate, endDate: $endDate) {
        income
        attendance
        bussing
        avgWeeklyIncome
      }
    }
  }
`

export const BACENTA_STAT_FOR_YEAR_TILL_DATE = gql`
  query bacentaStatForYearTillDate(
    $bacentaId: ID
    $startDate: String!
    $endDate: String!
  ) {
    bacentas(where: { id: $bacentaId }) {
      id
      name
      statsForYearTillDate(startDate: $startDate, endDate: $endDate) {
        income
        attendance
        bussing
        avgWeeklyIncome
      }
    }
  }
`
