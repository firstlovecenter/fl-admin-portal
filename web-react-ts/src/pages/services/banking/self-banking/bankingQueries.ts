import { gql } from '@apollo/client'

export const BACENTA_SERVICE_PAYMENT = gql`
  query bacentaServicePayment($id: ID!) {
    bacentas(where: { id: { eq: $id } }) {
      id
      name
      bankingCode
    }
  }
`

export const GOVERNORSHIP_SERVICE_PAYMENT = gql`
  query governorshipServicePayment($id: ID!) {
    governorships(where: { id: { eq: $id } }) {
      id
      name
    }
  }
`

export const COUNCIL_SERVICE_PAYMENT = gql`
  query councilServicePayment($id: ID!) {
    councils(where: { id: { eq: $id } }) {
      id
      name
    }
  }
`

export const STREAM_SERVICE_PAYMENT = gql`
  query streamServicePayment($id: ID!) {
    streams(where: { id: { eq: $id } }) {
      id
      name
    }
  }
`

export const DISPLAY_OFFERING_DETAILS = gql`
  query displayOfferingDetails($serviceRecordId: ID!) {
    serviceRecords(where: { id: { eq: $serviceRecordId } }) {
      id
      serviceDate {
        date
      }
      cash
      transactionTime
      transactionReference
      transactionStatus
    }
  }
`
export const PAY_OFFERING_MUTATION = gql`
  mutation PayOfferingMutation(
    $serviceRecordId: ID!
    $mobileNetwork: String!
    $mobileNumber: String!
  ) {
    BankServiceOffering(
      serviceRecordId: $serviceRecordId
      mobileNetwork: $mobileNetwork
      mobileNumber: $mobileNumber
    ) {
      id
      cash
      sourceNetwork
      sourceNumber
      desc
      transactionReference
      transactionTime
      transactionStatus
    }
  }
`

export const SEND_PAYMENT_OTP = gql`
  mutation SendPaymentOTP($serviceRecordId: String!, $otp: String!) {
    SendPaymentOTP(serviceRecordId: $serviceRecordId, otp: $otp) {
      id
      transactionStatus
    }
  }
`

export const CONFIRM_OFFERING_PAYMENT = gql`
  mutation ConfirmOfferingPayment($serviceRecordId: ID!) {
    ConfirmOfferingPayment(serviceRecordId: $serviceRecordId) {
      id
      cash
      transactionId
      sourceNetwork
      sourceNumber
      desc
      transactionReference
      transactionTime
      transactionStatus
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`

export const SELF_BANKING_RECEIPT = gql`
  query selfBankingReceipt($id: ID!) {
    serviceRecords(where: { id: { eq: $id } }) {
      id
      cash
      serviceDate {
        date
      }
      offeringBankedBy {
        id
        firstName
        lastName
        fullName
      }
      sourceNetwork
      sourceNumber
      desc
      transactionReference
      transactionTime
      transactionStatus
      transactionError
    }
  }
`

export const SET_TRANSACTION_REFERENCE_MANUALLY = gql`
  mutation SetTransactionReferenceManually(
    $serviceRecordId: ID!
    $transactionReference: ID!
  ) {
    SetTransactionReferenceManually(
      serviceRecordId: $serviceRecordId
      transactionReference: $transactionReference
    ) {
      id
      transactionReference
      transactionStatus
      transactionError
    }
  }
`
