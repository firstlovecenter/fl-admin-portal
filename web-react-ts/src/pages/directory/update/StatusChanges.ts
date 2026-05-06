import { gql } from '@apollo/client'

export const SET_VACATION_STREAM = gql`
  mutation SetVacationStream($streamId: ID!) {
    SetVacationStream(streamId: $streamId) {
      id
      name
      vacationStatus
      history(limit: 5) {
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

export const SET_ACTIVE_STREAM = gql`
  mutation SetActiveStream($streamId: ID!) {
    SetActiveStream(streamId: $streamId) {
      id
      name
      vacationStatus
      history(limit: 5) {
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

export const SET_VACATION_BACENTA = gql`
  mutation SetVacationBacenta($bacentaId: ID!) {
    SetVacationBacenta(bacentaId: $bacentaId) {
      id
      name
      vacationStatus
      history(limit: 5) {
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

export const SET_ACTIVE_BACENTA = gql`
  mutation SetActiveBacenta($bacentaId: ID!) {
    SetActiveBacenta(bacentaId: $bacentaId) {
      id
      name
      vacationStatus
      history(limit: 5) {
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

export const SET_ACTIVE_HUB = gql`
  mutation SetActiveHub($hubId: ID!) {
    SetActiveHub(hubId: $hubId) {
      id
      name
      vacationStatus
      history(limit: 5) {
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

export const SET_VACATION_HUB = gql`
  mutation SetVacationHub($hubId: ID!) {
    SetVacationHub(hubId: $hubId) {
      id
      name
      vacationStatus
      history(limit: 5) {
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

