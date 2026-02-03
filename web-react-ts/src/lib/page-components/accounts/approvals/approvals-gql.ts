import { gql } from '@apollo/client'

export const GET_COUNCIL_PENDING_APPROVAL_TRANSACTIONS = gql`
  query getCouncilPendingApprovalTransactions($campusId: ID!) {
    campuses(where: { id: $campusId }) {
      councils {
        id
        name
        transactions(where: { status: "pending approval" }) {
          id
          createdAt
          lastModified
          amount
          account
          category
          description
          status
          loggedBy {
            id
            firstName
            lastName
            fullName
          }
        }
      }
    }
  }
`

export const APPROVE_EXPENSE = gql`
  mutation ApproveExpense($transactionId: ID!, $charge: Float!) {
    ApproveExpense(transactionId: $transactionId, charge: $charge) {
      id
      createdAt
      lastModified
      amount
      account
      category
      description
      status
      loggedBy {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`

export const DECLINE_EXPENSE = gql`
  mutation DeclineExpense($transactionId: ID!) {
    DeclineExpense(transactionId: $transactionId) {
      id
      createdAt
      lastModified
      amount
      category
      description
      status
      loggedBy {
        id
        firstName
        lastName
        fullName
      }
    }
  }
`
