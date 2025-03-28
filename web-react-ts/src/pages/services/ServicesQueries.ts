import { gql } from '@apollo/client'

export const BACENTA_BANKING_SLIP_QUERIES = gql`
  query bacentaServices($bacentaId: ID!, $skip: Int) {
    bacentas(where: { id: $bacentaId }) {
      id
      bankingCode
      name
      services(limit: 10, skip: $skip) {
        id
        stream_name
        noServiceReason
        createdAt
        serviceDate {
          date
        }
        created_by {
          id
          firstName
          lastName
          fullName
        }
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
        income
        cash
        numberOfTithers
        foreignCurrency
        transactionId
        transactionReference
        transactionStatus
      }
    }
  }
`

export const BANKING_SLIP_SUBMISSION = gql`
  mutation SubmitBankingSlip($serviceRecordId: ID!, $bankingSlip: String!) {
    SubmitBankingSlip(
      serviceRecordId: $serviceRecordId
      bankingSlip: $bankingSlip
    ) {
      id
      bankingProof
      bankingSlip
      bankingSlipUploader {
        id
        firstName
        lastName
      }
    }
  }
`

export const GOVERNORSHIP_BANKING_SLIP_QUERIES = gql`
  query governorshipServices($governorshipId: ID!) {
    governorships(where: { id: $governorshipId }) {
      id

      name
      services(limit: 20) {
        id
        stream_name
        noServiceReason
        createdAt
        serviceDate {
          date
        }
        created_by {
          id
          firstName
          lastName
          fullName
        }
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
        income
        cash
        transactionId
        transactionStatus
      }
    }
  }
`

export const STREAM_BANKING_SLIP_QUERIES = gql`
  query streamServices($streamId: ID!) {
    streams(where: { id: $streamId }) {
      id

      name
      services(limit: 20) {
        id
        stream_name
        noServiceReason
        createdAt
        serviceDate {
          date
        }
        created_by {
          id
          firstName
          lastName
          fullName
        }
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
        income
        cash
        transactionId
        transactionStatus
      }
    }
  }
`

export const COUNCIL_BANKING_SLIP_QUERIES = gql`
  query councilServices($councilId: ID!) {
    councils(where: { id: $councilId }) {
      id

      name
      services(limit: 20) {
        id
        stream_name
        noServiceReason
        createdAt
        serviceDate {
          date
        }
        created_by {
          id
          firstName
          lastName
          fullName
        }
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
        income
        cash
        transactionId
        transactionStatus
      }
    }
  }
`

export const BACENTA_SERVICE_RECORDS = gql`
  query BacentaServiceRecords($serviceId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      serviceLog {
        bacenta {
          id
          name
          bankingCode
        }
      }
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
      attendance
      income
      cash
      foreignCurrency
    }
  }
`

export const GOVERNORSHIP_SERVICE_RECORDS = gql`
  query GovernorshipServiceRecords($serviceId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      serviceLog {
        governorship {
          id
          name
        }
      }
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
      attendance
      income
      cash
      foreignCurrency
    }
  }
`

export const COUNCIL_SERVICE_RECORDS = gql`
  query CouncilServiceRecords($serviceId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      serviceLog {
        council {
          id
          name
        }
      }
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
      attendance
      income
      cash
      foreignCurrency
    }
  }
`

export const STREAM_SERVICE_RECORDS = gql`
  query streamServiceRecords($serviceId: ID!) {
    serviceRecords(where: { id: $serviceId }) {
      id
      serviceLog {
        stream {
          id
          name
        }
      }
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
      attendance
      income
      cash
      foreignCurrency
    }
  }
`

export const HUB_BANKING_SLIP_QUERIES = gql`
  query hubMeetings($hubId: ID!, $skip: Int) {
    hubs(where: { id: $hubId }) {
      id
      name
      rehearsals(limit: 10, skip: $skip) {
        id
        stream_name
        noServiceReason
        createdAt
        serviceDate {
          date
        }
        created_by {
          id
          firstName
          lastName
          fullName
        }
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
        income
        cash
        numberOfTithers
        foreignCurrency
        transactionId
        transactionReference
        transactionStatus
      }
    }
  }
`
