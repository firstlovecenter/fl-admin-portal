import { gql } from '@apollo/client'

export const CREATE_CHECKIN_EVENT = gql`
  mutation CreateCheckInEvent($input: CreateCheckInEventInput!) {
    CreateCheckInEvent(input: $input) {
      id
      name
      type
      description
      location
      scopeLevel
      scopeId
      startsAt
      endsAt
      gracePeriod
      attendanceType
      status
      pinCode
      qrToken
      createdAt
      createdById
      createdByName
      createdByRole
      totalExpected
      allowedCheckInRoles
      allowedCheckInMethods
      geoFenceType
      geoCenter {
        latitude
        longitude
      }
      geoRadius
      geoPolygon {
        latitude
        longitude
      }
      autoCheckoutMinutes
    }
  }
`

export const LIST_CHECKIN_EVENTS = gql`
  query ListCheckInEvents(
    $scopeLevel: CheckInScopeLevel
    $scopeId: ID
    $status: CheckInStatus
  ) {
    ListCheckInEvents(
      scopeLevel: $scopeLevel
      scopeId: $scopeId
      status: $status
    ) {
      id
      name
      type
      scopeLevel
      scopeId
      startsAt
      endsAt
      status
      attendanceType
      gracePeriod
      allowedCheckInRoles
      allowedCheckInMethods
      geoFenceType
      autoCheckoutMinutes
    }
  }
`

export const GET_CHECKIN_DASHBOARD = gql`
  query GetCheckInDashboard($eventId: ID!, $filterScopeId: ID) {
    GetCheckInDashboard(eventId: $eventId, filterScopeId: $filterScopeId) {
      event {
        id
        name
        type
        scopeLevel
        scopeId
        startsAt
        endsAt
        gracePeriod
        attendanceType
        status
        pinCode
        qrToken
        allowedCheckInRoles
        allowedCheckInMethods
        createdById
        createdByName
        createdByRole
        geoFenceType
        geoCenter {
          latitude
          longitude
        }
        geoRadius
        geoPolygon {
          latitude
          longitude
        }
        autoCheckoutMinutes
      }
      checkedIn {
        memberId
        firstName
        lastName
        fullName
        roleLabel
        unitName
        unitType
        checkedInAt
        checkInMethod
        isLate
        geoVerified
        faceMatchStatus
        selfieUrl
        checkedOutAt
        autoCheckedOut
      }
      defaulted {
        memberId
        firstName
        lastName
        fullName
        roleLabel
        unitName
        unitType
        isLate
      }
      checkedOut {
        memberId
        firstName
        lastName
        fullName
        roleLabel
        unitName
        unitType
        checkedInAt
        checkedOutAt
        autoCheckedOut
      }
      stats {
        totalExpected
        checkedInCount
        defaultedCount
        checkedOutCount
        percentage
        flaggedCount
      }
      scopeFilters {
        id
        name
        level
      }
      appliedFilterId
      flaggedRecords {
        record {
          id
          eventId
          memberId
          memberName
          selfieUrl
          faceMatchScore
          faceMatchStatus
        }
        attendee {
          memberId
          fullName
          unitName
          selfieUrl
        }
        reason
      }
    }
  }
`

export const CHECKIN_MEMBER = gql`
  mutation CheckInMember(
    $eventId: ID!
    $method: CheckInMethod!
    $code: String
    $deviceFingerprint: String!
    $latitude: Float!
    $longitude: Float!
    $selfieBase64: String
    $faceMatchScore: Float
    $faceMatchStatus: FaceMatchStatus
  ) {
    CheckInMember(
      eventId: $eventId
      method: $method
      code: $code
      deviceFingerprint: $deviceFingerprint
      latitude: $latitude
      longitude: $longitude
      selfieBase64: $selfieBase64
      faceMatchScore: $faceMatchScore
      faceMatchStatus: $faceMatchStatus
    ) {
      id
      eventId
      memberId
      memberName
      memberRole
      memberUnit
      checkedInAt
      checkInMethod
      verifiedBy
      geoVerified
      distanceFromVenue
      selfieUrl
      faceMatchScore
      faceMatchStatus
      deviceFingerprint
      checkedOutAt
      autoCheckedOut
    }
  }
`

export const CHECKOUT_MEMBER = gql`
  mutation CheckOutMember(
    $eventId: ID!
    $latitude: Float!
    $longitude: Float!
    $deviceFingerprint: String!
  ) {
    CheckOutMember(
      eventId: $eventId
      latitude: $latitude
      longitude: $longitude
      deviceFingerprint: $deviceFingerprint
    ) {
      id
      eventId
      memberId
      memberName
      checkedInAt
      checkedOutAt
      autoCheckedOut
    }
  }
`
export const PAUSE_CHECKIN_EVENT = gql`
  mutation PauseCheckInEvent($eventId: ID!) {
    PauseCheckInEvent(eventId: $eventId) {
      id
      name
      status
      startsAt
      endsAt
    }
  }
`

export const RESUME_CHECKIN_EVENT = gql`
  mutation ResumeCheckInEvent($eventId: ID!) {
    ResumeCheckInEvent(eventId: $eventId) {
      id
      name
      status
      startsAt
      endsAt
    }
  }
`

export const UPDATE_CHECKIN_EVENT_DURATION = gql`
  mutation UpdateCheckInEventDuration($eventId: ID!, $endsAt: DateTime!) {
    UpdateCheckInEventDuration(eventId: $eventId, endsAt: $endsAt) {
      id
      name
      endsAt
      status
    }
  }
`

export const RESET_CHECKIN_EVENT_PIN = gql`
  mutation ResetCheckInEventPin($eventId: ID!) {
    ResetCheckInEventPin(eventId: $eventId) {
      id
      pinCode
      status
    }
  }
`

export const MANUAL_CHECKIN = gql`
  mutation ManualCheckIn(
    $eventId: ID!
    $memberId: ID!
    $latitude: Float!
    $longitude: Float!
    $reason: String
  ) {
    ManualCheckIn(
      eventId: $eventId
      memberId: $memberId
      latitude: $latitude
      longitude: $longitude
      reason: $reason
    ) {
      id
      eventId
      memberId
      memberName
      memberRole
      memberUnit
      checkedInAt
      checkInMethod
      verifiedBy
    }
  }
`

export const END_CHECKIN_EVENT = gql`
  mutation EndCheckInEvent($eventId: ID!) {
    EndCheckInEvent(eventId: $eventId) {
      id
      name
      status
      startsAt
      endsAt
    }
  }
`

export const GET_ADMIN_SCOPES = gql`
  query GetAdminScopes {
    GetAdminScopes {
      id
      name
      level
    }
  }
`

export const GET_FLAGGED_CHECKINS = gql`
  query GetFlaggedCheckIns($eventId: ID!) {
    GetFlaggedCheckIns(eventId: $eventId) {
      record {
        id
        eventId
        memberId
        memberName
        selfieUrl
        faceMatchScore
        faceMatchStatus
      }
      attendee {
        memberId
        fullName
        unitName
        selfieUrl
      }
      reason
    }
  }
`

export const REPORT_MEMBER_LOCATION = gql`
  mutation ReportMemberLocation(
    $eventId: ID!
    $latitude: Float!
    $longitude: Float!
  ) {
    ReportMemberLocation(
      eventId: $eventId
      latitude: $latitude
      longitude: $longitude
    ) {
      id
      eventId
      memberId
      checkedInAt
      checkedOutAt
      autoCheckedOut
    }
  }
`

export const GET_EVENTS_IN_RANGE = gql`
  query GetEventsInRange($latitude: Float!, $longitude: Float!) {
    GetEventsInRange(latitude: $latitude, longitude: $longitude) {
      id
      name
      type
      scopeLevel
      startsAt
      endsAt
      status
      qrToken
      allowedCheckInMethods
    }
  }
`

export const RESOLVE_FLAGGED_CHECKIN = gql`
  mutation ResolveFlaggedCheckIn($recordId: ID!, $resolution: String!) {
    ResolveFlaggedCheckIn(recordId: $recordId, resolution: $resolution) {
      id
      faceMatchStatus
      verifiedBy
    }
  }
`
