import { gql } from '@apollo/client'

export const MAKE_BACENTA_INACTIVE = gql`
  mutation CloseDownBacenta($id: ID!, $leaderId: ID!) {
    CloseDownBacenta(bacentaId: $id, leaderId: $leaderId) {
      id
      name

      bacentas {
        id
        name
      }
    }
  }
`

export const MAKE_GOVERNORSHIP_INACTIVE = gql`
  mutation CloseDownGovernorship($id: ID!, $adminId: ID!, $leaderId: ID!) {
    CloseDownGovernorship(
      governorshipId: $id
      leaderId: $leaderId
      adminId: $adminId
    ) {
      id
      name
      governorships {
        id
        name
      }
    }
  }
`

export const MAKE_COUNCIL_INACTIVE = gql`
  mutation CloseDownCouncil($id: ID!, $leaderId: ID!, $adminId: ID!) {
    CloseDownCouncil(councilId: $id, leaderId: $leaderId, adminId: $adminId) {
      id
      name
      councils {
        id
        name
      }
    }
  }
`

export const MAKE_STREAM_INACTIVE = gql`
  mutation CloseDownStream($id: ID!, $leaderId: ID!, $adminId: ID!) {
    CloseDownStream(streamId: $id, leaderId: $leaderId, adminId: $adminId) {
      id
      name

      streams {
        id
      }

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
export const MAKE_CAMPUS_INACTIVE = gql`
  mutation CloseDownCampus($id: ID!, $leaderId: ID!, $adminId: ID!) {
    CloseDownCampus(campusId: $id, leaderId: $leaderId, adminId: $adminId) {
      id
      name

      campuses {
        id
      }

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

export const MAKE_OVERSIGHT_INACTIVE = gql`
  mutation CloseDownOversight($id: ID!, $leaderId: ID!, $adminId: ID!) {
    CloseDownOversight(
      oversightId: $id
      leaderId: $leaderId
      adminId: $adminId
    ) {
      id
      name

      oversights {
        id
      }

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
