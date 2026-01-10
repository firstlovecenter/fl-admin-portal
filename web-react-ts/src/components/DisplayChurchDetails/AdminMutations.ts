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

// Multi-Admin Management Mutations (Add/Remove without replacement)
export const ADD_GOVERNORSHIP_ADMIN = gql`
  mutation AddGovernorshipAdmin($governorshipId: ID!, $adminId: ID!) {
    AddGovernorshipAdmin(governorshipId: $governorshipId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_GOVERNORSHIP_ADMIN = gql`
  mutation RemoveGovernorshipAdmin($governorshipId: ID!, $adminId: ID!) {
    RemoveGovernorshipAdminOnly(
      governorshipId: $governorshipId
      adminId: $adminId
    ) {
      id
      firstName
      lastName
    }
  }
`

export const ADD_COUNCIL_ADMIN = gql`
  mutation AddCouncilAdmin($councilId: ID!, $adminId: ID!) {
    AddCouncilAdmin(councilId: $councilId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_COUNCIL_ADMIN = gql`
  mutation RemoveCouncilAdmin($councilId: ID!, $adminId: ID!) {
    RemoveCouncilAdminOnly(councilId: $councilId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const ADD_STREAM_ADMIN = gql`
  mutation AddStreamAdmin($streamId: ID!, $adminId: ID!) {
    AddStreamAdmin(streamId: $streamId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_STREAM_ADMIN = gql`
  mutation RemoveStreamAdmin($streamId: ID!, $adminId: ID!) {
    RemoveStreamAdminOnly(streamId: $streamId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const ADD_CAMPUS_ADMIN = gql`
  mutation AddCampusAdmin($campusId: ID!, $adminId: ID!) {
    AddCampusAdmin(campusId: $campusId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_CAMPUS_ADMIN = gql`
  mutation RemoveCampusAdmin($campusId: ID!, $adminId: ID!) {
    RemoveCampusAdminOnly(campusId: $campusId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const ADD_OVERSIGHT_ADMIN = gql`
  mutation AddOversightAdmin($oversightId: ID!, $adminId: ID!) {
    AddOversightAdmin(oversightId: $oversightId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_OVERSIGHT_ADMIN = gql`
  mutation RemoveOversightAdmin($oversightId: ID!, $adminId: ID!) {
    RemoveOversightAdminOnly(oversightId: $oversightId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const ADD_DENOMINATION_ADMIN = gql`
  mutation AddDenominationAdmin($denominationId: ID!, $adminId: ID!) {
    AddDenominationAdmin(denominationId: $denominationId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_DENOMINATION_ADMIN = gql`
  mutation RemoveDenominationAdmin($denominationId: ID!, $adminId: ID!) {
    RemoveDenominationAdminOnly(
      denominationId: $denominationId
      adminId: $adminId
    ) {
      id
      firstName
      lastName
    }
  }
`

export const ADD_BACENTA_ADMIN = gql`
  mutation AddBacentaAdmin($bacentaId: ID!, $adminId: ID!) {
    AddBacentaAdmin(bacentaId: $bacentaId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_BACENTA_ADMIN = gql`
  mutation RemoveBacentaAdmin($bacentaId: ID!, $adminId: ID!) {
    RemoveBacentaAdminOnly(bacentaId: $bacentaId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`
