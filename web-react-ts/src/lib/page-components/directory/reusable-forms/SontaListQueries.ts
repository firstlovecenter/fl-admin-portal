import { gql } from '@apollo/client'

export const GET_MINISTRY_HUBCOUNCILS = gql`
  query getMinistryHubCouncilsList($ministryId: ID!) {
    ministries(where: { id: $ministryId }) {
      id
      name
      hubCouncils {
        id
        name
      }
    }
  }
`

export const GET_HUBCOUNCIL_GOVERNORSHIPS = gql`
  query getHubCouncilGovernorships($hubCouncilId: ID!) {
    hubCouncils(where: { id: $hubCouncilId }) {
      id
      name
      governorships {
        id
        name
      }
    }
  }
`

export const GET_MINISTRY_COUNCILS = gql`
  query getMinistryCouncils($ministryId: ID!) {
    ministries(where: { id: $ministryId }) {
      id
      name
      councils {
        id
        name
      }
    }
  }
`

export const GET_CREATIVEARTS_STREAMS = gql`
  query getCreativeArtsStreams($creativeArtsId: ID!) {
    creativeArts(where: { id: $creativeArtsId }) {
      id
      name
      streams {
        id
        name
      }
    }
  }
`
