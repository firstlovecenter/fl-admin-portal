import { gql } from '@apollo/client'

export const PURCHASE_DOWNLOAD_CREDITS = gql`
  mutation PurchaseDownloadCredits(
    $churchId: ID!
    $amount: Float!
    $mobileNetwork: String!
    $mobileNumber: String!
  ) {
    PurchaseDownloadCredits(
      churchId: $churchId
      amount: $amount
      mobileNetwork: $mobileNetwork
      mobileNumber: $mobileNumber
    ) {
      id
      amount
      mobileNetwork
      mobileNumber
      transactionReference
      transactionStatus
      credited
    }
  }
`

export const CONFIRM_CREDIT_TRANSACTION = gql`
  mutation ConfirmCreditTransaction($transactionReference: String!) {
    ConfirmCreditTransaction(transactionReference: $transactionReference) {
      id
      amount
      mobileNetwork
      mobileNumber
      transactionReference
      transactionStatus
      credited
    }
  }
`
