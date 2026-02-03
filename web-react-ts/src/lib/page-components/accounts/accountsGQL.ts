import { gql } from '@apollo/client'

export const COUNCIL_ACCOUNT_DASHBOARD = gql`
  query CouncilAccountDashboard($id: ID!) {
    councils(where: { id: $id }) {
      id
      name
      hrAmount
      bussingAmount
      weekdayBalance
      bussingSocietyBalance

      leader {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`

export const CAMPUS_ACCOUNT_DASHBOARD = gql`
  query CampusAccountDashboard($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      weekdayBalance
      bussingSocietyBalance

      leader {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`

export const OVERSIGHT_ACCOUNT_DASHBOARD = gql`
  query OversightAccountDashboard($id: ID!) {
    oversights(where: { id: $id }) {
      id
      name
      weekdayBalance
      bussingSocietyBalance

      leader {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`

export const CAMPUS_BY_COUNCIL_ACCOUNTS = gql`
  query CampusByCouncilAccounts($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      streams {
        id
        name

        councils(options: { sort: { name: ASC } }) {
          id
          name

          weekdayBalance
          bussingSocietyBalance

          leader {
            id
            firstName
            lastName
            pictureUrl
            fullName
          }
        }
      }
    }
  }
`

export const OVERSIGHT_BY_CAMPUS_ACCOUNT = gql`
  query OversightByCampusesAccounts($id: ID!) {
    oversights(where: { id: $id }) {
      id
      name

      campuses {
        id
        name

        streams(options: { sort: { name: ASC } }) {
          id
          name

          weekdayBalance
          bussingSocietyBalance

          leader {
            id
            firstName
            lastName
            pictureUrl
            fullName
          }
        }
      }
    }
  }
`
