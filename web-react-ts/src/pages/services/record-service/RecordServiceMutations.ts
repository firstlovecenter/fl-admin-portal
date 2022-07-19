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
    $servicePicture: String!
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
      servicePicture: $servicePicture
    ) {
      id
      serviceLog {
        id
        fellowship {
          id
          services(limit: 5) {
            id
            week
            bankingProof
          }
        }
      }
    }
  }
`

export const RECORD_CANCELLED_SERVICE = gql`
  mutation RecordCancelledService(
    $id: ID!
    $serviceDate: String!
    $noServiceReason: String!
  ) {
    RecordCancelledService(
      id: $id
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

export const RECORD_SERVICE_NO_INCOME = gql`
  mutation RecordServiceNoIncome(
    $churchId: ID!
    $serviceDate: String!
    $attendance: Int!
    $servicePicture: String!
  ) {
    RecordServiceNoIncome(
      churchId: $churchId
      serviceDate: $serviceDate
      attendance: $attendance
      servicePicture: $servicePicture
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
      created_at
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
      foreignCurrency
      treasurerSelfie
      servicePicture
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
    }
    fellowships(where: { id: $fellowshipId }) {
      id
      name
    }
  }
`

export const DISPLAY_BACENTA_SERVICE = gql`
  query bacentaDisplayServiceRecords($serviceId: ID!, $bacentaId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      created_at
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
      foreignCurrency
      treasurerSelfie
      servicePicture
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
    }
    bacentas(where: { id: $bacentaId }) {
      id
      name
    }
  }
`

export const DISPLAY_SONTA_SERVICE = gql`
  query sontaDisplayServiceRecords($serviceId: ID!, $sontaId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      created_at
      serviceDate {
        date
      }
      attendance
      income
      foreignCurrency
      treasurerSelfie
      servicePicture
      treasurers {
        id
        firstName
        lastName
        fullName
      }
    }
    sontas(where: { id: $sontaId }) {
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
      created_at
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
      foreignCurrency
      transactionId
      treasurerSelfie
      servicePicture
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
    constituencies(where: { id: $constituencyId }) {
      id
      name
    }
  }
`

export const DISPLAY_COUNCIL_SERVICE = gql`
  query councilDisplayServiceRecords($serviceId: ID!, $councilId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      created_at
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
      transactionId
      foreignCurrency
      treasurerSelfie
      servicePicture
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
    councils(where: { id: $councilId }) {
      id
      name
    }
  }
`

export const DISPLAY_STREAM_SERVICE = gql`
  query streamDisplayServiceRecords($serviceId: ID!, $streamId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      created_at
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
      foreignCurrency
      transactionId
      treasurerSelfie
      servicePicture
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
    streams(where: { id: $streamId }) {
      id
      name
    }
  }
`

export const DISPLAY_GATHERINGSERVICE_SERVICE = gql`
  query gatheringDisplayServiceRecords(
    $serviceId: ID!
    $gatheringServiceId: ID!
  ) {
    serviceRecords(where: { id: $serviceId }) {
      id
      created_at
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
      transactionId
      foreignCurrency
      treasurerSelfie
      servicePicture
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
    gatheringServices(where: { id: $gatheringServiceId }) {
      id
      name
    }
  }
`
