import { gql } from '@apollo/client'

export const GET_FEDERAL_MEMBERS = gql`
  query getFederalMembers {
    members(options: { sort: { firstName: ASC } }) {
      id
      firstName
      lastName
      pictureUrl
      bacenta {
        id
        name
      }
      basonta {
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
      leadsFellowship {
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

      leadsHubFellowship {
        id
        name
      }
      leadsHub {
        id
        name
      }
      basonta {
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
  query getServantMembers($id: ID!) {
    members(where: { id: $id }) {
      id
      firstName
      lastName
      fullName

      members {
        id
        firstName
        lastName
        pictureUrl
        stream_name
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_CAMPUS_MEMBERS = gql`
  query getGatheringMembers($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      members {
        id
        firstName
        lastName
        pictureUrl
        stream_name
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`
export const GET_STREAM_MEMBERS = gql`
  query getStreamMembers($id: ID!) {
    streams(where: { id: $id }) {
      id
      name

      members {
        id
        firstName
        lastName
        pictureUrl
        stream_name
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_OVERSIGHT_MEMBERS = gql`
  query getOversightMembers($id: ID!) {
    oversights(where: { id: $id }) {
      id
      name

      members {
        id
        firstName
        lastName
        pictureUrl
        stream_name
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_COUNCIL_MEMBERS = gql`
  query getCouncilMembers($id: ID!) {
    councils(where: { id: $id }) {
      id
      name

      members {
        id
        firstName
        lastName
        pictureUrl
        stream_name
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_GOVERNORSHIP_MEMBERS = gql`
  query getGovernorshipMembers($id: ID!) {
    governorships(where: { id: $id }) {
      id
      name
      members {
        id
        firstName
        lastName
        pictureUrl
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_BACENTA_MEMBERS = gql`
  query getBacentaMembers($id: ID!) {
    bacentas(where: { id: $id }) {
      id
      name
      members {
        id
        firstName
        lastName
        pictureUrl
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_FELLOWSHIP_MEMBERS = gql`
  query getFellowshipMembers($id: ID!) {
    fellowships(where: { id: $id }) {
      id
      name
      members {
        id
        firstName
        lastName
        pictureUrl
        stream_name
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_HUB_MEMBERS = gql`
  query getHubMembers($id: ID!) {
    hubs(where: { id: $id }) {
      id
      name
      members {
        id
        firstName
        lastName
        pictureUrl
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_HUBCOUNCIL_MEMBERS = gql`
  query getHubCouncilMembers($id: ID!) {
    hubCouncils(where: { id: $id }) {
      id
      name
      members {
        id
        firstName
        lastName
        pictureUrl
        stream_name
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_MINISTRY_MEMBERS = gql`
  query getMinistryMembers($id: ID!) {
    ministries(where: { id: $id }) {
      id
      name
      members {
        id
        firstName
        lastName
        pictureUrl
        stream_name
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`

export const GET_CREATIVEARTS_MEMBERS = gql`
  query getCreativeArtsMembers($id: ID!) {
    creativeArts(where: { id: $id }) {
      id
      name
      members {
        id
        firstName
        lastName
        pictureUrl
        stream_name
        bacenta {
          id
          name
        }
        basonta {
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
        bacenta {
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

        bacenta {
          id
          name
        }
        leadsHub {
          id
          name
        }
        leadsMinistry {
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

        isAdminForMinistry {
          id
          name
        }
        isAdminForCreativeArts {
          id
          name
        }
      }
    }
  }
`
