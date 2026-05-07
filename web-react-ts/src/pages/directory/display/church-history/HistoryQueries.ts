import { gql } from '@apollo/client'

export const MEMBER_HISTORY = gql`
  query MemberHistory($id: ID!) {
    members(where: { id: $id }) {
      id
      firstName
      lastName
      history(limit: 100) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          stream_name
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`
export const STREAM_HISTORY = gql`
  query StreamsHistory($id: ID!) {
    streams(where: { id: $id }) {
      id
      name
      history(limit: 100) {
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
      }
    }
  }
`
export const COUNCIL_HISTORY = gql`
  query CouncilsHistory($id: ID!) {
    councils(where: { id: $id }) {
      id
      name
      history(limit: 100) {
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
      }
    }
  }
`
export const GOVERNORSHIP_HISTORY = gql`
  query GovernorshipsHistory($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name
      history(limit: 100) {
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
      }
    }
  }
`

export const BACENTA_HISTORY = gql`
  query BacentasHistory($id: ID!) {
    bacentas(where: { id: $id }) {
      id
      name
      history(limit: 100) {
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
      }
    }
  }
`

export const CAMPUS_HISTORY = gql`
  query CampusHistory($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      history(limit: 100) {
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
      }
    }
  }
`
