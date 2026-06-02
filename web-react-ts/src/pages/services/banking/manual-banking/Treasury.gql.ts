import { gql } from '@apollo/client'

export const STREAM_BANK_TELLERS = gql`
  query streamBankTellers($id: ID!) {
    streams(where: { id: { eq: $id } }, limit: 1) {
      id
      name

      tellers {
        id
        firstName
        lastName
        fullName
        pictureUrl
        bacenta {
          id
          name
        }
        basonta {
          id
          name
        }
      }

      activeBacentaCount
    }
  }
`

export const MAKE_STREAM_TELLER = gql`
  mutation MakeStreamTeller($streamId: ID!, $tellerId: ID!) {
    MakeStreamTeller(streamId: $streamId, tellerId: $tellerId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_STREAM_TELLER = gql`
  mutation RemoveStreamTeller($streamId: ID!, $tellerId: ID!) {
    RemoveStreamTeller(streamId: $streamId, tellerId: $tellerId) {
      id
      firstName
      lastName
    }
  }
`

export const CONFIRM_BANKING = gql`
  mutation ConfirmBanking($governorshipId: ID!) {
    ConfirmBanking(governorshipId: $governorshipId) {
      id
    }
  }
`

export const CONFIRM_COUNCIL_BANKING = gql`
  mutation ConfirmCouncilBanking($councilId: ID!) {
    ConfirmCouncilBanking(councilId: $councilId) {
      id
    }
  }
`

export const STREAM_BANKING_DEFAULTERS_THIS_WEEK = gql`
  query streamBankingDefaultersThisWeek(
    $id: ID!
    $searchKey: String
    $govSkip: Int! = 0
    $govLimit: Int! = 10
    $councilSkip: Int! = 0
    $councilLimit: Int! = 10
  ) {
    streams(where: { id: { eq: $id } }) {
      id
      name
      governorshipBankingDefaultersThisWeekCount(searchKey: $searchKey)
      councilBankingDefaultersThisWeekCount(searchKey: $searchKey)
      governorshipBankingDefaultersThisWeek(
        searchKey: $searchKey
        skip: $govSkip
        limit: $govLimit
      ) {
        id
        name
        __typename
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
          pictureUrl
        }
      }
      councilBankingDefaultersThisWeek(
        searchKey: $searchKey
        skip: $councilSkip
        limit: $councilLimit
      ) {
        id
        name
        __typename
        leader {
          id
          firstName
          lastName
          fullName
          phoneNumber
          whatsappNumber
          pictureUrl
        }
      }
    }
  }
`

export const DISPLAY_COUNCIL_AGGREGATE_SERVICE_RECORD = gql`
  query councilAggregateServiceRecordForWeek($councilId: ID!, $week: Int!) {
    councils(where: { id: { eq: $councilId } }) {
      id
      aggregateServiceRecordForWeek(week: $week) {
        id
        attendance
        income
        foreignCurrency
        week
        year
      }
    }
  }
`
