import { gql } from '@apollo/client'

export const RECORD_MULTIPLICATION_EVENT = gql`
  mutation RecordMultiplicationEvent(
    $churchId: ID!
    $preacherId: String!
    $crusadeLocation: String!
    $attendance: Int!
    $income: Float!
    $souls: Int!
    $miracles: Int!
    $crusadePictures: [String!]!
    $treasurerSelfie: String!
    $crusadeDate: Date!
    $treasurers: [ID]!
    $foreignCurrency: String
  ) {
    RecordMultiplicationEvent(
      churchId: $churchId
      preacherId: $preacherId
      crusadeLocation: $crusadeLocation
      attendance: $attendance
      income: $income
      souls: $souls
      miracles: $miracles
      crusadePictures: $crusadePictures
      treasurerSelfie: $treasurerSelfie
      crusadeDate: $crusadeDate
      treasurers: $treasurers
      foreignCurrency: $foreignCurrency
    ) {
      attendance
      crusadeLocation
      crusadePictures
      id
      income
      miracles
      souls
    }
  }
`

export const MULTIPLICATION_RECORDS = gql`
  query MultiplicationRecords($id: ID!) {
    multiplicationRecords(where: { id: $id }) {
      id
      crusadeLocation
      attendance
      income
      foreignCurrency
      souls
      miracles
      bankingSlip
      bankingProof
      created_by {
        id
        firstName
        lastName
        fullName
      }
      crusadePictures
      treasurerSelfie
      crusadeDate {
        date
      }
      preacher {
        id
        firstName
        lastName
      }
    }
  }
`

export const GOVERNORSHIP_MULTIPLICATION_GRAPHS = gql`
  query governorshipServiceMultiplicationGraphs($governorshipId: ID!) {
    governorships(where: { id: $governorshipId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      aggregateMultiplicationRecords(limit: 4) {
        attendance
        id
        income
        week
      }
      multiplicationRecords(limit: 4) {
        id
        attendance
        income
        crusadeDate {
          date
        }
      }
    }
  }
`

export const CAMPUS_MULTIPLICATION_GRAPHS = gql`
  query CampusServiceMultiplicationGraphs($campusId: ID!) {
    campuses(where: { id: $campusId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      aggregateMultiplicationRecords(limit: 4) {
        attendance
        id
        income
        week
      }
      multiplicationRecords(limit: 4) {
        id
        attendance
        income
        crusadeDate {
          date
        }
      }
    }
  }
`

export const COUNCIL_MULTIPLICATION_GRAPHS = gql`
  query CouncilServiceMultiplicationGraphs($councilId: ID!) {
    councils(where: { id: $councilId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        pictureUrl
      }
      aggregateMultiplicationRecords(limit: 4) {
        attendance
        id
        income
        week
      }
      multiplicationRecords(limit: 4) {
        id
        attendance
        income
        crusadeDate {
          date
        }
      }
    }
  }
`

export const STREAM_MULTIPLICATION_GRAPHS = gql`
  query streamServiceMultiplicationGraphs($streamId: ID!) {
    streams(where: { id: $streamId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      aggregateMultiplicationRecords(limit: 4) {
        attendance
        id
        income
        week
      }
      multiplicationRecords(limit: 4) {
        id
        attendance
        income
        crusadeDate {
          date
        }
      }
    }
  }
`

export const MULTIPLICATION_BANKING_SLIP_SUBMISSION = gql`
  mutation MultiplicationBankingSlipSubmission(
    $multiplicationRecordId: String!
    $bankingSlip: String!
  ) {
    SubmitMultiplicationBankingSlip(
      multiplicationRecordId: $multiplicationRecordId
      bankingSlip: $bankingSlip
    ) {
      id
      bankingProof
      bankingSlipUploader {
        id
        firstName
        lastName
      }
    }
  }
`

export const CAMPUS_MULTIPLICATION_BANKING_SLIP_QUERY = gql`
  query campusMultiplicationBankingSlipQueries($campusId: ID!) {
    campuses(where: { id: $campusId }) {
      id
      name
      multiplicationRecords(limit: 20) {
        id
        created_by {
          id
          firstName
          lastName
        }
        crusadeDate {
          date
        }
        bankingProof
        bankingSlipUploader {
          id
          firstName
          lastName
        }
        income
      }
    }
  }
`

export const STREAM_MULTIPLICATION_BANKING_SLIP_QUERY = gql`
  query streamMultiplicationBankingSlipQueries($streamId: ID!) {
    streams(where: { id: $streamId }) {
      id
      name
      multiplicationRecords(limit: 20) {
        id
        created_by {
          id
          firstName
          lastName
        }
        crusadeDate {
          date
        }
        bankingProof
        bankingSlipUploader {
          id
          firstName
          lastName
        }
        income
      }
    }
  }
`

export const COUNCIL_MULTIPLICATION_BANKING_SLIP_QUERY = gql`
  query councilMultiplicationBankingSlipQueries($councilId: ID!) {
    councils(where: { id: $councilId }) {
      id
      name
      multiplicationRecords(limit: 20) {
        id
        created_by {
          id
          firstName
          lastName
        }
        crusadeDate {
          date
        }
        bankingProof
        bankingSlipUploader {
          id
          firstName
          lastName
        }
        income
      }
    }
  }
`

export const GOVERNORSHIP_MULTIPLICATION_BANKING_SLIP_QUERY = gql`
  query governorshipMultiplicationBankingSlipQueries($governorshipId: ID!) {
    governorships(where: { id: $governorshipId }) {
      id
      name
      multiplicationRecords(limit: 20) {
        id
        created_by {
          id
          firstName
          lastName
        }
        crusadeDate {
          date
        }
        bankingProof
        bankingSlipUploader {
          id
          firstName
          lastName
        }
        income
      }
    }
  }
`

export const CAMPUS_AGGREGATE_MEMBER_CONVERSION = gql`
  query campusAggregateMemberConversion($campusId: ID!) {
    campuses(where: { id: $campusId }) {
      id
      name
      aggregateMemberConversion {
        howYouJoined
        number
        percentage
      }
    }
  }
`

export const STREAM_AGGREGATE_MEMBER_CONVERSION = gql`
  query streamAggregateMemberConversion($streamId: ID!) {
    streams(where: { id: $streamId }) {
      id
      name
      aggregateMemberConversion {
        howYouJoined
        number
        percentage
      }
    }
  }
`

export const COUNCIL_AGGREGATE_MEMBER_CONVERSION = gql`
  query councilAggregateMemberConversion($councilId: ID!) {
    councils(where: { id: $councilId }) {
      id
      name
      aggregateMemberConversion {
        howYouJoined
        number
        percentage
      }
    }
  }
`

export const GOVERNORSHIP_AGGREGATE_MEMBER_CONVERSION = gql`
  query governorshipAggregateMemberConversion($governorshipId: ID!) {
    governorships(where: { id: $governorshipId }) {
      id
      name
      aggregateMemberConversion {
        howYouJoined
        number
        percentage
      }
    }
  }
`

export const BACENTA_AGGREGATE_MEMBER_CONVERSION = gql`
  query bacentaAggregateMemberConversion($bacentaId: ID!) {
    bacentas(where: { id: $bacentaId }) {
      id
      name
      aggregateMemberConversion {
        howYouJoined
        number
        percentage
      }
    }
  }
`

export const FELLOWSHIP_AGGREGATE_MEMBER_CONVERSION = gql`
  query fellowshipAggregateMemberConversion($fellowshipId: ID!) {
    fellowships(where: { id: $fellowshipId }) {
      id
      name
      aggregateMemberConversion {
        howYouJoined
        number
        percentage
      }
    }
  }
`
