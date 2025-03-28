import { gql } from '@apollo/client'

export const COUNCIL_CREDITS_TRANSACTION_HISTORY = gql`
  query CouncilTransactionHistory($id: ID!) {
    councils(where: { id: $id }) {
      id
      name
      creditsTransactionHistory {
        id
        amount
        createdAt
        transactionStatus
        transactionReference
        mobileNetwork
        mobileNumber
        credited
      }
    }
  }
`
