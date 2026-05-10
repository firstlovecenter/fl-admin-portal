import { gql } from '@apollo/client'

export const MEMBER_MEMBER_SEARCH = gql`
  query memberMemberSearch($id: ID!, $key: String!) {
    members(where: { id: { eq: $id } }) {
      id
      memberSearch(key: $key, limit: 5) {
        id
        firstName
        middleName
        lastName
        pictureUrl
        email
        location {
          latitude
          longitude
        }
      }
    }
  }
`

export const BASONTA_MEMBER_SEARCH = gql`
  query basontaMemberSearch($id: ID!, $key: String!) {
    members(where: { id: { eq: $id } }) {
      id
      basontaMemberSearch(key: $key, limit: 5) {
        id
        firstName
        middleName
        lastName
        pictureUrl
        email
        location {
          latitude
          longitude
        }
      }
    }
  }
`

export const BASONTA_MEMBER_SEARCH_FROM_HUB = gql`
  query basontaMemberSearchFromHub($id: ID!, $key: String!, $hubId: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      basontaMemberSearchFromHub(hubId: $hubId, key: $key, limit: 5) {
        id
        firstName
        middleName
        lastName
        pictureUrl
        email
        location {
          latitude
          longitude
        }
      }
    }
  }
`
