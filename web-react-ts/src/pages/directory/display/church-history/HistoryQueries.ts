import { gql } from '@apollo/client'

const HISTORY_FIELDS = `
  id
  timeStamp
  createdAt {
    date
  }
  loggedBy {
    id
    firstName
    lastName
    stream_name
  }
  historyRecord
`

export const MEMBER_HISTORY = gql`
  query MemberHistory($id: ID!, $offset: Int!, $limit: Int!) {
    members(where: { id: $id }) {
      id
      firstName
      lastName
      historyCount
      history(limit: $limit, offset: $offset) {
        ${HISTORY_FIELDS}
      }
    }
  }
`

export const STREAM_HISTORY = gql`
  query StreamsHistory($id: ID!, $offset: Int!, $limit: Int!) {
    streams(where: { id: $id }) {
      id
      name
      __typename
      historyCount
      history(limit: $limit, offset: $offset) {
        ${HISTORY_FIELDS}
      }
    }
  }
`

export const COUNCIL_HISTORY = gql`
  query CouncilsHistory($id: ID!, $offset: Int!, $limit: Int!) {
    councils(where: { id: $id }) {
      id
      name
      __typename
      historyCount
      history(limit: $limit, offset: $offset) {
        ${HISTORY_FIELDS}
      }
    }
  }
`

export const GOVERNORSHIP_HISTORY = gql`
  query GovernorshipsHistory($id: ID!, $offset: Int!, $limit: Int!) {
    governorships(where: { id: $id }) {
      id
      name
      __typename
      historyCount
      history(limit: $limit, offset: $offset) {
        ${HISTORY_FIELDS}
      }
    }
  }
`

export const BACENTA_HISTORY = gql`
  query BacentasHistory($id: ID!, $offset: Int!, $limit: Int!) {
    bacentas(where: { id: $id }) {
      id
      name
      __typename
      historyCount
      history(limit: $limit, offset: $offset) {
        ${HISTORY_FIELDS}
      }
    }
  }
`

export const CAMPUS_HISTORY = gql`
  query CampusHistory($id: ID!, $offset: Int!, $limit: Int!) {
    campuses(where: { id: $id }) {
      id
      name
      __typename
      historyCount
      history(limit: $limit, offset: $offset) {
        ${HISTORY_FIELDS}
      }
    }
  }
`
