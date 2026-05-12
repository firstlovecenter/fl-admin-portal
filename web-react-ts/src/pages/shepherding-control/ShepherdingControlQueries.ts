import { gql } from '@apollo/client'

const LEADER_FRAGMENT = `
  leader {
    id
    firstName
    lastName
    pictureUrl
    nameWithTitle
  }
`

const AGGREGATES_FRAGMENT = `
  aggregateServiceRecords(limit: $limit, skip: $skip) {
    id
    attendance
    income
    week
    year
    numberOfServices
  }
  aggregateBussingRecords(limit: $limit, skip: $skip) {
    id
    attendance
    week
    year
  }
`

export const SHEPHERDING_DENOMINATION = gql`
  query shepherdingDenomination($id: ID!, $limit: Int = 24, $skip: Int = 0) {
    denominations(where: { id: { eq: $id } }) {
      id
      name
      ${LEADER_FRAGMENT}
      memberCount
      bacentaCount
      ${AGGREGATES_FRAGMENT}
      oversights {
        id
        name
      }
    }
  }
`

export const SHEPHERDING_OVERSIGHT = gql`
  query shepherdingOversight($id: ID!, $limit: Int = 24, $skip: Int = 0) {
    oversights(where: { id: { eq: $id } }) {
      id
      name
      ${LEADER_FRAGMENT}
      memberCount
      bacentaCount
      ${AGGREGATES_FRAGMENT}
      campuses {
        id
        name
      }
    }
  }
`

export const SHEPHERDING_CAMPUS = gql`
  query shepherdingCampus($id: ID!, $limit: Int = 24, $skip: Int = 0) {
    campuses(where: { id: { eq: $id } }) {
      id
      name
      ${LEADER_FRAGMENT}
      memberCount
      bacentaCount
      ${AGGREGATES_FRAGMENT}
      streams {
        id
        name
      }
    }
  }
`

export const SHEPHERDING_STREAM = gql`
  query shepherdingStream($id: ID!, $limit: Int = 24, $skip: Int = 0) {
    streams(where: { id: { eq: $id } }) {
      id
      name
      ${LEADER_FRAGMENT}
      memberCount
      bacentaCount
      ${AGGREGATES_FRAGMENT}
      councils {
        id
        name
      }
    }
  }
`

export const SHEPHERDING_COUNCIL = gql`
  query shepherdingCouncil($id: ID!, $limit: Int = 24, $skip: Int = 0) {
    councils(where: { id: { eq: $id } }) {
      id
      name
      ${LEADER_FRAGMENT}
      memberCount
      bacentaCount
      ${AGGREGATES_FRAGMENT}
      governorships {
        id
        name
      }
    }
  }
`

export const SHEPHERDING_GOVERNORSHIP = gql`
  query shepherdingGovernorship($id: ID!, $limit: Int = 24, $skip: Int = 0) {
    governorships(where: { id: { eq: $id } }) {
      id
      name
      ${LEADER_FRAGMENT}
      memberCount
      bacentaCount
      ${AGGREGATES_FRAGMENT}
      bacentas {
        id
        name
      }
    }
  }
`

export const SHEPHERDING_BACENTA = gql`
  query shepherdingBacenta($id: ID!, $limit: Int = 24, $skip: Int = 0) {
    bacentas(where: { id: { eq: $id } }) {
      id
      name
      ${LEADER_FRAGMENT}
      memberCount
      ${AGGREGATES_FRAGMENT}
    }
  }
`

export const SHEPHERDING_SCOPE_CHECK = gql`
  query shepherdingScopeCheck($level: String!, $id: ID!) {
    shepherdingScopeCheck(level: $level, id: $id)
  }
`
