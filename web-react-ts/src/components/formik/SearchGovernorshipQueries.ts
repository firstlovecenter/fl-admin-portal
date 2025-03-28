import { gql } from '@apollo/client'

export const CAMPUS_GOVERNORSHIP_SEARCH = gql`
  query gatheringGovernorshipSearch($id: ID!, $key: String!) {
    campuses(where: { id: $id }) {
      id
      governorshipSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const STREAM_GOVERNORSHIP_SEARCH = gql`
  query streamGovernorshipSearch($id: ID!, $key: String!) {
    streams(where: { id: $id }) {
      id
      governorshipSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const COUNCIL_GOVERNORSHIP_SEARCH = gql`
  query councilGovernorshipSearch($id: ID!, $key: String!) {
    councils(where: { id: $id }) {
      id
      governorshipSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const MEMBER_GOVERNORSHIP_SEARCH = gql`
  query memberGovernorshipSearch($id: ID!, $key: String!) {
    members(where: { id: $id }) {
      id
      governorshipSearch(key: $key) {
        id
        name
        council {
          id
          name
        }
      }
    }
  }
`
