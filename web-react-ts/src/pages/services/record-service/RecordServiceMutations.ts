import { gql } from '@apollo/client'

export const RECORD_SERVICE = gql`
  mutation RecordService(
    $churchId: ID!
    $serviceDate: String!
    $attendance: Int!
    $income: Float!
    $foreignCurrency: String
    $numberOfTithers: Int!
    $treasurers: [ID]!
    $treasurerSelfie: String!
    $familyPicture: String!
  ) {
    RecordService(
      churchId: $churchId
      serviceDate: $serviceDate
      attendance: $attendance
      income: $income
      foreignCurrency: $foreignCurrency
      numberOfTithers: $numberOfTithers
      treasurers: $treasurers
      treasurerSelfie: $treasurerSelfie
      familyPicture: $familyPicture
    ) {
      id
      attendance
      income
      onlineGiving
    }
  }
`

export const RECORD_CANCELLED_SERVICE = gql`
  mutation RecordCancelledService(
    $churchId: ID!
    $serviceDate: String!
    $noServiceReason: String!
  ) {
    RecordCancelledService(
      churchId: $churchId
      serviceDate: $serviceDate
      noServiceReason: $noServiceReason
    ) {
      id
      serviceLog {
        id
        fellowship {
          id
          services(limit: 3) {
            id
          }
        }
      }
    }
  }
`

export const UNDO_CANCELLED_SERVICE = gql`
  mutation UndoCancelledService($serviceRecordId: ID!) {
    UndoCancelledService(serviceRecordId: $serviceRecordId) {
      id
      services(limit: 3) {
        id
        noServiceReason
        bankingProof
      }
    }
  }
`

export const MANUALLY_CONFIRM_OFFERING_PAYMENT = gql`
  mutation ManuallyConfirmOfferingPayment($serviceRecordId: ID!) {
    ManuallyConfirmOfferingPayment(serviceRecordId: $serviceRecordId) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      serviceDate {
        date
      }
      noServiceReason
      attendance
      income
      numberOfTithers
      foreignCurrency
      treasurerSelfie
      familyPicture
      bankingProof
      bankingSlip
      bankingSlipUploader {
        id
        firstName
        lastName
        fullName
      }
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }
      transactionId
      treasurers {
        id
        firstName
        lastName
        fullName
      }
      bankingConfirmer {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`

export const RECORD_SERVICE_NO_INCOME = gql`
  mutation RecordServiceNoIncome(
    $churchId: ID!
    $serviceDate: String!
    $attendance: Int!
    $familyPicture: String!
  ) {
    RecordServiceNoIncome(
      churchId: $churchId
      serviceDate: $serviceDate
      attendance: $attendance
      familyPicture: $familyPicture
    ) {
      id
      week
    }
  }
`

export const RECORD_HUB_REHEARSAL_SERVICE = gql`
  mutation RecordHubRehearsalService(
    $churchId: ID!
    $serviceDate: String!
    $attendance: Int!
    $income: Float!
    $foreignCurrency: String
    $numberOfTithers: Int!
    $treasurers: [ID]!
    $treasurerSelfie: String!
    $familyPicture: String!
  ) {
    RecordHubRehearsalService(
      churchId: $churchId
      serviceDate: $serviceDate
      attendance: $attendance
      income: $income
      foreignCurrency: $foreignCurrency
      numberOfTithers: $numberOfTithers
      treasurers: $treasurers
      treasurerSelfie: $treasurerSelfie
      familyPicture: $familyPicture
    ) {
      id
      week
      attendance
      income
      onlineGiving
    }
  }
`

export const RECORD_HUB_SUNDAY_MEETING = gql`
  mutation RecordHubSundayMeeting(
    $churchId: ID!
    $serviceDate: String!
    $attendance: Int!
    $familyPicture: String!
  ) {
    RecordHubSundayAttendance(
      churchId: $churchId
      serviceDate: $serviceDate
      attendance: $attendance
      familyPicture: $familyPicture
    ) {
      id
      week
    }
  }
`

export const DISPLAY_FELLOWSHIP_SERVICE = gql`
  query fellowshipDisplayServiceRecords($serviceId: ID!, $fellowshipId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      serviceDate {
        date
      }
      noServiceReason
      attendance
      income
      cash
      onlineGiving
      numberOfTithers
      foreignCurrency
      treasurerSelfie
      familyPicture
      bankingProof
      bankingSlip
      bankingSlipUploader {
        id
        firstName
        lastName
        fullName
      }
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }
      transactionId
      treasurers {
        id
        firstName
        lastName
        fullName
      }
      bankingConfirmer {
        id
        firstName
        lastName
        fullName
      }
    }
    fellowships(where: { id: $fellowshipId }) {
      id
      name
      noIncomeTracking
      stream_name
    }
  }
`
export const DISPLAY_AGGREGATE_SERVICE_RECORD = gql`
  query aggregateServiceRecordForWeek($week: Int!, $constituencyId: ID!) {
    constituencies(where: { id: $constituencyId }) {
      id
      name
      aggregateServiceRecordForWeek(week: $week) {
        id
        income
        foreignCurrency
      }
    }
  }
`

export const DISPLAY_BACENTA_SERVICE = gql`
  query bacentaDisplayServiceRecords($serviceId: ID!, $bacentaId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      serviceDate {
        date
      }
      noServiceReason
      attendance
      income
      cash
      onlineGiving
      numberOfTithers
      foreignCurrency
      treasurerSelfie
      familyPicture
      bankingProof
      bankingSlip
      bankingSlipUploader {
        id
        firstName
        lastName
        fullName
      }
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }
      bankingConfirmer {
        id
        firstName
        lastName
        fullName
      }
      transactionId
      treasurers {
        id
        firstName
        lastName
        fullName
      }
    }
    bacentas(where: { id: $bacentaId }) {
      id
      name
      stream_name
    }
  }
`

export const DISPLAY_HUBFELLOWSHIP_SUNDAY_MEETING = gql`
  query hubFellowshipDisplaySundayMeetingRecords(
    $serviceId: ID!
    $hubfellowshipId: ID!
  ) {
    ministryAttendanceRecords(where: { id: $serviceId }) {
      id
      createdAt
      serviceDate {
        date
      }
      attendance
      familyPicture
      week
      created_by {
        id
        firstName
        lastName
        fullName
      }
    }
    hubFellowships(where: { id: $hubfellowshipId }) {
      id
      name
    }
  }
`

export const DISPLAY_HUB_REHEARSAL = gql`
  query hubDisplayRehearsalRecords($serviceId: ID!, $hubId: ID!) {
    rehearsalRecords(where: { id: $serviceId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      serviceDate {
        date
      }
      noServiceReason
      attendance
      income
      cash
      onlineGiving
      numberOfTithers
      foreignCurrency
      transactionId
      treasurerSelfie
      familyPicture
      bankingProof
      bankingSlip
      bankingSlipUploader {
        id
        firstName
        lastName
        fullName
      }
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }

      treasurers {
        id
        firstName
        lastName
        fullName
      }
    }
    hubs(where: { id: $hubId }) {
      id
      name
    }
  }
`

export const DISPLAY_CONSTITUENCY_SERVICE = gql`
  query constituencyDisplayServiceRecords(
    $serviceId: ID!
    $constituencyId: ID!
  ) {
    serviceRecords(where: { id: $serviceId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      serviceDate {
        date
      }
      noServiceReason
      attendance
      income
      cash
      onlineGiving
      numberOfTithers
      foreignCurrency
      transactionId
      treasurerSelfie
      familyPicture
      bankingProof
      bankingSlip
      bankingSlipUploader {
        id
        firstName
        lastName
        fullName
      }
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }
      bankingConfirmer {
        id
        firstName
        lastName
        fullName
      }
      treasurers {
        id
        firstName
        lastName
        fullName
      }
    }
    constituencies(where: { id: $constituencyId }) {
      id
      name
      stream_name
    }
  }
`

export const DISPLAY_COUNCIL_SERVICE = gql`
  query councilDisplayServiceRecords($serviceId: ID!, $councilId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      serviceDate {
        date
      }
      noServiceReason
      attendance
      income
      cash
      onlineGiving
      numberOfTithers
      transactionId
      foreignCurrency
      treasurerSelfie
      familyPicture
      bankingProof
      bankingSlip
      bankingSlipUploader {
        id
        firstName
        lastName
        fullName
      }
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }
      bankingConfirmer {
        id
        firstName
        lastName
        fullName
      }
      treasurers {
        id
        firstName
        lastName
        fullName
      }
    }
    councils(where: { id: $councilId }) {
      id
      name
      stream_name
    }
  }
`

export const DISPLAY_STREAM_SERVICE = gql`
  query streamDisplayServiceRecords($serviceId: ID!, $streamId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      serviceDate {
        date
      }
      noServiceReason
      attendance
      income
      cash
      onlineGiving
      numberOfTithers
      foreignCurrency
      transactionId
      treasurerSelfie
      familyPicture
      bankingProof
      bankingSlip
      bankingSlipUploader {
        id
        firstName
        lastName
        fullName
      }
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }
      bankingConfirmer {
        id
        firstName
        lastName
        fullName
      }
      treasurers {
        id
        firstName
        lastName
        fullName
      }
    }
    streams(where: { id: $streamId }) {
      id
      name
      stream_name
    }
  }
`

export const DISPLAY_CAMPUS_SERVICE = gql`
  query gatheringDisplayServiceRecords($serviceId: ID!, $campusId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      serviceDate {
        date
      }
      noServiceReason
      attendance
      income
      numberOfTithers
      transactionId
      foreignCurrency
      treasurerSelfie
      familyPicture
      bankingProof
      bankingSlip
      bankingSlipUploader {
        id
        firstName
        lastName
        fullName
      }
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }
      bankingConfirmer {
        id
        firstName
        lastName
        fullName
      }
      treasurers {
        id
        firstName
        lastName
        fullName
      }
    }
    campuses(where: { id: $campusId }) {
      id
      name
    }
  }
`
export const RECORD_JOINT_REHEARSAL = gql`
  mutation RecordRehearsalService(
    $churchId: ID!
    $serviceDate: String!
    $attendance: Int!
    $income: Float!
    $treasurers: [ID]!
    $treasurerSelfie: String!
    $familyPicture: String!
  ) {
    RecordRehearsalService(
      churchId: $churchId
      serviceDate: $serviceDate
      attendance: $attendance
      income: $income
      treasurers: $treasurers
      treasurerSelfie: $treasurerSelfie
      familyPicture: $familyPicture
    ) {
      attendance
      id
      income
      serviceDate {
        date
      }
    }
  }
`
