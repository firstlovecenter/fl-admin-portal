import { gql } from '@apollo/client'

export const STREAM_SHEEP_SEEKERS = gql`
  query streamSheepSeekers($id: ID!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      sheepseekers {
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

export const MAKE_STREAM_SHEEP_SEEKER = gql`
  mutation MakeStreamSheepSeeker($streamId: ID!, $sheepseekerId: ID!) {
    MakeStreamSheepSeeker(streamId: $streamId, sheepseekerId: $sheepseekerId) {
      id
      firstName
      lastName
    }
  }
`

export const REMOVE_STREAM_SHEEP_SEEKER = gql`
  mutation RemoveStreamSheepSeeker($streamId: ID!, $sheepseekerId: ID!) {
    RemoveStreamSheepSeeker(
      streamId: $streamId
      sheepseekerId: $sheepseekerId
    ) {
      id
      firstName
      lastName
    }
  }
`
