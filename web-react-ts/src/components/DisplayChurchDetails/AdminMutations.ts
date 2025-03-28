import { gql } from '@apollo/client'

export const MAKE_GOVERNORSHIP_ADMIN = gql`
  mutation MakeGovernorshipAdmin(
    $governorshipId: ID!
    $newAdminId: ID!
    $oldAdminId: ID!
  ) {
    RemoveGovernorshipAdmin(
      governorshipId: $governorshipId
      adminId: $oldAdminId
      newAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeGovernorshipAdmin(
      governorshipId: $governorshipId
      adminId: $newAdminId
      oldAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      isAdminForGovernorship {
        id
        admin {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const MAKE_COUNCIL_ADMIN = gql`
  mutation MakeCouncilAdmin(
    $councilId: ID!
    $newAdminId: ID!
    $oldAdminId: ID!
  ) {
    RemoveCouncilAdmin(
      councilId: $councilId
      adminId: $oldAdminId
      newAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeCouncilAdmin(
      councilId: $councilId
      adminId: $newAdminId
      oldAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      isAdminForCouncil {
        id
        admin {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const MAKE_STREAM_ADMIN = gql`
  mutation MakeStreamAdmin($streamId: ID!, $newAdminId: ID!, $oldAdminId: ID!) {
    RemoveStreamAdmin(
      streamId: $streamId
      adminId: $oldAdminId
      newAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeStreamAdmin(
      streamId: $streamId
      adminId: $newAdminId
      oldAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      isAdminForStream {
        id
        admin {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const MAKE_CAMPUS_ADMIN = gql`
  mutation MakeCampusAdmin($campusId: ID!, $newAdminId: ID!, $oldAdminId: ID!) {
    RemoveCampusAdmin(
      campusId: $campusId
      adminId: $oldAdminId
      newAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeCampusAdmin(
      campusId: $campusId
      adminId: $newAdminId
      oldAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      isAdminForCampus {
        id
        admin {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const MAKE_OVERSIGHT_ADMIN = gql`
  mutation MakeOversightAdmin(
    $oversightId: ID!
    $newAdminId: ID!
    $oldAdminId: ID!
  ) {
    RemoveOversightAdmin(
      oversightId: $oversightId
      adminId: $oldAdminId
      newAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeOversightAdmin(
      oversightId: $oversightId
      adminId: $newAdminId
      oldAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      isAdminForOversight {
        id
        admin {
          id
          firstName
          lastName
        }
      }
    }
  }
`
