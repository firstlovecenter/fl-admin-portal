import { gql } from '@apollo/client'

export const MEMBER_SEARCH = gql`
  query memberSearch($key: String!, $id: ID!, $limit: Int!) {
    members(where: { id: $id }) {
      id
      memberSearch(key: $key, limit: $limit) {
        id
        firstName
        lastName
        nameWithTitle
        pictureUrl
        bacenta {
          id
          name
        }
      }
      oversightSearch(key: $key, limit: $limit) {
        id
        name
        leader {
          id
          firstName
          lastName
          nameWithTitle
          pictureUrl
        }
      }
      campusSearch(key: $key, limit: $limit) {
        id
        name
        noIncomeTracking
        currency
        conversionRateToDollar
        leader {
          id
          firstName
          lastName
          nameWithTitle
          pictureUrl
        }
      }
      streamSearch(key: $key, limit: $limit) {
        id
        name
        leader {
          id
          firstName
          lastName
          nameWithTitle
          pictureUrl
        }
      }
      councilSearch(key: $key, limit: $limit) {
        id
        name
        leader {
          id
          firstName
          lastName
          nameWithTitle
          pictureUrl
        }
      }
      governorshipSearch(key: $key, limit: $limit) {
        id
        name
        leader {
          id
          firstName
          lastName
          nameWithTitle
          pictureUrl
        }
      }
      bacentaSearch(key: $key, limit: $limit) {
        id
        name
        leader {
          id
          firstName
          lastName
          nameWithTitle
          pictureUrl
        }
      }
    }
  }
`
