import { gql } from '@apollo/client'

export const STREAM_ARRIVALS_HELPERS = gql`
  query StreamArrivalsHelpers($id: ID!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      arrivalsCounters {
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

      activeBacentaICCount
    }
  }
`

export const MAKE_STREAMARRIVALS_COUNTER = gql`
  mutation MakeStreamArrivalsCounter($streamId: ID!, $arrivalsCounterId: ID!) {
    MakeStreamArrivalsCounter(
      streamId: $streamId
      arrivalsCounterId: $arrivalsCounterId
    ) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_STREAMARRIVALS_COUNTER = gql`
  mutation RemoveStreamArrivalsCounter(
    $streamId: ID!
    $arrivalsCounterId: ID!
  ) {
    RemoveStreamArrivalsCounter(
      streamId: $streamId
      arrivalsCounterId: $arrivalsCounterId
    ) {
      id
      firstName
      lastName
    }
  }
`

export const COUNCIL_ARRIVALSPAYERS = gql`
  query councilArrivalsPayers($id: ID!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      arrivalsPayers {
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

export const MAKE_COUNCIL_ARRIVALSPAYER = gql`
  mutation MakeCouncilArrivalsPayer($councilId: ID!, $arrivalsPayerId: ID!) {
    MakeCouncilArrivalsPayer(
      councilId: $councilId
      arrivalsPayerId: $arrivalsPayerId
    ) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_COUNCIL_ARRIVALSPAYER = gql`
  mutation RemoveCouncilArrivalsPayer($councilId: ID!, $arrivalsPayerId: ID!) {
    RemoveCouncilArrivalsPayer(
      councilId: $councilId
      arrivalsPayerId: $arrivalsPayerId
    ) {
      id
      firstName
      lastName
    }
  }
`
