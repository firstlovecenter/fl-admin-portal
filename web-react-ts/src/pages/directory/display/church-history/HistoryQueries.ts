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

export const HUB_COUNCIL_HISTORY = gql`
  query HubCouncilsHistory($id: ID!) {
    hubCouncils(where: { id: $id }) {
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
export const HUB_HISTORY = gql`
  query HubHistory($id: ID!) {
    hubs(where: { id: $id }) {
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
export const MINISTRY_HISTORY = gql`
  query MinistryHistory($id: ID!) {
    ministries(where: { id: $id }) {
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

export const CREATIVE_ARTS_HISTORY = gql`
  query CreativeArtsHistory($id: ID!) {
    creativeArts(where: { id: $id }) {
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
export const FELLOWSHIP_HISTORY = gql`
  query FellowshipsHistory($id: ID!) {
    fellowships(where: { id: $id }) {
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
