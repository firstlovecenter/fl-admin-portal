import { gql } from '@apollo/client'

export const NEW_FELLOWSHIP_LEADER = gql`
  mutation NewFellowshipLeader($fellowshipId: ID!, $leaderId: ID!) {
    MakeFellowshipLeader(fellowshipId: $fellowshipId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsFellowship {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_BACENTA_LEADER = gql`
  mutation NewBacentaLeader($bacentaId: ID!, $leaderId: ID!) {
    MakeBacentaLeader(bacentaId: $bacentaId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsBacenta {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_GOVERNORSHIP_LEADER = gql`
  mutation NewGovernorshipLeader($governorshipId: ID!, $leaderId: ID!) {
    MakeGovernorshipLeader(
      governorshipId: $governorshipId
      leaderId: $leaderId
    ) {
      id
      firstName
      lastName
      leadsGovernorship {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_COUNCIL_LEADER = gql`
  mutation NewCouncilLeader($councilId: ID!, $leaderId: ID!) {
    MakeCouncilLeader(councilId: $councilId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsCouncil {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_STREAM_LEADER = gql`
  mutation NewStreamLeader($streamId: ID!, $leaderId: ID!) {
    MakeStreamLeader(streamId: $streamId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsStream {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_CAMPUS_LEADER = gql`
  mutation NewCampusLeader($campusId: ID!, $leaderId: ID!) {
    MakeCampusLeader(campusId: $campusId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsCampus {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_OVERSIGHT_LEADER = gql`
  mutation NewOversightLeader($oversightId: ID!, $leaderId: ID!) {
    MakeOversightLeader(oversightId: $oversightId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsOversight {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_CREATIVEARTS_LEADER = gql`
  mutation NewCreativeArtsLeader($creativeArtsId: ID!, $leaderId: ID!) {
    MakeCreativeArtsLeader(
      creativeArtsId: $creativeArtsId
      leaderId: $leaderId
    ) {
      id
      firstName
      lastName
      leadsCreativeArts {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_MINISTRY_LEADER = gql`
  mutation NewMinistryLeader($ministryId: ID!, $leaderId: ID!) {
    MakeMinistryLeader(ministryId: $ministryId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsMinistry {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_HUBCOUNCIL_LEADER = gql`
  mutation NewHubCouncilLeader($hubCouncilId: ID!, $leaderId: ID!) {
    MakeHubCouncilLeader(hubCouncilId: $hubCouncilId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsHubCouncil {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const NEW_HUB_LEADER = gql`
  mutation NewHubLeader($hubId: ID!, $leaderId: ID!) {
    MakeHubLeader(hubId: $hubId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsHub {
        id
        leader {
          id
          firstName
          lastName
        }
      }
    }
  }
`
