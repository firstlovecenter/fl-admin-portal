import { gql } from '@apollo/client'

export const UPDATE_MEMBER_MUTATION = gql`
  mutation UpdateMemberDetails(
    $id: ID!
    $firstName: String!
    $middleName: String
    $lastName: String!
    $email: String
    $phoneNumber: String!
    $whatsappNumber: String
    $dob: String
    $maritalStatus: String!
    $gender: String!
    $occupation: String
    $bacenta: String!
    $pictureUrl: String!
  ) {
    UpdateMemberDetails(
      id: $id
      firstName: $firstName
      middleName: $middleName
      lastName: $lastName
      email: $email
      phoneNumber: $phoneNumber
      whatsappNumber: $whatsappNumber
      dob: $dob
      maritalStatus: $maritalStatus
      gender: $gender
      occupation: $occupation
      bacenta: $bacenta
      pictureUrl: $pictureUrl
    ) {
      firstName
      middleName
      lastName
      fullName
      email
      phoneNumber
      pictureUrl
      whatsappNumber
      dob {
        date
      }
      gender {
        gender
      }
      maritalStatus {
        status
      }
      occupation {
        occupation
      }

      occupation {
        occupation
      }
    }
  }
`

export const UPDATE_MEMBER_STICKY_NOTE = gql`
  mutation UpdateMemberStickyNote(
    $id: ID!
    $stickyNote: String
    $ids: [ID]
    $historyRecord: String!
  ) {
    updateMembers(where: { id: $id }, update: { stickyNote: $stickyNote }) {
      members {
        id
        stickyNote
      }
    }
    LogMemberHistory(ids: $ids, historyRecord: $historyRecord) {
      id
      firstName
      lastName
      history(limit: 3) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const UPDATE_MEMBER_BASONTA = gql`
  mutation UpdateMemberBasonta($memberId: ID!, $basontaId: ID!) {
    UpdateMemberBasonta(memberId: $memberId, basontaId: $basontaId) {
      id
      firstName
      lastName
      basonta {
        id
        name
      }
    }
  }
`

export const LOG_MEMBER_HISTORY = gql`
  mutation LogMemberHistory($ids: [ID], $historyRecord: String!) {
    LogMemberHistory(ids: $ids, historyRecord: $historyRecord) {
      id
      firstName
      lastName
      history(limit: 3) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const UPDATE_MEMBER_BACENTA = gql`
  mutation UpdateMemberBacenta(
    $memberId: ID!
    $bacentaId: ID!
    $ids: [ID]
    $historyRecord: String!
  ) {
    UpdateMemberBacenta(memberId: $memberId, bacentaId: $bacentaId) {
      id
      firstName
      lastName
      bacenta {
        id
        name
      }
    }
    LogMemberHistory(ids: $ids, historyRecord: $historyRecord) {
      id
      firstName
      lastName
      history(limit: 3) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          firstName
          lastName
          stream_name
        }
        historyRecord
      }
    }
  }
`
export const UPDATE_STREAM_MUTATION = gql`
  mutation UpdateStream(
    $streamId: ID!
    $name: String!
    $bankAccount: String!
    $meetingDay: String!
  ) {
    UpdateStreamDetails(
      streamId: $streamId
      name: $name
      bankAccount: $bankAccount
      meetingDay: $meetingDay
    ) {
      id
      name
      vacationStatus
      bankAccount
      meetingDay {
        day
        dayNumber
      }

      admin {
        id
        firstName
        lastName
        bacenta {
          id
          stream_name
        }
      }
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

export const UPDATE_OVERSIGHT_MUTATION = gql`
  mutation UpdateOversight($oversightId: ID!, $name: String!) {
    UpdateOversightDetails(oversightId: $oversightId, name: $name) {
      id
      name
      campuses {
        id
        name
        oversight {
          id
          name
          denomination {
            id
            oversights {
              id
            }
          }
        }
      }

      admin {
        id
        firstName
        lastName
        bacenta {
          id
          stream_name
        }
      }
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

export const UPDATE_DENOMINATION_MUTATION = gql`
  mutation UpdateDenomination($denominationId: ID!, $name: String!) {
    UpdateDenominationDetails(denominationId: $denominationId, name: $name) {
      id
      name
      oversights {
        id
        name
        denomination {
          id
          name
        }
      }

      admin {
        id
        firstName
        lastName
        bacenta {
          id
          stream_name
        }
      }
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

export const UPDATE_CAMPUS_MUTATION = gql`
  mutation UpdateCampus(
    $campusId: ID!
    $name: String!
    $noIncomeTracking: Boolean!
    $currency: String!
    $conversionRateToDollar: Float!
  ) {
    UpdateCampusDetails(
      campusId: $campusId
      name: $name
      noIncomeTracking: $noIncomeTracking
      currency: $currency
      conversionRateToDollar: $conversionRateToDollar
    ) {
      id
      name
      noIncomeTracking
      currency
      conversionRateToDollar
      streams {
        id
        name
        campus {
          id
          name
          oversight {
            id
            campuses {
              id
            }
          }
        }
      }

      admin {
        id
        firstName
        lastName
        bacenta {
          id
          stream_name
        }
      }
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

export const UPDATE_COUNCIL_MUTATION = gql`
  mutation UpdateCouncil($councilId: ID!, $name: String!) {
    UpdateCouncilDetails(councilId: $councilId, name: $name) {
      id
      name
      governorships {
        id
        name
        council {
          id
          name
          stream {
            id
            councils {
              id
            }
          }
        }
      }

      admin {
        id
        firstName
        lastName
        bacenta {
          id
          stream_name
        }
      }
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

export const UPDATE_GOVERNORSHIP_MUTATION = gql`
  mutation UpdateGovernorship($governorshipId: ID!, $name: String!) {
    UpdateGovernorshipDetails(governorshipId: $governorshipId, name: $name) {
      id
      name
      bacentas {
        id
        name
        governorship {
          id
          name
          council {
            id
            governorships {
              id
            }
          }
        }
      }

      admin {
        id
        firstName
        lastName
        bacenta {
          id
          stream_name
        }
      }
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

export const UPDATE_BACENTA_MUTATION = gql`
  mutation UpdateBacenta(
    $id: ID!
    $name: String!
    $meetingDay: String!
    $venueLongitude: Float!
    $venueLatitude: Float!
  ) {
    UpdateBacentaDetails(
      id: $id
      name: $name
      meetingDay: $meetingDay
      venueLongitude: $venueLongitude
      venueLatitude: $venueLatitude
    ) {
      id
      name
      sprinterTopUp
      urvanTopUp

      governorship {
        id
        name
        bacentas {
          id
          name
        }
      }

      leader {
        id
        firstName
        lastName
        whatsappNumber
        title {
          name
        }
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

export const UPDATE_FELLOWSHIP = gql`
  mutation UpdateFellowship(
    $id: ID!
    $name: String!
    $meetingDay: String
    $venueLatitude: Float
    $venueLongitude: Float
  ) {
    UpdateFellowshipDetails(
      id: $id
      name: $name
      meetingDay: $meetingDay
      venueLatitude: $venueLatitude
      venueLongitude: $venueLongitude
    ) {
      id
      labels
      stream_name
      bankingCode
      name
      memberCount
      location {
        longitude
        latitude
      }
      meetingDay {
        day
        dayNumber
      }

      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
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

export const MAKE_MEMBER_INACTIVE = gql`
  mutation MakeMemberInactive($memberId: ID!, $reason: String!) {
    MakeMemberInactive(id: $memberId, reason: $reason) {
      id
      firstName
      lastName
    }
  }
`

export const MOVE_OVERSIGHT_TO_DENOMINATION = gql`
  mutation MoveOversightToDenomination(
    $oversightId: ID!
    $newDenominationId: ID!
    $oldDenominationId: ID!
    $historyRecord: String!
  ) {
    MoveOversightToDenomination(
      oversightId: $oversightId
      denominationId: $newDenominationId
    ) {
      id
      name
      denomination {
        id
        name
        oversights {
          id
          name
        }
      }
    }
    LogOversightHistory(
      oversightId: $oversightId
      historyRecord: $historyRecord
      oldDenominationId: $oldDenominationId
      newDenominationId: $newDenominationId
    ) {
      id
      name
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
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const MOVE_CAMPUS_TO_OVERSIGHT = gql`
  mutation MoveCampusToOversight(
    $campusId: ID!
    $newOversightId: ID!
    $oldOversightId: ID!
    $historyRecord: String!
  ) {
    MoveCampusToOversight(campusId: $campusId, oversightId: $newOversightId) {
      id
      name
      oversight {
        id
        name
        campuses {
          id
          name
        }
      }
    }
    LogCampusHistory(
      campusId: $campusId
      historyRecord: $historyRecord
      oldOversightId: $oldOversightId
      newOversightId: $newOversightId
    ) {
      id
      name
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
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const MOVE_STREAM_TO_CAMPUS = gql`
  mutation MoveStreamToCampus(
    $streamId: ID!
    $newCampusId: ID!
    $oldCampusId: ID!
    $historyRecord: String!
  ) {
    MoveStreamToCampus(streamId: $streamId, campusId: $newCampusId) {
      id
      name
      campus {
        id
        name
        streams {
          id
          name
        }
      }
    }
    LogStreamHistory(
      streamId: $streamId
      historyRecord: $historyRecord
      oldCampusId: $oldCampusId
      newCampusId: $newCampusId
    ) {
      id
      name
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
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const MOVE_COUNCIL_TO_STREAM = gql`
  mutation MoveCouncilToStream(
    $councilId: ID!
    $newStreamId: ID!
    $oldStreamId: ID!
    $historyRecord: String!
  ) {
    MoveCouncilToStream(councilId: $councilId, streamId: $newStreamId) {
      id
      name
      stream {
        id
        name
        councils {
          id
          name
        }
      }
    }
    LogCouncilHistory(
      councilId: $councilId
      historyRecord: $historyRecord
      oldStreamId: $oldStreamId
      newStreamId: $newStreamId
    ) {
      id
      name
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
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const MOVE_GOVERNORSHIP_TO_COUNCIL = gql`
  mutation MoveGovernorshipToCouncil(
    $governorshipId: ID!
    $newCouncilId: ID!
    $oldCouncilId: ID!
    $historyRecord: String!
  ) {
    MoveGovernorshipToCouncil(
      governorshipId: $governorshipId
      councilId: $newCouncilId
    ) {
      id
      name
      council {
        id
        name
        governorships {
          id
          name
        }
      }
    }
    LogGovernorshipHistory(
      governorshipId: $governorshipId
      historyRecord: $historyRecord
      oldCouncilId: $oldCouncilId
      newCouncilId: $newCouncilId
    ) {
      id
      name
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
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const MOVE_BACENTA_TO_GOVERNORSHIP = gql`
  mutation MoveBacentaToGovernorship(
    $bacentaId: ID!
    $newGovernorshipId: ID!
    $oldGovernorshipId: ID!
    $historyRecord: String!
  ) {
    MoveBacentaToGovernorship(
      bacentaId: $bacentaId
      governorshipId: $newGovernorshipId
    ) {
      id
      name
      governorship {
        id
        name
        bacentas {
          id
          name
        }
      }
    }
    LogBacentaHistory(
      bacentaId: $bacentaId
      historyRecord: $historyRecord
      oldGovernorshipId: $oldGovernorshipId
      newGovernorshipId: $newGovernorshipId
    ) {
      id
      name
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
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const MOVE_CREATIVEARTS_TO_CAMPUS = gql`
  mutation MoveCreativeArtsToCampus(
    $creativeArtsId: ID!
    $newCampusId: ID!
    $oldCampusId: ID!
    $historyRecord: String!
  ) {
    MoveCreativeArtsToCampus(
      creativeArtsId: $creativeArtsId
      campusId: $newCampusId
    ) {
      id
      name
      campus {
        id
        name
        creativeArts {
          id
          name
        }
      }
    }
    LogCreativeArtsHistory(
      creativeArtsId: $creativeArtsId
      historyRecord: $historyRecord
      oldCampusId: $oldCampusId
      newCampusId: $newCampusId
    ) {
      id
      name
      campus {
        id
        name
        creativeArts {
          id
          name
        }
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          stream_name
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const MOVE_MINISTRY_TO_CREATIVEARTS = gql`
  mutation MoveMinistryToCreativeArts(
    $ministryId: ID!
    $newCreativeArtsId: ID!
    $oldCreativeArtsId: ID!
    $historyRecord: String!
  ) {
    MoveMinistryToCreativeArts(
      ministryId: $ministryId
      creativeArtsId: $newCreativeArtsId
    ) {
      id
      name
      hubCouncils {
        id
        name
        hubs {
          id
          name
        }
      }
    }
    LogMinistryHistory(
      ministryId: $ministryId
      historyRecord: $historyRecord
      oldCreativeArtsId: $oldCreativeArtsId
      newCreativeArtsId: $newCreativeArtsId
    ) {
      id
      name
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
          stream_name
        }
        historyRecord
      }
    }
  }
`

export const MOVE_MINISTRY_TO_STREAM = gql`
  mutation MoveMinistryToStream(
    $ministryId: ID!
    $newStreamId: ID!
    $oldStreamId: ID!
    $historyRecord: String!
  ) {
    MoveMinistryToStream(ministryId: $ministryId, streamId: $newStreamId) {
      id
      name
      stream {
        id
        name
        ministries {
          id
          name
        }
      }
    }
    LogMinistryHistoryWithStream(
      ministryId: $ministryId
      historyRecord: $historyRecord
      oldStreamId: $oldStreamId
      newStreamId: $newStreamId
    ) {
      id
      name
      stream {
        id
        name
        ministries {
          id
          name
        }
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          stream_name
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const MOVE_HUBCOUNCIL_TO_MINISTRY = gql`
  mutation MoveHubCouncilToMinistry(
    $hubCouncilId: ID!
    $newMinistryId: ID!
    $oldMinistryId: ID!
    $historyRecord: String!
  ) {
    MoveHubCouncilToMinistry(
      hubCouncilId: $hubCouncilId
      ministryId: $newMinistryId
    ) {
      id
      name
      ministry {
        id
        name
        hubCouncils {
          id
          name
        }
      }
    }
    LogHubCouncilHistory(
      hubCouncilId: $hubCouncilId
      historyRecord: $historyRecord
      oldMinistryId: $oldMinistryId
      newMinistryId: $newMinistryId
    ) {
      id
      name
      ministry {
        id
        name
        hubCouncils {
          id
          name
        }
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          stream_name
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const MOVE_HUBCOUNCIL_TO_COUNCIL = gql`
  mutation MoveHubCouncilToCouncil(
    $hubCouncilId: ID!
    $newCouncilId: ID!
    $oldCouncilId: ID!
    $historyRecord: String!
  ) {
    MoveHubCouncilToCouncil(
      hubCouncilId: $hubCouncilId
      councilId: $newCouncilId
    ) {
      id
      name
      council {
        id
        name
        hubCouncils {
          id
          name
        }
      }
    }
    LogHubCouncilHistoryWithCouncil(
      hubCouncilId: $hubCouncilId
      historyRecord: $historyRecord
      oldCouncilId: $oldCouncilId
      newCouncilId: $newCouncilId
    ) {
      id
      name
      council {
        id
        name
        hubCouncils {
          id
          name
        }
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          stream_name
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const MOVE_HUB_TO_HUBCOUNCIL = gql`
  mutation MoveHubsToHubCouncils(
    $hubId: ID!
    $newHubCouncilId: ID!
    $oldHubCouncilId: ID!
    $historyRecord: String!
  ) {
    MoveHubToHubCouncil(hubId: $hubId, hubCouncilId: $newHubCouncilId) {
      id
      name
      hubCouncil {
        id
        name
        hubs {
          id
          name
        }
      }
    }
    LogHubHistory(
      hubId: $hubId
      historyRecord: $historyRecord
      oldHubCouncilId: $oldHubCouncilId
      newHubCouncilId: $newHubCouncilId
    ) {
      id
      name
      hubCouncil {
        id
        name
        hubs {
          id
          name
        }
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          stream_name
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`

export const MOVE_HUB_TO_GOVERNORSHIP = gql`
  mutation MoveHubToGovernorship(
    $hubId: ID!
    $newGovernorshipId: ID!
    $oldGovernorshipId: ID!
    $historyRecord: String!
  ) {
    MoveHubToGovernorship(hubId: $hubId, governorshipId: $newGovernorshipId) {
      id
      name
      governorship {
        id
        name
        hubs {
          id
          name
        }
      }
    }
    LogHubHistoryWithGovernorship(
      hubId: $hubId
      historyRecord: $historyRecord
      oldGovernorshipId: $oldGovernorshipId
      newGovernorshipId: $newGovernorshipId
    ) {
      id
      name
      governorship {
        id
        name
        hubs {
          id
          name
        }
      }
      history(limit: 5) {
        id
        timeStamp
        createdAt {
          date
        }
        loggedBy {
          id
          stream_name
          firstName
          lastName
        }
        historyRecord
      }
    }
  }
`
