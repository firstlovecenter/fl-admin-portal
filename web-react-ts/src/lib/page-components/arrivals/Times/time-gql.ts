import { gql } from '@apollo/client'

export const SET_STREAM_ARRIVAL_TIMES = gql`
  mutation SetStreamArrivalTimes(
    $id: ID!
    $mobilisationStartTime: String!
    $mobilisationEndTime: String!
    $arrivalStartTime: String!
    $arrivalEndTime: String!
  ) {
    SetStreamArrivalTimes(
      id: $id
      mobilisationStartTime: $mobilisationStartTime
      mobilisationEndTime: $mobilisationEndTime
      arrivalStartTime: $arrivalStartTime
      arrivalEndTime: $arrivalEndTime
    ) {
      id
      name
      mobilisationStartTime
      mobilisationEndTime
      arrivalStartTime
      arrivalEndTime
    }
  }
`

export const GET_ARRIVAL_TIMES = gql`
  query getStreamArrivalTimes($id: ID!) {
    streams(where: { id: $id }) {
      id
      name
      mobilisationStartTime
      mobilisationEndTime
      arrivalStartTime
      arrivalEndTime
    }
  }
`
