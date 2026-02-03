import { gql } from '@apollo/client'

export const LOG_FELLOWSHIP_HISTORY = gql`
  mutation LogFellowshipHistory(
    $fellowshipId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldBacentaId: ID
    $newBacentaId: ID
  ) {
    LogFellowshipHistory(
      fellowshipId: $fellowshipId
      historyRecord: $historyRecord
      oldLeaderId: $oldLeaderId
      newLeaderId: $newLeaderId
      oldBacentaId: $oldBacentaId
      newBacentaId: $newBacentaId
    ) {
      id
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_BACENTA_HISTORY = gql`
  mutation LogBacentaHistory(
    $bacentaId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldGovernorshipId: ID
    $newGovernorshipId: ID
  ) {
    LogBacentaHistory(
      bacentaId: $bacentaId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldGovernorshipId: $oldGovernorshipId
      newGovernorshipId: $newGovernorshipId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_GOVERNORSHIP_HISTORY = gql`
  mutation LogGovernorshipHistory(
    $governorshipId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldCouncilId: ID
    $newCouncilId: ID
  ) {
    LogGovernorshipHistory(
      governorshipId: $governorshipId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldCouncilId: $oldCouncilId
      newCouncilId: $newCouncilId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_COUNCIL_HISTORY = gql`
  mutation LogCouncilHistory(
    $councilId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldStreamId: ID
    $newStreamId: ID
  ) {
    LogCouncilHistory(
      councilId: $councilId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldStreamId: $oldStreamId
      newStreamId: $newStreamId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_STREAM_HISTORY = gql`
  mutation LogStreamHistory(
    $streamId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldCampusId: ID
    $newCampusId: ID
  ) {
    LogStreamHistory(
      streamId: $streamId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldCampusId: $oldCampusId
      newCampusId: $newCampusId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_CAMPUS_HISTORY = gql`
  mutation LogCampusHistory(
    $campusId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldOversightId: ID
    $newOversightId: ID
  ) {
    LogCampusHistory(
      campusId: $campusId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldOversightId: $oldOversightId
      newOversightId: $newOversightId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_OVERSIGHT_HISTORY = gql`
  mutation LogOversightHistory(
    $oversightId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldDenominationId: ID
    $newDenominationId: ID
  ) {
    LogOversightHistory(
      oversightId: $oversightId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldDenominationId: $oldDenominationId
      newDenominationId: $newDenominationId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_DENOMINATION_HISTORY = gql`
  mutation LogDenominationHistory(
    $denominationId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
  ) {
    LogDenominationHistory(
      denominationId: $denominationId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_CREATIVEARTS_HISTORY = gql`
  mutation LogCreativeArtsHistory(
    $creativeArtsId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldCampusId: ID
    $newCampusId: ID
  ) {
    LogCreativeArtsHistory(
      creativeArtsId: $creativeArtsId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldCampusId: $oldCampusId
      newCampusId: $newCampusId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_MINISTRY_HISTORY = gql`
  mutation LogMinistryHistory(
    $ministryId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldCreativeArtsId: ID
    $newCreativeArtsId: ID
  ) {
    LogMinistryHistory(
      ministryId: $ministryId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldCreativeArtsId: $oldCreativeArtsId
      newCreativeArtsId: $newCreativeArtsId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_HUBCOUNCIL_HISTORY = gql`
  mutation LogHubCouncilHistory(
    $hubCouncilId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldMinistryId: ID
    $newMinistryId: ID
  ) {
    LogHubCouncilHistory(
      hubCouncilId: $hubCouncilId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldMinistryId: $oldMinistryId
      newMinistryId: $newMinistryId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const LOG_HUB_HISTORY = gql`
  mutation LogHubHistory(
    $hubId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldHubCouncilId: ID
    $newHubCouncilId: ID
  ) {
    LogHubHistory(
      hubId: $hubId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldHubCouncilId: $oldHubCouncilId
      newHubCouncilId: $newHubCouncilId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      hubCouncil {
        id
        name
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const LOG_HUBFELLOWSHIP_HISTORY = gql`
  mutation LogHubFellowshipHistory(
    $hubFellowshipId: ID!
    $historyRecord: String!
    $oldLeaderId: ID
    $newLeaderId: ID
    $oldHubId: ID
    $newHubId: ID
  ) {
    LogHubFellowshipHistory(
      hubFellowshipId: $hubFellowshipId
      historyRecord: $historyRecord
      newLeaderId: $newLeaderId
      oldLeaderId: $oldLeaderId
      oldHubId: $oldHubId
      newHubId: $newHubId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      hub {
        id
        name
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
        }
      }
    }
  }
`
