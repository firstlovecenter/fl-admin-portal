import { gql } from '@apollo/client'

const MEMBER_FIELDS = `
  id
  firstName
  lastName
  pictureUrl
  stream_name
  bacenta {
    id
    name
  }
  maritalStatus {
    status
  }
  gender {
    gender
  }
  title {
    name
  }
  basonta {
    id
    name
  }
  leadsBacenta {
    id
    name
  }
  leadsGovernorship {
    id
    name
  }
  isAdminForCouncil {
    id
    name
  }
  isAdminForGovernorship {
    id
    name
  }
`

export const GET_FEDERAL_MEMBERS = gql`
  query getFederalMembers {
    members(sort: [{ firstName: ASC }]) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        id
        name
      }
      maritalStatus {
        status
      }
      gender {
        gender
      }
      title {
        name
      }
      leadsBacenta {
        id
        name
      }
      leadsGovernorship {
        id
        name
      }

      isAdminForCouncil {
        id
        name
      }
      isAdminForGovernorship {
        id
        name
      }
    }
  }
`

export const GET_SERVANT_MEMBERS = gql`
  query getServantMembers(
    $id: ID!
    $offset: Int!
    $limit: Int!
    $search: String
    $genders: [String!]
    $maritalStatuses: [String!]
    $leaderTitles: [String!]
    $basontas: [String!]
    $leaderRanks: [String!]
  ) {
    members(where: { id: { eq: $id } }) {
      id
      firstName
      lastName
      fullName
      memberCount

      members(
        limit: $limit
        offset: $offset
        search: $search
        genders: $genders
        maritalStatuses: $maritalStatuses
        leaderTitles: $leaderTitles
        basontas: $basontas
        leaderRanks: $leaderRanks
      ) {
        ${MEMBER_FIELDS}
      }
    }
  }
`

export const GET_CAMPUS_MEMBERS = gql`
  query getGatheringMembers(
    $id: ID!
    $offset: Int!
    $limit: Int!
    $search: String
    $genders: [String!]
    $maritalStatuses: [String!]
    $leaderTitles: [String!]
    $basontas: [String!]
    $leaderRanks: [String!]
  ) {
    campuses(where: { id: { eq: $id } }) {
      id
      name
      memberCount
      members(
        limit: $limit
        offset: $offset
        search: $search
        genders: $genders
        maritalStatuses: $maritalStatuses
        leaderTitles: $leaderTitles
        basontas: $basontas
        leaderRanks: $leaderRanks
      ) {
        ${MEMBER_FIELDS}
      }
    }
  }
`

export const GET_STREAM_MEMBERS = gql`
  query getStreamMembers(
    $id: ID!
    $offset: Int!
    $limit: Int!
    $search: String
    $genders: [String!]
    $maritalStatuses: [String!]
    $leaderTitles: [String!]
    $basontas: [String!]
    $leaderRanks: [String!]
  ) {
    streams(where: { id: { eq: $id } }) {
      id
      name
      memberCount
      members(
        limit: $limit
        offset: $offset
        search: $search
        genders: $genders
        maritalStatuses: $maritalStatuses
        leaderTitles: $leaderTitles
        basontas: $basontas
        leaderRanks: $leaderRanks
      ) {
        ${MEMBER_FIELDS}
      }
    }
  }
`

export const GET_OVERSIGHT_MEMBERS = gql`
  query getOversightMembers(
    $id: ID!
    $offset: Int!
    $limit: Int!
    $search: String
    $genders: [String!]
    $maritalStatuses: [String!]
    $leaderTitles: [String!]
    $basontas: [String!]
    $leaderRanks: [String!]
  ) {
    oversights(where: { id: { eq: $id } }) {
      id
      name
      memberCount
      members(
        limit: $limit
        offset: $offset
        search: $search
        genders: $genders
        maritalStatuses: $maritalStatuses
        leaderTitles: $leaderTitles
        basontas: $basontas
        leaderRanks: $leaderRanks
      ) {
        ${MEMBER_FIELDS}
      }
    }
  }
`

export const GET_COUNCIL_MEMBERS = gql`
  query getCouncilMembers(
    $id: ID!
    $offset: Int!
    $limit: Int!
    $search: String
    $genders: [String!]
    $maritalStatuses: [String!]
    $leaderTitles: [String!]
    $basontas: [String!]
    $leaderRanks: [String!]
  ) {
    councils(where: { id: { eq: $id } }) {
      id
      name
      memberCount
      members(
        limit: $limit
        offset: $offset
        search: $search
        genders: $genders
        maritalStatuses: $maritalStatuses
        leaderTitles: $leaderTitles
        basontas: $basontas
        leaderRanks: $leaderRanks
      ) {
        ${MEMBER_FIELDS}
      }
    }
  }
`

export const GET_GOVERNORSHIP_MEMBERS = gql`
  query getGovernorshipMembers(
    $id: ID!
    $offset: Int!
    $limit: Int!
    $search: String
    $genders: [String!]
    $maritalStatuses: [String!]
    $leaderTitles: [String!]
    $basontas: [String!]
    $leaderRanks: [String!]
  ) {
    governorships(where: { id: { eq: $id } }) {
      id
      name
      memberCount
      members(
        limit: $limit
        offset: $offset
        search: $search
        genders: $genders
        maritalStatuses: $maritalStatuses
        leaderTitles: $leaderTitles
        basontas: $basontas
        leaderRanks: $leaderRanks
      ) {
        ${MEMBER_FIELDS}
      }
    }
  }
`

export const GET_BACENTA_MEMBERS = gql`
  query getBacentaMembers(
    $id: ID!
    $offset: Int!
    $limit: Int!
    $search: String
    $genders: [String!]
    $maritalStatuses: [String!]
    $leaderTitles: [String!]
    $basontas: [String!]
    $leaderRanks: [String!]
  ) {
    bacentas(where: { id: { eq: $id } }) {
      id
      name
      memberCount
      members(
        limit: $limit
        offset: $offset
        search: $search
        genders: $genders
        maritalStatuses: $maritalStatuses
        leaderTitles: $leaderTitles
        basontas: $basontas
        leaderRanks: $leaderRanks
      ) {
        ${MEMBER_FIELDS}
      }
    }
  }
`
