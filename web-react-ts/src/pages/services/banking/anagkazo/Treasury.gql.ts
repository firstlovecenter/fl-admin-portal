import { gql } from '@apollo/client'

export const STREAM_BANK_TELLERS = gql`
  query streamBankTellers($id: ID!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
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
