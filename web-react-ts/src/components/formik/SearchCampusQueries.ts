import { gql } from '@apollo/client'

export const MEMBER_CAMPUS_SEARCH = gql`
  query memberCampusSearch($id: ID!, $key: String!) {
    members(where: { id: { eq: $id } }) {
      id
      campusSearch(key: $key) {
        id
        name
        oversight {
          id
          name
        }
      }
    }
  }
`

export const OVERSIGHT_CAMPUS_SEARCH = gql`
  query oversightCampusSearch($id: ID!, $key: String!) {
    oversights(where: { id: { eq: $id } }) {
      id
      campusSearch(key: $key, limit: 5) {
        id
        name
        oversight {
          id
          name
        }
      }
    }
  }
`
