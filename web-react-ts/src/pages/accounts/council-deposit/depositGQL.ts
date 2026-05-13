import { gql } from '@apollo/client'

export const DEPOSIT_INTO_COUNCIL_CURRENT_ACCOUNTS = gql`
  mutation DepositIntoCouncilCurrentAccounts(
    $councilId: ID!
    $weekdayBalanceDepositAmount: Float!
    $clientTransactionId: ID!
  ) {
    DepositIntoCouncilCurrentAccount(
      councilId: $councilId
      weekdayBalanceDepositAmount: $weekdayBalanceDepositAmount
      clientTransactionId: $clientTransactionId
    ) {
      id
      createdAt
      lastModified
      amount
      account
      category
      description
      loggedBy {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`

export const DEPOSIT_INTO_COUNCIL_BUSSING_SOCIETY = gql`
  mutation DepositIntoCouncilBussingSociety(
    $councilId: ID!
    $bussingSocietyBalance: Float!
    $clientTransactionId: ID!
  ) {
    DepositIntoCouncilBussingSociety(
      councilId: $councilId
      bussingSocietyBalance: $bussingSocietyBalance
      clientTransactionId: $clientTransactionId
    ) {
      id
      createdAt
      lastModified
      amount
      account
      category
      description
      loggedBy {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`
export const SET_HR_AMOUNT = gql`
  mutation setHrAmount($councilId: ID!, $amount: Float!) {
    SetCouncilHRAmount(councilId: $councilId, amount: $amount) {
      id
      name
      hrAmount
    }
  }
`
