import { gql } from '@apollo/client'

// Lightweight queries for the `/download-reports/<level>/membership` page.
// They fetch only what's needed to render the page chrome:
//   - church name + memberCount → sidebar stats and filename
//   - members(limit: 5)          → 5-row preview table
// The full CSV is generated server-side and downloaded over a separate
// HTTP endpoint (`/downloads/membership/:level/:churchId.csv`), so we
// never ship the full member list through Apollo.

const PREVIEW_FIELDS = `
  members(limit: 5) {
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
    basonta {
      id
      name
    }
  }
`

export const BACENTA_MEMBERSHIP_DOWNLOAD = gql`
  query BacentaMembershipDownload($id: ID!) {
    bacentas(where: { id: $id }) {
      id
      name
      memberCount
      ${PREVIEW_FIELDS}
    }
  }
`

export const GOVERNORSHIP_MEMBERSHIP_DOWNLOAD = gql`
  query GovernorshipMembershipDownload($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name
      memberCount
      ${PREVIEW_FIELDS}
    }
  }
`

export const COUNCIL_MEMBERSHIP_DOWNLOAD = gql`
  query CouncilMembershipDownload($id: ID!) {
    councils(where: { id: $id }) {
      id
      name
      memberCount
      ${PREVIEW_FIELDS}
    }
  }
`

export const STREAM_MEMBERSHIP_DOWNLOAD = gql`
  query StreamMembershipDownload($id: ID!) {
    streams(where: { id: $id }) {
      id
      name
      memberCount
      ${PREVIEW_FIELDS}
    }
  }
`

export const CAMPUS_MEMBERSHIP_DOWNLOAD = gql`
  query CampusMembershipDownload($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name
      memberCount
      ${PREVIEW_FIELDS}
    }
  }
`

export const OVERSIGHT_MEMBERSHIP_DOWNLOAD = gql`
  query OversightMembershipDownload($id: ID!) {
    oversights(where: { id: $id }) {
      id
      name
      memberCount
      ${PREVIEW_FIELDS}
    }
  }
`
