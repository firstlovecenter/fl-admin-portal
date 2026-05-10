import { gql } from '@apollo/client'

export const GET_CAMPUS_TRANSACTION_HISTORY = gql`
  query getCampusTransactionHistory(
    $campusId: ID!
    $offset: Int!
    $limit: Int!
  ) {
    campuses(where: { id: { eq: $campusId } }) {
      id
      name
      transactionCount
      transactions(limit: $limit, offset: $offset) {
        id
        council {
          id
          name
          leader {
            id
            firstName
            lastName
            fullName
          }
        }
        createdAt
        lastModified
        amount
        account
        charge
        category
        description
        status

        bussingSocietyBalance
        weekdayBalance

        loggedBy {
          id
          firstName
          lastName
          fullName
        }
      }
    }
  }
`

export const GET_COUNCIL_TRANSACTION_HISTORY = gql`
  query getCouncilTransactionHistory(
    $councilId: ID!
    $offset: Int!
    $limit: Int!
  ) {
    councils(where: { id: { eq: $councilId } }) {
      id
      name
      transactionCount
      transactions(limit: $limit, offset: $offset) {
        id
        createdAt
        lastModified
        amount
        account
        charge
        category
        description
        status

        bussingSocietyBalance
        weekdayBalance

        loggedBy {
          id
          firstName
          lastName
          fullName
        }
      }
    }
  }
`

export const GET_TRANSACTION_DETAILS = gql`
  query getTransactionDetails($id: ID!) {
    accountTransactions(where: { id: { eq: $id } }) {
      id
      createdAt
      lastModified
      bussingSocietyBalance
      weekdayBalance
      amount
      account
      category
      charge
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

export const UNDO_BUSSING_TRANSACTION = gql`
  mutation undoBussingTransaction($transactionId: ID!) {
    UndoBussingTransaction(transactionId: $transactionId) {
      id
      name
    }
  }
`

export const UNDO_WEEKDAY_TRANSACTION = gql`
  mutation undoWeekdayTransaction($transactionId: ID!) {
    UndoWeekdayTransaction(transactionId: $transactionId) {
      id
      name
    }
  }
`
