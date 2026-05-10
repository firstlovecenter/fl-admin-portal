import { gql } from '@apollo/client'

export const CAMPUS_STREAM_SEARCH = gql`
  query gatheringStreamSearch($id: ID!, $key: String!) {
    campuses(where: { id: { eq: $id } }) {
      id
      streamSearch(key: $key, limit: 5) {
        id
        name
      }
    }
  }
`

export const MEMBER_STREAM_SEARCH = gql`
  query memberStreamSearch($id: ID!, $key: String!) {
    members(where: { id: { eq: $id } }) {
      id
      streamSearch(key: $key) {
        id
        name
        campus {
          id
          name
        }
      }
    }
  }
`
