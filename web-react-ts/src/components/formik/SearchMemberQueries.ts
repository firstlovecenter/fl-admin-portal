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

