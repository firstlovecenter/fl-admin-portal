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
        }
        historyRecord
      }
    }
  }
`

