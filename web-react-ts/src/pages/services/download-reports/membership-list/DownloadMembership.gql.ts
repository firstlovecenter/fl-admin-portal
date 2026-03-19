import { gql } from '@apollo/client'

const MEMBERSHIP_FIELDS = `
  downloadMembership {
    id
    firstName
    lastName
    phoneNumber
    whatsappNumber
    email
    visitationArea
    maritalStatus {
      status
    }
    gender {
      gender
    }
    dob {
      date
    }
    basonta {
      id
      name
    }
    bacenta {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
      governorship {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
        }
      }
    }
  }
`

export const DISPLAY_FELLOWSHIP_MEMBERSHIP = gql`
  query DisplayFellowshipMembership($id: ID!) {
    fellowships(where: { id: $id }) {
      id
      name
      ${MEMBERSHIP_FIELDS}
    }
  }
`

export const DISPLAY_BACENTA_MEMBERSHIP = gql`
  query DisplayBacentaMembership($id: ID!) {
    bacentas(where: { id: $id }) {
      id
      name
      ${MEMBERSHIP_FIELDS}
    }
  }
`

export const DISPLAY_GOVERNORSHIP_MEMBERSHIP = gql`
  query DisplayGovernorshipMembership($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name
      ${MEMBERSHIP_FIELDS}
    }
  }
`

export const DISPLAY_COUNCIL_MEMBERSHIP = gql`
  query DisplayCouncilMembership($id: ID!) {
    councils(where: { id: $id }) {
      id
      name
      ${MEMBERSHIP_FIELDS}
    }
  }
`

export const DISPLAY_STREAM_MEMBERSHIP = gql`
  query DisplayStreamMembership($id: ID!) {
    streams(where: { id: $id }) {
      id
      name
      ${MEMBERSHIP_FIELDS}
    }
  }
`

export const DISPLAY_CAMPUS_MEMBERSHIP = gql`
  query DisplayCampusMembership($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      ${MEMBERSHIP_FIELDS}
    }
  }
`

export const DISPLAY_OVERSIGHT_MEMBERSHIP = gql`
  query DisplayOversightMembership($id: ID!) {
    oversights(where: { id: $id }) {
      id
      name
      ${MEMBERSHIP_FIELDS}
    }
  }
`
