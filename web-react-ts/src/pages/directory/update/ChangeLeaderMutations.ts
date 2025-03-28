import { gql } from '@apollo/client'

export const MAKE_FELLOWSHIP_LEADER = gql`
  mutation MakeFellowshipLeader(
    $fellowshipId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveFellowshipLeader(
      fellowshipId: $fellowshipId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeFellowshipLeader(
      fellowshipId: $fellowshipId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
      id
      firstName
      lastName
      fullName
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

export const MAKE_BACENTA_LEADER = gql`
  mutation MakeBacentaLeader(
    $bacentaId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveBacentaLeader(
      bacentaId: $bacentaId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeBacentaLeader(
      bacentaId: $bacentaId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
      id
      firstName
      lastName
      leadsBacenta {
        id
        momoNumber
        leader {
          id
          firstName
          lastName
        }
        # history(limit: 5 ) {
        #   id
        #   timeStamp
        #   createdAt {
        #     date
        #   }
        #   loggedBy {
        #     id
        #     firstName
        #     lastName
        #   }
        #   historyRecord
        # }
      }
    }
  }
`

export const MAKE_GOVERNORSHIP_LEADER = gql`
  mutation MakeGovernorshipLeader(
    $governorshipId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveGovernorshipLeader(
      governorshipId: $governorshipId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeGovernorshipLeader(
      governorshipId: $governorshipId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
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
        # history(limit: 5 ) {
        #   id
        #   timeStamp
        #   createdAt {
        #     date
        #   }
        #   loggedBy {
        #     id
        #     firstName
        #     lastName
        #   }
        #   historyRecord
        # }
      }
    }
  }
`

export const MAKE_COUNCIL_LEADER = gql`
  mutation MakeCouncilLeader(
    $councilId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveCouncilLeader(
      councilId: $councilId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeCouncilLeader(
      councilId: $councilId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
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
        # history(limit: 5 ) {
        #   id
        #   timeStamp
        #   createdAt {
        #     date
        #   }
        #   loggedBy {
        #     id
        #     firstName
        #     lastName
        #   }
        #   historyRecord
        # }
      }
    }
  }
`

export const MAKE_STREAM_LEADER = gql`
  mutation MakeStreamLeader(
    $streamId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveStreamLeader(
      streamId: $streamId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeStreamLeader(
      streamId: $streamId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
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
        # history(limit: 5 ) {
        #   id
        #   timeStamp
        #   createdAt {
        #     date
        #   }
        #   loggedBy {
        #     id
        #     firstName
        #     lastName
        #   }
        #   historyRecord
        # }
      }
    }
  }
`

export const MAKE_CAMPUS_LEADER = gql`
  mutation MakeCampusLeader(
    $campusId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveCampusLeader(
      campusId: $campusId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeCampusLeader(
      campusId: $campusId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
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

export const MAKE_OVERSIGHT_LEADER = gql`
  mutation MakeOversightLeader(
    $oversightId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveOversightLeader(
      oversightId: $oversightId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeOversightLeader(
      oversightId: $oversightId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
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

export const MAKE_DENOMINATION_LEADER = gql`
  mutation MakeDenominationLeader(
    $denominationId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveDenominationLeader(
      denominationId: $denominationId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeDenominationLeader(
      denominationId: $denominationId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
      id
      firstName
      lastName
      leadsDenomination {
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

export const MAKE_CREATIVEARTS_LEADER = gql`
  mutation MakeCreativeArtsLeader(
    $creativeArtsId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveCreativeArtsLeader(
      creativeArtsId: $creativeArtsId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeCreativeArtsLeader(
      creativeArtsId: $creativeArtsId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
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

export const MAKE_MINISTRY_LEADER = gql`
  mutation MakeMinistryLeader(
    $ministryId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveMinistryLeader(
      ministryId: $ministryId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeMinistryLeader(
      ministryId: $ministryId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
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

export const MAKE_HUBCOUNCIL_LEADER = gql`
  mutation MakeHubCouncilLeader(
    $hubCouncilId: ID!
    $newLeaderId: ID!
    $oldLeaderId: ID!
  ) {
    RemoveHubCouncilLeader(
      hubCouncilId: $hubCouncilId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeHubCouncilLeader(
      hubCouncilId: $hubCouncilId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
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

export const MAKE_HUB_LEADER = gql`
  mutation MakeHubLeader($hubId: ID!, $newLeaderId: ID!, $oldLeaderId: ID!) {
    RemoveHubLeader(
      hubId: $hubId
      leaderId: $oldLeaderId
      newLeaderId: $newLeaderId
    ) {
      id
      firstName
      lastName
    }
    MakeHubLeader(
      hubId: $hubId
      leaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
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
