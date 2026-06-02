import { gql } from '@apollo/client'

export const EXPENSE_REQUEST = gql`
  mutation ExpenseRequest(
    $councilId: ID!
    $expenseAmount: Float!
    $expenseCategory: String!
    $description: String!
    $accountType: String!
    $clientTransactionId: ID!
  ) {
    ExpenseRequest(
      councilId: $councilId
      expenseAmount: $expenseAmount
      expenseCategory: $expenseCategory
      description: $description
      accountType: $accountType
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

export const DEBIT_BUSSING_SOCIETY = gql`
  mutation DebitBussingSociety(
    $councilId: ID!
    $expenseAmount: Float!
    $expenseCategory: String!
    $clientTransactionId: ID!
  ) {
    DebitBussingSociety(
      councilId: $councilId
      expenseAmount: $expenseAmount
      expenseCategory: $expenseCategory
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
