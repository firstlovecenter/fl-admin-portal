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

export const SET_VACATION_FELLOWSHIP = gql`
  mutation SetVacationFellowship($fellowshipId: ID!) {
    SetVacationFellowship(fellowshipId: $fellowshipId) {
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

export const SET_ACTIVE_FELLOWSHIP = gql`
  mutation SetActiveFellowship($fellowshipId: ID!) {
    SetActiveFellowship(fellowshipId: $fellowshipId) {
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

export const SET_ONLINE_FELLOWSHIP = gql`
  mutation SetOnlineFellowship($fellowshipId: ID!) {
    SetOnlineFellowship(fellowshipId: $fellowshipId) {
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

export const SET_FELLOWSHIP_TO_HUB_FELLOWSHIP = gql`
  mutation SetFellowshipToHubFellowship($fellowshipId: ID!, $hubId: ID!) {
    SetFellowshipToHubFellowship(fellowshipId: $fellowshipId, hubId: $hubId) {
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

export const SET_HUB_FELLOWSHIP_TO_REGULAR_FELLOWSHIP = gql`
  mutation SetHubFellowshipToRegularFellowship($fellowshipId: ID!) {
    SetHubFellowshipToRegularFellowship(fellowshipId: $fellowshipId) {
      id
      name
      hubStatus
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
