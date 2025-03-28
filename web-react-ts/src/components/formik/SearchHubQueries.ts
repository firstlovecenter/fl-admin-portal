import { gql } from '@apollo/client'

export const MEMBER_HUB_SEARCH = gql`
  query memberHubSearch($id: ID!, $key: String!) {
    members(where: { id: $id }) {
      id
      hubSearch(key: $key) {
        id
        name

        governorship {
          id
          name
        }

        hubCouncil {
          id
          name
        }
      }
    }
  }
`
