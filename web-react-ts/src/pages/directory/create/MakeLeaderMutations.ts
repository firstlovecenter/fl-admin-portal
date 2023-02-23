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

export const NEW_CONSTITUENCY_LEADER = gql`
  mutation NewConstituencyLeader($constituencyId: ID!, $leaderId: ID!) {
    MakeConstituencyLeader(
      constituencyId: $constituencyId
      leaderId: $leaderId
    ) {
      id
      firstName
      lastName
      leadsConstituency {
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

export const NEW_GATHERING_SERVICE_LEADER = gql`
  mutation NewGatheringServiceLeader($gatheringServiceId: ID!, $leaderId: ID!) {
    MakeGatheringServiceLeader(
      gatheringServiceId: $gatheringServiceId
      leaderId: $leaderId
    ) {
      id
      firstName
      lastName
      leadsGatheringService {
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

export const NEW_FEDERAL_MINISTRY_LEADER = gql`
  mutation NewFederalministryLeader($federalMinistryId: ID!, $leaderId: ID!) {
    MakeFederalministryLeader(
      federalMinistryId: $federalMinistryId
      leaderId: $leaderId
    ) {
      id
      firstName
      lastName
      leadsFederalministry {
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

export const NEW_SONTA_LEADER = gql`
  mutation NewSontaLeader($sontaId: ID!, $leaderId: ID!) {
    MakeSontaLeader(sontaId: $sontaId, leaderId: $leaderId) {
      id
      firstName
      lastName
      leadsSonta {
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
