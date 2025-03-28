import { gql } from '@apollo/client'

export const OVERSIGHT_FELLOWSHIP_SEARCH = gql`
  query oversightFellowshipSearch($id: ID!, $key: String!) {
    oversights(where: { id: $id }) {
      id
      fellowshipSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const CAMPUS_FELLOWSHIP_SEARCH = gql`
  query gatheringFellowshipSearch($id: ID!, $key: String!) {
    campuses(where: { id: $id }) {
      id
      fellowshipSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const STREAM_FELLOWSHIP_SEARCH = gql`
  query streamFellowshipSearch($id: ID!, $key: String!) {
    streams(where: { id: $id }) {
      id
      fellowshipSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const COUNCIL_FELLOWSHIP_SEARCH = gql`
  query councilFellowshipSearch($id: ID!, $key: String!) {
    councils(where: { id: $id }) {
      id
      fellowshipSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const GOVERNORSHIP_FELLOWSHIP_SEARCH = gql`
  query governorshipFellowshipSearch($id: ID!, $key: String!) {
    governorships(where: { id: $id }) {
      id
      fellowshipSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const BACENTA_FELLOWSHIP_SEARCH = gql`
  query bacentaFellowshipSearch($id: ID!, $key: String!) {
    bacentas(where: { id: $id }) {
      id
      fellowshipSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const MEMBER_FELLOWSHIP_SEARCH = gql`
  query memberFellowshipSearch($id: ID!, $key: String!) {
    members(where: { id: $id }) {
      id
      fellowshipSearch(key: $key) {
        id
        name
        bacenta {
          id
          name
        }
      }
    }
  }
`
