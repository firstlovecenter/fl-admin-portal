import { gql } from '@apollo/client'

// Add Admin Mutations
export const ADD_COUNCIL_ADMIN = gql`
  mutation AddCouncilAdmin($councilId: ID!, $adminId: ID!) {
    AddCouncilAdmin(councilId: $councilId, adminId: $adminId) {
      id
      firstName
      lastName
      isAdminForCouncil {
        id
        admins {
          id
          firstName
          lastName
          pictureUrl
        }
      }
    }
  }
`

export const ADD_STREAM_ADMIN = gql`
  mutation AddStreamAdmin($streamId: ID!, $adminId: ID!) {
    AddStreamAdmin(streamId: $streamId, adminId: $adminId) {
      id
      firstName
      lastName
      isAdminForStream {
        id
        admins {
          id
          firstName
          lastName
          pictureUrl
        }
      }
    }
  }
`

export const ADD_CAMPUS_ADMIN = gql`
  mutation AddCampusAdmin($campusId: ID!, $adminId: ID!) {
    AddCampusAdmin(campusId: $campusId, adminId: $adminId) {
      id
      firstName
      lastName
      isAdminForCampus {
        id
        admins {
          id
          firstName
          lastName
          pictureUrl
        }
      }
    }
  }
`

export const ADD_OVERSIGHT_ADMIN = gql`
  mutation AddOversightAdmin($oversightId: ID!, $adminId: ID!) {
    AddOversightAdmin(oversightId: $oversightId, adminId: $adminId) {
      id
      firstName
      lastName
      isAdminForOversight {
        id
        admins {
          id
          firstName
          lastName
          pictureUrl
        }
      }
    }
  }
`

export const ADD_GOVERNORSHIP_ADMIN = gql`
  mutation AddGovernorshipAdmin($governorshipId: ID!, $adminId: ID!) {
    AddGovernorshipAdmin(governorshipId: $governorshipId, adminId: $adminId) {
      id
      firstName
      lastName
      isAdminForGovernorship {
        id
        admins {
          id
          firstName
          lastName
          pictureUrl
        }
      }
    }
  }
`

// Delete Admin Mutations
export const DELETE_COUNCIL_ADMIN = gql`
  mutation DeleteCouncilAdmin($councilId: ID!, $adminId: ID!) {
    DeleteCouncilAdmin(councilId: $councilId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const DELETE_STREAM_ADMIN = gql`
  mutation DeleteStreamAdmin($streamId: ID!, $adminId: ID!) {
    DeleteStreamAdmin(streamId: $streamId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const DELETE_CAMPUS_ADMIN = gql`
  mutation DeleteCampusAdmin($campusId: ID!, $adminId: ID!) {
    DeleteCampusAdmin(campusId: $campusId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const DELETE_OVERSIGHT_ADMIN = gql`
  mutation DeleteOversightAdmin($oversightId: ID!, $adminId: ID!) {
    DeleteOversightAdmin(oversightId: $oversightId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const DELETE_GOVERNORSHIP_ADMIN = gql`
  mutation DeleteGovernorshipAdmin($governorshipId: ID!, $adminId: ID!) {
    DeleteGovernorshipAdmin(governorshipId: $governorshipId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`
