import { gql } from '@apollo/client'

export const MAKE_MINISTRY_ADMIN = gql`
  mutation MakeMinistryAdmin(
    $ministryId: ID!
    $newAdminId: ID!
    $oldAdminId: ID!
  ) {
    RemoveMinistryAdmin(
      ministryId: $ministryId
      adminId: $oldAdminId
      newAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeMinistryAdmin(
      ministryId: $ministryId
      adminId: $newAdminId
      oldAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      isAdminForMinistry {
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

export const ADD_CREATIVEARTS_ADMIN = gql`
  mutation AddCreativeArtsAdmin($creativeArtsId: ID!, $adminId: ID!) {
    AddCreativeArtsAdmin(creativeArtsId: $creativeArtsId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_CREATIVEARTS_ADMIN = gql`
  mutation RemoveCreativeArtsAdmin($creativeArtsId: ID!, $adminId: ID!) {
    RemoveCreativeArtsAdminOnly(
      creativeArtsId: $creativeArtsId
      adminId: $adminId
    ) {
      id
      firstName
      lastName
    }
  }
`

export const ADD_MINISTRY_ADMIN = gql`
  mutation AddMinistryAdmin($ministryId: ID!, $adminId: ID!) {
    AddMinistryAdmin(ministryId: $ministryId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_MINISTRY_ADMIN = gql`
  mutation RemoveMinistryAdmin($ministryId: ID!, $adminId: ID!) {
    RemoveMinistryAdminOnly(ministryId: $ministryId, adminId: $adminId) {
      id
      firstName
      lastName
    }
  }
`

export const MAKE_CREATIVEARTS_ADMIN = gql`
  mutation MakeCreativeArtsAdmin(
    $creativeArtsId: ID!
    $newAdminId: ID!
    $oldAdminId: ID!
  ) {
    RemoveCreativeArtsAdmin(
      creativeArtsId: $creativeArtsId
      adminId: $oldAdminId
      newAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeCreativeArtsAdmin(
      creativeArtsId: $creativeArtsId
      adminId: $newAdminId
      oldAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      isAdminForCreativeArts {
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
